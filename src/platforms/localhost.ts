const localhostCommon = {
  oauth: ['app-e', 'ODE'],
  logo: require('ASSETS/platforms/logo-localhost.png'),
  webTheme: 'cg77',
};

module.exports = {
  default: {
    ...localhostCommon,
    name: 'localhost-default',
    url: 'http://localhost:8090',
    displayName: 'Localhost',
  },
  avd: {
    ...localhostCommon,
    name: 'localhost-avd',
    url: 'http://10.0.2.2:8090',
    displayName: '10.0.2.2 AVDHost',
  },
};
