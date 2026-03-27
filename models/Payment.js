const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    provider: {
      type: String,
      enum: ["paystack", "flutterwave"],
      required: true,
    },

    reference: {
      type: String,
      required: true,
      unique: true,
    },

    providerTransactionId: {
      type: String,
      default: null,
    },

    plan: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      required: true,
    },

    country: {
      type: String,
      required: true,
    },

    currency: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Payment", paymentSchema);
