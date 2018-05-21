// Allows us to use ES6 in our migrations and tests.
require('babel-register')

const Web3 = require("web3");
const web3 = new Web3();
const gasPrice = web3.toWei("10", "gwei");

console.log("gasPrice : " + gasPrice);

module.exports = {
  // solc: {
  //   optimizer: {
  //     enabled: true,
  //     runs: 200
  //   }
  // },
  networks: {
    development: {
      host: '127.0.0.1',
      port: 9545,
      network_id: '*' // Match any network id
    },
    ropsten: {
      gas: 4712388,
      gasPrice: gasPrice,
      host: '127.0.0.1',
      port: 8545,
      network_id: '3' // ropsten network id
    }
  }
}
