/*
 * AIMA tracking configuration.
 * Add the IDs only after creating the matching Google Analytics and Meta Pixel properties.
 * Tracking scripts are loaded only after the visitor grants the relevant consent.
 */
window.AIMA_TRACKING_CONFIG = {
  gaMeasurementId: "G-6T7W3F4133",
  metaPixelId: ""
};
window.dispatchEvent(new Event("aima:tracking-config-ready"));
