// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract DepositManager {
    // Structure for user deposits
    struct Deposit {
        uint256 amount;         // Amount of tokens deposited
        uint256 lockPeriod;     // Lock period in seconds
        uint256 depositTime;    // Timestamp of deposit
        uint256 interestRate;   // Annual interest rate in basis points (e.g., 500 = 5%)
        uint256 liquidityTokens;// Liquidity tokens received from pool (if applicable)
        bool withdrawn;         // Whether the deposit has been withdrawn
    }

    // Mapping of user address to their deposits
    mapping(address => Deposit[]) public userDeposits;

    // Events
    event Deposited(address indexed user, uint256 amount, uint256 lockPeriod, uint256 liquidityTokens);
    event Withdrawn(address indexed user, uint256 depositIndex, uint256 amount, uint256 interest);

    // Token interface (to be set by inheriting contract)
    IERC20 public token;

    constructor(address _token) {
        token = IERC20(_token);
    }


    function _recordDeposit(
        address user,
        uint256 amount,
        uint256 lockPeriod,
        uint256 interestRate,
        uint256 liquidityTokens
    ) internal {
        require(amount > 0, "Amount must be greater than 0");
        require(lockPeriod >= 30 days, "Minimum lock period is 30 days");

        Deposit memory newDeposit = Deposit({
            amount: amount,
            lockPeriod: lockPeriod,
            depositTime: block.timestamp,
            interestRate: interestRate,
            liquidityTokens: liquidityTokens,
            withdrawn: false
        });
        userDeposits[user].push(newDeposit);

        emit Deposited(user, amount, lockPeriod, liquidityTokens);
    }

    function _withdrawDeposit(address user, uint256 depositIndex) 
        internal returns (uint256 principal, uint256 interest) 
    {
        Deposit storage userDeposit = userDeposits[user][depositIndex];
        require(!userDeposit.withdrawn, "Deposit already withdrawn");
        require(block.timestamp >= userDeposit.depositTime + userDeposit.lockPeriod, "Lock period not ended");

        uint256 timeLocked = block.timestamp - userDeposit.depositTime;
        interest = (userDeposit.amount * userDeposit.interestRate * timeLocked) / (365 days * 10000);
        principal = userDeposit.amount;

        userDeposit.withdrawn = true;

        emit Withdrawn(user, depositIndex, principal, interest);
        return (principal, interest);
    }

    // View function to get deposit details
    function getDepositDetails(address user, uint256 depositIndex) 
        external view returns (uint256 amount, uint256 lockPeriod, uint256 depositTime, uint256 interestRate, uint256 liquidityTokens, bool withdrawn) 
    {
        Deposit memory userDeposit = userDeposits[user][depositIndex];
        return (userDeposit.amount, userDeposit.lockPeriod, userDeposit.depositTime, userDeposit.interestRate, userDeposit.liquidityTokens, userDeposit.withdrawn);
    }

    // Abstract functions to be implemented by inheriting contract
    function deposit(uint256 amount, uint256 lockPeriodInDays) external virtual;
    function withdraw(uint256 depositIndex) external virtual;
}