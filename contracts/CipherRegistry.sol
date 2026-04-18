// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CipherRegistry
 * @notice Protocol registry for all Cipher CV smart contracts.
 *
 * Single source of truth for all deployed contract addresses.
 * Frontend reads from this registry to discover contract addresses
 * without hardcoding them.
 *
 * Features:
 *   - Contract address registry with versioning
 *   - Upgrade path (new version → old version archived)
 *   - Pause/unpause individual contracts
 *   - Protocol-wide emergency pause
 *   - Event log for all registry changes
 */
contract CipherRegistry {
    // ─── Types ────────────────────────────────────────────────────────────────

    struct ContractEntry {
        address contractAddress;
        string name;
        string version;
        bool active;
        bool paused;
        uint256 deployedAt;
        uint256 updatedAt;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    mapping(bytes32 => ContractEntry) public contracts;
    bytes32[] public contractKeys;

    bool public protocolPaused;
    address public admin;
    address public pendingAdmin;

    // ─── Events ───────────────────────────────────────────────────────────────

    event ContractRegistered(bytes32 indexed key, address contractAddress, string name, string version);
    event ContractUpdated(bytes32 indexed key, address oldAddress, address newAddress, string newVersion);
    event ContractPaused(bytes32 indexed key);
    event ContractUnpaused(bytes32 indexed key);
    event ProtocolPaused(address indexed by);
    event ProtocolUnpaused(address indexed by);
    event AdminTransferInitiated(address indexed newAdmin);
    event AdminTransferCompleted(address indexed newAdmin);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        admin = msg.sender;
    }

    // ─── Registry Functions ───────────────────────────────────────────────────

    /**
     * @notice Register a new contract in the registry.
     * @param name Contract name (e.g., "CipherCV")
     * @param version Version string (e.g., "1.0.0")
     * @param contractAddress Deployed contract address
     */
    function register(
        string calldata name,
        string calldata version,
        address contractAddress
    ) external {
        require(msg.sender == admin, "Not admin");
        require(contractAddress != address(0), "Zero address");

        bytes32 key = keccak256(bytes(name));

        if (!contracts[key].active) {
            contractKeys.push(key);
        }

        contracts[key] = ContractEntry({
            contractAddress: contractAddress,
            name: name,
            version: version,
            active: true,
            paused: false,
            deployedAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit ContractRegistered(key, contractAddress, name, version);
    }

    /**
     * @notice Update a contract address (upgrade path).
     * @param name Contract name
     * @param newVersion New version string
     * @param newAddress New contract address
     */
    function upgrade(
        string calldata name,
        string calldata newVersion,
        address newAddress
    ) external {
        require(msg.sender == admin, "Not admin");
        bytes32 key = keccak256(bytes(name));
        require(contracts[key].active, "Contract not registered");

        address oldAddress = contracts[key].contractAddress;
        contracts[key].contractAddress = newAddress;
        contracts[key].version = newVersion;
        contracts[key].updatedAt = block.timestamp;

        emit ContractUpdated(key, oldAddress, newAddress, newVersion);
    }

    /**
     * @notice Pause a specific contract.
     */
    function pauseContract(string calldata name) external {
        require(msg.sender == admin, "Not admin");
        bytes32 key = keccak256(bytes(name));
        contracts[key].paused = true;
        emit ContractPaused(key);
    }

    /**
     * @notice Unpause a specific contract.
     */
    function unpauseContract(string calldata name) external {
        require(msg.sender == admin, "Not admin");
        bytes32 key = keccak256(bytes(name));
        contracts[key].paused = false;
        emit ContractUnpaused(key);
    }

    /**
     * @notice Emergency pause the entire protocol.
     */
    function pauseProtocol() external {
        require(msg.sender == admin, "Not admin");
        protocolPaused = true;
        emit ProtocolPaused(msg.sender);
    }

    /**
     * @notice Unpause the protocol.
     */
    function unpauseProtocol() external {
        require(msg.sender == admin, "Not admin");
        protocolPaused = false;
        emit ProtocolUnpaused(msg.sender);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    /**
     * @notice Get a contract address by name.
     * @param name Contract name
     */
    function getAddress(string calldata name) external view returns (address) {
        bytes32 key = keccak256(bytes(name));
        ContractEntry storage entry = contracts[key];
        require(entry.active, "Contract not registered");
        require(!entry.paused, "Contract is paused");
        require(!protocolPaused, "Protocol is paused");
        return entry.contractAddress;
    }

    /**
     * @notice Get full contract entry by name.
     */
    function getEntry(string calldata name)
        external
        view
        returns (
            address contractAddress,
            string memory version,
            bool active,
            bool paused,
            uint256 deployedAt
        )
    {
        bytes32 key = keccak256(bytes(name));
        ContractEntry storage entry = contracts[key];
        return (entry.contractAddress, entry.version, entry.active, entry.paused, entry.deployedAt);
    }

    /**
     * @notice Get all registered contract names.
     */
    function getAllContracts()
        external
        view
        returns (string[] memory names, address[] memory addresses, bool[] memory paused)
    {
        uint256 len = contractKeys.length;
        names = new string[](len);
        addresses = new address[](len);
        paused = new bool[](len);

        for (uint256 i = 0; i < len; i++) {
            ContractEntry storage entry = contracts[contractKeys[i]];
            names[i] = entry.name;
            addresses[i] = entry.contractAddress;
            paused[i] = entry.paused;
        }
    }

    function getContractCount() external view returns (uint256) {
        return contractKeys.length;
    }

    // ─── Admin Transfer ───────────────────────────────────────────────────────

    function initiateAdminTransfer(address newAdmin) external {
        require(msg.sender == admin, "Not admin");
        pendingAdmin = newAdmin;
        emit AdminTransferInitiated(newAdmin);
    }

    function acceptAdminTransfer() external {
        require(msg.sender == pendingAdmin, "Not pending admin");
        admin = pendingAdmin;
        pendingAdmin = address(0);
        emit AdminTransferCompleted(admin);
    }
}
