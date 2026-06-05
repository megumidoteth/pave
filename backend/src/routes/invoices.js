const express = require("express");
const { query } = require("../db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Get all invoices for logged in business
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM invoices 
       WHERE seller_id = $1 
       ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single invoice by ID
router.get("/:id", async (req, res) => {
  try {
    const result = await query(
      `SELECT i.*, u.wallet_address as seller_address, u.business_name 
       FROM invoices i
       JOIN users u ON i.seller_id = u.id
       WHERE i.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get invoice by chain ID (for payment page)
router.get("/chain/:chainId", async (req, res) => {
  try {
    const result = await query(
      `SELECT i.*, u.wallet_address as seller_address, u.business_name 
       FROM invoices i
       JOIN users u ON i.seller_id = u.id
       WHERE i.chain_invoice_id = $1`,
      [req.params.chainId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create invoice record in DB after chain tx
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      chainInvoiceId,
      clientEmail,
      clientName,
      lineItems,
      amountUsdc,
      dueDate,
    } = req.body;

    if (!amountUsdc || !dueDate || !clientName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await query(
      `INSERT INTO invoices 
        (chain_invoice_id, seller_id, client_email, client_name, line_items, amount_usdc, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        chainInvoiceId,
        req.user.userId,
        clientEmail,
        clientName,
        JSON.stringify(lineItems || []),
        amountUsdc,
        dueDate,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark invoice as paid (called by event indexer)
router.patch("/:chainId/paid", async (req, res) => {
  try {
    const { txHash } = req.body;

    const result = await query(
      `UPDATE invoices 
       SET status = 'paid', tx_hash = $1, paid_at = now()
       WHERE chain_invoice_id = $2
       RETURNING *`,
      [txHash, req.params.chainId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Cancel invoice
router.patch("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `UPDATE invoices 
       SET status = 'cancelled'
       WHERE id = $1 AND seller_id = $2
       RETURNING *`,
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found or unauthorized" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
