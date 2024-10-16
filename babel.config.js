module.exports = function (api) {
  if (api.env('production')) {
    return {
      plugins: [
        //'transform-remove-console',
        'react-native-reanimated/plugin',
        '@babel/plugin-transform-flow-strip-types',
        ['@babel/plugin-transform-private-methods', { loose: true }],
      ],
      presets: ['module:@react-native/babel-preset'],
    };
  }

  return {
    plugins: [
      'react-native-reanimated/plugin',
      '@babel/plugin-transform-flow-strip-types',
      ['@babel/plugin-transform-private-methods', { loose: true }],
    ],
    presets: ['module:@react-native/babel-preset'],
  };
};
