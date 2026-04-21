const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DevicePassportRegistry", function () {
  async function deployFixture() {
    const [admin, service, attacker] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("DevicePassportRegistry");
    const contract = await Factory.deploy(admin.address);
    await contract.waitForDeployment();
    return { contract, admin, service, attacker };
  }

  it("authorizes service and registers report", async function () {
    const { contract, admin, service } = await deployFixture();
    await contract.connect(admin).authorizeService(service.address);
    const deviceHash = ethers.keccak256(ethers.toUtf8Bytes("device-1"));
    const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report-1"));
    await expect(contract.connect(service).registerReport(deviceHash, reportHash, 0, 5, "ipfs://demo"))
      .to.emit(contract, "ReportRegistered");
    expect(await contract.getReportCountByDevice(deviceHash)).to.equal(1n);
  });

  it("blocks unauthorized sender", async function () {
    const { contract, attacker } = await deployFixture();
    const deviceHash = ethers.keccak256(ethers.toUtf8Bytes("device-1"));
    const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report-1"));
    await expect(contract.connect(attacker).registerReport(deviceHash, reportHash, 0, 0, "ipfs://demo"))
      .to.be.reverted;
  });
});
