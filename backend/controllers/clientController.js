const Client = require("../models/Client");

// Create new client
exports.createClient = async (req, res) => {
  try {
    const { name, email, company, phone, billingRate, address } = req.body;

    const existingClient = await Client.findOne({ email, userId: req.userId });
    if (existingClient) {
      return res.status(400).json({ message: "Client already exists" });
    }

    const client = await Client.create({
      userId: req.userId,
      name,
      email,
      company,
      phone,
      billingRate,
      address,
    });

    res.status(201).json({ message: "Client created successfully", client });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all clients for user
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single client
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update client
exports.updateClient = async (req, res) => {
  try {
    const { name, email, company, phone, billingRate, address, status } = req.body;

    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, email, company, phone, billingRate, address, status },
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json({ message: "Client updated successfully", client });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete client
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
