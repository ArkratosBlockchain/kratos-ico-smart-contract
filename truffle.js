// Allows us to use ES6 in our migrations and tests.
require('babel-register')

const HDWalletProvider = require("truffle-hdwallet-provider")

const Web3 = require("web3")
const web3 = new Web3()
const gasPrice = web3.toWei("10", "gwei")

console.log("gasPrice : " + gasPrice);

module.exports = {
  compilers: {
    solc: {
        version: "0.4.24"
    }
  },
  networks: {
    development: {
      host: '127.0.0.1',
      port: 9545,
      network_id: '*' // Match any network id
    },
    test: {
      host: '127.0.0.1',
      port: 9545,
      network_id: '*' // Match any network id
    },
    ropsten: {
      gas: 8000000,
      gasPrice: gasPrice,
      host: '127.0.0.1',
      port: 8545,
      network_id: '3' // ropsten network id
    },
    ropstenInfura: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, 'https://ropsten.infura.io/LjKEqau6MKZzYWdDiwSo', 0, 5),
      network_id: 3
    },
    mainnetInfura: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, 'https://mainnet.infura.io/LjKEqau6MKZzYWdDiwSo', 0, 5),
      network_id: 1
    }
  }
}
