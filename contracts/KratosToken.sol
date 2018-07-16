pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/StandardBurnableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract KratosToken is StandardBurnableToken, PausableToken {

    string constant public name = "KRATOS";
    string constant public symbol = "TOS";
    uint8 constant public decimals = 18;

    uint256 public timelockTimestamp = 0;
    mapping(address => uint256) public timelock;

    constructor(uint256 _totalSupply) public {
        // constructor
        totalSupply_ = _totalSupply;
        balances[msg.sender] = _totalSupply;
    }

    event TimeLocked(address indexed _beneficary, uint256 _timestamp);
    event TimeUnlocked(address indexed _beneficary);

    /**
    * @dev Modifier to make a function callable only when the contract is not timelocked or timelock expired.
    */
    modifier whenNotTimelocked(address _beneficary) {
        require(timelock[_beneficary] <= block.timestamp);
        _;
    }

    /**
    * @dev Modifier to make a function callable only when the contract is timelocked and not expired.
    */
    modifier whenTimelocked(address _beneficary) {
        require(timelock[_beneficary] > block.timestamp);
        _;
    }

    function enableTimelock(uint256 _timelockTimestamp) onlyOwner public {
        require(timelockTimestamp == 0 || _timelockTimestamp > block.timestamp);
        timelockTimestamp = _timelockTimestamp;
    }

    function disableTimelock() onlyOwner public {
        timelockTimestamp = 0;
    }

    /**
    * @dev called by the owner to timelock token belonging to beneficary
    */
    function addTimelock(address _beneficary, uint256 _timestamp) public onlyOwner {
        _addTimelock(_beneficary, _timestamp);
    }

    function _addTimelock(address _beneficary, uint256 _timestamp) internal whenNotTimelocked(_beneficary) {
        require(_timestamp > block.timestamp);
        timelock[_beneficary] = _timestamp;
        emit TimeLocked(_beneficary, _timestamp);
    }

    /**
    * @dev called by the owner to timeunlock token belonging to beneficary
    */
    function removeTimelock(address _beneficary) onlyOwner whenTimelocked(_beneficary) public {
        timelock[_beneficary] = 0;
        emit TimeUnlocked(_beneficary);
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
