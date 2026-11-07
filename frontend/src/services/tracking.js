const CONSENT_STORAGE_KEY = "sunstreamers_tracking_consent";

const trackingConfig = {
  metaPixelId: import.meta.env.VITE_META_PIXEL_ID,
  ga4MeasurementId: import.meta.env.VITE_GA4_MEASUREMENT_ID,
  googleAdsId: import.meta.env.VITE_GOOGLE_ADS_ID,
  googleAdsConversionLabel: import.meta.env.VITE_GOOGLE_ADS_CONVERSION_LABEL,
  tiktokPixelId: import.meta.env.VITE_TIKTOK_PIXEL_ID,
};

let currentConsent = {
  analytics: false,
  advertising: false,
};

let trackingInitialized = false;
let googleScriptLoaded = false;
let metaScriptLoaded = false;
let tiktokScriptLoaded = false;

let configuredGoogleIds = new Set();
let lastPageView = "";

function getSavedConsent() {
  try {
    const saved = localStorage.getItem(CONSENT_STORAGE_KEY);

    if (!saved) return null;

    const parsed = JSON.parse(saved);

    if (
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.advertising !== "boolean"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getTrackingConsent() {
  return { ...currentConsent };
}

export function hasTrackingConsentChoice() {
  return getSavedConsent() !== null;
}

function ensureGoogleTagStub() {
  window.dataLayer = window.dataLayer || [];

  if (typeof window.gtag !== "function") {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }
}

function updateGoogleConsent() {
  if (typeof window.gtag !== "function") return;

  window.gtag("consent", "update", {
    analytics_storage: currentConsent.analytics ? "granted" : "denied",
    ad_storage: currentConsent.advertising ? "granted" : "denied",
    ad_user_data: currentConsent.advertising ? "granted" : "denied",
    ad_personalization: currentConsent.advertising ? "granted" : "denied",
  });
}

function loadGoogleTags() {
  const ga4Id = trackingConfig.ga4MeasurementId;
  const adsId = trackingConfig.googleAdsId;

  const shouldLoadGA4 = currentConsent.analytics && Boolean(ga4Id);
  const shouldLoadAds = currentConsent.advertising && Boolean(adsId);

  if (!shouldLoadGA4 && !shouldLoadAds) return;

  // Prefer GA4 when analytics consent is available.
  // Otherwise, load using the Google Ads ID.
  const primaryId = shouldLoadGA4 ? ga4Id : adsId;

  if (!primaryId) return;

  ensureGoogleTagStub();

  if (!googleScriptLoaded) {
    const script = document.createElement("script");

    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      primaryId,
    )}`;

    document.head.appendChild(script);
    googleScriptLoaded = true;
  }

  // Initialize gtag only once for this page session.
  if (!window.__sunStreamersGtagInitialized) {
    window.gtag("js", new Date());
    window.__sunStreamersGtagInitialized = true;
  }

  if (shouldLoadGA4 && !configuredGoogleIds.has(ga4Id)) {
    window.gtag("config", ga4Id, {
      send_page_view: false,
    });

    configuredGoogleIds.add(ga4Id);
  }

  if (shouldLoadAds && !configuredGoogleIds.has(adsId)) {
    window.gtag("config", adsId, {
      send_page_view: false,
    });

    configuredGoogleIds.add(adsId);
  }

  updateGoogleConsent();
}

function loadMetaPixel() {
  const pixelId = trackingConfig.metaPixelId;

  if (!currentConsent.advertising || !pixelId || metaScriptLoaded) {
    return;
  }

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

  if (!currentConsent.advertising || !pixelId || tiktokScriptLoaded) {
    return;
  }

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
      script.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(
        id,
      )}&lib=ttq`;

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

export function initializeTracking() {
  if (trackingInitialized || typeof window === "undefined") return;

  trackingInitialized = true;

  const savedConsent = getSavedConsent();

  currentConsent = savedConsent || {
    analytics: false,
    advertising: false,
  };

  ensureGoogleTagStub();

  // Set default consent before any Google tags are loaded.
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });

  window.gtag("js", new Date());
  window.__sunStreamersGtagInitialized = true;

  if (savedConsent) {
    applyTrackingConsent();
  }
}

function applyTrackingConsent() {
  updateGoogleConsent();
  loadGoogleTags();
  loadMetaPixel();
  loadTikTokPixel();
}

export function setTrackingConsent(consent) {
  currentConsent = {
    analytics: Boolean(consent.analytics),
    advertising: Boolean(consent.advertising),
  };

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(currentConsent));
  } catch (error) {
    console.warn("Could not save tracking preferences:", error);
  }

  applyTrackingConsent();

  // Re-track the current page using the newly selected preferences.
  lastPageView = "";

  if (typeof window !== "undefined" && window.location) {
    trackPageView(window.location.href);
  }
}

export function trackPageView(pageUrl) {
  if (typeof window === "undefined") return;

  const url = pageUrl || window.location.href;

  if (lastPageView === url) return;

  lastPageView = url;

  if (currentConsent.analytics && trackingConfig.ga4MeasurementId) {
    loadGoogleTags();

    window.gtag?.("event", "page_view", {
      page_location: url,
      page_title: document.title,
      page_path: `${window.location.pathname}${window.location.search}`,
    });
  }

  if (currentConsent.advertising && trackingConfig.metaPixelId) {
    loadMetaPixel();
    window.fbq?.("track", "PageView");
  }

  if (currentConsent.advertising && trackingConfig.tiktokPixelId) {
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
    // Kept separate from purchase to avoid counting the same
    // subscription as two GA4 purchases.
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

  const mapping = eventMappings[eventName] || {
    ga4: eventName,
    meta: eventName,
    metaType: "custom",
    tiktok: eventName,
  };

  if (currentConsent.analytics && trackingConfig.ga4MeasurementId) {
    loadGoogleTags();

    if (typeof window.gtag === "function") {
      window.gtag("event", mapping.ga4, parameters);
      result.ga4 = true;
    }
  }

  if (currentConsent.advertising && trackingConfig.metaPixelId) {
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

  if (currentConsent.advertising && trackingConfig.tiktokPixelId) {
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
    !currentConsent.advertising ||
    !trackingConfig.googleAdsId ||
    !trackingConfig.googleAdsConversionLabel ||
    typeof window === "undefined"
  ) {
    return false;
  }

  const numericValue = Number(value);

  // Do not send a conversion with an invented or invalid value.
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
