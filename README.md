# BEP20Token

## Requrements
- truffle v5.1.43 (Solidity v0.5.16 (solc-js), Node v14.8.0, Web3.js v1.2.1)
- ganache test rpc.

## Getting started
```
$ npm install 
```

## Deploy BEP-20 token
Create `.env` file from `.env.example` file.
Set ```seed``` ```api key``` in `.env` file.

## Deploying contracts to BEP-2 token (for bsc_testnet)
```
$ truffle deploy --reset --network bsc_testnet

After deployment write down 3 contract addresses(lp token, tryBit, staking) to be used for dapp
```

## Test
```
$ truffle test
```
