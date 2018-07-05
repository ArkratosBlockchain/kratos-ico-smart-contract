pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/distribution/PostDeliveryCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";

import "./KratosToken.sol";

contract KratosPresale is CappedCrowdsale, RefundableCrowdsale, WhitelistedCrowdsale, PostDeliveryCrowdsale {

    constructor(
        uint256 _goal,
        uint256 _cap,
        uint256 _openingTime,
        uint256 _closingTime,
        uint256 _rate,
        address _wallet,
        KratosToken _token
    ) public
        Crowdsale(_rate, _wallet, _token)
        CappedCrowdsale(_cap) // hard cap
        RefundableCrowdsale(_goal) // soft cap, allow refund if goal not reached
        TimedCrowdsale(_openingTime, _closingTime) {
    }

    function setRate(uint256 _rate) external onlyOwner onlyWhileOpen {
        // solium-disable-next-line security/no-block-members
        require(_rate > 0);

        rate = _rate;
    }

    function setClosingTime(uint256 _closingTime) external onlyOwner {
        // solium-disable-next-line security/no-block-members
        require(_closingTime >= block.timestamp);
        require(_closingTime >= openingTime);

        closingTime = _closingTime;
    }

    // allow withdrawal of tokens anytime
    function withdrawTokens(address addr) public onlyOwner {
        // require(hasClosed());
        uint256 amount = balances[addr];
        require(amount > 0);
        balances[addr] = 0;
        _deliverTokens(addr, amount);
    }

    // allow withdrawal of funds anytime
    function withdrawFunds() public onlyOwner {
        wallet.transfer(address(vault).balance);
    } 

    function claimRefund(address addr) public onlyOwner {
        require(isFinalized);
        require(!goalReached());

        vault.refund(addr);
    }
}