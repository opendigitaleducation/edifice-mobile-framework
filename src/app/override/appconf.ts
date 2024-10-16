/**
 * Global runtime configuration override
 */

export default {
  matomo: undefined,
  onboarding: {
    showDiscoveryClass: true,
    showAppName: true,
  },
  webviewIdentifier: 'dev',
  zendesk: undefined,

  platforms: [require('~/platforms/localhost')['default'], require('~/platforms/localhost')['avd']],
};
