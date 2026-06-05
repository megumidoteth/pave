// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract InvoiceRegistry {
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

    uint256 private nextInvoiceId;
    mapping(uint256 => Invoice) private invoices;
    mapping(address => uint256[]) private sellerInvoices;

    event InvoiceCreated(
        uint256 indexed id,
        address indexed seller,
        uint256 amountUSDC,
        uint256 dueDate,
        string invoiceRef
    );
    event InvoicePaid(
        uint256 indexed id,
        address indexed buyer,
        uint256 amountUSDC
    );
    event InvoiceCancelled(uint256 indexed id, address indexed seller);
    event InvoiceMarkedOverdue(uint256 indexed id);

    modifier invoiceExists(uint256 invoiceId) {
        require(invoices[invoiceId].seller != address(0), "Invoice does not exist");
        _;
    }

    modifier onlySeller(uint256 invoiceId) {
        require(invoices[invoiceId].seller == msg.sender, "Not the invoice seller");
        _;
    }

    function createInvoice(
        uint256 amountUSDC,
        uint256 dueDate,
        string calldata invoiceRef
    ) external returns (uint256) {
        require(amountUSDC > 0, "Amount must be greater than zero");
        require(dueDate > block.timestamp, "Due date must be in the future");

        uint256 invoiceId = nextInvoiceId++;

        invoices[invoiceId] = Invoice({
            id: invoiceId,
            seller: msg.sender,
            buyer: address(0),
            amountUSDC: amountUSDC,
            dueDate: dueDate,
            status: Status.Pending,
            invoiceRef: invoiceRef
        });

        sellerInvoices[msg.sender].push(invoiceId);

        emit InvoiceCreated(invoiceId, msg.sender, amountUSDC, dueDate, invoiceRef);
        return invoiceId;
    }

    function markAsPaid(
        uint256 invoiceId,
        address buyer
    ) external invoiceExists(invoiceId) {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == Status.Pending, "Invoice is not pending");
        require(buyer != address(0), "Invalid buyer address");

        invoice.status = Status.Paid;
        invoice.buyer = buyer;

        emit InvoicePaid(invoiceId, buyer, invoice.amountUSDC);
    }

    function cancelInvoice(
        uint256 invoiceId
    ) external invoiceExists(invoiceId) onlySeller(invoiceId) {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == Status.Pending, "Can only cancel pending invoices");

        invoice.status = Status.Cancelled;
        emit InvoiceCancelled(invoiceId, msg.sender);
    }

    function markAsOverdue(
        uint256 invoiceId
    ) external invoiceExists(invoiceId) {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == Status.Pending, "Invoice is not pending");
        require(block.timestamp > invoice.dueDate, "Invoice is not yet overdue");

        invoice.status = Status.Overdue;
        emit InvoiceMarkedOverdue(invoiceId);
    }

    function getInvoice(
        uint256 invoiceId
    ) external view invoiceExists(invoiceId) returns (Invoice memory) {
        return invoices[invoiceId];
    }

    function getInvoicesBySeller(
        address seller
    ) external view returns (uint256[] memory) {
        return sellerInvoices[seller];
    }
}
