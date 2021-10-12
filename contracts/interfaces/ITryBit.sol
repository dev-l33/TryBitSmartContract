// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./IBEP20.sol";

interface ITryBit is IBEP20 {
    function setStakingAddr(address _staking) external;

    function mint(address to, uint256 amount) external returns (bool);
        
    function burn(address to, uint256 amount) external returns (bool);
}