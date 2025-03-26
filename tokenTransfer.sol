// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title tokenTransfer
 * @dev Library for handling safe token transfers with balance verification
 */
library tokenTransfer {
    // Event to log successful transfers
    event TransferRequested(address indexed from, address indexed to, uint256 amount);

    /**
     * @dev Verifies if the sender has enough tokens and initiates a transfer
     * @param token The ERC20 token contract instance (FTGPtoken in this case)
     * @param sender The address initiating the transfer
     * @param receiver The address receiving the tokens
     * @param amount The amount of tokens to transfer (in wei, i.e., 18 decimals)
     * @return bool Returns true if the transfer is successful
     */
    function safeTransfer(
        IERC20 token,
        address sender,
        address receiver,
        uint256 amount
    ) internal returns (bool) {
        require(sender != address(0), "TransferLib: Sender cannot be zero address");
        require(receiver != address(0), "TransferLib: Receiver cannot be zero address");
        require(amount > 0, "TransferLib: Amount must be greater than zero");

        // Check if sender has enough balance
        uint256 senderBalance = token.balanceOf(sender);
        require(senderBalance >= amount, "TransferLib: Insufficient balance");

        // Check allowance (if called by a contract, sender must approve this contract)
        uint256 allowance = token.allowance(sender, address(this));
        require(allowance >= amount, "TransferLib: Insufficient allowance");

        // Perform the transfer
        bool success = token.transferFrom(sender, receiver, amount);
        require(success, "TransferLib: Transfer failed");

        emit TransferRequested(sender, receiver, amount);
        return true;
    }

    /**
     * @dev Helper function to get the balance of an account (in token units, not wei)
     * @param token The ERC20 token contract instance
     * @param account The address to check
     * @return uint256 The balance in token units (adjusted for decimals)
     */
    function getBalance(
        IERC20 token,
        address account,
        uint8 decimals
    ) internal view returns (uint256) {
        return token.balanceOf(account) / (10 ** decimals); // Pass decimals as parameter
    }
}