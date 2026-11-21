const mongoose = require("mongoose");

const WebsiteEventSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      index: true,
    },

    sessionId: {
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

    eventName: {
      type: String,
      required: true,
      index: true,
    },

    pageUrl: {
      type: String,
      default: "",
    },

    pagePath: {
      type: String,
      default: "",
      index: true,
    },

    pageTitle: {
      type: String,
      default: "",
    },

    referrer: {
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

    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmContent: String,
    utmTerm: String,

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

    eventData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

WebsiteEventSchema.index({ createdAt: -1 });
WebsiteEventSchema.index({ visitorId: 1, createdAt: -1 });
WebsiteEventSchema.index({ sessionId: 1, createdAt: -1 });
WebsiteEventSchema.index({ eventName: 1, createdAt: -1 });

module.exports = mongoose.model("WebsiteEvent", WebsiteEventSchema);
