const WorkLog = require("../models/WorkLog");
const Project = require("../models/Project");
const { calculateBillableAmount } = require("../utils/billingService");

// Create work log
exports.createWorkLog = async (req, res) => {
  try {
    const { projectId, clientId, date, hours, description, billable } = req.body;

    const projectQuery = req.userRole === "client"
      ? { _id: projectId, userId: req.userId }
      : { _id: projectId };
    const project = await Project.findOne(projectQuery);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const billableAmount = billable ? calculateBillableAmount(hours, project.hourlyRate) : 0;

    const workLog = await WorkLog.create({
      userId: req.userId,
      projectId,
      clientId,
      date,
      hours,
      description,
      billable,
      billableAmount,
    });

    const populatedLog = await workLog.populate(["projectId", "clientId"]);
    res.status(201).json({ message: "Work log created successfully", workLog: populatedLog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all work logs
exports.getWorkLogs = async (req, res) => {
  try {
    const { projectId, clientId, startDate, endDate, billable } = req.query;

    const filter = req.userRole === "client" ? { clientId: req.clientId } : {};
    if (projectId) filter.projectId = projectId;
    if (clientId && req.userRole !== "client") filter.clientId = clientId;
    if (billable !== undefined) filter.billable = billable === "true";

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const workLogs = await WorkLog.find(filter)
      .populate(["projectId", "clientId"])
      .sort({ date: -1 });

    res.json(workLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single work log
exports.getWorkLogById = async (req, res) => {
  try {
    const query = req.userRole === "client"
      ? { _id: req.params.id, userId: req.userId }
      : { _id: req.params.id };
    const workLog = await WorkLog.findOne(query).populate(["projectId", "clientId"]);

    if (!workLog) {
      return res.status(404).json({ message: "Work log not found" });
    }

    res.json(workLog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update work log
exports.updateWorkLog = async (req, res) => {
  try {
    const { date, hours, description, billable } = req.body;

    const query = req.userRole === "client"
      ? { _id: req.params.id, userId: req.userId }
      : { _id: req.params.id };
    const workLog = await WorkLog.findOne(query);

    if (!workLog) {
      return res.status(404).json({ message: "Work log not found" });
    }

    if (workLog.invoiceId) {
      return res.status(400).json({ message: "Cannot edit work log that is already invoiced" });
    }

    const project = await Project.findById(workLog.projectId);
    const billableAmount = billable ? calculateBillableAmount(hours, project.hourlyRate) : 0;

    const updated = await WorkLog.findByIdAndUpdate(
      req.params.id,
      { date, hours, description, billable, billableAmount },
      { new: true, runValidators: true }
    ).populate(["projectId", "clientId"]);

    res.json({ message: "Work log updated successfully", workLog: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete work log
exports.deleteWorkLog = async (req, res) => {
  try {
    const query = req.userRole === "client"
      ? { _id: req.params.id, userId: req.userId }
      : { _id: req.params.id };
    const workLog = await WorkLog.findOne(query);

    if (!workLog) {
      return res.status(404).json({ message: "Work log not found" });
    }

    if (workLog.invoiceId) {
      return res.status(400).json({ message: "Cannot delete work log that is already invoiced" });
    }

    await WorkLog.findByIdAndDelete(req.params.id);
    res.json({ message: "Work log deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
