const csv = require("fast-csv")

const Token = artifacts.require('KratosToken.sol');
const tokenAddress = '0x603533be30302606d861cd62514162a9e11e5469'
const holderAddress = '0x107be2ff8b6d5c73950c068ebc8085a743e5044f'
const approvedAddress = '0xba4e392745f1aea5132ec1e6d52d505824bc1eb2'

module.exports = async (done) => {

    console.log('web3 api version', web3.version.api)

    web3.version.getNetwork( async (err, networkId) => {

        if (!err) {
            console.log('networkId', networkId)

            let filepath = `scripts/bounty-${networkId}.csv`
            console.log('filepath', filepath)

            const token = await Token.at(tokenAddress)
    
            csv
            .fromPath(filepath)
            .on("data", async (data) => {
                console.log(data)

                const address = data[1]
                const amount = web3.toWei(data[2], 'ether')
                const balance = await token.balanceOf(address)
                console.log('address:', address, 'amount:', amount, 'balance:', balance, balance.isZero())

                // check address balance is still zero
                if (balance.isZero()) {
                    // transfer
                    console.log('initiate transfer to', address)
                    const receipt = await token.transferFrom(holderAddress, address, amount, {from: approvedAddress})
                    console.log('receipt', receipt)
                }
            })
            .on("end", () => {
                console.log("done")
            })
        } else {
            console.log(err)
        }

    })
}