pragma solidity ^0.4.18;

import "openzeppelin-solidity/contracts/token/ERC20/StandardBurnableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract KratosToken is StandardBurnableToken, PausableToken {

    string public name = "KRATOS";
    string public symbol = "TOS";
    uint8 public decimals = 18;

    uint256 timelockTimestamp = 0;
    mapping(address => uint256) public timelock;

    function KratosToken(uint256 totalSupply) {
        // constructor
        totalSupply_ = totalSupply;
        balances[msg.sender] = totalSupply;
    }

    event TimeLocked(address indexed beneficary, uint256 timestamp);
    event TimeUnlocked(address indexed beneficary);

    /**
    * @dev Modifier to make a function callable only when the contract is not timelocked or timelock expired.
    */
    modifier whenNotTimelocked(address beneficary) {
        require(timelock[beneficary] == 0 || timelock[beneficary] <= block.timestamp);
        _;
    }

    /**
    * @dev Modifier to make a function callable only when the contract is timelocked and not expired.
    */
    modifier whenTimelocked(address beneficary) {
        require(timelock[beneficary] > 0 && timelock[beneficary] > block.timestamp);
        _;
    }

    function enableTimelock(uint256 _timelockTimestamp) onlyOwner public {
        require(timelockTimestamp == 0 || timelockTimestamp > block.timestamp);
        timelockTimestamp = _timelockTimestamp;
    }

    function disableTimelock() onlyOwner public {
        timelockTimestamp = 0;
    }

    /**
    * @dev called by the owner to timelock token belonging to beneficary
    */
    function addTimelock(address beneficary, uint256 timestamp) public onlyOwner whenNotTimelocked(beneficary) {
        _addTimelock(beneficary, timestamp);
    }

    function _addTimelock(address beneficary, uint256 timestamp) internal whenNotTimelocked(beneficary) {
        require(timestamp > block.timestamp);
        timelock[beneficary] = timestamp;
        emit TimeLocked(beneficary, timestamp);
    }

    /**
    * @dev called by the owner to timeunlock token belonging to beneficary
    */
    function removeTimelock(address beneficary) onlyOwner whenTimelocked(beneficary) public {
        timelock[beneficary] = 0;
        emit TimeUnlocked(beneficary);
    }

    function transfer(address _to, uint256 _value) public whenNotTimelocked(msg.sender) returns (bool) {
        if (timelockTimestamp > block.timestamp)
            _addTimelock(_to, timelockTimestamp);
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value) public whenNotTimelocked(_from) returns (bool) {
        if (timelockTimestamp > block.timestamp)
            _addTimelock(_to, timelockTimestamp);
        return super.transferFrom(_from, _to, _value);
    }

    function approve(address _spender, uint256 _value) public whenNotTimelocked(_spender) returns (bool) {
        return super.approve(_spender, _value);
    }

    function increaseApproval(address _spender, uint _addedValue) public whenNotTimelocked(_spender) returns (bool success) {
        return super.increaseApproval(_spender, _addedValue);
    }

    function decreaseApproval(address _spender, uint _subtractedValue) public whenNotTimelocked(_spender) returns (bool success) {
        return super.decreaseApproval(_spender, _subtractedValue);
    }
}
