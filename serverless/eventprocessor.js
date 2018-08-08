'use strict';

const Web3 = require('web3')
const axios = require('axios')
const AWS = require("aws-sdk")
const fs = require("fs")
const Tx = require('ethereumjs-tx')

// common service code goes here to prevent recreating if lambda container is still live
// use fixed contract from remix deployment
const docClient = new AWS.DynamoDB.DocumentClient()
const json = JSON.parse(fs.readFileSync(process.env.ABI_PATH, 'utf-8'))
const abi = json.abi?json.abi:json
const contractAddress = process.env.CONTRACT_ADDRESS
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.ETHEREUM_URI))
const contract = new web3.eth.Contract(abi, contractAddress)
const privateKey = new Buffer(process.env.CONTRACT_OWNER_PRIVKEY, 'hex')          

module.exports.whitelist = async (event, context, callback) => {

  // get non whitelisted accounts
  const json = await axios.get(`${process.env.API_URL}/kyc-whitelist-api.php?whiteliststatus=0`, {
    data: null,
    responseType: 'json',
    auth : {
      username: process.env.API_USER, 
      password: process.env.API_PASS
    }
  })

  let result = json.data  

  // whitelist on smart contract
  if (result.api_status) {
    let accounts = result.data
    for (let i=0; i<accounts.length; i++) {
      let address = accounts[i].walletaddress
      let nonce = await web3.eth.getTransactionCount(process.env.CONTRACT_OWNER, "pending")

      // check if address already submitted for whitelisting
      let data = await docClient.query({
        TableName : process.env.DYNAMODB_WHITELIST_TABLE,
        KeyConditionExpression: "address = :address",
        ExpressionAttributeValues: {
          ":address": address
        }
      }).promise()
    
      console.log(data)
      console.log(`address ${address}`)

      if (data.Count == 0) {
        // send address for whitelisting
        let addAddressToWhitelist = contract.methods[process.env.CONTRACT_WHITELIST_METHOD_NAME](address)
        let gasLimit = await addAddressToWhitelist.estimateGas({from: process.env.CONTRACT_OWNER}) + 50000
        console.log(`gasLimit ${gasLimit}`)
        let gasPrice = web3.utils.toBN(await web3.eth.getGasPrice()).add( web3.utils.toBN(await web3.utils.toWei("1", "gwei")) )
        console.log(`gasPrice ${gasPrice}`)

        if (gasPrice.lt(web3.utils.toBN(web3.utils.toWei('10', 'gwei')))) {

          let encodedData = addAddressToWhitelist.encodeABI()
          console.log(`encoded data ${encodedData}`)
          console.log(`nonce ${nonce}`)
          let rawTx = {
            // from: process.env.CONTRACT_OWNER,
            nonce: nonce++,
            gasLimit: web3.utils.toHex(gasLimit),
            gasPrice: web3.utils.toHex(gasPrice),
            to: process.env.CONTRACT_ADDRESS,
            value: '0x00',
            data: encodedData
          }
          
          var tx = new Tx(rawTx);
          tx.sign(privateKey);
          
          var serializedTx = tx.serialize();
          console.log(`serialized tx ${serializedTx.toString('hex')}`)
          
          web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
          .on('transactionHash', async (txHash) => {

            console.log(`txHash ${txHash}`)

            // store address, hash for checking for tx receipt later
            await docClient.put({
              TableName: process.env.DYNAMODB_WHITELIST_TABLE,
              Item: {
                address: address,
                txHash: txHash,
                whitelisted: false
              }
            }).promise().then( (data) => {
              console.log("Whitelist address and txHash stored")
            }).catch( (err) => {
              console.log("Unable to store whitelist address and txHash")
              console.log(err)
              callback(err, null)
            })
          })
          .on('error', console.error)
        }
      }
    }
  }

  callback(null, { message: 'whitelist processing ended', event });
}

module.exports.notify_whitelisted = async (event, context, callback) => {

  // check if address already submitted for whitelisting
  let data = await docClient.scan({
    TableName : process.env.DYNAMODB_WHITELIST_TABLE,
    FilterExpression: "#whitelisted = :whitelisted",
    ExpressionAttributeNames: {
      "#whitelisted": "whitelisted",
    },
    ExpressionAttributeValues: {
        ":whitelisted": false,
    }
  }).promise()

  console.log(data)

  if (data.Count > 0) {

    for (let i=0; i<data.Items.length; i++) {
      let item = data.Items[i]
      console.log(item)
      
      // retrieve tx receipt
      let receipt = await web3.eth.getTransactionReceipt(item.txHash)
      console.log(receipt)
      if (receipt) {
        // update whitelisted to true
        await docClient.update({
          TableName: process.env.DYNAMODB_WHITELIST_TABLE,
          Key: {
            address: item.address,
            txHash: item.txHash
          },
          UpdateExpression: "set whitelisted = :whitelisted",
          ExpressionAttributeValues:{
            ":whitelisted": true
          },
        }).promise().then( (data) => {
          console.log("Updated whitelisted status")
        }).catch( (err) => {
          console.log("Unable to update whitelisted status")
          console.log(err)
          callback(err, null)
        })

        console.log(`item.address ${item.address}`)
        // make api call to set whitelist to true
        await axios.post(`${process.env.API_URL}/kyc-whitelist-api.php`, {
          data: {
            walletaddress: [item.address],
            whiteliststatus: true
          },
          responseType: 'json',
          auth : {
            username: process.env.API_USER, 
            password: process.env.API_PASS
          }
        }).then((json) => {
          console.log('updated api')
          console.log(json)
        })
        .catch((error) => {
          console.error(error)
        })

      }
    }
  }

  // notify ico website

  callback(null, { message: 'whitelist processing ended', event });
}

module.exports.purchase = async (event, context, callback) => {

  let fromBlock = 0

  // get last blockNumber processed, special entry using txHash = '0'
  await docClient.query({
    TableName : process.env.DYNAMODB_PURCHASE_TABLE,
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
    callback(err, null)
  })

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
          TableName : process.env.DYNAMODB_PURCHASE_TABLE,
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
          callback(err, null)
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

      const json = await axios.post(`${process.env.API_URL}/notify-contribution.php`, {
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
          TableName: process.env.DYNAMODB_PURCHASE_TABLE,
          Item: purchase
        }).promise().then( (data) => {
          console.log("Purchase stored")
        }).catch( (err) => {
          console.log("Unable to store purchase")
          console.log(err)
          callback(err, null)
        })
      }

      // store largest blockNumber process for continuation, special entry using txHash = '0'
      await docClient.put({
        TableName: process.env.DYNAMODB_PURCHASE_TABLE,
        Item: {txHash: '0', blockNumber: maxBlockNumber}
      }).promise().then( (data) => {
        console.log("blocknumber stored")
      }).catch( (err) => {
        console.log("Unable to store purchase")
        console.log(err)
        callback(err, null)
      })
    }
  })

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  callback(null, { message: 'Purchase event processed successfully!', event })
}
