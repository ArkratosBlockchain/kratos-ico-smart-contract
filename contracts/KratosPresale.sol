pragma solidity ^0.4.18;

import "openzeppelin-solidity/contracts/crowdsale/distribution/PostDeliveryCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";

import "./KratosToken.sol";

contract KratosPresale is CappedCrowdsale, RefundableCrowdsale, WhitelistedCrowdsale, PostDeliveryCrowdsale {

    function() external payable {
        buyTokens(msg.sender);
    }

    function KratosPresale(
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
        require(_closingTime > block.timestamp);
        require(_closingTime > openingTime);
        require(_closingTime > closingTime);

        closingTime = _closingTime;
    }
}
