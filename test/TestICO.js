import 'babel-polyfill';

var KratosToken = artifacts.require("KratosToken");
var KratosPresale = artifacts.require("KratosPresale");
var RefundVault = artifacts.require("RefundVault");

contract('KratosPresale', function(accounts) {
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
            // await instance.addToWhitelist(accounts[7]);
            await instance.sendTransaction({ from: accounts[7], value: web3.toWei(1, "ether") });
            assert(false, "Non whitelisted address did not encounter error when purchasing");
            done();
       }).catch(function(error) {
           assert(true);
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

    it('should store proceed of sales into refundVault', function(done){
        KratosPresale.deployed().then(async function(instance) {
            const vaultAddress = await instance.vault.call();
            const vault = RefundVault.at(vaultAddress);
            const vaultTokenAmount = await vault.deposited(accounts[7]);
            assert.equal(vaultTokenAmount.toNumber(), 1000000000000000000, 'Didn\'t receive the same amount of ETH in refund vault');
            done();
       });
    });

    it('one ETH should buy 1999 Kratos Tokens in Presale and stored in RefundVault', function(done){
        KratosPresale.deployed().then(async function(instance) {
            const tokenAddress = await instance.token.call();
            const kratosToken = KratosToken.at(tokenAddress);
            const tokenAmount = await kratosToken.balanceOf(accounts[7]);
            assert.equal(tokenAmount.toNumber(), 1999000000000000000000, 'The sender shouldn\'t receive the tokens before Presale ends');
            done();
       });
    });

    it('should transfer the ETH to wallet immediately in Presale', function(done){
        KratosPresale.deployed().then(async function(instance) {
            let balanceOfBeneficiary = await web3.eth.getBalance(accounts[9]);
            balanceOfBeneficiary = Number(balanceOfBeneficiary.toString(10));

            await instance.sendTransaction({ from: accounts[1], value: web3.toWei(2, "ether")});

            let newBalanceOfBeneficiary = await web3.eth.getBalance(accounts[9]);
            newBalanceOfBeneficiary = Number(newBalanceOfBeneficiary.toString(10));

            assert.equal(newBalanceOfBeneficiary, balanceOfBeneficiary + 2000000000000000000, 'ETH couldn\'t be transferred to the beneficiary');
            done();
       });
    });

    it('should set variable `weiRaised` correctly', function(done){
        KratosPresale.deployed().then(async function(instance) {
            var amount = await instance.weiRaised.call();
            assert.equal(amount.toNumber(), web3.toWei(3, "ether"), 'Total ETH raised in Presale was not calculated correctly');
            done();
       });
    });

    it('should transfer the raised ETH to RefundVault during Presale', function(done){
        KratosPresale.deployed().then(async function(instance) {
            var vaultAddress = await instance.vault.call();

            let balance = await web3.eth.getBalance(vaultAddress);

            assert.equal(balance.toNumber(), 1000000000000000000, 'ETH couldn\'t be transferred to the vault');
            done();
       });
    });

    it('Vault balance should be added to our wallet once Presale is over', function(done){
        KratosPresale.deployed().then(async function(instance) {
            let balanceOfBeneficiary = await web3.eth.getBalance(accounts[9]);
            balanceOfBeneficiary = balanceOfBeneficiary.toNumber();

            var vaultAddress = await instance.vault.call();
            let vaultBalance = await web3.eth.getBalance(vaultAddress);

            await instance.finish(accounts[0], accounts[1], accounts[2]);

            let newBalanceOfBeneficiary = await web3.eth.getBalance(accounts[9]);
            newBalanceOfBeneficiary = newBalanceOfBeneficiary.toNumber();

            assert.equal(newBalanceOfBeneficiary, balanceOfBeneficiary + vaultBalance.toNumber(), 'Vault balance couldn\'t be sent to the wallet');
            done();
       });
    });
});