import 'babel-polyfill';

var KratosToken = artifacts.require("KratosToken");
var KratosPresale = artifacts.require("KratosPresale");
var RefundVault = artifacts.require("RefundVault");

contract('KratosPresale', function(accounts) {

    before(async function() {
        // advance block so that it is pass the opening time during deployment
        web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", id: Date.now()});
        web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [5], id: Date.now()});
    });

    it('should deploy the token and store the address', function(done){
        KratosPresale.deployed().then(async function(instance) {
            const token = await instance.token.call();
            assert(token, 'Token address couldn\'t be stored');
            done();
        });
    });

    it('should set rate to 1999', function(done){
        KratosPresale.deployed().then(async function(instance) {
            await instance.setRate(1999);
            const rate = await instance.rate.call();
            assert.equal(rate.toNumber(), 1999, 'The rate couldn\'t be set to 1999');
            done();
        });
    });

    it('should not allow non whitelisted address to buy', function(done){
        KratosPresale.deployed().then(async function(instance) {
            await instance.sendTransaction({ from: accounts[7], value: web3.toWei(1, "ether") });
            assert(false, "Non whitelisted address did not encounter error when purchasing");
            done();
        }).catch(function(error) {
            assert.equal(error.toString(), "Error: VM Exception while processing transaction: revert", "Not a EVM error");
            done();
        });
    });

    it('should allow whitelisted address to buy', function(done){
        KratosPresale.deployed().then(async function(instance) {
            await instance.addToWhitelist(accounts[7]);
            assert(instance.sendTransaction({ from: accounts[7], value: web3.toWei(1, "ether") }), "Whitelisted address unable to purchase");
            done();
        });
    });

    it('should not allow total purchase to exceed hard cap', function(done){
        KratosPresale.deployed().then(async function(instance) {
            let balance = await web3.eth.getBalance(accounts[7]);
            assert(balance >= 7, "Account insufficient fund to buy over hard cap limit");

            await instance.sendTransaction({ from: accounts[7], value: web3.toWei(10, "ether") });

            assert(false, "Transaction succeed even when total wei raised is expected to be over hard cap");
            done();
        }).catch(function(error) {
            assert.equal(error.toString(), "Error: VM Exception while processing transaction: revert", "Not a EVM error");
            done();
        });
    });

    it('should store proceed of sales into refundVault', function(done){
        KratosPresale.deployed().then(async function(instance) {
            const vaultAddress = await instance.vault.call();
            const vault = RefundVault.at(vaultAddress);
            const vaultTokenAmount = await vault.deposited(accounts[7]);
            assert.equal(vaultTokenAmount.toNumber(), 1000000000000000000, 'Didn\'t receive the same amount of ETH in refund vault');
            done();
        });
    });

    it('should set variable `weiRaised` correctly', function(done){
        KratosPresale.deployed().then(async function(instance) {
            var amount = await instance.weiRaised.call();
            assert.equal(amount.toNumber(), web3.toWei(1, "ether"), 'Total ETH raised in Presale was not calculated correctly');
            done();
        });
    });

    it('one ETH should buy 1999 Kratos Tokens and stored as balance in Presale contract for Post Delivery, not Token contract', function(done){
        KratosPresale.deployed().then(async function(instance) {
            const tokenAddress = await instance.token.call();
            const kratosToken = KratosToken.at(tokenAddress);
            const tokenAmount = await kratosToken.balanceOf(accounts[7]);
            assert.equal(tokenAmount.toNumber(), 0, 'The sender shouldn\'t receive the tokens before Presale ends');

            const tokenBalance = await instance.balances.call(accounts[7]);
            assert.equal(tokenBalance.toNumber(), 1999000000000000000000, '1999 Tokens are held in custody before Presale ends');
            done();
        });
    });

    it('should end Presale now', function(done){
        KratosPresale.deployed().then(async function(instance) {
            var hasClosed = await instance.hasClosed();
            assert(!hasClosed, false, 'Presale closed prematurely');

            var newClosingTime = web3.eth.getBlock('latest').timestamp+30 // add 30 seconds allowance in case the next block is mined again before setting closing time;
            await instance.setClosingTime(newClosingTime);
            // trigger mining of new block and then "forward time"
            web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", id: Date.now()});
            web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [120], id: Date.now()});
            var hasClosed = await instance.hasClosed();
            assert(hasClosed, 'Presale did not close');
            done();
        });
    });

    it('should have 80 million Presale tokens', function(done){
        KratosPresale.deployed().then(async function(instance) {

            const tokenAddress = await instance.token.call();
            const token = KratosToken.at(tokenAddress);

            const presaleSupply = await token.balanceOf(instance.address);
            assert.equal(presaleSupply.toNumber(), 80000000000000000000000000, "Presale supply is not 80 million");

            done();
        });
    });

    it('should transfer the ETH to wallet after Presale is successful and finalized', function(done){
        KratosPresale.deployed().then(async function(instance) {

            const goalReached = await instance.goalReached();
            assert(goalReached, "Crowdfunding goal not reached");

            let preBalance = await web3.eth.getBalance(accounts[1]);
            preBalance = Number(preBalance.toString(10));

            await instance.finalize();

            let postBalance = await web3.eth.getBalance(accounts[1]);
            postBalance = Number(postBalance.toString(10));

            assert.equal(postBalance, preBalance + 1000000000000000000, 'ETH couldn\'t be transferred to the owner');
            done();
        });
    });

    it('should deliver tokens to investors', function(done){
        KratosPresale.deployed().then(async function(instance) {
            await instance.withdrawTokens({from: accounts[7]});

            const tokenAddress = await instance.token.call();
            const token = KratosToken.at(tokenAddress);

            const ownerSupply = await token.balanceOf(instance.address);
            assert.equal(ownerSupply.toNumber(), 80000000000000000000000000-1999000000000000000000, "Owner supply is not 1999 less");

            const totalSupply = await token.totalSupply.call();
            assert.equal(totalSupply.toNumber(), 300000000000000000000000000, "Total token supply is not 300 million");

            const tokenAmount = await token.balanceOf(accounts[7]);
            assert.equal(tokenAmount.toNumber(), 1999000000000000000000, 'The sender didn\'t receive 1999 tokens post delivery');

            done();
        });
    });

    it('should timelock Presale tokens', function(done){
        KratosPresale.deployed().then(async function(instance) {
            const tokenAddress = await instance.token.call();
            const token = KratosToken.at(tokenAddress);

            await token.transfer(accounts[8], 1, {from: accounts[7]});
            done();
        }).catch(function(error) {
            assert.equal(error.toString(), "Error: VM Exception while processing transaction: revert", "Not a EVM error");
            done();
        });
    });

    it('should be able to transfer token after timelock', function(done){
        KratosPresale.deployed().then(async function(instance) {
            const tokenAddress = await instance.token.call();
            const token = KratosToken.at(tokenAddress);

            const tokenTimestamp = await token.timelock.call(accounts[7]);

            const senderPreBalance = await token.balanceOf(accounts[7]);

            await token.disableTimelock();
            await token.removeTimelock(accounts[7]);
            await token.transfer(accounts[8], 1000000000000000000, {from: accounts[7]});

            const senderPostBalance = await token.balanceOf(accounts[7]);
            assert.equal(senderPreBalance.toNumber() - senderPostBalance.toNumber(), 1000000000000000000, "1 token is not transfered out of sender");

            const balance = await token.balanceOf(accounts[8]);
            assert.equal(balance.toNumber(), 1000000000000000000, "1 token is not received by recipient");
            done();
        });
    });
});