var KratosToken = artifacts.require("./KratosToken.sol");
var KratosPreSale = artifacts.require("./KratosPreSale.sol");

module.exports = function(deployer) {

  const goal = 80000000000000000000000000;
  const openingTime = web3.eth.getBlock('latest').timestamp + 600; // 10 mins in the future
  const closingTime = openingTime + 86400 * 20; // 20 days
  const rate = new web3.BigNumber(1250);
  const wallet = web3.eth.accounts[0];

  return deployer.then(() => {
    return deployer.deploy(KratosToken);
  }).then(() => {
    return deployer.deploy(
      KratosPreSale,
      goal,
      openingTime,
      closingTime,
      rate,
      wallet,
      KratosToken.address, 
      // {gas: web3.eth.getBlock('latest').gasLimit, gasPrice: web3.toWei(0.5, 'gwei')}
    );
  });
};
