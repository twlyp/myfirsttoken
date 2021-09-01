const hre = require("hardhat");
const { håkon } = require("../addresses.json");

async function main() {
  // local deployment:
  // const [owner, admin] = await hre.ethers.getSigners();

  const VolcanoCoin = await hre.ethers.getContractFactory("VolcanoCoin");
  const volcano = await VolcanoCoin.deploy(håkon);

  await volcano.deployed();

  console.log("VolcanoCoin deployed to:", volcano.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
