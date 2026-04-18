// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@fhenixprotocol/cofhe-contracts/access/Permissioned.sol";

/**
 * @title CipherVault
 * @notice Privacy-preserving credential vault for Cipher CV.
 * Supported networks: Ethereum Sepolia, Arbitrum Sepolia, Base Sepolia
 * SDK: @cofhe/sdk
 */
contract CipherVault is Permissioned {
    // ─── Types ────────────────────────────────────────────────────────────────

    enum CredentialType { Salary, Experience, SkillScore, Custom }

    struct Credential {
        euint32 value;
        CredentialType credType;
        string label;
        bool active;
        uint256 createdAt;
        uint256 updatedAt;
        uint32 version;
    }

    struct AccessLog {
        address requester;
        uint256 credentialIndex;
        uint256 timestamp;
        string purpose;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    mapping(address => mapping(uint256 => Credential)) public credentials;
    mapping(address => uint256) public credentialCount;
    mapping(address => AccessLog[]) public accessLogs;
    mapping(address => bool) public registered;

    address[] public vaultOwners;

    // ─── Events ───────────────────────────────────────────────────────────────

    event CredentialStored(address indexed owner, uint256 indexed index, CredentialType credType, string label);
    event CredentialRevoked(address indexed owner, uint256 indexed index);
    event CredentialUpdated(address indexed owner, uint256 indexed index, uint32 newVersion);
    event AccessLogged(address indexed owner, address indexed requester, uint256 indexed credentialIndex);

    // ─── Vault Functions ──────────────────────────────────────────────────────

    function storeCredential(
        inEuint32 calldata inValue,
        CredentialType credType,
        string calldata label
    ) external returns (uint256 index) {
        if (!registered[msg.sender]) {
            registered[msg.sender] = true;
            vaultOwners.push(msg.sender);
        }

        index = credentialCount[msg.sender];
        credentials[msg.sender][index] = Credential({
            value: FHE.asEuint32(inValue),
            credType: credType,
            label: label,
            active: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            version: 1
        });

        FHE.allowThis(credentials[msg.sender][index].value);
        FHE.allowSender(credentials[msg.sender][index].value);

        credentialCount[msg.sender]++;
        emit CredentialStored(msg.sender, index, credType, label);
    }

    function updateCredential(
        uint256 index,
        inEuint32 calldata inNewValue
    ) external {
        require(index < credentialCount[msg.sender], "Invalid index");
        require(credentials[msg.sender][index].active, "Credential revoked");

        Credential storage cred = credentials[msg.sender][index];
        cred.value = FHE.asEuint32(inNewValue);
        cred.updatedAt = block.timestamp;
        cred.version++;

        FHE.allowThis(cred.value);
        FHE.allowSender(cred.value);

        emit CredentialUpdated(msg.sender, index, cred.version);
    }

    function revokeCredential(uint256 index) external {
        require(index < credentialCount[msg.sender], "Invalid index");
        credentials[msg.sender][index].active = false;
        emit CredentialRevoked(msg.sender, index);
    }

    function sealCredential(
        uint256 index,
        Permission memory permission
    ) external view onlySender(permission) returns (bytes memory) {
        require(index < credentialCount[msg.sender], "Invalid index");
        require(credentials[msg.sender][index].active, "Credential revoked");
        return FHE.sealoutput(credentials[msg.sender][index].value, permission.publicKey);
    }

    function logAccess(
        address owner,
        uint256 credentialIndex,
        string calldata purpose
    ) external {
        accessLogs[owner].push(AccessLog({
            requester: msg.sender,
            credentialIndex: credentialIndex,
            timestamp: block.timestamp,
            purpose: purpose
        }));
        emit AccessLogged(owner, msg.sender, credentialIndex);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getCredentialMeta(address owner, uint256 index)
        external
        view
        returns (
            CredentialType credType,
            string memory label,
            bool active,
            uint256 createdAt,
            uint256 updatedAt,
            uint32 version
        )
    {
        Credential storage cred = credentials[owner][index];
        return (cred.credType, cred.label, cred.active, cred.createdAt, cred.updatedAt, cred.version);
    }

    function getAccessLogCount(address owner) external view returns (uint256) {
        return accessLogs[owner].length;
    }

    function getAccessLog(address owner, uint256 logIndex)
        external
        view
        returns (address requester, uint256 credentialIndex, uint256 timestamp, string memory purpose)
    {
        AccessLog storage log = accessLogs[owner][logIndex];
        return (log.requester, log.credentialIndex, log.timestamp, log.purpose);
    }

    function getVaultOwnerCount() external view returns (uint256) {
        return vaultOwners.length;
    }
}