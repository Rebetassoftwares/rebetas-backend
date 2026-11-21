const trackingConfig = {
  metaPixelId: import.meta.env.VITE_META_PIXEL_ID,
  ga4MeasurementId: import.meta.env.VITE_GA4_MEASUREMENT_ID,
  googleAdsId: import.meta.env.VITE_GOOGLE_ADS_ID,
  googleAdsConversionLabel: import.meta.env.VITE_GOOGLE_ADS_CONVERSION_LABEL,
  tiktokPixelId: import.meta.env.VITE_TIKTOK_PIXEL_ID,
  clarityId: import.meta.env.VITE_CLARITY_ID,
};

const FIRST_PARTY_TRACKING_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "")}/website-tracking/event`
  : null;

const VISITOR_STORAGE_KEY = "sunstreamers_analytics_visitor_id";
const SESSION_STORAGE_KEY = "sunstreamers_analytics_session_id";
const UTM_STORAGE_KEY = "sunstreamers_landing_utm";

let trackingInitialized = false;
let googleScriptLoaded = false;
let metaScriptLoaded = false;
let tiktokScriptLoaded = false;
let configuredGoogleIds = new Set();
let lastPageView = "";

function createTrackingId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateTrackingId(storage, key) {
  try {
    let id = storage.getItem(key);

    if (!id) {
      id = createTrackingId();
      storage.setItem(key, id);
    }

    return id;
  } catch {
    return createTrackingId();
  }
}

function getVisitorId() {
  return getOrCreateTrackingId(localStorage, VISITOR_STORAGE_KEY);
}

function getSessionId() {
  return getOrCreateTrackingId(sessionStorage, SESSION_STORAGE_KEY);
}

function readSavedUtm() {
  try {
    return JSON.parse(localStorage.getItem(UTM_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveUtmParams() {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);

  const trackingKeys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "utm_id",
    "fbclid",
    "gclid",
    "ttclid",
    "campaign_id",
    "adset_id",
    "ad_id",
  ];

  const hasTrackingParams = trackingKeys.some((key) => params.has(key));

  if (!hasTrackingParams) {
    return readSavedUtm();
  }

  const utmData = {};

  trackingKeys.forEach((key) => {
    utmData[key] = params.get(key) || "";
  });

  utmData.capturedAt = new Date().toISOString();

  try {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmData));
  } catch (error) {
    console.warn("Could not save campaign attribution:", error);
  }

  return utmData;
}

function getTrafficAttribution() {
  const params = new URLSearchParams(window.location.search);
  const saved = readSavedUtm();
  const referrer = document.referrer || "";

  const utmSource = params.get("utm_source") || saved.utm_source || "";

  const utmMedium = params.get("utm_medium") || saved.utm_medium || "";

  const utmCampaign = params.get("utm_campaign") || saved.utm_campaign || "";

  const utmContent = params.get("utm_content") || saved.utm_content || "";

  const utmTerm = params.get("utm_term") || saved.utm_term || "";

  let source = utmSource;
  let medium = utmMedium;

  if (!source && referrer) {
    try {
      const hostname = new URL(referrer).hostname.toLowerCase();

      if (hostname.includes("facebook.com") || hostname.includes("fb.com")) {
        source = "facebook";
        medium = "referral";
      } else if (hostname.includes("instagram.com")) {
        source = "instagram";
        medium = "referral";
      } else if (hostname.includes("tiktok.com")) {
        source = "tiktok";
        medium = "referral";
      } else if (hostname.includes("google.")) {
        source = "google";
        medium = "organic";
      } else if (
        hostname.includes("whatsapp.com") ||
        hostname.includes("wa.me")
      ) {
        source = "whatsapp";
        medium = "referral";
      } else {
        source = hostname;
        medium = "referral";
      }
    } catch {
      source = "referral";
      medium = "referral";
    }
  }

  if (!source) {
    source = "direct";
    medium = "none";
  }

  return {
    source,
    medium,
    campaign: utmCampaign,
    campaignId:
      params.get("campaign_id") ||
      params.get("utm_id") ||
      saved.campaign_id ||
      saved.utm_id ||
      "",
    adSet: utmTerm,
    adSetId: params.get("adset_id") || saved.adset_id || "",
    ad: utmContent,
    adId: params.get("ad_id") || saved.ad_id || "",
    referrer,
    landingPage: window.location.pathname,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
  };
}

function sanitizeEventData(parameters = {}) {
  const blockedKeyPattern =
    /email|phone|password|token|secret|authorization|fullname|first.?name|last.?name|address/i;

  const safeData = {};

  for (const [key, value] of Object.entries(parameters || {})) {
    if (blockedKeyPattern.test(key)) continue;

    if (
      value === null ||
      ["string", "number", "boolean"].includes(typeof value)
    ) {
      safeData[key] = typeof value === "string" ? value.slice(0, 500) : value;
    }
  }

  return safeData;
}

function sendFirstPartyEvent(eventName, parameters = {}) {
  if (typeof window === "undefined" || !FIRST_PARTY_TRACKING_URL) {
    return;
  }

  // Payment conversions must come from verified backend records.
  if (eventName === "Purchase" || eventName === "Subscribe") {
    return;
  }

  const allowedEvents = [
    "PageView",
    "ViewContent",
    "TutorialStart",
    "TutorialProgress",
    "TutorialComplete",
    "RegistrationAttempt",
    "CompleteRegistration",
    "Login",
    "InitiateCheckout",
    "Lead",
    "ButtonClick",
    "FormSubmit",
    "CustomEvent",
  ];

  let backendEventName = eventName;

  if (eventName === "TutorialStepView") {
    backendEventName = "TutorialProgress";
  }

  if (!allowedEvents.includes(backendEventName)) {
    backendEventName = "CustomEvent";
  }

  const payload = {
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    eventName: backendEventName,
    pageUrl: window.location.href,
    pagePath: `${window.location.pathname}${window.location.search}`,
    pageTitle: document.title,
    referrer: document.referrer || "",
    attribution: getTrafficAttribution(),
    eventData: {
      ...sanitizeEventData(parameters),
      ...(backendEventName === "CustomEvent"
        ? { originalEventName: String(eventName).slice(0, 100) }
        : {}),
    },
  };

  fetch(FIRST_PARTY_TRACKING_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((error) => {
    console.warn("First-party analytics request failed:", error);
  });
}

function ensureGoogleTagStub() {
  window.dataLayer = window.dataLayer || [];

  if (typeof window.gtag !== "function") {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }
}

function loadGoogleTags() {
  const ga4Id = trackingConfig.ga4MeasurementId;
  const adsId = trackingConfig.googleAdsId;

  if (!ga4Id && !adsId) return;

  const primaryId = ga4Id || adsId;

  ensureGoogleTagStub();

  if (!googleScriptLoaded) {
    const script = document.createElement("script");

    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(primaryId)}`;

    document.head.appendChild(script);
    googleScriptLoaded = true;
  }

  if (!window.__sunStreamersGtagInitialized) {
    window.gtag("js", new Date());
    window.__sunStreamersGtagInitialized = true;
  }

  if (ga4Id && !configuredGoogleIds.has(ga4Id)) {
    window.gtag("config", ga4Id, {
      send_page_view: false,
    });

    configuredGoogleIds.add(ga4Id);
  }

  if (adsId && !configuredGoogleIds.has(adsId)) {
    window.gtag("config", adsId, {
      send_page_view: false,
    });

    configuredGoogleIds.add(adsId);
  }
}

