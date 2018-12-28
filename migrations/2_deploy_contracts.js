var KratosToken = artifacts.require("./KratosToken.sol")
var KratosPresale = artifacts.require("./KratosPresale.sol")
var KratosFinalsale = artifacts.require("./KratosFinalsale.sol")

module.exports = async (deployer, network) => {

  if (network === 'test')
    return;

  let deployDelay = 60*30 // 30 minutes
  
  if (network === 'ropsten') {
    deployDelay = 60*10  // 10 minutes
  }

  if (network !== 'live-finalsale') {
    const cap = new web3.utils.BN('80000000000000000000000000')
    const openingTime = (await web3.eth.getBlock('latest')).timestamp + deployDelay // !IMPT :: opening timestamp has to be much later when deploying to public networks as it takes some time before contract gets initialized
    const closingTime = openingTime + 86400 * 20 // 20 days
    const rate = new web3.utils.BN(1250)
  
    // deploy token
    const tokenTotalSupply = new web3.utils.BN('300000000000000000000000000')
    await deployer.deploy(KratosToken, tokenTotalSupply, {gas: '4700000', gasPrice: web3.utils.toWei('4', 'gwei')} )

    console.log(await web3.eth.getAccounts())
    const wallet = (await web3.eth.getAccounts())[1]

    console.log("deploying presale...")
    console.log('token address', KratosToken.address)
    console.log('soft cap', cap)
    console.log('opening time', openingTime)
    console.log('closing time', closingTime)
    console.log('conversion rate', rate)
    console.log('wallet address', wallet)
  
    // deploy crowdsale contract with initialization parameters
    await deployer.deploy(
      KratosPresale,
      cap,
      openingTime,
      closingTime,
      rate,
      wallet,
      KratosToken.address,
      {gas: '4700000', gasPrice: web3.utils.toWei('4', "gwei")}
    )

    console.log("setting presale supply and timelock...")

    // only available in truffle test blockchain to increase time
    web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [10], id: Date.now()})

    // transfer supply to crowdsale contract
    const token = await KratosToken.at(KratosToken.address)
    await token.transfer(KratosPresale.address, cap)
    token.enableTimelock((await web3.eth.getBlock('latest')).timestamp + 86400 * 180)

  } else {

    // IMPT :: need to separate presale and finalsale because timelock value will affect presale if set in final sale for testing

    console.log("deploying finalsale...")

    const cap = 85e24
    const openingTime = (await web3.eth.getBlock('latest')).timestamp + deployDelay // !IMPT :: opening timestamp has to be much later when deploying to public networks as it takes some time before contract gets initialized
    const closingTime = openingTime + 86400 * 20 // 20 days
    const rate = new web3.utils.BN(1000)
    const wallet = (await web3.eth.getAccounts())[1]

    console.log(KratosToken.address)
    console.log(cap)
    console.log(openingTime)
    console.log(closingTime)
    console.log(rate)
    console.log(wallet)

    // finalsale!
    // deploy crowdsale contract with initialization parameters
    await deployer.deploy(
      KratosFinalsale,
      cap,
      openingTime,
      closingTime,
      rate,
      wallet,
      KratosToken.address,
      {gas: 4700000, gasPrice: web3.utils.toWei(4, "gwei")}
    )

    console.log("setting finalsale supply and timelock...")

    const tokenFinalsaleSupply = 85e24
    const timelockedWallet = (await web3.eth.accounts)[2]

    // only available in truffle test blockchain to increase time
    web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [deployDelay], id: Date.now()})

    const token = await KratosToken.at(KratosToken.address)

    // transfer supply to locked accounts
    await token.transfer(timelockedWallet, tokenFinalsaleSupply)
    token.enableTimelock((await web3.eth.getBlock('latest')).timestamp + 86400 * 180)

    // transfer supply to crowdsale contract
    token.disableTimelock()
    await token.transfer(KratosFinalsale.address, tokenFinalsaleSupply)

  }

  console.log('done')

};
