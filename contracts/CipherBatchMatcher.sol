// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "./CipherCV.sol";

/**
 * @title CipherBatchMatcher
 * @notice Batch tournament matching for Cipher CV.
 * Supported networks: Ethereum Sepolia, Arbitrum Sepolia, Base Sepolia
 * SDK: @cofhe/sdk
 */
contract CipherBatchMatcher {
    // ─── Types ────────────────────────────────────────────────────────────────

    struct BatchJob {
        uint256 id;
        address[] candidates;
        address[] employers;
        uint256 pairsProcessed;
        uint256 matchesFound;
        bool complete;
        uint256 startedAt;
        uint256 completedAt;
    }

    struct PairResult {
        address candidate;
        address employer;
        bool computed;
        bool compatible;
        uint256 computedAt;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    CipherCV public cipherCV;
    uint256 public batchCount;
    mapping(uint256 => BatchJob) public batches;
    mapping(uint256 => mapping(uint256 => PairResult)) public batchResults;

    uint256 public constant MAX_BATCH_SIZE = 50;
    uint256 public totalMatchesFound;
    uint256 public totalPairsProcessed;

    // ─── Events ───────────────────────────────────────────────────────────────

    event BatchStarted(uint256 indexed batchId, uint256 pairCount);
    event PairProcessed(uint256 indexed batchId, uint256 pairIndex, address candidate, address employer, bool compatible);
    event BatchCompleted(uint256 indexed batchId, uint256 matchesFound, uint256 totalPairs);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _cipherCV) {
        cipherCV = CipherCV(_cipherCV);
    }

    // ─── Batch Functions ──────────────────────────────────────────────────────

    /**
     * @notice Start a batch match job.
     * @param candidates Array of candidate addresses
     * @param employers Array of employer addresses (must match candidates length)
     */
    function startBatch(
        address[] calldata candidates,
        address[] calldata employers
    ) external returns (uint256 batchId) {
        require(candidates.length == employers.length, "Length mismatch");
        require(candidates.length <= MAX_BATCH_SIZE, "Batch too large");
        require(candidates.length > 0, "Empty batch");

        batchId = batchCount++;
        batches[batchId] = BatchJob({
            id: batchId,
            candidates: candidates,
            employers: employers,
            pairsProcessed: 0,
            matchesFound: 0,
            complete: false,
            startedAt: block.timestamp,
            completedAt: 0
        });

        emit BatchStarted(batchId, candidates.length);
    }

    /**
     * @notice Process a range of pairs in a batch job.
     * Split into multiple transactions to avoid gas limits.
     * @param batchId The batch to process
     * @param startIndex Start index (inclusive)
     * @param endIndex End index (exclusive)
     */
    function processBatch(
        uint256 batchId,
        uint256 startIndex,
        uint256 endIndex
    ) external {
        BatchJob storage batch = batches[batchId];
        require(!batch.complete, "Batch already complete");
        require(endIndex <= batch.candidates.length, "Out of bounds");
        require(endIndex - startIndex <= 10, "Process max 10 at a time");

        for (uint256 i = startIndex; i < endIndex; i++) {
            address candidate = batch.candidates[i];
            address employer = batch.employers[i];

            (bool candidateSubmitted,) = _getCandidateStatus(candidate);
            (bool employerSubmitted,) = _getEmployerStatus(employer);

            bool compatible = false;
            if (candidateSubmitted && employerSubmitted) {
                try cipherCV.computeMatch(candidate, employer) {
                    compatible = true;
                    batch.matchesFound++;
                    totalMatchesFound++;
                } catch {
                    compatible = false;
                }
            }

            batchResults[batchId][i] = PairResult({
                candidate: candidate,
                employer: employer,
                computed: true,
                compatible: compatible,
                computedAt: block.timestamp
            });

            batch.pairsProcessed++;
            totalPairsProcessed++;

            emit PairProcessed(batchId, i, candidate, employer, compatible);
        }

        if (batch.pairsProcessed >= batch.candidates.length) {
            batch.complete = true;
            batch.completedAt = block.timestamp;
            emit BatchCompleted(batchId, batch.matchesFound, batch.candidates.length);
        }
    }

    /**
     * @notice Run a full tournament: all candidates vs all employers.
     * Creates a batch with all N×M pairs (max 50 total).
     * @param candidates Array of candidate addresses
     * @param employers Array of employer addresses
     */
    function startTournament(
        address[] calldata candidates,
        address[] calldata employers
    ) external returns (uint256 batchId) {
        uint256 totalPairs = candidates.length * employers.length;
        require(totalPairs <= MAX_BATCH_SIZE, "Tournament too large");

        address[] memory allCandidates = new address[](totalPairs);
        address[] memory allEmployers = new address[](totalPairs);

        uint256 idx = 0;
        for (uint256 c = 0; c < candidates.length; c++) {
            for (uint256 e = 0; e < employers.length; e++) {
                allCandidates[idx] = candidates[c];
                allEmployers[idx] = employers[e];
                idx++;
            }
        }

        batchId = batchCount++;
        batches[batchId] = BatchJob({
            id: batchId,
            candidates: allCandidates,
            employers: allEmployers,
            pairsProcessed: 0,
            matchesFound: 0,
            complete: false,
            startedAt: block.timestamp,
            completedAt: 0
        });

        emit BatchStarted(batchId, totalPairs);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getBatchStatus(uint256 batchId)
        external
        view
        returns (uint256 pairsProcessed, uint256 matchesFound, uint256 totalPairs, bool complete, uint256 startedAt)
    {
        BatchJob storage batch = batches[batchId];
        return (batch.pairsProcessed, batch.matchesFound, batch.candidates.length, batch.complete, batch.startedAt);
    }

    function getPairResult(uint256 batchId, uint256 pairIndex)
        external
        view
        returns (address candidate, address employer, bool computed, bool compatible)
    {
        PairResult storage result = batchResults[batchId][pairIndex];
        return (result.candidate, result.employer, result.computed, result.compatible);
    }

    function getGlobalStats()
        external
        view
        returns (uint256 totalBatches, uint256 totalMatches, uint256 totalPairs)
    {
        return (batchCount, totalMatchesFound, totalPairsProcessed);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _getCandidateStatus(address candidate) internal view returns (bool submitted, uint256 submittedAt) {
        (,,,, bool s, uint256 t) = cipherCV.candidateProfiles(candidate);
        return (s, t);
    }

    function _getEmployerStatus(address employer) internal view returns (bool submitted, uint256 submittedAt) {
        (,,, bool s, uint256 t) = cipherCV.jobPostings(employer);
        return (s, t);
    }
}