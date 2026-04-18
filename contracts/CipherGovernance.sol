// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@fhenixprotocol/cofhe-contracts/access/Permissioned.sol";

/**
 * @title CipherGovernance
 * @notice On-chain governance with encrypted voting weights for Cipher CV.
 * Supported networks: Ethereum Sepolia, Arbitrum Sepolia, Base Sepolia
 * SDK: @cofhe/sdk
 */
contract CipherGovernance is Permissioned {
    enum ProposalStatus { Active, Passed, Rejected, Executed, Cancelled }

    struct Proposal {
        uint256 id;
        string title;
        string description;
        address proposer;
        euint32 votesFor;
        euint32 votesAgainst;
        ProposalStatus status;
        uint256 createdAt;
        uint256 votingEndsAt;
        uint256 executedAt;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public proposalCount;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant MIN_QUORUM = 10;
    address public admin;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string title);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalFinalized(uint256 indexed id, ProposalStatus status);

    constructor() {
        admin = msg.sender;
    }

    function createProposal(string calldata title, string calldata description) external returns (uint256 id) {
        id = proposalCount++;
        proposals[id] = Proposal({
            id: id,
            title: title,
            description: description,
            proposer: msg.sender,
            votesFor: FHE.asEuint32(0),
            votesAgainst: FHE.asEuint32(0),
            status: ProposalStatus.Active,
            createdAt: block.timestamp,
            votingEndsAt: block.timestamp + VOTING_PERIOD,
            executedAt: 0
        });

        FHE.allowThis(proposals[id].votesFor);
        FHE.allowThis(proposals[id].votesAgainst);

        emit ProposalCreated(id, msg.sender, title);
    }

    function castVote(uint256 proposalId, inEuint32 calldata inVoteWeight, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Not active");
        require(block.timestamp <= proposal.votingEndsAt, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        euint32 weight = FHE.asEuint32(inVoteWeight);
        FHE.allowThis(weight);

        if (support) {
            proposal.votesFor = FHE.add(proposal.votesFor, weight);
            FHE.allowThis(proposal.votesFor);
        } else {
            proposal.votesAgainst = FHE.add(proposal.votesAgainst, weight);
            FHE.allowThis(proposal.votesAgainst);
        }

        hasVoted[proposalId][msg.sender] = true;
        emit VoteCast(proposalId, msg.sender, support);
    }

    function finalizeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Not active");
        require(block.timestamp > proposal.votingEndsAt, "Voting not ended");

        ebool passed = FHE.gt(proposal.votesFor, proposal.votesAgainst);
        bool result = FHE.decrypt(passed);

        proposal.status = result ? ProposalStatus.Passed : ProposalStatus.Rejected;
        emit ProposalFinalized(proposalId, proposal.status);
    }

    function getProposalCount() external view returns (uint256) {
        return proposalCount;
    }

    function getProposalStatus(uint256 proposalId) external view returns (ProposalStatus) {
        return proposals[proposalId].status;
    }
}