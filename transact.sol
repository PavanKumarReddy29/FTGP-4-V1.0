// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract SecureStableUSDToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    mapping(bytes32 => AggregatorV3Interface) private priceFeeds; // Currency mapping

    event TokenMinted(address indexed buyer, string currency, uint256 amountPaid, uint256 tokensReceived);
    event TokenBurned(address indexed account, uint256 amount);
    event PriceFeedUpdated(string currency, address newFeed);

    constructor() ERC20("Secure Stable USD Token", "USDTK") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        // ✅ Predefined Chainlink oracle addresses (for Sepolia testnet only)
        priceFeeds[keccak256("GBP")] = AggregatorV3Interface(0x91FAB41F5f3bE955963a986366edAcff1aaeaa83);
        priceFeeds[keccak256("EUR")] = AggregatorV3Interface(0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910);
        priceFeeds[keccak256("JPY")] = AggregatorV3Interface(0x8A6af2B75F23831ADc973ce6288e5329F63D86c6);
        priceFeeds[keccak256("USD")] = AggregatorV3Interface(address(0)); // USD is always 1:1 and does not require an oracle
    }

    // ✅ Update Chainlink oracle address
    function updatePriceFeed(string memory currency, address newFeed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFeed != address(0), "Invalid address");
        bytes32 currencyKey = keccak256(abi.encodePacked(currency));
        require(address(priceFeeds[currencyKey]) != address(0), "Unsupported currency");

        priceFeeds[currencyKey] = AggregatorV3Interface(newFeed);
        emit PriceFeedUpdated(currency, newFeed);
    }

    // ✅ Public getLatestPrice() function, allowing direct price queries in Remix
    function getLatestPrice(string memory currency) public view returns (uint256) {
        bytes32 currencyKey = keccak256(abi.encodePacked(currency));
        AggregatorV3Interface priceFeed = priceFeeds[currencyKey];

        require(address(priceFeed) != address(0), "Unsupported currency");
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price data");

        return uint256(price); // Chainlink prices typically return 1e8 precision
    }

    // ✅ Calculate the equivalent USD amount from any given currency
    function calculateRequiredAmount(string memory currency, uint256 amount) public view returns (uint256 amountInUSD) {
        require(amount > 0, "Currency amount must be greater than 0");

        bytes32 currencyKey = keccak256(abi.encodePacked(currency));

        // ✅ If the currency is USD, return the same amount
        if (currencyKey == keccak256("USD")) {
            return amount;
        }

        // ✅ Get the exchange rate of the currency against USD
        uint256 currencyUsdPrice = getLatestPrice(currency); // Price of 1 currency unit in USD (1e8 precision)
        
        require(currencyUsdPrice > 0, "Invalid price data");

        // ✅ Convert the given amount to USD
        amountInUSD = (amount * currencyUsdPrice) / 1e8; // Since price is in 1e8 precision, divide by 1e8
    }


    // ✅ Mint tokens using only USD-based pricing, without ETH transactions
    function mintWithCurrency(string memory currency, uint256 tokenAmount) public {
        require(tokenAmount > 0, "Token amount must be greater than 0");


        uint256 amountInUSD = calculateRequiredAmount(currency, tokenAmount);


        _mint(msg.sender, tokenAmount);


        emit TokenMinted(msg.sender, currency, amountInUSD, tokenAmount);
    }

   

    // ✅ Burn tokens
    function burnTokens(uint256 amount) public {
        require(amount > 0, "Token amount must be greater than 0");
        _burn(msg.sender, amount);
        emit TokenBurned(msg.sender, amount);
    }
}









