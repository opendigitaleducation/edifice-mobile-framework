import appConfOverride from '~/app/override/appconf';

const overrideJson = require('ROOT/override.json');

const emptyAppConf = {
  matomo: undefined,
  webviewIdentifier: undefined,
  platforms: [],
};

console.log({
  ...emptyAppConf,
  ...appConfOverride,
  ...overrideJson?.deeplinks,
});

export default {
  ...emptyAppConf,
  ...appConfOverride,
  deeplinks: {
    ...overrideJson?.deeplinks,
  },
};
