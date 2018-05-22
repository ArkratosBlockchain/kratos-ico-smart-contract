var KratosToken = artifacts.require("./KratosToken.sol");
var KratosPresale = artifacts.require("./KratosPresale.sol");

module.exports = function(deployer) {

  const goal = web3.toWei("5000", "ether");
  const cap = web3.toWei("80000", "ether");
  const openingTime = web3.eth.getBlock('latest').timestamp;
  const closingTime = openingTime + 86400 * 20; // 20 days
  const rate = new web3.BigNumber(1250);
  const wallet = web3.eth.accounts[0];

  return deployer.then(() => {
    return deployer.deploy(KratosToken);
  }).then(() => {
    return deployer.deploy(
      KratosPresale,
      goal,
      cap,
      openingTime,
      closingTime,
      rate,
      wallet,
      KratosToken.address, 
      // {gas: web3.eth.getBlock('latest').gasLimit, gasPrice: web3.toWei(0.5, 'gwei')}
    );
  });
};
