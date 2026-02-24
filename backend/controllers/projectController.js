const Project = require("../models/Project");
const { calculateProjectHours, calculateProjectEarnings } = require("../utils/billingService");

// Create new project
exports.createProject = async (req, res) => {
  try {
    const { clientId, name, description, hourlyRate, budget, startDate, endDate } = req.body;

    const project = await Project.create({
      userId: req.userId,
      clientId,
      name,
      description,
      hourlyRate,
      budget,
      startDate,
      endDate,
    });

    const populatedProject = await project.populate("clientId");
    res.status(201).json({ message: "Project created successfully", project: populatedProject });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.userId })
      .populate("clientId")
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get projects by client
exports.getProjectsByClient = async (req, res) => {
  try {
    const projects = await Project.find({
      userId: req.userId,
      clientId: req.params.clientId,
    })
      .populate("clientId")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single project with summary
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate("clientId");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Calculate live stats
    const totalHours = await calculateProjectHours(project._id);
    const totalEarnings = await calculateProjectEarnings(project._id);

    res.json({
      ...project.toObject(),
      totalHours,
      totalEarnings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const { name, description, hourlyRate, budget, status, startDate, endDate } = req.body;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, description, hourlyRate, budget, status, startDate, endDate },
      { new: true, runValidators: true }
    ).populate("clientId");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Project updated successfully", project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
