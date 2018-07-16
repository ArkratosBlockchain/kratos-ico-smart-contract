import 'babel-polyfill'

var KratosToken = artifacts.require("KratosToken")
var KratosPresale = artifacts.require("KratosPresale")
// var RefundVault = artifacts.require("RefundVault")

contract('KratosPresale', async (accounts) => {

    const tokenTotalSupply = 3e26;
    const tokenPresaleSupply = 8e25;
    const deployDelay = 30
    const cap = web3.toWei("10", "ether")
    const openingTime = web3.eth.getBlock('latest').timestamp + deployDelay
    const closingTime = openingTime + 86400 * 20 // 20 days
    const rate = new web3.BigNumber(1250)
    const wallet = web3.eth.accounts[1]

    const timelockTimestamp = web3.eth.getBlock('latest').timestamp + 86400 * 180

    let token = null
    let presale = null

    before(async () => {
        await KratosToken.new(tokenTotalSupply).then( (instance) => {

            token = instance

            return KratosPresale.new(
                cap,
                openingTime,
                closingTime,
                rate,
                wallet,
                token.address,
            )
        }).then(async (instance) => {

            presale = instance

            // transfer supply to crowdsale contract
            await token.transfer(presale.address, tokenPresaleSupply);
            token.enableTimelock(timelockTimestamp);
        
            // advance block so that it is pass the opening time during deployment
            web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", id: Date.now()})
            web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [deployDelay+1], id: Date.now()})
        })
    })

    it('should deploy the token and store the address', async () => {
        assert(token.address, 'Token address couldn\'t be stored')
    })

    it('should set rate to 1999', async () => {
        await presale.setRate(1999)
        const rate = await presale.rate.call()
        assert.equal(rate.toNumber(), 1999, 'The rate couldn\'t be set to 1999')
    })

    it('should not allow non whitelisted address to buy', async () => {
        try {
            await presale.sendTransaction({ from: accounts[7], value: web3.toWei(1, "ether") })
            assert(false, "Non whitelisted address did not encounter error when purchasing")
        } catch(error) {
            assert.equal(error.toString(), "Error: VM Exception while processing transaction: revert", "Not a EVM error")
        }
    })

    it('should allow whitelisted address to buy', async () => {
        await presale.addToWhitelist(accounts[7])
        assert(presale.sendTransaction({ from: accounts[7], value: web3.toWei(1, "ether") }), "Whitelisted address unable to purchase")
    })

    it('should not allow total purchase to exceed hard cap', async ()=> {
        try {
            let balance = await web3.eth.getBalance(accounts[7])
            assert(balance >= 7, "Account insufficient fund to buy over hard cap limit")

            await presale.sendTransaction({ from: accounts[7], value: web3.toWei(10, "ether") })

            assert(false, "Transaction succeed even when total wei raised is expected to be over hard cap")
        } catch (error) {
            assert.equal(error.toString(), "Error: VM Exception while processing transaction: revert", "Not a EVM error")
        }
    })

    // it('should store proceed of sales into refundVault', async () => {
    //     const vaultAddress = await presale.vault.call()
    //     const vault = RefundVault.at(vaultAddress)
    //     const vaultTokenAmount = await vault.deposited(accounts[7])
    //     assert.equal(vaultTokenAmount.toNumber(), 1e18, 'Didn\'t receive the same amount of ETH in refund vault')
    // })

    it('should set variable `weiRaised` correctly', async () => {
        var amount = await presale.weiRaised.call()
        assert.equal(amount.toNumber(), web3.toWei(1, "ether"), 'Total ETH raised in Presale was not calculated correctly')
    })

    it('one ETH should buy 1999 Kratos Tokens and stored as balance in Presale contract for Post Delivery, not Token contract', async () => {
        const tokenAmount = await token.balanceOf(accounts[7])
        assert.equal(tokenAmount.toNumber(), 0, 'The sender shouldn\'t receive the tokens before Presale ends')

        const tokenBalance = await presale.balances.call(accounts[7])
        assert.equal(tokenBalance.toNumber(), 1999e18, '1999 Tokens are held in custody before Presale ends')
    })

    // it('should be able to withdraw funds before presale ends', async () => {

    //     let preBalance = await web3.eth.getBalance(accounts[1])
    //     preBalance = Number(preBalance.toString(10))

    //     const vaultAddress = await presale.vault.call()
    //     let withdrawAmount = await web3.eth.getBalance(vaultAddress)
    //     withdrawAmount = Number(withdrawAmount.toString(10))

    //     await presale.withdrawFunds()

    //     let postBalance = await web3.eth.getBalance(accounts[1])
    //     postBalance = Number(postBalance.toString(10))

    //     console.log('withdrawAmount', withdrawAmount)
    //     console.log('preBalance', preBalance)
    //     console.log('postBalance', postBalance)
    //     assert.equal(postBalance, preBalance + withdrawAmount, 'ETH couldn\'t be transferred to the owner before presale ends')
    // })

    it('should allow more than one purchaser', async () => {
        await presale.addToWhitelist(accounts[5])
        await presale.sendTransaction({ from: accounts[5], value: web3.toWei(1, "ether") })
        const tokenBalance = await presale.balances.call(accounts[5])
        assert.equal(tokenBalance.toNumber(), 1999e18, 'Another account unable to purchase 1999 tokens')
    })

    it('should be able to deliver tokens to investors before presale ends', async () => {
        await presale.withdrawTokens(accounts[5])

        const ownerSupply = await token.balanceOf(presale.address)
        assert.equal(ownerSupply.toNumber(), 8e25-1999e18, "Owner supply is not 1999 less")

        const totalSupply = await token.totalSupply.call()
        assert.equal(totalSupply.toNumber(), 3e26, "Total token supply is not 300 million")

        const tokenAmountA = await token.balanceOf(accounts[5])
        assert.equal(tokenAmountA.toNumber(), 1999e18, 'Sender A didn\'t receive 1999 tokens post delivery')
    })

    it('should end Presale now', async () => {
        var hasClosed = await presale.hasClosed()
        assert(!hasClosed, false, 'Presale closed prematurely')

        var newClosingTime = web3.eth.getBlock('latest').timestamp+30 // add 30 seconds allowance in case the next block is mined again before setting closing time
        await presale.setClosingTime(newClosingTime)
        // trigger mining of new block and then "forward time"
        web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", id: Date.now()})
        web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [120], id: Date.now()})
        var hasClosed = await presale.hasClosed()
        assert(hasClosed, 'Presale did not close')
    })

    // it('should transfer the remaining ETH in vault to wallet after Presale is successful and finalized', async () => {
    //     const goalReached = await presale.goalReached()
    //     assert(goalReached, "Crowdfunding goal not reached")

    //     let preBalance = await web3.eth.getBalance(accounts[1])
    //     preBalance = Number(preBalance.toString(10))

    //     await presale.finalize()

    //     let postBalance = await web3.eth.getBalance(accounts[1])
    //     postBalance = Number(postBalance.toString(10))

    //     assert.equal(postBalance, preBalance + 1e18, 'remaining ETH in vault couldn\'t be transferred to the owner')
    // })

    it('should deliver tokens to investors', async () => {
        await presale.withdrawTokens(accounts[7])

        const ownerSupply = await token.balanceOf(presale.address)
        assert.equal(ownerSupply.toNumber(), 8e25-1999e18*2, "Owner supply is not 1999*2 less")

        const totalSupply = await token.totalSupply.call()
        assert.equal(totalSupply.toNumber(), 3e26, "Total token supply is not 300 million")

        const tokenAmountB = await token.balanceOf(accounts[7])
        assert.equal(tokenAmountB.toNumber(), 1999e18, 'Sender B didn\'t receive 1999 tokens post delivery')
    })

    it('should timelock Presale tokens', async () => {
        try {
            await token.transfer(accounts[5], 1, {from: accounts[7]})
        } catch(error) {
            assert.equal(error.toString(), "Error: VM Exception while processing transaction: revert", "Not a EVM error")
        }
    })

    it('should be able to transfer token after timelock', async () => {
        // advance to time after timelock period
        web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [timelockTimestamp+1], id: Date.now()})

        const senderPreBalance = await token.balanceOf(accounts[7])
        const receipientPreBalance = await token.balanceOf(accounts[5])

        await token.transfer(accounts[5], 1e18, {from: accounts[7]})

        const senderPostBalance = await token.balanceOf(accounts[7])
        assert.equal(senderPreBalance.toNumber() - senderPostBalance.toNumber(), 1e18, "1 token is not transfered out of sender")

        const receipientPostBalance = await token.balanceOf(accounts[5])
        assert.equal(receipientPostBalance.toNumber() - receipientPreBalance.toNumber(), 1e18, "1 token is not received by recipient")
    })
})