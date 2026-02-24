const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Client = require("../models/Client");
const { authMiddleware, requireRoles } = require("../middlewares/auth");

// REGISTER
// Rule: Only the first user registered becomes ADMIN
// All subsequent users become STAFF by default
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hasAdmin = await User.exists({ role: "admin" });

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: hasAdmin ? "staff" : "admin", // Ensure only one admin
    });

    res.status(201).json({ message: "User registered successfully", userId: user._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (role && !["admin", "staff", "client"].includes(role)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (role && role !== user.role) {
      return res.status(401).json({ message: "Selected role does not match this account" });
    }

    // For client users, match email to Client record
    let clientId = user.clientId || null;
    if (user.role === "client" && !clientId) {
      const clientRecord = await Client.findOne({ email: user.email });
      if (clientRecord) {
        clientId = clientRecord._id;
        console.log(`[Auth] Client user ${user.email} matched to Client record: ${clientId}`);
      } else {
        console.log(`[Auth] Client user ${user.email} - no matching Client record found`);
      }
    } else if (user.role === "client" && clientId) {
      console.log(`[Auth] Client user ${user.email} already has clientId: ${clientId}`);
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, clientId },
      process.env.JWT_SECRET,
      {
      expiresIn: "7d",
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clientId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET PROFILE
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE PROFILE
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: LIST USERS
router.get("/users", authMiddleware, requireRoles("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: UPDATE USER ROLE
// Rules:
// - Can only assign roles: staff, client (never admin)
// - Cannot change own role
// - Cannot change admin user's role
router.put("/users/:id/role", authMiddleware, requireRoles("admin"), async (req, res) => {
  try {
    const { role } = req.body;
    
    // Prevent assigning admin role (single admin only)
    if (!["staff", "client"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Admin role cannot be assigned." });
    }

    // Prevent admin from changing own role
    if (req.params.id === req.userId) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    const existingUser = await User.findById(req.params.id).select("-password");
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Protect the admin user from role changes
    if (existingUser.role === "admin") {
      return res.status(400).json({ message: "Admin role cannot be changed" });
    }

    existingUser.role = role;
    await existingUser.save();

    res.json({ message: "User role updated", user: existingUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: DELETE USER
// Rules:
// - Cannot delete own account
// - Cannot delete the admin user (system owner)
router.delete("/users/:id", authMiddleware, requireRoles("admin"), async (req, res) => {
  try {
    if (req.params.id === req.userId) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "The admin user cannot be deleted" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN/STAFF: CREATE CLIENT PORTAL USER
router.post("/portal-users", authMiddleware, requireRoles("admin", "staff"), async (req, res) => {
  try {
    const { clientId, name, email, password } = req.body;

    if (!clientId || !name || !email || !password) {
      return res.status(400).json({ message: "clientId, name, email and password are required" });
    }

    const client = await Client.findOne({ _id: clientId, userId: req.userId });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "client",
      clientId,
    });

    res.status(201).json({
      message: "Client portal user created",
      user: { id: user._id, name: user.name, email: user.email, role: user.role, clientId },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

