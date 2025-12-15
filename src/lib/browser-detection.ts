/**
 * Browser Detection Utility
 *
 * Detects the user's browser and determines if it's supported.
 * Used for redirecting unsupported browsers (Safari, IE) to an info page.
 */

export interface BrowserInfo {
  name: string;
  isSupported: boolean;
  extensionAvailable: boolean;
}

/**
 * Detects the current browser from the user agent string
 */
export function detectBrowser(userAgent?: string): BrowserInfo {
  const ua = userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "");

  // Check for Safari (must check before Chrome because Safari also has "Chrome" in UA on iOS)
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua) && !/CriOS/i.test(ua)) {
    return { name: "Safari", isSupported: false, extensionAvailable: false };
  }

  // Check for Internet Explorer
  if (/MSIE|Trident/i.test(ua)) {
    return { name: "Internet Explorer", isSupported: false, extensionAvailable: false };
  }

  // Check for Edge (Chromium-based)
  if (/Edg/i.test(ua)) {
    return { name: "Microsoft Edge", isSupported: true, extensionAvailable: true };
  }

  // Check for Opera
  if (/OPR/i.test(ua) || /Opera/i.test(ua)) {
    return { name: "Opera", isSupported: true, extensionAvailable: true };
  }

  // Check for Firefox
  if (/Firefox/i.test(ua)) {
    return { name: "Firefox", isSupported: true, extensionAvailable: true };
  }

  // Check for Chrome
  if (/Chrome/i.test(ua)) {
    return { name: "Google Chrome", isSupported: true, extensionAvailable: true };
  }

  // Unknown browser - assume not supported
  return { name: "Unknown", isSupported: false, extensionAvailable: false };
}

/**
 * Checks if the browser is unsupported (for use in middleware)
 */
export function isUnsupportedBrowser(userAgent: string): boolean {
  const browser = detectBrowser(userAgent);
  return !browser.isSupported;
}

/**
 * List of supported browsers with download links
 */
export const SUPPORTED_BROWSERS = [
  {
    name: "Google Chrome",
    icon: "/icons/chrome.svg",
    downloadUrl: "https://www.google.com/chrome/",
    extensionUrl: "#", // TODO: Add Chrome Web Store URL after publishing
  },
  {
    name: "Microsoft Edge",
    icon: "/icons/edge.svg",
    downloadUrl: "https://www.microsoft.com/edge",
    extensionUrl: "#", // TODO: Add Edge Add-ons URL after publishing
  },
  {
    name: "Firefox",
    icon: "/icons/firefox.svg",
    downloadUrl: "https://www.mozilla.org/firefox/",
    extensionUrl: "#", // TODO: Add Firefox Add-ons URL after publishing
  },
  {
    name: "Opera",
    icon: "/icons/opera.svg",
    downloadUrl: "https://www.opera.com/",
    extensionUrl: "#", // TODO: Add Opera Add-ons URL after publishing
  },
];
