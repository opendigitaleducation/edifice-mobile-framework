'use strict';

module.exports = {
  dependencies: {
    ...(process.env.NO_FLIPPER ? { 'react-native-flipper': { platforms: { ios: null } } } : {}),
    //   'appcenter': {
    //     platforms: {
    //       android: null, // disable Android platform, other platforms will still autolink if provided
    //     },
    //   },
    //   'appcenter-crashes': {
    //     platforms: {
    //       android: null, // disable Android platform, other platforms will still autolink if provided
    //     },
    //   },
    //   'appcenter-analytics': {
    //     platforms: {
    //       android: null, // disable Android platform, other platforms will still autolink if provided
    //     },
    //   },
  },
};
