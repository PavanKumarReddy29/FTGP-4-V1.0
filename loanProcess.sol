// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract CollateralVerifier {
    // tokenName → tokenAddress
    mapping(string => address) private tokenRegistry;

    // tokenName → priceFeedAddress (Chainlink)
    mapping(string => address) private priceFeedRegistry;

    constructor() {
        tokenRegistry["ETH"] = 0x668500e92F1A95204C5e648871163186F9fEc173; // Sepolia ETH address
        priceFeedRegistry["ETH"] = 0x694AA1769357215DE4FAC081bf1f309aDC325306; // ETH/USD Chainlink
        
        // You can add more here:
        // tokenRegistry["WBTC"] = 0xYourWBTCAddress;
        // priceFeedRegistry["WBTC"] = 0xYourBTCUSDPriceFeed;
    }

    /// Get user's token balance (supports ETH and ERC20)
    function getUserTokenBalance(address user, string memory tokenName) public view returns (uint256 balance) {
        require(user != address(0), "Invalid user");

        address tokenAddress = tokenRegistry[tokenName];
        require(tokenAddress != address(0), "Token not supported");

        if (keccak256(bytes(tokenName)) == keccak256(bytes("ETH"))) {
            balance = user.balance; // Native ETH
        } else {
            balance = IERC20Metadata(tokenAddress).balanceOf(user); // ERC20
        }

        return balance;
    }

    /// Get max loanable amount in USD (LTV = 40%), auto fetches price feed
    function getMaxLoanAmountUSD(
        address user,
        string memory tokenName,
        uint256 collateralAmount
    ) public view returns (bool valid, uint256 maxLoanUSD) {
        require(user != address(0), "Invalid user");

        address tokenAddress = tokenRegistry[tokenName];
        require(tokenAddress != address(0), "Token not supported");

        address priceFeedAddress = priceFeedRegistry[tokenName];
        require(priceFeedAddress != address(0), "Price feed not registered");

        // Check if user has enough balance
        uint256 balance = getUserTokenBalance(user, tokenName);
        valid = balance >= collateralAmount;
        if (!valid) return (false, 0);

        // Get price from Chainlink oracle
        AggregatorV3Interface feed = AggregatorV3Interface(priceFeedAddress);
        (, int256 price, , , ) = feed.latestRoundData();
        require(price > 0, "Invalid price");

        // Decimals (ETH = 18)
        uint8 decimals = keccak256(bytes(tokenName)) == keccak256(bytes("ETH"))
            ? 18
            : IERC20Metadata(tokenAddress).decimals();

        // Calculate collateral value in USD
        uint256 collateralValueUSD = (uint256(price) * collateralAmount) / (10 ** decimals) / 1e8;

        // Max loan = 40% of collateral value
        maxLoanUSD = (collateralValueUSD * 40) / 100;

        return (true, maxLoanUSD);
    }
}




