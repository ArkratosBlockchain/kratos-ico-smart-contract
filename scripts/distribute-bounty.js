const csv = require("fast-csv")

const Token = artifacts.require('KratosToken.sol');
const tokenAddress = '0x89fD8A520eEC23c8406a08315BA9440dDD30Baa2'
// const holderAddress = '0xC9d689Fd857DcfaF8011Ba064DB989222E84c003'
// const approvedAddress = '0xba4e392745f1aea5132ec1e6d52d505824bc1eb2'

// IMPT :: use web3 >= v1, for use with truffle-hdwallet-provider to send transactions via infura
module.exports = async (done) => {

    try {
        console.log('web3 api version', web3.version)
        console.log('accounts', await web3.eth.getAccounts())

        const networkId = await web3.eth.net.getId()
        console.log('networkId', networkId)

        let filepath = `scripts/bounty-${networkId}.csv`
        console.log('filepath', filepath)

        const token = await Token.at(tokenAddress)

        csv
        .fromPath(filepath)
        .on("data", async (data) => {
            console.log(data)

            const address = data[1]
            const amount = web3.utils.toWei(data[2], 'ether')
            const balance = await token.balanceOf(address)
            console.log('address:', address, 'amount:', amount, 'balance:', balance, balance.isZero())

            // check address balance is still zero
            if (balance.isZero()) {
                // transfer
                console.log('initiate transfer to', address)
                // use transferFrom if no access to owner account, but owner account need to approve address to use transferFrom
                // const receipt = await token.transferFrom(holderAddress, address, amount, {from: approvedAddress})
                const receipt = await token.transfer(address, amount)
                console.log('receipt', receipt)
            }
        })
        .on("end", () => {
            console.log("read done")
            done()
        })
    } catch (err) {
        done(err)
    }
}