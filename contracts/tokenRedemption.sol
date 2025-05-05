// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
 
/**
* @title tokenRedemption
* @dev Library for handling token redemption to a specified currency
*/
library tokenRedemption {
    event TokensRedeemed(address indexed user, string toCurrency, uint256 tokenAmount, uint256 currencyAmount);
    event Debug(string message, uint256 value, string unit);
 
    function redeemTokens(
        IERC20 token,
        address user,
        string memory toCurrency,
        uint256 tokenAmountInWei,
        function(string memory) view returns (uint256) getExchangeRate
    ) internal returns (uint256) {
        require(user != address(0), "RedemptionLib: User cannot be zero address");
        require(tokenAmountInWei > 0, "RedemptionLib: Token amount must be greater than zero");
 
        // Fetch and log user balance
        uint256 userBalance = token.balanceOf(user);
        emit Debug("User balance", userBalance, "wei");
        require(userBalance >= tokenAmountInWei, "RedemptionLib: Insufficient token balance");
 
        // Calculate redemption amount
        uint256 currencyAmount = calculateRedemptionAmount(toCurrency, tokenAmountInWei, getExchangeRate);
        emit Debug("Currency amount", currencyAmount, "currency units");
        require(currencyAmount > 0, "RedemptionLib: Invalid conversion amount");
 
        // Burn tokens by transferring to 0xdead
        bool success = token.transferFrom(user, address(0xdead), tokenAmountInWei);
        emit Debug("Transfer success", success ? 1 : 0, "boolean");
        require(success, "RedemptionLib: Token burn failed");
 
        emit TokensRedeemed(user, toCurrency, tokenAmountInWei, currencyAmount);
        return currencyAmount;
    }
 
    function calculateRedemptionAmount(
        string memory toCurrency,
        uint256 tokenAmountInWei,
        function(string memory) view returns (uint256) getExchangeRate
    ) internal view returns (uint256) {
        // Convert token amount from wei to token units (assuming 18 decimals)
        uint256 usdAmount = tokenAmountInWei / (10 ** 18);
        // emit Debug("USD equivalent", usdAmount, "USD");
 
        if (keccak256(abi.encodePacked(toCurrency)) == keccak256(abi.encodePacked("USD"))) {
            return usdAmount;
        }
 
        uint256 toRate = getExchangeRate(toCurrency);
        // emit Debug("Exchange rate", toRate, "rate");
        require(toRate > 0, "RedemptionLib: Invalid target currency rate");
 
        // Calculate currency amount (assuming rate is in 10^8 precision, adjust as needed)
        uint256 currencyAmount = (usdAmount * 10**2) / toRate;
        return currencyAmount;
    }
 
    function getBalance(IERC20 token, address account, uint8 decimals) internal view returns (uint256) {
        uint256 balance = token.balanceOf(account);
        // emit Debug("Balance fetched", balance, "wei");
        return balance / (10 ** decimals);
    }
}