pragma solidity ^0.4.18;

import "openzeppelin-solidity/contracts/token/ERC20/StandardBurnableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract KratosToken is StandardBurnableToken, PausableToken {

    string public name = "KRATOS";
    string public symbol = "TOS";
    uint8 public decimals = 18;

    mapping(address => uint256) timelock;

    function KratosToken() {
        // constructor
    }

    event TimeLocked(address indexed beneficary, uint256 timestamp);
    event TimeUnlocked(address indexed beneficary);

    /**
    * @dev Modifier to make a function callable only when the contract is not timelocked or timelock expired.
    */
    modifier whenNotTimelocked() {
        require(timelock[this] == 0 || timelock[this] > block.timestamp);
        _;
    }

    /**
    * @dev Modifier to make a function callable only when the contract is timelocked and not expired.
    */
    modifier whenTimelocked() {
        require(timelock[this] > 0 && timelock[this] < block.timestamp);
        _;
    }

    /**
    * @dev called by the owner to timelock token belonging to beneficary
    */
    function addTimelock(address beneficary, uint256 timestamp) onlyOwner whenNotTimelocked public {
        require(timestamp > 0);
        timelock[beneficary] = timestamp;
        emit TimeLocked(beneficary, timestamp);
    }

    /**
    * @dev called by the owner to timeunlock token belonging to beneficary
    */
    function removeTimelock(address beneficary) onlyOwner whenTimelocked public {
        timelock[beneficary] = 0;
        emit TimeUnlocked(beneficary);
    }

    function transfer(address _to, uint256 _value) public whenNotTimelocked returns (bool) {
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value) public whenNotTimelocked returns (bool) {
        return super.transferFrom(_from, _to, _value);
    }

    function approve(address _spender, uint256 _value) public whenNotTimelocked returns (bool) {
        return super.approve(_spender, _value);
    }

    function increaseApproval(address _spender, uint _addedValue) public whenNotTimelocked returns (bool success) {
        return super.increaseApproval(_spender, _addedValue);
    }

    function decreaseApproval(address _spender, uint _subtractedValue) public whenNotTimelocked returns (bool success) {
        return super.decreaseApproval(_spender, _subtractedValue);
    }
}
