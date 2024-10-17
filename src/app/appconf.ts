import appConfOverride from '~/app/override/appconf';

const overrideJson = require('ROOT/override.json');

const emptyAppConf = {
  matomo: undefined,
  webviewIdentifier: undefined,
  platforms: [],
};

export default {
  ...emptyAppConf,
  ...appConfOverride,
  deeplinks: {
    ...overrideJson?.deeplinks,
  },
};
