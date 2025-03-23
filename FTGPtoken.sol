// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./currConverter.sol";

contract FTGPtoken is ERC20, currConverter, Ownable {
    uint256 public constant TOKEN_PRICE_IN_USD = 1 * 10**8; // 1 FTGP = $1
    // uint256 public constant DISPLAY_PRECISION = 10**2; // 2 decimal places for display (e.g., 1.29 as 129)
    

    constructor() 
        ERC20("FTGPtoken", "FTGP") 
        currConverter(address(this))
        Ownable(msg.sender)
    {
        // No initial minting
    }
    // Current logic to set the pricefeed address manually, need to work on automating this process by direclty retriving the
    // pricefeed address from chainlink website.
    function setPriceFeed(string memory currency, address priceFeedAddress) public onlyOwner override {
        priceFeeds[currency] = AggregatorV3Interface(priceFeedAddress);
    }
    // This function displays the current exchange rate.
    function getExchangeRate(string memory currency) public override view virtual returns (uint256) {
        if (keccak256(abi.encodePacked(currency)) == keccak256(abi.encodePacked(baseCurrency))){
            return (TOKEN_PRICE_IN_USD* DISPLAY_PRECISION) / 10**8;
        }else{
            AggregatorV3Interface priceFeed = priceFeeds[currency];
            require(address(priceFeed) != address(0), "Price feed not set for currency");
            (, int256 price, , , ) = priceFeed.latestRoundData();
            require(price > 0, "Invalid price data from feed");
            uint256 rate = uint256(price); // e.g., 129000000
            return (rate * DISPLAY_PRECISION) / 10**8; // e.g., 129
        }
    }

    // Preview conversion in human-readable format (e.g., 100 GBP to EUR as ~118.18)
    // This logic display the possible number of tokens you can convert with the given amount.
    function previewConversion(
        string memory fromCurrency,
        string memory toCurrency,
        uint256 amount
    ) public view returns (uint256 displayAmount) {
        require(
            keccak256(abi.encodePacked(fromCurrency)) != keccak256(abi.encodePacked(toCurrency)),
            "Cannot convert to the same currency"
        );

        // Step 1: Convert fromCurrency to USD
        uint256 fromRate = (keccak256(abi.encodePacked(fromCurrency)) == keccak256(abi.encodePacked(baseCurrency))) 
            ? 1e2 : getExchangeRate(fromCurrency); 
        uint256 usdAmount = (amount * fromRate) / 10**2; 

        // Step 2: Convert USD to toCurrency
        uint256 toRate = (keccak256(abi.encodePacked(toCurrency)) == keccak256(abi.encodePacked(baseCurrency))) 
            ? 1e2 : getExchangeRate(toCurrency); 
        require(toRate > 0, "Target currency rate is zero");
        uint256 targetAmount = (usdAmount * 10**18) / toRate;

        // Scale for display (e.g., 118.1818e18 tokens → 11818 for 118.18)
        displayAmount = (targetAmount * DISPLAY_PRECISION) / 10**18;
        return displayAmount;
    }
    // Debug function to inspect all latestRoundData values
    // function getPriceFeedData(string memory currency) public view returns (
    //     uint80 roundId,
    //     int256 price,
    //     uint256 startedAt,
    //     uint256 timeStamp,
    //     uint80 answeredInRound
    // ) {
    //     AggregatorV3Interface priceFeed = priceFeeds[currency];
    //     require(address(priceFeed) != address(0), "Price feed not set for currency");
    //     return priceFeed.latestRoundData();
    // }

    // Wrapper function to call convert from currConverter and mint the required tokens.
    function convertAndMint(
        string memory fromCurrency,
        string memory toCurrency,
        uint256 amount
    ) public {
        // Call the parent convert function and get the target amount
        uint256 targetAmount = previewConversion(fromCurrency, toCurrency, amount);
        
        // Mint the target amount to the sender
        _mint(msg.sender, targetAmount);
    }

    // Function to mint the tokens. No actual use, can be disabled.
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    // Logic to get the current total supply of tokens
    function getTotalSupplyInTokens() public view returns (uint256) {
        return totalSupply() / (10 ** decimals());
    }
    // Function to get the current balance of tokens from a specific account.
    function getBalanceOfAccount(address account) public view returns (uint256) {
        return balanceOf(account) / (10 ** decimals());
    }

    // function to Debug (retriving the chainlink pricefeed address)
    function getPriceFeedAddress(string memory currency) public view returns (address) {
        return address(priceFeeds[currency]);
    }

}