'use strict';

const Web3 = require('web3')
const request = require('request')
const AWS = require("aws-sdk")

module.exports.purchase = (event, context, callback) => {

  console.log('--- purchase event processing start ---')

  // TODO :: paramtereize
  let abi = [
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
      "name": "goal",
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
      "inputs": [],
      "name": "finalize",
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
      "constant": true,
      "inputs": [],
      "name": "goalReached",
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
          "name": "_beneficiary",
          "type": "address"
        }
      ],
      "name": "removeFromWhitelist",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_beneficiaries",
          "type": "address[]"
        }
      ],
      "name": "addManyToWhitelist",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "isFinalized",
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
          "name": "",
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
          "name": "_beneficiary",
          "type": "address"
        }
      ],
      "name": "addToWhitelist",
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
          "name": "newOwner",
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
      "name": "vault",
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
          "name": "_goal",
          "type": "uint256"
        },
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
      "inputs": [],
      "name": "Finalized",
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
      "constant": false,
      "inputs": [
        {
          "name": "addr",
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
      "constant": false,
      "inputs": [],
      "name": "withdrawTokens",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "claimRefund",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "addr",
          "type": "address"
        }
      ],
      "name": "claimRefund",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]

  let fromBlock = 0
  const docClient = new AWS.DynamoDB.DocumentClient()
  // get last blockNumber processed, special entry using txHash = '0'
  docClient.query({
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

    let contractAddress = process.env.WALLET_ADDRESS
    let web3 = new Web3(new Web3.providers.HttpProvider(process.env.ETHEREUM_URI))
    let contract = new web3.eth.Contract(abi, contractAddress)
    console.log('starting from', fromBlock)
    contract.getPastEvents('TokenPurchase', {fromBlock: fromBlock}).then((events) => {
      let maxBlockNumber = 0
      let purchases = []
      events.forEach((purchase) => {
        console.log(purchase)

        // if blockNumber to be processed is the same as the blockNumber last processed, check txHash
        if (fromBlock === purchase.blockNumber) {
          docClient.get({
            TableName : process.env.DYNAMODB_TABLE,
            Key: {
              txHash: purchase.transactionHash,
              blockNumber: fromBlock
            }
          }).promise().then( (data) => {
            console.log('check txHash + blockNumber match', data)
            if (data.Item) {
              return
            } else {
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
      })

      request.post({
        url: process.env.API_URL,
        body: purchases,
        json: true,
        auth : {
          user: process.env.API_USER, 
          pass: process.env.API_PASS
        }
      }, (err, resp, json) => {

        console.log(json)

        for (const purchase of purchases) {
          console.log(purchase)
          docClient.put({
            TableName: process.env.DYNAMODB_TABLE,
            Item: purchase
          }, (err, data) => {
            if (err) {
              console.error("Unable to store purchase")
              console.error(err)
            } else {
              console.log("Purchase stored")
            }
          })
        }

        // store largest blockNumber process for continuation, special entry using txHash = '0'
        docClient.put({
          TableName: process.env.DYNAMODB_TABLE,
          Item: {txHash: '0', blockNumber: maxBlockNumber}
        }, (err, data) => {
          if (err) {
            console.error("Unable to store purchase")
            console.error(err)
          } else {
            console.log("blocknumber stored")
          }
        })

      })
    })

    console.log('--- purchase event processing done ---')

    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    callback(null, { message: 'Purchase event processed successfully!', event });
  }).catch((err) => {
    console.error(err)
  })


};
