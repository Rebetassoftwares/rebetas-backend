import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../../services/tracking";

export default function RouteTracker() {
  const location = useLocation();
  const lastTrackedPage = useRef("");

  useEffect(() => {
    const currentPage = `${location.pathname}${location.search}${location.hash}`;

    if (lastTrackedPage.current === currentPage) {
      return;
    }

    lastTrackedPage.current = currentPage;

    trackPageView(window.location.href);
  }, [location.pathname, location.search, location.hash]);

  return null;
}
