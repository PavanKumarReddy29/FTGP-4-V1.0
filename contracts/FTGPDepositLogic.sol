// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract FTGPDepositLogic {
    IERC20 internal ftgpToken;

    struct Deposit {
        uint256 amount;
        uint256 startTime;
        uint256 lockPeriod; // 0 for flexible deposits
        bool withdrawn;
    }

    mapping(address => Deposit[]) internal userDeposits;

    uint256 internal openInterestRate = 3; // 3% annual
    uint256 public constant MIN_LOCK_PERIOD = 30 days;

    mapping(uint256 => uint256) internal lockupRates; // lock period (seconds) => interest rate %

    /// @notice Initializes FTGP token address and sets default lockup rates
    function _initDepositLogic(address _ftgpToken) internal {
        ftgpToken = IERC20(_ftgpToken);

        // Example lock periods and rates
        lockupRates[30 days] = 3;
        lockupRates[90 days] = 5;
        lockupRates[180 days] = 8;
        lockupRates[365 days] = 12;
    }

    // ========== USER INTERACTIONS ==========

    function openDeposit(uint256 amount) public {
        require(amount > 0, "Amount must be greater than 0");

        ftgpToken.transferFrom(msg.sender, address(this), amount);

        userDeposits[msg.sender].push(Deposit({
            amount: amount,
            startTime: block.timestamp,
            lockPeriod: 0,
            withdrawn: false
        }));
    }

    function lockupDeposit(uint256 amount, uint256 period) public {
        require(amount > 0, "Amount must be greater than 0");
        require(lockupRates[period] > 0, "Invalid lockup period");

        ftgpToken.transferFrom(msg.sender, address(this), amount);

        userDeposits[msg.sender].push(Deposit({
            amount: amount,
            startTime: block.timestamp,
            lockPeriod: period,
            withdrawn: false
        }));
    }

    function withdraw(uint256 index) public {
        require(index < userDeposits[msg.sender].length, "Invalid index");

        Deposit storage dep = userDeposits[msg.sender][index];
        require(!dep.withdrawn, "Already withdrawn");

        if (dep.lockPeriod > 0) {
            require(block.timestamp >= dep.startTime + dep.lockPeriod, "Lockup not ended");
        }

        uint256 interest = _calculateInterest(dep);
        uint256 total = dep.amount + interest;

        dep.withdrawn = true;
        ftgpToken.transfer(msg.sender, total);
    }

    // ========== INTEREST ==========

    function calculateInterestForDeposit(address user, uint256 index) public view returns (uint256) {
        require(index < userDeposits[user].length, "Invalid index");

        Deposit memory dep = userDeposits[user][index];
        if (dep.withdrawn) return 0;

        return _calculateInterest(dep);
    }

    function calculateInterest(address user) public view returns (uint256 totalInterest) {
        Deposit[] memory deposits = userDeposits[user];

        for (uint256 i = 0; i < deposits.length; i++) {
            if (!deposits[i].withdrawn) {
                totalInterest += _calculateInterest(deposits[i]);
            }
        }
    }

    function _calculateInterest(Deposit memory dep) internal view returns (uint256) {
        uint256 rate = dep.lockPeriod > 0 ? lockupRates[dep.lockPeriod] : openInterestRate;
        uint256 duration = block.timestamp - dep.startTime;
        return (dep.amount * rate * duration) / (100 * 365 days);
    }

    // ========== VIEW FUNCTIONS ==========

    // Get a single deposit by index
    function getUserDeposit(address user, uint256 index) public view returns (
        uint256 amount,
        uint256 startTime,
        uint256 lockPeriod,
        bool withdrawn
    ) {
        Deposit storage dep = userDeposits[user][index];
        return (dep.amount, dep.startTime, dep.lockPeriod, dep.withdrawn);
    }

    // Get all deposits for a user
    function getAllUserDeposits(address user) public view returns (
        uint256[] memory indexes,
        uint256[] memory amounts,
        uint256[] memory startTimes,
        uint256[] memory lockPeriods,
        bool[] memory withdrawnFlags
    ) {
        uint256 length = userDeposits[user].length;

        indexes = new uint256[](length);
        amounts = new uint256[](length);
        startTimes = new uint256[](length);
        lockPeriods = new uint256[](length);
        withdrawnFlags = new bool[](length);

        for (uint256 i = 0; i < length; i++) {
            Deposit storage dep = userDeposits[user][i];
            indexes[i] = i;
            amounts[i] = dep.amount;
            startTimes[i] = dep.startTime;
            lockPeriods[i] = dep.lockPeriod;
            withdrawnFlags[i] = dep.withdrawn;
        }
    }

    // Get total number of deposits for a user
    function getDepositCount(address user) public view returns (uint256) {
        return userDeposits[user].length;
    }

    // Get interest for a specific deposit
    function interestForDepositCalculation(address user, uint256 index) public view returns (uint256) {
        require(index < userDeposits[user].length, "Invalid index");

        Deposit memory dep = userDeposits[user][index];
        if (dep.withdrawn) return 0;

        return _calculateInterest(dep);
    }

    // Get all unwithdrawn (active) deposits for a user
    function getActiveDeposits(address user) public view returns (
        uint256[] memory indexes,
        uint256[] memory amounts,
        uint256[] memory startTimes,
        uint256[] memory lockPeriods
    ) {
        uint256 count = 0;

        // First pass: count active deposits
        for (uint256 i = 0; i < userDeposits[user].length; i++) {
            if (!userDeposits[user][i].withdrawn) {
                count++;
            }
        }

        // Init return arrays
        indexes = new uint256[](count);
        amounts = new uint256[](count);
        startTimes = new uint256[](count);
        lockPeriods = new uint256[](count);

        // Second pass: fill in the arrays
        uint256 j = 0;
        for (uint256 i = 0; i < userDeposits[user].length; i++) {
            if (!userDeposits[user][i].withdrawn) {
                indexes[j] = i;
                amounts[j] = userDeposits[user][i].amount;
                startTimes[j] = userDeposits[user][i].startTime;
                lockPeriods[j] = userDeposits[user][i].lockPeriod;
                j++;
            }
        }
    }

    // ========== ADMIN ==========

    function _setOpenInterestRate(uint256 newRate) internal {
        openInterestRate = newRate;
    }

    function _setLockupRate(uint256 period, uint256 rate) internal {
        require(period >= MIN_LOCK_PERIOD, "Too short");
        lockupRates[period] = rate;
    }

    function _removeLockupPeriod(uint256 period) internal {
        delete lockupRates[period];
    }
}