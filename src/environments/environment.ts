// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
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

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
