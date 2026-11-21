const mongoose = require("mongoose");

const AttributionSchema = new mongoose.Schema(
  {
    source: { type: String, default: "direct" },
    medium: { type: String, default: "" },
    campaign: { type: String, default: "" },
    campaignId: { type: String, default: "" },
    adSet: { type: String, default: "" },
    adSetId: { type: String, default: "" },
    ad: { type: String, default: "" },
    adId: { type: String, default: "" },
    referrer: { type: String, default: "" },
    landingPage: { type: String, default: "" },
    utmSource: { type: String, default: "" },
    utmMedium: { type: String, default: "" },
    utmCampaign: { type: String, default: "" },
    utmContent: { type: String, default: "" },
    utmTerm: { type: String, default: "" },
  },
  { _id: false },
);

const WebsiteVisitorSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    firstSeenAt: {
      type: Date,
      default: Date.now,
    },

    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    totalSessions: {
      type: Number,
      default: 0,
    },

    totalPageViews: {
      type: Number,
      default: 0,
    },

    firstTouch: {
      type: AttributionSchema,
      default: () => ({}),
    },

    lastTouch: {
      type: AttributionSchema,
      default: () => ({}),
    },

    country: { type: String, default: "" },
    deviceType: { type: String, default: "" },
    browser: { type: String, default: "" },
    operatingSystem: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

WebsiteVisitorSchema.index({ lastSeenAt: -1 });

module.exports = mongoose.model("WebsiteVisitor", WebsiteVisitorSchema);
