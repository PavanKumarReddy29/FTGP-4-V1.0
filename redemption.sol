// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
 
/**
 * @title tokenRedemption
 * @dev Library for handling token redemption to a specified currency
 */
library tokenRedemption {
    event TokensRedeemed(address indexed user, string toCurrency, uint256 tokenAmount, uint256 currencyAmount);
    event Debug(string message, uint256 value);
 
    function redeemTokens(
        IERC20 token,
        address user,
        string memory toCurrency,
        uint256 tokenAmount,
        function(string memory) view returns (uint256) getExchangeRate
    ) internal returns (uint256) {
        require(user != address(0), "RedemptionLib: User cannot be zero address");
        require(tokenAmount > 0, "RedemptionLib: Token amount must be greater than zero");
 
        uint256 userBalance = token.balanceOf(user);
        emit Debug("User balance", userBalance);
        require(userBalance >= tokenAmount, "RedemptionLib: Insufficient token balance");
 
        uint256 currencyAmount = calculateRedemptionAmount(toCurrency, tokenAmount, getExchangeRate);
        emit Debug("Currency amount", currencyAmount);
        require(currencyAmount > 0, "RedemptionLib: Invalid conversion amount");
 
        bool success = token.transferFrom(user, address(0xdead), tokenAmount);
        emit Debug("Transfer success", success ? 1 : 0);
        require(success, "RedemptionLib: Token burn failed");
 
        emit TokensRedeemed(user, toCurrency, tokenAmount, currencyAmount);
        return currencyAmount;
    }
 
    function calculateRedemptionAmount(
        string memory toCurrency,
        uint256 tokenAmount,
        function(string memory) view returns (uint256) getExchangeRate
    ) internal view returns (uint256) {
        uint256 usdAmount = tokenAmount / (10 ** 18);
        if (keccak256(abi.encodePacked(toCurrency)) == keccak256(abi.encodePacked("USD"))) {
            return usdAmount;
        }
        uint256 toRate = getExchangeRate(toCurrency);
        require(toRate > 0, "Invalid target currency rate");
        return (usdAmount * 10**2) / toRate;
    }
 
    function getBalance(IERC20 token, address account, uint8 decimals) internal view returns (uint256) {
        return token.balanceOf(account) / (10 ** decimals);
    }
}
 