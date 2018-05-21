pragma solidity ^0.4.18;

import "openzeppelin-solidity/contracts/token/ERC20/StandardBurnableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract KratosToken is StandardBurnableToken, PausableToken {

    string public name = "KRATOS";
    string public symbol = "TOS";
    uint8 public decimals = 18;
    uint256 totalSupply_ = 30000000000000000000000000;

    function KratosToken() {
        // constructor
    }
}
