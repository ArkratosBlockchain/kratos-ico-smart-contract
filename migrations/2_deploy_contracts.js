var PreSale = artifacts.require("./PreSale.sol");

module.exports = function(deployer) {
  // deployer.deploy(ConvertLib);
  // deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(PreSale);
};
