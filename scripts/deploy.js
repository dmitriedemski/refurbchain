const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer, service] = await hre.ethers.getSigners();
  const Factory = await hre.ethers.getContractFactory("DevicePassportRegistry");
  const contract = await Factory.deploy(deployer.address);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  await (await contract.authorizeService(service.address)).wait();

  const artifact = await hre.artifacts.readArtifact("DevicePassportRegistry");
  const output = {
    contractAddress: address,
    adminAddress: deployer.address,
    demoServiceAddress: service.address,
    abi: artifact.abi
  };

  fs.mkdirSync(path.join(__dirname, "..", "backend"), { recursive: true });
  fs.mkdirSync(path.join(__dirname, "..", "frontend", "src"), { recursive: true });
  fs.writeFileSync(path.join(__dirname, "..", "backend", "contract-config.json"), JSON.stringify(output, null, 2));
  fs.writeFileSync(path.join(__dirname, "..", "frontend", "src", "contract-config.json"), JSON.stringify(output, null, 2));

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
