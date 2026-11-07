import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://www.sunstreamers.com";

const SEO_PAGES = {
  "/": {
    title:
      "SunStreamers - 24/7 Smart Profit-Oriented Virtual Football Predictions Software",
    description:
      "SunStreamers - 24/7 Profit-Oriented Virtual Football Copy Signal Software designed to improve profitability across virtual football platforms.",
  },

  "/about": {
    title: "About SunStreamers | Our Platform",
    description:
      "Learn about SunStreamers and our virtual football copy signal software designed to improve profitability across virtual football platforms.",
  },

  "/pricing": {
    title: "SunStreamers Pricing | Subscription Plans",
    description:
      "Explore SunStreamers subscription plans and find the option that suits your virtual football prediction needs.",
  },

  "/tutorials": {
    title: "SunStreamers Tutorials | How to Use the Platform",
    description:
      "Explore SunStreamers tutorials and learn how to use the platform and its virtual football copy signal features.",
  },

  "/faq": {
    title: "SunStreamers FAQ | Frequently Asked Questions",
    description:
      "Find answers to frequently asked questions about SunStreamers, subscriptions, supported platforms and using the software.",
  },

  "/supported-platforms": {
    title: "Supported Platforms | SunStreamers",
    description:
      "Explore the virtual football platforms supported by SunStreamers.",
  },

  "/login": {
    title: "Login to Your SunStreamers Account",
    description:
      "Log in to your SunStreamers account to access your virtual football prediction software.",
  },

  "/register": {
    title: "Create a SunStreamers Account | Register",
    description:
      "Register for a SunStreamers account and get started with our virtual football copy signal software.",
  },
};

function updateMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function updateCanonical(url) {
  let element = document.head.querySelector('link[rel="canonical"]');

  if (!url) {
    element?.remove();
    return;
  }

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", url);
}

export default function SEOManager() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname.replace(/\/+$/, "") || "/";

    const page = SEO_PAGES[pathname];

    if (!page) {
      document.title = "SunStreamers";

      updateMeta("name", "robots", "noindex, nofollow");

      updateCanonical(null);
      return;
    }

    const canonicalUrl = `${SITE_URL}${pathname === "/" ? "/" : pathname}`;

    document.title = page.title;

    updateMeta("name", "description", page.description);

    updateMeta("name", "robots", "index, follow");

    updateCanonical(canonicalUrl);

    // Open Graph metadata
    updateMeta("property", "og:type", "website");
    updateMeta("property", "og:site_name", "SunStreamers");
    updateMeta("property", "og:title", page.title);
    updateMeta("property", "og:description", page.description);
    updateMeta("property", "og:url", canonicalUrl);

    // Twitter metadata
    updateMeta("name", "twitter:card", "summary");

    updateMeta("name", "twitter:title", page.title);

    updateMeta("name", "twitter:description", page.description);
  }, [location.pathname]);

  return null;
}
