// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./currConverter.sol";
import "./tokenTransfer.sol";

contract FTGPtoken is ERC20, currConverter, Ownable {
    uint256 public constant TOKEN_PRICE_IN_USD = 1 * 10**8; // 1 FTGP = $1
    
    // Mapping to track token balances tied to a specific redemption currency
    mapping(address => mapping(string => uint256)) public currencyLockedBalances;

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
    function getRateForCurrency(string memory currency) public view returns (uint256) {
        return getExchangeRate(currency); // Calls the inherited function from CurrencyConverter
    }

    // Preview conversion (view function)
    function previewConversion(
        string memory fromCurrency,
        string memory toCurrency,
        uint256 amount
    ) public view returns (uint256 displayAmount) {
        displayAmount = calculateConversion(fromCurrency, toCurrency, amount);
        return displayAmount;
    }

    // Convert and mint
    function convertAndMint(
        string memory fromCurrency,
        uint256 amount
    ) public {
        uint256 tokenAmount = convert(fromCurrency, amount);
        require(tokenAmount > 0, "Invalid token amount");
        _mint(msg.sender, tokenAmount);
        emit Converted(msg.sender, fromCurrency, amount, tokenAmount);
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
    /**
     * @dev Function to transfer tokens using TransferLib
     * @param receiver The address to send tokens to
     * @param amount The amount of tokens to transfer
     */
    function transferTokens(address receiver, uint256 amount) public returns (bool) {
        uint256 amountInTokens = amount * 10**18;
        return tokenTransfer.safeTransfer(IERC20(address(this)), msg.sender, receiver, amountInTokens);
    }

}