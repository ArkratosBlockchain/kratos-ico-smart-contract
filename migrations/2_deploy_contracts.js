var KratosToken = artifacts.require("./KratosToken.sol");
var KratosPresale = artifacts.require("./KratosPresale.sol");
var KratosFinalsale = artifacts.require("./KratosFinalsale.sol");

module.exports = async (deployer, network) => {

  if (network === 'development')
    return;

  let deployDelay = 60*30; // 30 minutes
    deployDelay = 30;
  
  if (network === 'ropsten')
    deployDelay = 60*10;  // 10 minutes
  

  return deployer.then(async () => {
    // deploy token
    const tokenTotalSupply = 300000000000000000000000000;
    return deployer.deploy(KratosToken, tokenTotalSupply, {gas: 4700000, gasPrice: web3.toWei(4, "gwei")} );
  }).then(async () => {

    console.log("deploying presale...");

    const goal = web3.toWei("1", "ether");
    const cap = web3.toWei("10", "ether");
    const openingTime = web3.eth.getBlock('latest').timestamp+deployDelay; // !IMPT :: opening timestamp has to be much later when deploying to public networks as it takes some time before contract gets initialized
    const closingTime = openingTime + 86400 * 20; // 20 days
    const rate = new web3.BigNumber(1250);
    const wallet = web3.eth.accounts[1];
  
    console.log(KratosToken.address);
    console.log(goal);
    console.log(cap);
    console.log(openingTime);
    console.log(closingTime);
    console.log(rate);
    console.log(wallet);
  
    // deploy crowdsale contract with initialization parameters
    return deployer.deploy(
      KratosPresale,
      goal,
      cap,
      openingTime,
      closingTime,
      rate,
      wallet,
      KratosToken.address,
      {gas: 4700000, gasPrice: web3.toWei(4, "gwei")}
    );
  }).then(async () => {

    console.log("setting presale supply and timelock...")

    const tokenPresaleSupply = 80000000000000000000000000;

    web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [10], id: Date.now()});

    // transfer supply to crowdsale contract
    const token = KratosToken.at(KratosToken.address);
    await token.transfer(KratosPresale.address, tokenPresaleSupply);
    token.enableTimelock(web3.eth.getBlock('latest').timestamp + 86400 * 180);

  })/*.then(async () => {

    // TODO :: somehow need to separate presale and finalsale because timelock value will affaect presale if set in final sale for testing

    console.log("deploying finalsale...");

    const cap = web3.toWei("10", "ether");
    const openingTime = web3.eth.getBlock('latest').timestamp + deployDelay; // !IMPT :: opening timestamp has to be much later when deploying to public networks as it takes some time before contract gets initialized
    const closingTime = openingTime + 86400 * 20; // 20 days
    const rate = new web3.BigNumber(1000);
    const wallet = web3.eth.accounts[1];

    console.log(KratosToken.address);
    console.log(cap);
    console.log(openingTime);
    console.log(closingTime);
    console.log(rate);
    console.log(wallet);

    // finalsale!
    // deploy crowdsale contract with initialization parameters
    return deployer.deploy(
      KratosFinalsale,
      cap,
      openingTime,
      closingTime,
      rate,
      wallet,
      KratosToken.address,
      {gas: 4700000, gasPrice: web3.toWei(4, "gwei")}
    );
  }).then(async () => {

    console.log("setting finalsale supply and timelock...")

    const tokenFinalsaleSupply = 85000000000000000000000000;
    const timelockedWallet = web3.eth.accounts[2];

    web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [deployDelay], id: Date.now()});

    const token = KratosToken.at(KratosToken.address);

    // transfer supply to locked accounts
    await token.transfer(timelockedWallet, tokenFinalsaleSupply);
    token.enableTimelock(web3.eth.getBlock('latest').timestamp + 86400 * 180);

    // transfer supply to crowdsale contract
    token.disableTimelock();
    await token.transfer(KratosFinalsale.address, tokenFinalsaleSupply);

  })*/;
};
