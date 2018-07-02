'use strict';

const Web3 = require('web3')
const request = require('request-promise')
const AWS = require("aws-sdk")
const fs = require("fs")

module.exports.purchase = async (event, context, callback) => {

  console.log('--- purchase event processing start ---')

  let json = JSON.parse(fs.readFileSync(process.env.CONTRACT_JSON_PATH, 'utf-8'))
  let abi = json.abi
  console.log(abi)

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

  let contractAddress = process.env.WALLET_ADDRESS
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
      request.post({
        url: process.env.API_URL,
        body: purchases,
        json: true,
        auth : {
          user: process.env.API_USER, 
          pass: process.env.API_PASS
        }
      }).then( async (json) => {

        console.log(json)

        for (const purchase of purchases) {
          console.log(purchase)
          
          await docClient.put({
            TableName: process.env.DYNAMODB_TABLE,
            Item: purchase
          }).promise().then( (data) => {
            console.log("Purchase stored")
          }).catch( (err) => {
            console.error("Unable to store purchase")
            console.error(err)
          })
        }

        // store largest blockNumber process for continuation, special entry using txHash = '0'
        await docClient.put({
          TableName: process.env.DYNAMODB_TABLE,
          Item: {txHash: '0', blockNumber: maxBlockNumber}
        }).promise().then( (data) => {
          console.log("blocknumber stored")
        }).catch( (err) => {
          console.error("Unable to store purchase")
          console.error(err)
        })

      })
    }
  })

  console.log('--- purchase event processing done ---')

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  callback(null, { message: 'Purchase event processed successfully!', event });
};
