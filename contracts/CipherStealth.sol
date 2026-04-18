// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@fhenixprotocol/cofhe-contracts/access/Permissioned.sol";

/**
 * @title CipherStealth
 * @notice Stealth mode employer blocklist for Cipher CV.
 * Supported networks: Ethereum Sepolia, Arbitrum Sepolia, Base Sepolia
 * SDK: @cofhe/sdk
 */
contract CipherStealth is Permissioned {
    enum StealthMode {
        Off,
        Blocklist,
        Allowlist,
        TimeLocked,
        FullStealth
    }

    struct StealthSettings {
        StealthMode mode;
        uint256 timeLockDate;
        bool active;
        uint256 updatedAt;
    }

    mapping(address => StealthSettings) public stealthSettings;
    mapping(address => mapping(address => bool)) public blocklist;
    mapping(address => mapping(address => bool)) public allowlist;
    mapping(address => mapping(bytes32 => bool)) public domainBlocklist;
    mapping(address => uint256) public blocklistCount;
    mapping(address => uint256) public allowlistCount;

    event StealthModeUpdated(address indexed candidate, StealthMode mode);
    event EmployerBlocked(address indexed candidate, address indexed employer);
    event EmployerUnblocked(address indexed candidate, address indexed employer);
    event EmployerAllowed(address indexed candidate, address indexed employer);
    event DomainBlocked(address indexed candidate, bytes32 indexed domainHash);
    event TimeLockSet(address indexed candidate, uint256 unlockDate);

    function setStealthMode(StealthMode mode) external {
        stealthSettings[msg.sender].mode = mode;
        stealthSettings[msg.sender].active = true;
        stealthSettings[msg.sender].updatedAt = block.timestamp;
        emit StealthModeUpdated(msg.sender, mode);
    }

    function setTimeLock(uint256 unlockDate) external {
        require(unlockDate > block.timestamp, "Must be in the future");
        stealthSettings[msg.sender].timeLockDate = unlockDate;
        stealthSettings[msg.sender].mode = StealthMode.TimeLocked;
        stealthSettings[msg.sender].updatedAt = block.timestamp;
        emit TimeLockSet(msg.sender, unlockDate);
    }

    function blockEmployer(address employer) external {
        require(!blocklist[msg.sender][employer], "Already blocked");
        blocklist[msg.sender][employer] = true;
        blocklistCount[msg.sender]++;
        emit EmployerBlocked(msg.sender, employer);
    }

    function unblockEmployer(address employer) external {
        require(blocklist[msg.sender][employer], "Not blocked");
        blocklist[msg.sender][employer] = false;
        blocklistCount[msg.sender]--;
        emit EmployerUnblocked(msg.sender, employer);
    }

    function allowEmployer(address employer) external {
        require(!allowlist[msg.sender][employer], "Already allowed");
        allowlist[msg.sender][employer] = true;
        allowlistCount[msg.sender]++;
        emit EmployerAllowed(msg.sender, employer);
    }

    function blockDomain(bytes32 domainHash) external {
        domainBlocklist[msg.sender][domainHash] = true;
        emit DomainBlocked(msg.sender, domainHash);
    }

    function isVisible(address candidate, address employer) external view returns (bool) {
        StealthSettings storage settings = stealthSettings[candidate];

        if (!settings.active) return true;

        if (settings.mode == StealthMode.FullStealth) return false;

        if (settings.mode == StealthMode.TimeLocked) {
            return block.timestamp >= settings.timeLockDate;
        }

        if (settings.mode == StealthMode.Blocklist) {
            return !blocklist[candidate][employer];
        }

        if (settings.mode == StealthMode.Allowlist) {
            return allowlist[candidate][employer];
        }

        return true;
    }

    function getStealthSettings(address candidate)
        external
        view
        returns (StealthMode mode, uint256 timeLockDate, bool active, uint256 blockCount, uint256 allowCount)
    {
        StealthSettings storage s = stealthSettings[candidate];
        return (s.mode, s.timeLockDate, s.active, blocklistCount[candidate], allowlistCount[candidate]);
    }
}