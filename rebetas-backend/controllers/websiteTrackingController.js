const crypto = require("crypto");

const WebsiteEvent = require("../models/WebsiteEvent");
const WebsiteVisitor = require("../models/WebsiteVisitor");
const WebsiteSession = require("../models/WebsiteSession");

const ALLOWED_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "TutorialStart",
  "TutorialProgress",
  "TutorialComplete",
  "RegistrationAttempt",
  "CompleteRegistration",
  "Login",
  "InitiateCheckout",
  "Subscribe",
  "Purchase",
  "Lead",
  "ButtonClick",
  "FormSubmit",
  "CustomEvent",
]);

const cleanString = (value, maxLength = 500) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

function getDeviceInfo(userAgent = "") {
  const ua = userAgent.toLowerCase();

  let deviceType = "desktop";

  if (/mobile|android|iphone|ipod/.test(ua)) {
    deviceType = "mobile";
  } else if (/ipad|tablet/.test(ua)) {
    deviceType = "tablet";
  }

  let browser = "Other";

  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("opr/")) browser = "Opera";
  else if (ua.includes("chrome/")) browser = "Chrome";
  else if (ua.includes("firefox/")) browser = "Firefox";
  else if (ua.includes("safari/")) browser = "Safari";

  let operatingSystem = "Other";

  if (ua.includes("windows")) operatingSystem = "Windows";
  else if (ua.includes("android")) operatingSystem = "Android";
  else if (/iphone|ipad|ipod/.test(ua)) operatingSystem = "iOS";
  else if (ua.includes("mac os")) operatingSystem = "macOS";
  else if (ua.includes("linux")) operatingSystem = "Linux";

  return { deviceType, browser, operatingSystem };
}

function getAttribution(data) {
  const params = data.attribution || {};

  const referrer = cleanString(data.referrer, 1000);

  let source = cleanString(params.utmSource || params.source, 150);

  if (!source && referrer) {
    try {
      const hostname = new URL(referrer).hostname.toLowerCase();

      if (hostname.includes("facebook")) source = "facebook";
      else if (hostname.includes("instagram")) source = "instagram";
      else if (hostname.includes("tiktok")) source = "tiktok";
      else if (hostname.includes("google")) source = "google";
      else if (hostname.includes("whatsapp")) source = "whatsapp";
      else source = hostname;
    } catch {
      source = "referral";
    }
  }

  if (!source) source = "direct";

  return {
    source,
    medium: cleanString(params.utmMedium || params.medium, 150),
    campaign: cleanString(params.utmCampaign || params.campaign, 250),
    campaignId: cleanString(params.campaignId, 150),
    adSet: cleanString(params.adSet, 250),
    adSetId: cleanString(params.adSetId, 150),
    ad: cleanString(params.ad, 250),
    adId: cleanString(params.adId, 150),
    referrer,
    landingPage: cleanString(data.pagePath, 1000),
    utmSource: cleanString(params.utmSource, 150),
    utmMedium: cleanString(params.utmMedium, 150),
    utmCampaign: cleanString(params.utmCampaign, 250),
    utmContent: cleanString(params.utmContent, 250),
    utmTerm: cleanString(params.utmTerm, 250),
  };
}

exports.trackWebsiteEvent = async (req, res) => {
  try {
    const data = req.body || {};

    // Analytics consent is required.
    if (data.analyticsConsent !== true) {
      return res.status(403).json({
        success: false,
        message: "Analytics consent required",
      });
    }

    const visitorId = cleanString(data.visitorId, 100);
    const sessionId = cleanString(data.sessionId, 100);
    const eventName = cleanString(data.eventName, 80);

    if (!visitorId || !sessionId || !eventName) {
      return res.status(400).json({
        success: false,
        message: "Visitor ID, session ID and event name are required",
      });
    }

    if (
      !/^[a-zA-Z0-9_-]+$/.test(visitorId) ||
      !/^[a-zA-Z0-9_-]+$/.test(sessionId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid visitor or session ID",
      });
    }

    if (!ALLOWED_EVENTS.has(eventName)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported tracking event",
      });
    }

    const now = new Date();
    const pageUrl = cleanString(data.pageUrl, 2000);
    const pagePath = cleanString(data.pagePath, 1000);
    const pageTitle = cleanString(data.pageTitle, 300);
    const referrer = cleanString(data.referrer, 1000);

    const attribution = getAttribution({
      ...data,
      pagePath,
      referrer,
    });

    const device = getDeviceInfo(req.headers["user-agent"] || "");

    // Preserve the original attribution while updating the latest touch.
    let visitor = await WebsiteVisitor.findOne({ visitorId });

    if (!visitor) {
      visitor = await WebsiteVisitor.create({
        visitorId,
        firstSeenAt: now,
        lastSeenAt: now,
        totalSessions: 0,
        totalPageViews: 0,
        firstTouch: attribution,
        lastTouch: attribution,
        ...device,
      });
    } else {
      visitor.lastSeenAt = now;
      visitor.lastTouch = attribution;

      visitor.deviceType = device.deviceType;
      visitor.browser = device.browser;
      visitor.operatingSystem = device.operatingSystem;

      await visitor.save();
    }

    // Find or create the current session.
    let session = await WebsiteSession.findOne({ sessionId });

    if (!session) {
      session = await WebsiteSession.create({
        sessionId,
        visitorId,
        startedAt: now,
        lastActivityAt: now,
        landingPage: pagePath,
        source: attribution.source,
        medium: attribution.medium,
        campaign: attribution.campaign,
        campaignId: attribution.campaignId,
        adSet: attribution.adSet,
        adSetId: attribution.adSetId,
        ad: attribution.ad,
        adId: attribution.adId,
        referrer,
        ...device,
      });

      visitor.totalSessions += 1;
    }

    session.lastActivityAt = now;
    session.isActive = true;
    session.endedAt = null;
    session.eventCount += 1;

    if (eventName === "PageView") {
      session.pageViews += 1;
      session.exitPage = pagePath;
      visitor.totalPageViews += 1;
    }

    await Promise.all([session.save(), visitor.save()]);

    // Store the individual event.
    const event = await WebsiteEvent.create({
      visitorId,
      sessionId,
      eventName,
      pageUrl,
      pagePath,
      pageTitle,
      referrer,
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      campaignId: attribution.campaignId,
      adSet: attribution.adSet,
      adSetId: attribution.adSetId,
      ad: attribution.ad,
      adId: attribution.adId,
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      utmContent: attribution.utmContent,
      utmTerm: attribution.utmTerm,
      deviceType: device.deviceType,
      browser: device.browser,
      operatingSystem: device.operatingSystem,
      eventData:
        data.eventData && typeof data.eventData === "object"
          ? data.eventData
          : {},
    });

    return res.status(201).json({
      success: true,
      message: "Website activity recorded",
      eventId: event._id,
    });
  } catch (error) {
    console.error("Website tracking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to record website activity",
    });
  }
};
