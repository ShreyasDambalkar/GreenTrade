// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract EmissionAudit is Ownable {
    struct AuditRecord {
        uint256 timestamp;
        string sector;
        uint256 emissionValue;
        string unit;
        string dataHash; // Hash of the detailed raw data stored off-chain (e.g., IPFS)
        address recordedBy;
    }

    AuditRecord[] public audits;
    mapping(string => AuditRecord[]) public sectorAudits;

    event AuditRecorded(uint256 indexed id, string sector, uint256 emissionValue, address indexed recordedBy);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function recordAudit(
        string memory _sector,
        uint256 _emissionValue,
        string memory _unit,
        string memory _dataHash
    ) public {
        AuditRecord memory newAudit = AuditRecord({
            timestamp: block.timestamp,
            sector: _sector,
            emissionValue: _emissionValue,
            unit: _unit,
            dataHash: _dataHash,
            recordedBy: msg.sender
        });

        audits.push(newAudit);
        sectorAudits[_sector].push(newAudit);

        emit AuditRecorded(audits.length - 1, _sector, _emissionValue, msg.sender);
    }

    function getAuditCount() public view returns (uint256) {
        return audits.length;
    }

    function getAuditsBySector(string memory _sector) public view returns (AuditRecord[] memory) {
        return sectorAudits[_sector];
    }
}
