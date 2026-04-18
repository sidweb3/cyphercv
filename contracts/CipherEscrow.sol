// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@fhenixprotocol/cofhe-contracts/access/Permissioned.sol";

/**
 * @title CipherEscrow
 * @notice Interview Insurance escrow contract for Cipher CV.
 * Supported networks: Ethereum Sepolia, Arbitrum Sepolia, Base Sepolia
 * SDK: @cofhe/sdk
 */
contract CipherEscrow is Permissioned {
    // ─── Types ────────────────────────────────────────────────────────────────

    enum InsuranceStatus { Active, InterviewsScheduled, Completed, Refunded, Expired }

    struct InsuranceOrder {
        address candidate;
        uint256 premium;
        euint32 targetSalaryMin;
        euint32 targetSalaryMax;
        string targetRole;
        uint256 interviewsTarget;
        uint256 interviewsDelivered;
        InsuranceStatus status;
        uint256 activatedAt;
        uint256 expiresAt;
        uint256 completedAt;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 public constant PROTOCOL_FEE_BPS = 500;
    uint256 public constant INTERVIEW_WINDOW = 30 days;
    uint256 public constant MIN_PREMIUM = 0.01 ether;

    mapping(address => InsuranceOrder) public orders;
    mapping(address => bool) public hasActiveOrder;

    address public protocolTreasury;
    address public admin;
    uint256 public totalPremiumsCollected;
    uint256 public totalRefundsIssued;

    // ─── Events ───────────────────────────────────────────────────────────────

    event InsuranceActivated(address indexed candidate, uint256 premium, uint256 interviewsTarget);
    event InterviewDelivered(address indexed candidate, uint256 interviewsDelivered, uint256 remaining);
    event InsuranceCompleted(address indexed candidate, uint256 protocolFee);
    event InsuranceRefunded(address indexed candidate, uint256 refundAmount);
    event InsuranceExpired(address indexed candidate, uint256 refundAmount);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _treasury) {
        protocolTreasury = _treasury;
        admin = msg.sender;
    }

    // ─── Insurance Functions ──────────────────────────────────────────────────

    function activateInsurance(
        inEuint32 calldata inTargetSalaryMin,
        inEuint32 calldata inTargetSalaryMax,
        string calldata targetRole,
        uint256 interviewsTarget
    ) external payable {
        require(msg.value >= MIN_PREMIUM, "Premium too low");
        require(interviewsTarget >= 1 && interviewsTarget <= 5, "Invalid target");
        require(!hasActiveOrder[msg.sender], "Already has active insurance");

        orders[msg.sender] = InsuranceOrder({
            candidate: msg.sender,
            premium: msg.value,
            targetSalaryMin: FHE.asEuint32(inTargetSalaryMin),
            targetSalaryMax: FHE.asEuint32(inTargetSalaryMax),
            targetRole: targetRole,
            interviewsTarget: interviewsTarget,
            interviewsDelivered: 0,
            status: InsuranceStatus.Active,
            activatedAt: block.timestamp,
            expiresAt: block.timestamp + INTERVIEW_WINDOW,
            completedAt: 0
        });

        FHE.allowThis(orders[msg.sender].targetSalaryMin);
        FHE.allowThis(orders[msg.sender].targetSalaryMax);
        FHE.allowSender(orders[msg.sender].targetSalaryMin);
        FHE.allowSender(orders[msg.sender].targetSalaryMax);

        hasActiveOrder[msg.sender] = true;
        totalPremiumsCollected += msg.value;

        emit InsuranceActivated(msg.sender, msg.value, interviewsTarget);
    }

    function recordInterviewDelivery(address candidate) external {
        require(msg.sender == admin, "Not authorized");
        InsuranceOrder storage order = orders[candidate];
        require(order.status == InsuranceStatus.Active || order.status == InsuranceStatus.InterviewsScheduled, "Not active");
        require(block.timestamp <= order.expiresAt, "Order expired");

        order.interviewsDelivered++;
        order.status = InsuranceStatus.InterviewsScheduled;

        emit InterviewDelivered(candidate, order.interviewsDelivered, order.interviewsTarget - order.interviewsDelivered);

        if (order.interviewsDelivered >= order.interviewsTarget) {
            _completeInsurance(candidate);
        }
    }

    function claimRefund() external {
        InsuranceOrder storage order = orders[msg.sender];
        require(order.candidate == msg.sender, "No order found");
        require(
            order.status == InsuranceStatus.Active || order.status == InsuranceStatus.InterviewsScheduled,
            "Not eligible for refund"
        );
        require(block.timestamp > order.expiresAt, "Window not expired");

        uint256 refundAmount;
        if (order.interviewsDelivered == 0) {
            refundAmount = order.premium;
        } else {
            uint256 undelivered = order.interviewsTarget - order.interviewsDelivered;
            refundAmount = (order.premium * undelivered) / order.interviewsTarget;
        }

        order.status = InsuranceStatus.Refunded;
        hasActiveOrder[msg.sender] = false;
        totalRefundsIssued += refundAmount;

        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");

        emit InsuranceRefunded(msg.sender, refundAmount);
    }

    function checkSalaryEligibility(
        address candidate,
        inEuint32 calldata jobBudgetMax
    ) external view returns (ebool) {
        InsuranceOrder storage order = orders[candidate];
        require(order.candidate == candidate, "No order");
        euint32 budget = FHE.asEuint32(jobBudgetMax);
        return FHE.gte(budget, order.targetSalaryMin);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getOrderStatus(address candidate)
        external
        view
        returns (
            InsuranceStatus status,
            uint256 premium,
            uint256 interviewsDelivered,
            uint256 interviewsTarget,
            uint256 expiresAt,
            string memory targetRole
        )
    {
        InsuranceOrder storage order = orders[candidate];
        return (order.status, order.premium, order.interviewsDelivered, order.interviewsTarget, order.expiresAt, order.targetRole);
    }

    function getProtocolStats()
        external
        view
        returns (uint256 totalPremiums, uint256 totalRefunds, uint256 balance)
    {
        return (totalPremiumsCollected, totalRefundsIssued, address(this).balance);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _completeInsurance(address candidate) internal {
        InsuranceOrder storage order = orders[candidate];
        order.status = InsuranceStatus.Completed;
        order.completedAt = block.timestamp;
        hasActiveOrder[candidate] = false;

        uint256 fee = (order.premium * PROTOCOL_FEE_BPS) / 10000;
        (bool feeSuccess, ) = payable(protocolTreasury).call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        emit InsuranceCompleted(candidate, fee);
    }

    function updateAdmin(address newAdmin) external {
        require(msg.sender == admin, "Not admin");
        admin = newAdmin;
    }

    function updateTreasury(address newTreasury) external {
        require(msg.sender == admin, "Not admin");
        protocolTreasury = newTreasury;
    }

    receive() external payable {}
}