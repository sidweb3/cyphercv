// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@fhenixprotocol/cofhe-contracts/access/Permissioned.sol";

/**
 * @title CipherCounterOffer
 * @notice Privacy-preserving counter-offer calculator for Cipher CV.
 * Supported networks: Ethereum Sepolia, Arbitrum Sepolia, Base Sepolia
 * SDK: @cofhe/sdk
 */
contract CipherCounterOffer is Permissioned {
    struct CounterOfferRequest {
        euint32 currentSalary;
        euint32 targetIncrease;
        euint32 yearsAtCompany;
        string role;
        bool computed;
        uint256 submittedAt;
        uint256 computedAt;
    }

    struct MarketBenchmark {
        string role;
        euint32 p25Salary;
        euint32 p50Salary;
        euint32 p75Salary;
        euint32 p90Salary;
        bool active;
    }

    mapping(address => CounterOfferRequest) public requests;
    mapping(bytes32 => MarketBenchmark) public benchmarks;
    string[] public benchmarkRoles;

    address public admin;
    uint256 public totalRequests;

    event CounterOfferRequested(address indexed candidate, string role);
    event CounterOfferComputed(address indexed candidate);
    event BenchmarkUpdated(string role);

    constructor() {
        admin = msg.sender;
    }

    function requestCounterOffer(
        inEuint32 calldata inCurrentSalary,
        inEuint32 calldata inTargetIncrease,
        inEuint32 calldata inYearsAtCompany,
        string calldata role
    ) external {
        requests[msg.sender] = CounterOfferRequest({
            currentSalary: FHE.asEuint32(inCurrentSalary),
            targetIncrease: FHE.asEuint32(inTargetIncrease),
            yearsAtCompany: FHE.asEuint32(inYearsAtCompany),
            role: role,
            computed: false,
            submittedAt: block.timestamp,
            computedAt: 0
        });

        FHE.allowThis(requests[msg.sender].currentSalary);
        FHE.allowThis(requests[msg.sender].targetIncrease);
        FHE.allowThis(requests[msg.sender].yearsAtCompany);
        FHE.allowSender(requests[msg.sender].currentSalary);
        FHE.allowSender(requests[msg.sender].targetIncrease);
        FHE.allowSender(requests[msg.sender].yearsAtCompany);

        totalRequests++;
        emit CounterOfferRequested(msg.sender, role);
    }

    function computeCounterOffer(address candidate) external {
        require(msg.sender == admin, "Not authorized");
        CounterOfferRequest storage req = requests[candidate];
        require(!req.computed, "Already computed");
        req.computed = true;
        req.computedAt = block.timestamp;
        emit CounterOfferComputed(candidate);
    }

    function sealCurrentSalary(
        Permission memory permission
    ) external view onlySender(permission) returns (bytes memory) {
        require(requests[msg.sender].submittedAt > 0, "No request found");
        return FHE.sealoutput(requests[msg.sender].currentSalary, permission.publicKey);
    }

    function isBelowMarketMedian(address candidate) external view returns (ebool) {
        CounterOfferRequest storage req = requests[candidate];
        bytes32 roleHash = keccak256(bytes(req.role));
        MarketBenchmark storage bench = benchmarks[roleHash];
        require(bench.active, "No benchmark for role");
        return FHE.lt(req.currentSalary, bench.p50Salary);
    }

    function computeLeverageScore(address candidate) external view returns (euint32) {
        CounterOfferRequest storage req = requests[candidate];
        bytes32 roleHash = keccak256(bytes(req.role));
        MarketBenchmark storage bench = benchmarks[roleHash];
        require(bench.active, "No benchmark for role");

        euint32 score = FHE.asEuint32(0);
        euint32 one = FHE.asEuint32(1);

        ebool aboveP25 = FHE.gte(req.currentSalary, bench.p25Salary);
        ebool aboveP50 = FHE.gte(req.currentSalary, bench.p50Salary);
        ebool aboveP75 = FHE.gte(req.currentSalary, bench.p75Salary);
        ebool aboveP90 = FHE.gte(req.currentSalary, bench.p90Salary);

        score = FHE.add(score, FHE.select(aboveP25, one, FHE.asEuint32(0)));
        score = FHE.add(score, FHE.select(aboveP50, one, FHE.asEuint32(0)));
        score = FHE.add(score, FHE.select(aboveP75, one, FHE.asEuint32(0)));
        score = FHE.add(score, FHE.select(aboveP90, one, FHE.asEuint32(0)));

        return score;
    }

    function setBenchmark(
        string calldata role,
        inEuint32 calldata inP25,
        inEuint32 calldata inP50,
        inEuint32 calldata inP75,
        inEuint32 calldata inP90
    ) external {
        require(msg.sender == admin, "Not authorized");
        bytes32 roleHash = keccak256(bytes(role));

        if (!benchmarks[roleHash].active) {
            benchmarkRoles.push(role);
        }

        benchmarks[roleHash] = MarketBenchmark({
            role: role,
            p25Salary: FHE.asEuint32(inP25),
            p50Salary: FHE.asEuint32(inP50),
            p75Salary: FHE.asEuint32(inP75),
            p90Salary: FHE.asEuint32(inP90),
            active: true
        });

        FHE.allowThis(benchmarks[roleHash].p25Salary);
        FHE.allowThis(benchmarks[roleHash].p50Salary);
        FHE.allowThis(benchmarks[roleHash].p75Salary);
        FHE.allowThis(benchmarks[roleHash].p90Salary);

        emit BenchmarkUpdated(role);
    }

    function getRequestStatus(address candidate)
        external
        view
        returns (bool hasRequest, bool computed, string memory role, uint256 submittedAt)
    {
        CounterOfferRequest storage req = requests[candidate];
        return (req.submittedAt > 0, req.computed, req.role, req.submittedAt);
    }

    function getBenchmarkRoles() external view returns (string[] memory) {
        return benchmarkRoles;
    }

    function getTotalRequests() external view returns (uint256) {
        return totalRequests;
    }
}