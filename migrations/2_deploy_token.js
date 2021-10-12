const TestERC20 = artifacts.require("../contracts/TestERC20.sol");
const TryBit = artifacts.require("../contracts/TryBit.sol");
const Staking = artifacts.require("./Staking.sol");

const toBN = web3.utils.toBN;

module.exports = async function (deployer) {
  await deployer.deploy(TestERC20,  {gas: 9000000});
  await deployer.deploy(TryBit,  {gas: 9000000});
  await deployer.deploy(Staking, TryBit.address, TestERC20.address, {gas: 5000000});  
  const tBit = await TryBit.deployed();
  await tBit.setStakingAddr(Staking.address);


  console.log("LP Token: ", TestERC20.address)
  console.log("TryBit Token: ", TryBit.address)
  console.log("Staking: ", Staking.address)
};
