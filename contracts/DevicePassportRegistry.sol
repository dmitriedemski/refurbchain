// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract DevicePassportRegistry is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SERVICE_ROLE = keccak256("SERVICE_ROLE");

    enum ReportStatus { Clean, Warning, Blacklisted }

    struct Report {
        uint256 reportId;
        bytes32 deviceHash;
        bytes32 reportHash;
        address serviceAddress;
        uint64 timestamp;
        ReportStatus status;
        uint256 flags;
        string metadataURI;
        bool active;
    }

    uint256 public nextReportId = 1;
    mapping(uint256 => Report) public reportsById;
    mapping(bytes32 => uint256[]) private deviceReports;

    event ServiceAuthorized(address indexed service, address indexed admin);
    event ServiceRevoked(address indexed service, address indexed admin);
    event ReportRegistered(
        uint256 indexed reportId,
        bytes32 indexed deviceHash,
        address indexed serviceAddress,
        bytes32 reportHash,
        ReportStatus status,
        uint256 flags,
        string metadataURI
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    function authorizeService(address service) external onlyRole(ADMIN_ROLE) {
        grantRole(SERVICE_ROLE, service);
        emit ServiceAuthorized(service, msg.sender);
    }

    function revokeService(address service) external onlyRole(ADMIN_ROLE) {
        revokeRole(SERVICE_ROLE, service);
        emit ServiceRevoked(service, msg.sender);
    }

    function registerReport(
        bytes32 deviceHash,
        bytes32 reportHash,
        ReportStatus status,
        uint256 flags,
        string calldata metadataURI
    ) external onlyRole(SERVICE_ROLE) returns (uint256) {
        uint256 reportId = nextReportId++;
        Report memory report = Report({
            reportId: reportId,
            deviceHash: deviceHash,
            reportHash: reportHash,
            serviceAddress: msg.sender,
            timestamp: uint64(block.timestamp),
            status: status,
            flags: flags,
            metadataURI: metadataURI,
            active: true
        });
        reportsById[reportId] = report;
        deviceReports[deviceHash].push(reportId);
        emit ReportRegistered(reportId, deviceHash, msg.sender, reportHash, status, flags, metadataURI);
        return reportId;
    }

    function getReportIdsByDevice(bytes32 deviceHash) external view returns (uint256[] memory) {
        return deviceReports[deviceHash];
    }

    function getReportCountByDevice(bytes32 deviceHash) external view returns (uint256) {
        return deviceReports[deviceHash].length;
    }

    function isTrustedService(address service) external view returns (bool) {
        return hasRole(SERVICE_ROLE, service);
    }
}
