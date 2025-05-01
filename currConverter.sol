// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
 
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
 
contract currConverter{
    IERC20 public token;
    string public baseCurrency = "USD";
    uint256 internal constant DISPLAY_PRECISION = 10**2;
 
    // Mapping of currency codes (e.g., "ETH", "GBP") to Chainlink price feed contracts
    mapping(string => AggregatorV3Interface) internal priceFeeds;
 
    // Event to track conversions
    event Converted(
        address indexed user,
        string fromCurrency,
        uint256 amount,
        uint256 tokenAmount
    );
 
    // Constructor to set the token address and default price feeds
    constructor(address _token) {
        token = IERC20(_token);
 
        // Default price feeds for Sepolia testnet (adjust for your network)
        priceFeeds["GBP"] = AggregatorV3Interface(0x91FAB41F5f3bE955963a986366edAcff1aaeaa83); // GBP/USD
        priceFeeds["EUR"] = AggregatorV3Interface(0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910); // EUR/USD
        priceFeeds["JPY"] = AggregatorV3Interface(0x8A6af2B75F23831ADc973ce6288e5329F63D86c6); // JPY/USD
        priceFeeds["ETH"] = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306); // ETH/USD
        priceFeeds["USD"] = AggregatorV3Interface(address(0)); // USD is always 1:1 and does not require an oracle
        // USD is base currency, no feed needed (handled in getExchangeRate)
    }
 
    // Function to manually set or update price feeds (optional)
    function setPriceFeed(string memory currency, address priceFeedAddress) public virtual {
        priceFeeds[currency] = AggregatorV3Interface(priceFeedAddress);
    }
    // This logic gets the exchange rate from Chainlink price feed. This logic helps in showing the values in 3 digits, as float is not possible on remix.
    // Eg. converting GBP to USD actual convertion rate is ~1.29, our logic shows it as 129.
    function getExchangeRate(string memory currency) public view virtual returns (uint256) {
        if (keccak256(abi.encodePacked(currency)) == keccak256(abi.encodePacked(baseCurrency))) {
            return DISPLAY_PRECISION; // USD -> USD = 1.00, scaled
        }
 
        AggregatorV3Interface priceFeed = priceFeeds[currency];
        require(address(priceFeed) != address(0), "Price feed not set for currency");
 
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price data");
 
        uint256 rate = uint256(price);
        return (rate * DISPLAY_PRECISION) / 10**8; // 保留2位小数
    }
 
 
    function calculateConversion(
        string memory fromCurrency,
        string memory toCurrency,
        uint256 amount
    ) internal view returns (uint256 displayAmount) {
        require(
            keccak256(abi.encodePacked(fromCurrency)) != keccak256(abi.encodePacked(toCurrency)),
            "Cannot convert to the same currency"
        );
 
        // Step 1: Convert fromCurrency to USD
        uint256 fromRate = getExchangeRate(fromCurrency);
        uint256 usdAmount = (amount * fromRate) / 10**2; // amount is in 2 decimals
 
        // Step 2: Convert USD to toCurrency
        uint256 toRate = getExchangeRate(toCurrency);
        require(toRate > 0, "Target currency rate is zero");
        displayAmount = (usdAmount * 10**2) / toRate; // Result in 2 decimals
        return displayAmount;
    }
 
    function convert(
        string memory fromCurrency,
        uint256 amount
    ) internal virtual returns (uint256 tokenAmount) {
        uint256 fromRate = getExchangeRate(fromCurrency);
        require(fromRate > 0, "Invalid exchange rate");
 
       
        uint256 usdAmount = (amount * fromRate) / DISPLAY_PRECISION;
 
       
        tokenAmount = usdAmount * 10**18;
 
        return tokenAmount;
    }
 
   
}