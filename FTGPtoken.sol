// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./currConverter.sol";
import "./tokenTransfer.sol";

contract FTGPtoken is ERC20, currConverter, Ownable {
    uint256 public constant TOKEN_PRICE_IN_USD = 1 * 10**8; // 1 FTGP = $1
    uint256 public constant ETH_TO_USD_RATE = 3000 * 10**8; // $3000
    uint256 public constant LTV_RATIO = 40; // 40%
    uint256 public constant INTEREST_RATE = 12; // 12% per year
    uint256 public constant LOAN_DURATION = 12 * 30 days; // 12 months

    struct LoanInfo {
        uint256 collateralAmountInETH;
        uint256 loanAmountInFTGP;
        uint256 timestamp;
        uint256 repaymentDue;
        uint256 monthlyInstallment;
        uint256 repaidAmount;
        address borrower;
    }

    mapping(address => LoanInfo) public userLoans;
    mapping(address => mapping(string => uint256)) public currencyLockedBalances;

    event LoanIssued(address indexed borrower, uint256 collateralETH, uint256 loanFTGP, uint256 timestamp);
    event LoanRepaid(address indexed borrower, uint256 totalRepaid, uint256 timestamp);

    constructor() 
        ERC20("FTGPtoken", "FTGP") 
        currConverter(address(this))
        Ownable(msg.sender)
    {}

    function setPriceFeed(string memory currency, address priceFeedAddress) public onlyOwner override {
        priceFeeds[currency] = AggregatorV3Interface(priceFeedAddress);
    }

    function getRateForCurrency(string memory currency) public view returns (uint256) {
        return getExchangeRate(currency);
    }

    function previewConversion(string memory fromCurrency, string memory toCurrency, uint256 amount)
        public view returns (uint256 displayAmount) 
    {
        displayAmount = calculateConversion(fromCurrency, toCurrency, amount);
        return displayAmount;
    }

    function convertAndMint(string memory fromCurrency, uint256 amount) public {
        uint256 tokenAmount = convert(fromCurrency, amount);
        require(tokenAmount > 0, "Invalid token amount");
        _mint(msg.sender, tokenAmount);
        emit Converted(msg.sender, fromCurrency, amount, tokenAmount);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function getTotalSupplyInTokens() public view returns (uint256) {
        return totalSupply() / (10 ** decimals());
    }

    function getBalanceOfAccount(address account) public view returns (uint256) {
        return balanceOf(account) / (10 ** decimals());
    }

    function getPriceFeedAddress(string memory currency) public view returns (address) {
        return address(priceFeeds[currency]);
    }

    function transferTokens(address receiver, uint256 amount) public returns (bool) {
        uint256 amountInTokens = amount * 10**18;
        return tokenTransfer.safeTransfer(IERC20(address(this)), msg.sender, receiver, amountInTokens);
    }

    function getLoan() public payable {
        require(msg.value > 0, "Collateral must be greater than 0");
        require(userLoans[msg.sender].loanAmountInFTGP == 0, "Loan already exists");

        uint256 collateralInETH = msg.value;
        uint256 collateralInUSD = (collateralInETH * ETH_TO_USD_RATE) / 1 ether;
        uint256 loanAmountInUSD = (collateralInUSD * LTV_RATIO) / 100;
        uint256 loanAmountInFTGP = loanAmountInUSD * 10**decimals();

        // Calculate repayment details
        uint256 interest = (loanAmountInFTGP * INTEREST_RATE) / 100;
        uint256 totalRepayment = loanAmountInFTGP + interest;
        uint256 monthlyRepayment = totalRepayment / 12;

        _mint(msg.sender, loanAmountInFTGP);

        userLoans[msg.sender] = LoanInfo({
            collateralAmountInETH: collateralInETH,
            loanAmountInFTGP: loanAmountInFTGP,
            timestamp: block.timestamp,
            repaymentDue: totalRepayment,
            monthlyInstallment: monthlyRepayment,
            repaidAmount: 0,
            borrower: msg.sender
        });

        emit LoanIssued(msg.sender, collateralInETH, loanAmountInFTGP, block.timestamp);
    }

    function calculateRepaymentAmounts(address borrower) external view returns (uint256 monthly, uint256 total) {
        LoanInfo memory loan = userLoans[borrower];
        require(loan.loanAmountInFTGP > 0, "No active loan");

        return (loan.monthlyInstallment, loan.repaymentDue);
    }

    function convertAndRepay(string memory fromCurrency, uint256 amountInCurrency) public {
    LoanInfo storage loan = userLoans[msg.sender];
    require(loan.loanAmountInFTGP > 0, "No active loan");

    uint256 tokenAmount = convert(fromCurrency, amountInCurrency);
    require(tokenAmount > 0, "Conversion failed or zero amount");

    _mint(address(this), tokenAmount);
    loan.repaidAmount += tokenAmount;

    _burn(address(this), tokenAmount); // Burn only what was just minted

    if (loan.repaidAmount >= loan.repaymentDue) {
        uint256 collateral = loan.collateralAmountInETH;
        delete userLoans[msg.sender];
        payable(msg.sender).transfer(collateral);
        emit LoanRepaid(msg.sender, loan.repaidAmount, block.timestamp);
    }
}

}
