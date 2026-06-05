module.exports = {
  require: ['@nomicfoundation/hardhat-toolbox-mocha-ethers'],
  timeout: 60000,
  spec: 'test/**/*.ts',
  loader: 'ts-node/esm'
}
