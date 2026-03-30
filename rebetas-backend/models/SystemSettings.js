const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    minWithdrawal: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
