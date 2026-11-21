const mongoose = require("mongoose");

const WebsiteSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    visitorId: {
      type: String,
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    endedAt: {
      type: Date,
      default: null,
    },

    durationSeconds: {
      type: Number,
      default: 0,
    },

    pageViews: {
      type: Number,
      default: 0,
    },

    eventCount: {
      type: Number,
      default: 0,
    },

    landingPage: {
      type: String,
      default: "",
    },

    exitPage: {
      type: String,
      default: "",
    },

    source: {
      type: String,
      default: "direct",
      index: true,
    },

    medium: {
      type: String,
      default: "",
    },

    campaign: {
      type: String,
      default: "",
      index: true,
    },

    campaignId: {
      type: String,
      default: "",
    },

    adSet: {
      type: String,
      default: "",
    },

    adSetId: {
      type: String,
      default: "",
    },

    ad: {
      type: String,
      default: "",
    },

    adId: {
      type: String,
      default: "",
    },

    referrer: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "",
    },

    deviceType: {
      type: String,
      default: "",
    },

    browser: {
      type: String,
      default: "",
    },

    operatingSystem: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

WebsiteSessionSchema.index({ visitorId: 1, startedAt: -1 });
WebsiteSessionSchema.index({ startedAt: -1 });
WebsiteSessionSchema.index({ isActive: 1, lastActivityAt: -1 });

module.exports = mongoose.model("WebsiteSession", WebsiteSessionSchema);
