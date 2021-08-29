const hre = require("hardhat");
const { toWei } = require("./utils");

const addresses = require("../addresses.json");
const {
  ALCHEMY_API_KEY,
  ETHERSCAN_API_TOKEN,
  RINKEBY_PRIVATE_KEY,
} = require("../secrets.json");
const {
  abi,
} = require("../artifacts/contracts/VolcanoCoin.sol/VolcanoCoin.json");

async function main() {
  const provider = ethers.getDefaultProvider("rinkeby", {
    etherscan: ETHERSCAN_API_TOKEN,
    alchemy: ALCHEMY_API_KEY,
  });
  const wallet = new ethers.Wallet(RINKEBY_PRIVATE_KEY, provider);

  const volcano = new ethers.Contract(addresses.contract, abi, wallet);

  let tx = await volcano.transfer(addresses.oliver, toWei(100));
  console.log(tx.hash);
  await tx.wait();

  tx = await volcano.transfer(addresses.håkon, toWei(100));
  console.log(tx.hash);
  await tx.wait();

  tx = await volcano.transfer(addresses.martin, toWei(100));
  console.log(tx.hash);
  await tx.wait();

  tx = await volcano.transfer(addresses.vasilis, toWei(100));
  console.log(tx.hash);
  await tx.wait();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
