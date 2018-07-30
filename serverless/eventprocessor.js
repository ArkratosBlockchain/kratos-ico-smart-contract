'use strict';

const Web3 = require('web3')
const axios = require('axios')
const AWS = require("aws-sdk")
const fs = require("fs")

module.exports.purchase = async (event, context, callback) => {

  console.log('--- purchase event processing start ---')

  // use fixed contract from remix deployment
  let abi = [
    {
      "constant": true,
      "inputs": [
        {
          "name": "_operator",
          "type": "address"
        },
        {
          "name": "_role",
          "type": "string"
        }
      ],
      "name": "checkRole",
      "outputs": [],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "hasClosed",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "ROLE_WHITELISTED",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_operator",
          "type": "address"
        },
        {
          "name": "_role",
          "type": "string"
        }
      ],
      "name": "hasRole",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_operators",
          "type": "address[]"
        }
      ],
      "name": "removeAddressesFromWhitelist",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "name": "balances",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_operator",
          "type": "address"
        }
      ],
      "name": "removeAddressFromWhitelist",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "rate",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_rate",
          "type": "uint256"
        }
      ],
      "name": "setRate",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "cap",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "weiRaised",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_addr",
          "type": "address"
        }
      ],
      "name": "withdrawTokens",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "closingTime",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_closingTime",
          "type": "uint256"
        }
      ],
      "name": "setClosingTime",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "capReached",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "wallet",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_operator",
          "type": "address"
        }
      ],
      "name": "addAddressToWhitelist",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "withdrawTokens",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_operator",
          "type": "address"
        }
      ],
      "name": "whitelist",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "openingTime",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_operators",
          "type": "address[]"
        }
      ],
      "name": "addAddressesToWhitelist",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_beneficiary",
          "type": "address"
        }
      ],
      "name": "buyTokens",
      "outputs": [],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "token",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "_cap",
          "type": "uint256"
        },
        {
          "name": "_openingTime",
          "type": "uint256"
        },
        {
          "name": "_closingTime",
          "type": "uint256"
        },
        {
          "name": "_rate",
          "type": "uint256"
        },
        {
          "name": "_wallet",
          "type": "address"
        },
        {
          "name": "_token",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "payable": true,
      "stateMutability": "payable",
      "type": "fallback"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "purchaser",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "beneficiary",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "value",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "TokenPurchase",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "role",
          "type": "string"
        }
      ],
      "name": "RoleAdded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "role",
          "type": "string"
        }
      ],
      "name": "RoleRemoved",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "previousOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipRenounced",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    }
  ]

  let fromBlock = 0
  const docClient = new AWS.DynamoDB.DocumentClient()
  // get last blockNumber processed, special entry using txHash = '0'
  await docClient.query({
    TableName : process.env.DYNAMODB_TABLE,
    KeyConditionExpression: "txHash = :txHash",
    ExpressionAttributeValues: {
      ":txHash": "0"
    }
  }).promise().then( (data) => {
    console.log(data)
    if (data.Items.length > 0) {
      fromBlock = data.Items[0].blockNumber
    }
  }).catch((err) => {
    console.error(err)
  })

  let contractAddress = process.env.CONTRACT_ADDRESS
  let web3 = new Web3(new Web3.providers.HttpProvider(process.env.ETHEREUM_URI))
  let contract = new web3.eth.Contract(abi, contractAddress)
  console.log('starting from', fromBlock)
  
  // get token purchase events from blockchain
  await contract.getPastEvents('TokenPurchase', {fromBlock: fromBlock}).then(async (events) => {
    let maxBlockNumber = 0
    let purchases = []
  
    for (let i=0; i<events.length; i++) {
      let purchase = events[i]
      console.log(purchase)

      // if blockNumber to be processed is the same as the blockNumber last processed, check txHash
      if (fromBlock === purchase.blockNumber) {

        await docClient.get({
          TableName : process.env.DYNAMODB_TABLE,
          Key: {
            txHash: purchase.transactionHash,
            blockNumber: fromBlock
          }
        }).promise().then( (data) => {
          console.log('check txHash + blockNumber match', data)
          // push for processing only if record has not been processed before
          if (!data.Item) {
            purchases.push({
              blockNumber: purchase.blockNumber,
              txHash: purchase.transactionHash,
              walletaddress: purchase.returnValues.purchaser,
              etheramount: purchase.returnValues.value / 1e18,
              tokenamount: purchase.returnValues.amount / 1e18
            })  
          }
        }).catch( (err) => {
          console.error(err)
        })

      } else {
        purchases.push({
          blockNumber: purchase.blockNumber,
          txHash: purchase.transactionHash,
          walletaddress: purchase.returnValues.purchaser,
          etheramount: purchase.returnValues.value / 1e18,
          tokenamount: purchase.returnValues.amount / 1e18
        })
      }

      if (purchase.blockNumber > maxBlockNumber) {
        maxBlockNumber = purchase.blockNumber
      }
    }

    console.log('purchases:', purchases.length)
    if (purchases.length > 0) {

      console.log(purchases)

      const json = await axios.post(process.env.API_URL, {
        data: purchases,
        responseType: 'json',
        auth : {
          username: process.env.API_USER, 
          password: process.env.API_PASS
        }
      })

      console.log(json)

      for (const purchase of purchases) {
        console.log(purchase)
        
        await docClient.put({
          TableName: process.env.DYNAMODB_TABLE,
          Item: purchase
        }).promise().then( (data) => {
          console.log("Purchase stored")
        }).catch( (err) => {
          console.log("Unable to store purchase")
          console.log(err)
        })
      }

      // store largest blockNumber process for continuation, special entry using txHash = '0'
      await docClient.put({
        TableName: process.env.DYNAMODB_TABLE,
        Item: {txHash: '0', blockNumber: maxBlockNumber}
      }).promise().then( (data) => {
        console.log("blocknumber stored")
      }).catch( (err) => {
        console.log("Unable to store purchase")
        console.log(err)
      })
    }
  })

  console.log('--- purchase event processing done ---')

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  callback(null, { message: 'Purchase event processed successfully!', event });
};
