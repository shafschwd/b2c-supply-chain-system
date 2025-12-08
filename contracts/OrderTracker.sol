// /contracts/OrderTracker.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OrderTracker
 * @dev Manages the immutable audit trail for the B2C Supply Chain DApp.
 * All critical status and transaction events are logged here.
 */
contract OrderTracker {

    // --- ENUM (Matches OrderStatus in TypeScript/PostgreSQL for clarity) ---
    enum EventType {
        ORDER_CREATED,
        STATUS_UPDATE,
        DELIVERY_CONFIRMED,
        PAYMENT_RELEASED
    }

    // --- EVENT (The immutable ledger entry read by the BlockchainViewer) ---
    // The event is indexed to allow for efficient filtering by the off-chain application.
    event OrderEvent(
        string indexed uniqueId,      // e.g., Order ID, Shipment ID (for easy search)
        EventType indexed eventType,  // Type of transaction/status update
        bytes32 dataHash,             // SHA-256 hash of the off-chain data (proof of integrity)
        address indexed sender,       // Address of the role executing the update (Buyer, Seller, Logistics)
        uint256 timestamp             // Block timestamp
    );

    // --- FUNCTIONS ---

    /**
     * @dev Records a critical event, such as a status change or order confirmation.
     * @param _uniqueId The ID of the affected entity (Order ID or Shipment ID).
     * @param _eventType The type of event occurring.
     * @param _dataHash Cryptographic hash of the off-chain data payload (e.g., status, location, amount).
     */
    function recordEvent(
        string memory _uniqueId,
        EventType _eventType,
        bytes32 _dataHash
    ) public {
        // The transaction sender is automatically recorded by 'msg.sender'.
        
        // Emit the event to the immutable ledger
        emit OrderEvent(
            _uniqueId,
            _eventType,
            _dataHash,
            msg.sender,
            block.timestamp
        );
    }
}