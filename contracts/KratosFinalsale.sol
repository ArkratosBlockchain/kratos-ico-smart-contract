pragma solidity ^0.4.18;

import "openzeppelin-solidity/contracts/crowdsale/distribution/PostDeliveryCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";

import "./KratosToken.sol";

contract KratosFinalsale is CappedCrowdsale, WhitelistedCrowdsale, PostDeliveryCrowdsale {

    function KratosFinalsale(
        uint256 _cap,
        uint256 _openingTime,
        uint256 _closingTime,
        uint256 _rate,
        address _wallet,
        KratosToken _token
    ) public
        Crowdsale(_rate, _wallet, _token)
        CappedCrowdsale(_cap) // hard cap
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

    function withdrawTokens(address addr) public onlyOwner {
        require(hasClosed());
        uint256 amount = balances[addr];
        require(amount > 0);
        balances[addr] = 0;
        _deliverTokens(addr, amount);
    }

}