function loadMetaPixel() {
  const pixelId = trackingConfig.metaPixelId;

  if (!pixelId || metaScriptLoaded) return;

  if (!window.fbq) {
    const fbq = function () {
      fbq.callMethod
        ? fbq.callMethod.apply(fbq, arguments)
        : fbq.queue.push(arguments);
    };

    window.fbq = fbq;
    window._fbq = fbq;

    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];

    const script = document.createElement("script");

    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";

    document.head.appendChild(script);
  }

  window.fbq("init", pixelId);
  metaScriptLoaded = true;
}

function loadTikTokPixel() {
  const pixelId = trackingConfig.tiktokPixelId;

  if (!pixelId || tiktokScriptLoaded) return;

  if (!window.ttq) {
    const ttq = (window.ttq = []);

    ttq.methods = [
      "page",
      "track",
      "identify",
      "instances",
      "debug",
      "on",
      "off",
      "once",
      "ready",
      "alias",
      "group",
      "enableCookie",
      "disableCookie",
      "holdConsent",
      "revokeConsent",
      "grantConsent",
    ];

    ttq.setAndDefer = function (target, method) {
      target[method] = function () {
        target.push([method].concat(Array.prototype.slice.call(arguments)));
      };
    };

    for (let i = 0; i < ttq.methods.length; i++) {
      ttq.setAndDefer(ttq, ttq.methods[i]);
    }

    ttq.instance = function (id) {
      const instance = ttq._i[id] || [];

      for (let i = 0; i < ttq.methods.length; i++) {
        ttq.setAndDefer(instance, ttq.methods[i]);
      }

      return instance;
    };

    ttq.load = function (id) {
      const script = document.createElement("script");

      script.async = true;
      script.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(id)}&lib=ttq`;

      const firstScript = document.getElementsByTagName("script")[0];

      if (firstScript?.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }

      ttq._i = ttq._i || {};
      ttq._i[id] = [];
      ttq._t = ttq._t || {};
      ttq._t[id] = Date.now();
      ttq._o = ttq._o || {};
      ttq._o[id] = {};
    };
  }

  window.ttq.load(pixelId);
  tiktokScriptLoaded = true;
}

function loadClarity() {
  const clarityId = trackingConfig.clarityId;

  if (!clarityId || typeof window === "undefined" || window.clarity) {
    return;
  }

  (function (c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function () {
        (c[a].q = c[a].q || []).push(arguments);
      };

    t = l.createElement(r);
    t.async = true;
    t.src = "https://www.clarity.ms/tag/" + i;

    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", clarityId);
}

export function initializeTracking() {
  if (trackingInitialized || typeof window === "undefined") {
    return;
  }

  trackingInitialized = true;

  saveUtmParams();

  ensureGoogleTagStub();
  loadGoogleTags();
  loadMetaPixel();
  loadTikTokPixel();
  loadClarity();
}

export function trackPageView(pageUrl) {
  if (typeof window === "undefined") return;

  const url = pageUrl || window.location.href;

  if (lastPageView === url) return;

  lastPageView = url;

  saveUtmParams();
  sendFirstPartyEvent("PageView");

  if (trackingConfig.ga4MeasurementId) {
    loadGoogleTags();

    window.gtag?.("event", "page_view", {
      page_location: url,
      page_title: document.title,
      page_path: `${window.location.pathname}${window.location.search}`,
    });
  }

  if (trackingConfig.metaPixelId) {
    loadMetaPixel();
    window.fbq?.("track", "PageView");
  }

  if (trackingConfig.tiktokPixelId) {
    loadTikTokPixel();
    window.ttq?.page();
  }
}

const eventMappings = {
  ViewContent: {
    ga4: "view_item",
    meta: "ViewContent",
    metaType: "standard",
    tiktok: "ViewContent",
  },

  InitiateCheckout: {
    ga4: "begin_checkout",
    meta: "InitiateCheckout",
    metaType: "standard",
    tiktok: "InitiateCheckout",
  },

  Purchase: {
    ga4: "purchase",
    meta: "Purchase",
    metaType: "standard",
    tiktok: "CompletePayment",
  },

  Subscribe: {
    ga4: "subscribe",
    meta: "Subscribe",
    metaType: "standard",
    tiktok: "Subscribe",
  },

  CompleteRegistration: {
    ga4: "sign_up",
    meta: "CompleteRegistration",
    metaType: "standard",
    tiktok: "CompleteRegistration",
  },

  Lead: {
    ga4: "generate_lead",
    meta: "Lead",
    metaType: "standard",
    tiktok: "SubmitForm",
  },

  Login: {
    ga4: "login",
    meta: "Login",
    metaType: "custom",
    tiktok: "Login",
  },
};

export function trackEvent(eventName, parameters = {}) {
  const result = {
    ga4: false,
    meta: false,
    tiktok: false,
  };

  if (typeof window === "undefined") return result;

  sendFirstPartyEvent(eventName, parameters);

  const mapping = eventMappings[eventName] || {
    ga4: eventName,
    meta: eventName,
    metaType: "custom",
    tiktok: eventName,
  };

  if (trackingConfig.ga4MeasurementId) {
    loadGoogleTags();

    if (typeof window.gtag === "function") {
      window.gtag("event", mapping.ga4, parameters);
      result.ga4 = true;
    }
  }

  if (trackingConfig.metaPixelId) {
    loadMetaPixel();

    if (typeof window.fbq === "function") {
      if (mapping.metaType === "custom") {
        window.fbq("trackCustom", mapping.meta, parameters);
      } else {
        window.fbq("track", mapping.meta, parameters);
      }

      result.meta = true;
    }
  }

  if (trackingConfig.tiktokPixelId) {
    loadTikTokPixel();

    if (typeof window.ttq?.track === "function") {
      window.ttq.track(mapping.tiktok, parameters);
      result.tiktok = true;
    }
  }

  return result;
}

export function trackGoogleAdsConversion({
  value,
  currency = "NGN",
  transactionId,
} = {}) {
  if (
    !trackingConfig.googleAdsId ||
    !trackingConfig.googleAdsConversionLabel ||
    typeof window === "undefined"
  ) {
    return false;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    console.warn(
      "Google Ads conversion skipped: a valid positive transaction value is required.",
    );

    return false;
  }

  loadGoogleTags();

  if (typeof window.gtag !== "function") return false;

  window.gtag("event", "conversion", {
    send_to: `${trackingConfig.googleAdsId}/${trackingConfig.googleAdsConversionLabel}`,
    value: numericValue,
    currency,
    ...(transactionId ? { transaction_id: transactionId } : {}),
  });

  return true;
}
