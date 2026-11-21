export const environment = {
  production: true,
  // Google Static Maps key (moved here from chat-details.page.html so it lives in one place).
  // NOTE: anything in the app bundle is readable. Restrict this key in Google Cloud Console
  // (Static Maps API only + quota), or have the backend sign/proxy map images.
  googleMapsStaticKey: 'AIzaSyDinqEFwSCs66zyeb1WwpjmklkC8pio99k',
  // Settings page links (fill these in; empty = "Coming soon" message)
  settingsLinks: {
    helpCentre: '',
    support: '',
    privacyPolicy: '',
    terms: ''
  }
};
