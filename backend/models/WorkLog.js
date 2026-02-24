const mongoose = require("mongoose");

const workLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    hours: {
      type: Number,
      required: true,
      min: 0.25,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    billable: {
      type: Boolean,
      default: true,
    },
    billableAmount: {
      type: Number,
      default: 0,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkLog", workLogSchema);
