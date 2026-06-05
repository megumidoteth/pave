const express = require("express");
const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");
const { query } = require("../db");
require("dotenv").config();

const router = express.Router();

// Step 1 — Get a message to sign
router.get("/nonce/:address", async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const nonce = Math.floor(Math.random() * 1000000).toString();
    const message = `Welcome to Pave!\n\nPlease sign this message to verify your wallet.\n\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;

    res.json({ message, nonce });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Step 2 — Verify signature and issue JWT
router.post("/verify", async (req, res) => {
  try {
    const { address, message, signature } = req.body;

    if (!address || !message || !signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Recover the address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Find or create user in database
    let result = await query(
      "SELECT * FROM users WHERE wallet_address = $1",
      [address.toLowerCase()]
    );

    let user;
    if (result.rows.length === 0) {
      // New user — create them
      result = await query(
        "INSERT INTO users (wallet_address) VALUES ($1) RETURNING *",
        [address.toLowerCase()]
      );
      user = result.rows[0];
      console.log("New user created:", address);
    } else {
      user = result.rows[0];
    }

    // Issue JWT token
    const token = jwt.sign(
      { userId: user.id, address: user.wallet_address },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        address: user.wallet_address,
        businessName: user.business_name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get current user profile
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      "SELECT * FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      address: user.wallet_address,
      businessName: user.business_name,
      email: user.email,
    });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
