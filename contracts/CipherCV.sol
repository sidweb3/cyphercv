// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@fhenixprotocol/cofhe-contracts/access/Permissioned.sol";

/**
 * @title CipherCV
 * @notice Privacy-preserving job matching using Fully Homomorphic Encryption.
 *
 * Candidates submit encrypted salary ranges and experience levels.
 * Employers submit encrypted budget and requirements.
 * The contract computes compatibility on encrypted inputs — no plaintext ever touches the chain.
 *
 * Supported networks: Ethereum Sepolia, Arbitrum Sepolia, Base Sepolia
 * SDK: @cofhe/sdk (cofhe-hardhat-plugin for local testing)
 */
contract CipherCV is Permissioned {
    // ─── Structs ──────────────────────────────────────────────────────────────

    struct CandidateProfile {
        euint32 minSalary;
        euint32 maxSalary;
        euint32 experienceYears;
        euint32 skillScore;
        bool submitted;
        uint256 submittedAt;
    }

    struct JobPosting {
        euint32 budgetMax;
        euint32 requiredExpYears;
        euint32 requiredSkillMin;
        bool submitted;
        uint256 submittedAt;
    }

    struct MatchResult {
        ebool compatible;
        bool salaryRevealed;
        bool candidateConsented;
        bool employerConsented;
        uint256 matchedAt;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    mapping(address => CandidateProfile) public candidateProfiles;
    mapping(address => JobPosting) public jobPostings;
    mapping(bytes32 => MatchResult) public matchResults;

    address[] public candidateList;
    address[] public employerList;

    // ─── Events ───────────────────────────────────────────────────────────────

    event CandidateProfileSubmitted(address indexed candidate, uint256 timestamp);
    event JobPostingSubmitted(address indexed employer, uint256 timestamp);
    event MatchComputed(bytes32 indexed matchId, address indexed candidate, address indexed employer);
    event ConsentGiven(bytes32 indexed matchId, address indexed party, string role);

    // ─── Candidate Functions ──────────────────────────────────────────────────

    function submitCandidateProfile(
        inEuint32 calldata inMinSalary,
        inEuint32 calldata inMaxSalary,
        inEuint32 calldata inExperience,
        inEuint32 calldata inSkillScore
    ) external {
        CandidateProfile storage profile = candidateProfiles[msg.sender];

        profile.minSalary = FHE.asEuint32(inMinSalary);
        profile.maxSalary = FHE.asEuint32(inMaxSalary);
        profile.experienceYears = FHE.asEuint32(inExperience);
        profile.skillScore = FHE.asEuint32(inSkillScore);
        profile.submitted = true;
        profile.submittedAt = block.timestamp;

        // Grant access permissions
        FHE.allowThis(profile.minSalary);
        FHE.allowThis(profile.maxSalary);
        FHE.allowThis(profile.experienceYears);
        FHE.allowThis(profile.skillScore);
        FHE.allowSender(profile.minSalary);
        FHE.allowSender(profile.maxSalary);
        FHE.allowSender(profile.experienceYears);
        FHE.allowSender(profile.skillScore);

        if (!_isCandidateRegistered(msg.sender)) {
            candidateList.push(msg.sender);
        }

        emit CandidateProfileSubmitted(msg.sender, block.timestamp);
    }

    // ─── Employer Functions ───────────────────────────────────────────────────

    function submitJobPosting(
        inEuint32 calldata inBudgetMax,
        inEuint32 calldata inRequiredExp,
        inEuint32 calldata inRequiredSkill
    ) external {
        JobPosting storage posting = jobPostings[msg.sender];

        posting.budgetMax = FHE.asEuint32(inBudgetMax);
        posting.requiredExpYears = FHE.asEuint32(inRequiredExp);
        posting.requiredSkillMin = FHE.asEuint32(inRequiredSkill);
        posting.submitted = true;
        posting.submittedAt = block.timestamp;

        FHE.allowThis(posting.budgetMax);
        FHE.allowThis(posting.requiredExpYears);
        FHE.allowThis(posting.requiredSkillMin);
        FHE.allowSender(posting.budgetMax);
        FHE.allowSender(posting.requiredExpYears);
        FHE.allowSender(posting.requiredSkillMin);

        if (!_isEmployerRegistered(msg.sender)) {
            employerList.push(msg.sender);
        }

        emit JobPostingSubmitted(msg.sender, block.timestamp);
    }

    // ─── Matching Engine ──────────────────────────────────────────────────────

    function computeMatch(address candidateAddr, address employerAddr) external {
        require(candidateProfiles[candidateAddr].submitted, "Candidate profile not submitted");
        require(jobPostings[employerAddr].submitted, "Job posting not submitted");

        CandidateProfile storage candidate = candidateProfiles[candidateAddr];
        JobPosting storage employer = jobPostings[employerAddr];

        ebool salaryCompatible = FHE.lte(candidate.minSalary, employer.budgetMax);
        ebool expCompatible    = FHE.gte(candidate.experienceYears, employer.requiredExpYears);
        ebool skillCompatible  = FHE.gte(candidate.skillScore, employer.requiredSkillMin);

        ebool compatible = FHE.and(FHE.and(salaryCompatible, expCompatible), skillCompatible);

        bytes32 matchId = _matchId(candidateAddr, employerAddr);
        matchResults[matchId] = MatchResult({
            compatible: compatible,
            salaryRevealed: false,
            candidateConsented: false,
            employerConsented: false,
            matchedAt: block.timestamp
        });

        FHE.allowThis(compatible);
        FHE.allow(compatible, candidateAddr);
        FHE.allow(compatible, employerAddr);

        emit MatchComputed(matchId, candidateAddr, employerAddr);
    }

    // ─── Consent & Reveal ─────────────────────────────────────────────────────

    function candidateConsent(address employerAddr) external {
        bytes32 matchId = _matchId(msg.sender, employerAddr);
        require(matchResults[matchId].matchedAt > 0, "Match not computed");
        matchResults[matchId].candidateConsented = true;
        emit ConsentGiven(matchId, msg.sender, "candidate");
    }

    function employerConsent(address candidateAddr) external {
        bytes32 matchId = _matchId(candidateAddr, msg.sender);
        require(matchResults[matchId].matchedAt > 0, "Match not computed");
        matchResults[matchId].employerConsented = true;
        emit ConsentGiven(matchId, msg.sender, "employer");
    }

    function revealMatch(address candidateAddr, address employerAddr)
        external
        view
        returns (bool isCompatible)
    {
        bytes32 matchId = _matchId(candidateAddr, employerAddr);
        MatchResult storage result = matchResults[matchId];
        require(result.candidateConsented && result.employerConsented, "Both parties must consent");
        return FHE.decrypt(result.compatible);
    }

    function sealedMatchResult(
        address candidateAddr,
        address employerAddr,
        Permission memory permission
    ) external view onlySender(permission) returns (bytes memory) {
        bytes32 matchId = _matchId(candidateAddr, employerAddr);
        return FHE.sealoutput(matchResults[matchId].compatible, permission.publicKey);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getCandidateCount() external view returns (uint256) {
        return candidateList.length;
    }

    function getEmployerCount() external view returns (uint256) {
        return employerList.length;
    }

    function getMatchStatus(address candidateAddr, address employerAddr)
        external
        view
        returns (bool exists, bool candidateConsented, bool employerConsented, bool salaryRevealed)
    {
        bytes32 matchId = _matchId(candidateAddr, employerAddr);
        MatchResult storage result = matchResults[matchId];
        return (result.matchedAt > 0, result.candidateConsented, result.employerConsented, result.salaryRevealed);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _matchId(address candidate, address employer) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(candidate, employer));
    }

    function _isCandidateRegistered(address addr) internal view returns (bool) {
        for (uint256 i = 0; i < candidateList.length; i++) {
            if (candidateList[i] == addr) return true;
        }
        return false;
    }

    function _isEmployerRegistered(address addr) internal view returns (bool) {
        for (uint256 i = 0; i < employerList.length; i++) {
            if (employerList[i] == addr) return true;
        }
        return false;
    }
}