// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

interface IInvoiceRegistry {
    enum Status { Pending, Paid, Cancelled, Overdue }
    
    struct Invoice {
        uint256 id;
        address seller;
        address buyer;
        uint256 amountUSDC;
        uint256 dueDate;
        Status status;
        string invoiceRef;
    }

    function getInvoice(uint256 invoiceId) external view returns (Invoice memory);
    function markAsPaid(uint256 invoiceId, address buyer) external;
}

contract PaymentProcessor {
    address public owner;
    address public usdcToken;
    address public invoiceRegistry;
    address public feeCollector;
    uint256 public feeBasisPoints;

    event InvoicePaid(
        uint256 indexed invoiceId,
        address indexed buyer,
        address indexed seller,
        uint256 totalAmount,
        uint256 feeAmount,
        uint256 sellerAmount
    );
    event ConfigUpdated(string setting, address newValue);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(
        address _usdcToken,
        address _invoiceRegistry,
        address _feeCollector
    ) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_invoiceRegistry != address(0), "Invalid registry address");
        require(_feeCollector != address(0), "Invalid fee collector address");

        owner = msg.sender;
        usdcToken = _usdcToken;
        invoiceRegistry = _invoiceRegistry;
        feeCollector = _feeCollector;
        feeBasisPoints = 50;
    }

    function payInvoice(uint256 invoiceId) external {
        IInvoiceRegistry registry = IInvoiceRegistry(invoiceRegistry);
        IInvoiceRegistry.Invoice memory invoice = registry.getInvoice(invoiceId);

        require(invoice.status == IInvoiceRegistry.Status.Pending, "Invoice is not pending");
        require(invoice.dueDate >= block.timestamp, "Invoice is overdue");
        require(invoice.seller != address(0), "Invalid invoice");
        require(msg.sender != invoice.seller, "Seller cannot pay own invoice");

        uint256 totalAmount = invoice.amountUSDC;
        uint256 feeAmount = (totalAmount * feeBasisPoints) / 10000;
        uint256 sellerAmount = totalAmount - feeAmount;

        IERC20 usdc = IERC20(usdcToken);
        require(
            usdc.allowance(msg.sender, address(this)) >= totalAmount,
            "Insufficient USDC allowance"
        );

        require(
            usdc.transferFrom(msg.sender, address(this), totalAmount),
            "USDC transfer failed"
        );

        require(
            usdc.transfer(feeCollector, feeAmount),
            "Fee transfer failed"
        );

        require(
            usdc.transfer(invoice.seller, sellerAmount),
            "Seller transfer failed"
        );

        registry.markAsPaid(invoiceId, msg.sender);

        emit InvoicePaid(
            invoiceId,
            msg.sender,
            invoice.seller,
            totalAmount,
            feeAmount,
            sellerAmount
        );
    }

    function updateFeeCollector(address newFeeCollector) external onlyOwner {
        require(newFeeCollector != address(0), "Invalid address");
        feeCollector = newFeeCollector;
        emit ConfigUpdated("feeCollector", newFeeCollector);
    }

    function updateFeeBasisPoints(uint256 newFeeBasisPoints) external onlyOwner {
        require(newFeeBasisPoints <= 500, "Fee cannot exceed 5%");
        feeBasisPoints = newFeeBasisPoints;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
}
