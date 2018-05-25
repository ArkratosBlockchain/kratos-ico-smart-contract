var KratosToken = artifacts.require("./KratosToken.sol");
var KratosPresale = artifacts.require("./KratosPresale.sol");

module.exports = async (deployer) => {

  const tokenTotalSupply = 300000000000000000000000000;
  const tokenPresaleSupply = 80000000000000000000000000;
  const goal = web3.toWei("1", "ether");
  const cap = web3.toWei("10", "ether");
  const openingTime = web3.eth.getBlock('latest').timestamp+5;
  const closingTime = openingTime + 86400 * 20; // 20 days
  const rate = new web3.BigNumber(1250);
  const wallet = web3.eth.accounts[1];

  return deployer.then(async () => {
    return deployer.deploy(KratosToken, tokenTotalSupply);
  }).then(async () => {
    return deployer.deploy(
      KratosPresale,
      goal,
      cap,
      openingTime,
      closingTime,
      rate,
      wallet,
      KratosToken.address, 
    );
  }).then(async () => {
    web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [10], id: Date.now()});

    const token = KratosToken.at(KratosToken.address);
    await token.transfer(KratosPresale.address, tokenPresaleSupply);
    token.enableTimelock(web3.eth.getBlock('latest').timestamp + 86400 * 180);
  });
};
