// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract currConverter{
    IERC20 public token;
    string public baseCurrency = "USD";
    uint256 internal constant DISPLAY_PRECISION = 10**2;

    // Mapping of currency codes (e.g., "ETH", "GBP") to Chainlink price feed contracts
    mapping(string => AggregatorV3Interface) internal priceFeeds;

    // Event to track conversions
    event Converted(
        address indexed user,
        string fromCurrency,
        string toCurrency,
        uint256 amount,
        uint256 convertedAmount
    );

    constructor(address _token) {
        token = IERC20(_token);
    }
    // Dynamic function to get the exchange rates from chain link, need to automate it. currently this needs to be added manually after deploying. 
    function setPriceFeed(string memory currency, address priceFeedAddress) public virtual {
        priceFeeds[currency] = AggregatorV3Interface(priceFeedAddress);
        // priceFeeds["GBP"] = AggregatorV3Interface(0x91FAB41F5f3bE955963a986366edAcff1aaeaa83);
        // priceFeeds["EUR"] = AggregatorV3Interface(0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910);
        // priceFeeds["JPY"] = AggregatorV3Interface(0x8A6af2B75F23831ADc973ce6288e5329F63D86c6);
        // priceFeeds["USD"] = AggregatorV3Interface(address(0)); // USD is always 1:1 and does not require an oracle

    }
    // This logic gets the exchange rate from Chainlink price feed. This logic helps in showing the values in 3 digits, as float is not possible on remix.
    // Eg. converting GBP to USD actual convertion rate is ~1.29, our logic shows it as 129.
    function getExchangeRate(string memory currency) public virtual returns (uint256) {
        AggregatorV3Interface priceFeed = priceFeeds[currency];
        require(address(priceFeed) != address(0), "Price feed not set for currency");
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price data");
        uint256 rate = uint256(price);
        return (rate * DISPLAY_PRECISION) / 10**8; // Scale to 2 decimals
    }

    // Convert function without minting, returns targetAmount
    function convert(
        string memory fromCurrency,
        string memory toCurrency,
        uint256 amount
    ) internal virtual returns (uint256 displayAmount) {
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
    
}