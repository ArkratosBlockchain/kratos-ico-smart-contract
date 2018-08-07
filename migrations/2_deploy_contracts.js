var KratosToken = artifacts.require("./KratosToken.sol")
var KratosPresale = artifacts.require("./KratosPresale.sol")
var KratosFinalsale = artifacts.require("./KratosFinalsale.sol")

module.exports = async (deployer, network) => {

  if (network === 'development')
    return;

  let deployDelay = 60*30 // 30 minutes
  
  if (network === 'ropsten') {
    deployDelay = 60*10  // 10 minutes
  }

  if (network === 'live-presale' || network === 'ropsten') {

    const cap = 80e24
    const openingTime = web3.eth.getBlock('latest').timestamp+deployDelay // !IMPT :: opening timestamp has to be much later when deploying to public networks as it takes some time before contract gets initialized
    const closingTime = openingTime + 86400 * 20 // 20 days
    const rate = new web3.BigNumber(1250)
    const wallet = web3.eth.accounts[1]
  
    return deployer.then(async () => {
      // deploy token
      const tokenTotalSupply = 3e26
      return deployer.deploy(KratosToken, tokenTotalSupply, {gas: 4700000, gasPrice: web3.toWei(4, "gwei")} )
    }).then(async () => {

      console.log("deploying presale...")
      console.log(KratosToken.address)
      console.log(cap)
      console.log(openingTime)
      console.log(closingTime)
      console.log(rate)
      console.log(wallet)
    
      // deploy crowdsale contract with initialization parameters
      return deployer.deploy(
        KratosPresale,
        cap,
        openingTime,
        closingTime,
        rate,
        wallet,
        KratosToken.address,
        {gas: 4700000, gasPrice: web3.toWei(4, "gwei")}
      )
    }).then(async () => {

      console.log("setting presale supply and timelock...")

      web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [10], id: Date.now()})

      // transfer supply to crowdsale contract
      const token = KratosToken.at(KratosToken.address)
      await token.transfer(KratosPresale.address, goal)
      token.enableTimelock(web3.eth.getBlock('latest').timestamp + 86400 * 180)

    })
  } else if (network === 'live-finalsale') {

    return deployer.then(async () => {
      // IMPT :: need to separate presale and finalsale because timelock value will affect presale if set in final sale for testing

      console.log("deploying finalsale...")

      const cap = 85e24
      const openingTime = web3.eth.getBlock('latest').timestamp + deployDelay // !IMPT :: opening timestamp has to be much later when deploying to public networks as it takes some time before contract gets initialized
      const closingTime = openingTime + 86400 * 20 // 20 days
      const rate = new web3.BigNumber(1000)
      const wallet = web3.eth.accounts[1]

      console.log(KratosToken.address)
      console.log(cap)
      console.log(openingTime)
      console.log(closingTime)
      console.log(rate)
      console.log(wallet)

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
      )
    }).then(async () => {

      console.log("setting finalsale supply and timelock...")

      const tokenFinalsaleSupply = 85e24
      const timelockedWallet = web3.eth.accounts[2]

      web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [deployDelay], id: Date.now()})

      const token = KratosToken.at(KratosToken.address)

      // transfer supply to locked accounts
      await token.transfer(timelockedWallet, tokenFinalsaleSupply)
      token.enableTimelock(web3.eth.getBlock('latest').timestamp + 86400 * 180)

      // transfer supply to crowdsale contract
      token.disableTimelock()
      await token.transfer(KratosFinalsale.address, tokenFinalsaleSupply)

    })
  }
};
