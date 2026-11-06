/**
 * 🎯 ANALYTICS HOOK
 * Use this hook in components to track page views and clicks
 */

"use client";

import { useEffect } from "react";
import { trackPageView, trackClick } from "../lib/analytics-db";

/**
 * Hook to track page views on component mount
 */
export function useTrackPageView() {
  useEffect(() => {
    // Track page view when component mounts
    trackPageView().catch(console.error);

    // Heartbeat every 60s to keep "visitors online" presence fresh
    const interval = setInterval(() => {
      trackPageView().catch(console.error);
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}

/**
 * Hook to get tracking functions
 */
export function useTracking() {
  return {
    trackProductClick: () => trackClick("productClick"),
    trackCategoryClick: () => trackClick("categoryClick"),
    trackButtonClick: () => trackClick("buttonClick"),
    trackLinkClick: () => trackClick("linkClick"),
    trackBlogClick: () => trackClick("blogClick"),
  };
}
