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
    const filter = req.userRole === "client" ? { userId: req.userId } : {};
    const clients = await Client.find(filter).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single client
exports.getClientById = async (req, res) => {
  try {
    const query = req.userRole === "client"
      ? { _id: req.params.id, userId: req.userId }
      : { _id: req.params.id };
    const client = await Client.findOne(query);

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

    const query = req.userRole === "client"
      ? { _id: req.params.id, userId: req.userId }
      : { _id: req.params.id };
    const client = await Client.findOneAndUpdate(
      query,
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
    const query = req.userRole === "client"
      ? { _id: req.params.id, userId: req.userId }
      : { _id: req.params.id };
    const client = await Client.findOneAndDelete(query);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
