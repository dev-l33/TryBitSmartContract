/* Contracts in this test */

const TestERC20 = artifacts.require("../contracts/TestERC20.sol");
const TryBit = artifacts.require("../contracts/TryBit.sol");
const Staking = artifacts.require("./Staking.sol");

const toBN = web3.utils.toBN;

contract("TryBit Test", (accounts) => {
  const OVERFLOW_NUMBER = toBN(2, 10).pow(toBN(256, 10)).sub(toBN(1, 10));

  const owner = accounts[0];
  const account1 = accounts[1];

  let staking;
  let lp;
  let tBit;

  before(async () => {
    staking = await Staking.deployed();
    lp = await TestERC20.deployed();
    tBit = await TryBit.deployed();
    await tBit.setStakingAddr(staking.address);
    // await tBit.transfer(staking.address, toBN(100 * (10 ** 18)));
    // await lp.transfer(staking.address, toBN(100 * (10 ** 18)));
  });

  // This is all we test for now

  // This also tests contractURI()

  describe('TBit Staking', () => {
    it('tBit', async() => {
      assert.equal(await tBit.name(), "TryBit");
      assert.equal(await tBit.symbol(), "TBIT");
    })

    it('deposit tbit work', async () => {
      const isLpToken = false;    //tBit
      const addr = await staking.tBit();
      assert.equal(addr, tBit.address);

      const depositAmount = 10 * (10 ** 18);
      await tBit.approve(staking.address, toBN(depositAmount));
      await staking.stake(toBN(depositAmount), isLpToken);

      const depositInfo = await staking.userInfo(owner, isLpToken);
      assert.equal(Number(depositInfo.amount), Number(toBN(depositAmount)));
      
      const totalStaking = await staking.totalStakingAmount(isLpToken);
      assert.equal(Number(totalStaking), Number(toBN(depositAmount)));

      const totalStaker = await staking.totalStakers(isLpToken);
      assert.equal(totalStaker, 1);
    });

    it('check reward of tbit staking before 30 days', async () => {
      const isLpToken = false;    //tBit
      const depositAmount = 10 * (10 ** 18);
      const rewardPerDay = 0.05 * (10 ** 18);
      // Initiate 2 more transactions to make 1st deposit pass 2 days
      for (let i = 0; i < 2; i ++) {
          await web3.eth.sendTransaction({from: owner, to: account1, value: 1});
      }

      let rewardFactor = 1; //only 2 days pass so reward factor is 1

      const reward = await staking.checkReward(isLpToken);
      assert.equal(Number(reward), rewardPerDay * 0.25 * rewardFactor * 2); // 2 days
    });

    it('check reward of tbit staking after 30 days', async () => {
      const isLpToken = false;    //tBit
      const depositAmount = 10 * (10 ** 18);
      const rewardPerDay = 0.05 * (10 ** 18);
      // Initiate 5 more transactions to make 1st deposit pass 7 days
      for (let i = 0; i < 28; i ++) {
          await web3.eth.sendTransaction({from: owner, to: account1, value: 1});
      }

      let rewardFactor = 2; //7 days pass so reward factor is 1

      const reward = await staking.checkReward(isLpToken);
      assert.equal(Number(reward), rewardPerDay * 0.25 * rewardFactor * 30); // 30 days

      const pending = await staking.getPending(isLpToken);
      assert.equal(Number(pending), rewardPerDay * 0.25 * rewardFactor * 30); // 30 days
    });

    it('claim', async () => {
      const isLpToken = false;
      const reward = await staking.checkReward(isLpToken);
      console.log(Number(reward));
      const balanceBeforeUnstaking = Number(await tBit.balanceOf(owner));
      await staking.claim(isLpToken);
      const balanceAfterUnstaking = Number(await tBit.balanceOf(owner));

      const pending = await staking.getPending(isLpToken);
      assert.equal(Number(pending), 0);
      console.log(balanceAfterUnstaking - balanceBeforeUnstaking);      
    })

    it('unstake', async () => {
      const isLpToken = false;
      const reward = await staking.checkReward(isLpToken);
      const unstakingAmount = 10 * (10 ** 18);
      console.log(Number(reward));
      const balanceBeforeUnstaking = Number(await tBit.balanceOf(owner));
      await staking.unstake(toBN(unstakingAmount), isLpToken);
      const balanceAfterUnstaking = Number(await tBit.balanceOf(owner));

      console.log(balanceAfterUnstaking - balanceBeforeUnstaking);

      const depositInfo = await staking.userInfo(owner, isLpToken);
      assert.equal(Number(depositInfo.amount), 0);
      
      const totalStaking = await staking.totalStakingAmount(isLpToken);
      assert.equal(Number(totalStaking), 0);

      const totalStaker = await staking.totalStakers(isLpToken);
      assert.equal(totalStaker, 0);

    });
  });

  describe('lp Staking', () => {
    it('lp token', async() => {
      assert.equal(await lp.name(), "LP Token");
      assert.equal(await lp.symbol(), "LPT");
    })

    it('deposit lp work', async () => {
      const isLpToken = true;    //LPToken
      const addr = await staking.lpToken();
      assert.equal(addr, lp.address);

      const depositAmount = 10 * (10 ** 18);
      await lp.approve(staking.address, toBN(depositAmount));
      await staking.stake(toBN(depositAmount), isLpToken);

      const depositInfo = await staking.userInfo(owner, isLpToken);
      assert.equal(Number(depositInfo.amount), Number(toBN(depositAmount)));
      
      const totalStaking = await staking.totalStakingAmount(isLpToken);
      assert.equal(Number(totalStaking), Number(toBN(depositAmount)));
    });

    it('check reward of lp staking before 30 days', async () => {
      const isLpToken = true;    //LpToken
      const depositAmount = 10 * (10 ** 18);
      const rewardPerDay = 0.05 * (10 ** 18);
      // Initiate 2 more transactions to make 1st deposit pass 2 days
      for (let i = 0; i < 2; i ++) {
          await web3.eth.sendTransaction({from: owner, to: account1, value: 1});
      }

      let rewardFactor = 1; //only 2 days pass so reward factor is 1

      const reward = await staking.checkReward(isLpToken);
      assert.equal(Number(reward), rewardPerDay * 0.75 * rewardFactor * 2); // 2 days
    });

    it('check reward of tbit staking after 30 days', async () => {
      const isLpToken = true;    //tBit
      const depositAmount = 10 * (10 ** 18);
      const rewardPerDay = 0.05 * (10 ** 18);
      // Initiate 5 more transactions to make 1st deposit pass 7 days
      for (let i = 0; i < 28; i ++) {
          await web3.eth.sendTransaction({from: owner, to: account1, value: 1});
      }

      let rewardFactor = 2; //7 days pass so reward factor is 1

      const reward = await staking.checkReward(isLpToken);
      assert.equal(Number(reward), rewardPerDay * 0.75 * rewardFactor * 30); // 30 days
    });

    it('unstake', async () => {
      const isLpToken = true;
      const reward = await staking.checkReward(isLpToken);
      const unstakingAmount = 10 * (10 ** 18);
      console.log(Number(reward));
      const tBitBalanceBeforeUnstaking = Number(await tBit.balanceOf(owner));
      const lpBalanceBeforeUnstaking = Number(await lp.balanceOf(owner));

      await staking.unstake(toBN(unstakingAmount), isLpToken);

      const tBitBalanceAfterUnstaking = Number(await tBit.balanceOf(owner));
      const lpBalanceAfterUnstaking = Number(await lp.balanceOf(owner));

      console.log(tBitBalanceAfterUnstaking - tBitBalanceBeforeUnstaking);
      console.log(lpBalanceAfterUnstaking - lpBalanceBeforeUnstaking);

      const depositInfo = await staking.userInfo(owner, isLpToken);
      assert.equal(Number(depositInfo.amount), 0);
      
      const totalStaking = await staking.totalStakingAmount(isLpToken);
      assert.equal(Number(totalStaking), 0);

    });
  });
});