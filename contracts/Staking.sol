// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./interfaces/ITryBit.sol";
import "./utils/Context.sol";
import "./utils/SafeMath.sol";
import "./utils/Ownable.sol";

contract Staking is Context, Ownable {
    using SafeMath for uint256;

    address public tBit;
    address public lpToken;
    // uint256 public SECONDS_IN_A_DAY = 28800;
    uint256 constant public SECONDS_IN_A_DAY = 1;
    uint256 constant public STAKING_DAYS_MIN = 7;
    uint256 constant public STAKING_DAYS_REWARD = 30;
    uint256 constant public STAKING_AMOUNT_MIN = 10000000000000000000; //10
    uint256 constant public VESTING_PERIOD = 60;
    uint256 constant public VESTING_AMOUNT = 100000000000000000000000; //100000
    // uint256 constant public REWARD_PER_DAY = 5000000000000000000000; //5000
    uint256 constant public REWARD_PER_DAY = 50000000000000000; //0.05

    uint256 public vestingStart;
    mapping(bool => uint256) public totalStakingAmount;
    mapping(bool => uint256) public totalStakers;

    struct DepositInfo {
        uint256 amount;
        uint256 time;
        uint256 rewards;
        uint256 claimed;
    }

    mapping (address => mapping(bool => DepositInfo)) public userInfo;
    event Staking(address indexed sender, uint amount, bool isLpToken);


    constructor(
        address _tBit,
        address _lpToken
    ) public {
        tBit = _tBit;
        lpToken = _lpToken;
        vestingStart = block.number;
    }

    function stake(uint256 amount, bool isLpToken) external {
        require(amount >= STAKING_AMOUNT_MIN, 'Staking: Invalid Staking Amount');
        if (isLpToken) {
            IBEP20(lpToken).transferFrom(msg.sender, address(this), amount);
        } else {
            ITryBit(tBit).transferFrom(msg.sender, address(this), amount);
        }

        DepositInfo storage depositInfo = userInfo[msg.sender][isLpToken];
        if (depositInfo.amount != 0) {
            uint256 _reward = _checkReward(msg.sender, isLpToken);
            depositInfo.rewards = (depositInfo.rewards).add(_reward);
        }
        
        depositInfo.amount = depositInfo.amount + amount;
        depositInfo.time = block.number;

        if (totalStakingAmount[isLpToken] == 0) {
            totalStakers[isLpToken] = totalStakers[isLpToken].add(1);
        }

        totalStakingAmount[isLpToken] = totalStakingAmount[isLpToken].add(amount);

        emit Staking(msg.sender, amount, isLpToken);
    }

    function _checkReward(address staker, bool isLpToken) internal view returns (uint256) {
        DepositInfo storage depositInfo = userInfo[staker][isLpToken];
        
        uint256 reward;
        uint256 rewardFactor = 1;
        if ( depositInfo.time + STAKING_DAYS_REWARD * SECONDS_IN_A_DAY <= block.number) {
            rewardFactor = 2;               //should be updated
        }
        
        if (totalStakingAmount[isLpToken] != 0) {
            if (isLpToken) {
                reward = depositInfo.amount * (block.number - depositInfo.time) * REWARD_PER_DAY * 75 / (100 * totalStakingAmount[isLpToken]) * rewardFactor;
            }
            else {
                reward = depositInfo.amount * (block.number - depositInfo.time) * REWARD_PER_DAY * 25 / (100 * totalStakingAmount[isLpToken]) * rewardFactor;
            }
        }
        return reward;
    }

    function checkReward(bool isLpToken) public view returns (uint256) {
        return _checkReward(msg.sender, isLpToken);
    }

    function _getPending(address staker, bool isLpToken) internal view returns (uint256) {
        DepositInfo storage depositInfo = userInfo[staker][isLpToken];
        uint256 pending = _checkReward(staker, isLpToken);
        pending = pending.add(depositInfo.rewards).sub(depositInfo.claimed);
        return pending;
    }

    function getPending(bool isLpToken) external view returns (uint256) {
        return _getPending(msg.sender, isLpToken);
    }

    function _claim(address staker, bool isLpToken) internal {
        DepositInfo storage depositInfo = userInfo[staker][isLpToken];
        require(depositInfo.time + STAKING_DAYS_MIN * SECONDS_IN_A_DAY <= block.number, 'Staking: Can not unstaking yet');
        uint256 pending = _getPending(staker, isLpToken);
        depositInfo.claimed = depositInfo.claimed.add(pending);
        ITryBit(tBit).mint(staker, pending);
    }

    function claim(bool isLpToken) external {
        _claim(msg.sender, isLpToken);
    }

    function unstake(uint256 amount, bool isLpToken) external {
        DepositInfo storage depositInfo = userInfo[msg.sender][isLpToken];
        require(depositInfo.amount >= amount, "Staking: Insufficient Amount");
        require(depositInfo.time + STAKING_DAYS_MIN * SECONDS_IN_A_DAY <= block.number, 'Staking: Can not unstaking yet');
        
        if (isLpToken) {
            IBEP20(lpToken).transfer(msg.sender, amount);
        } else {
            ITryBit(tBit).transfer(msg.sender, amount);
        }

        _claim(msg.sender, isLpToken);
        
        totalStakingAmount[isLpToken] = totalStakingAmount[isLpToken].sub(amount);

        if (totalStakingAmount[isLpToken] == 0) {
            totalStakers[isLpToken] = totalStakers[isLpToken].sub(1);
        }

        depositInfo.amount = depositInfo.amount.sub(amount);   
    }

    function withdrawToken(uint amount, bool isLpToken) external onlyOwner {
        if (isLpToken) {
            IBEP20(lpToken).transfer(msg.sender, amount);
        } else {
            ITryBit(tBit).transfer(msg.sender, amount);
        }
    }

    function setTBIT(address _tBit) external onlyOwner {
        tBit = _tBit;
    }

    function setLPToken(address _lpToken) external onlyOwner {
        lpToken = _lpToken;
    }

    function withdrawLiquidity(address to) external onlyOwner {
        require(vestingStart + VESTING_PERIOD * SECONDS_IN_A_DAY <= block.number, 'Staking: Vesting is not available yet');
        ITryBit(tBit).transfer(to, VESTING_AMOUNT);
    }
}
