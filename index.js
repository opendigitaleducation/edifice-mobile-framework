import { AppRegistry } from 'react-native';

import 'react-native-url-polyfill/auto';
// Add URLSearchParams polyfill as it is not implemented in React Native.
// @see https://github.com/facebook/react-native/issues/23922#issuecomment-648096619
import { startNetworkLogging } from 'react-native-network-logger';

import { name as appName } from './app.json';
import App from './src/app/index';

import './wdyr';

// from https://stackoverflow.com/a/35305611/6111343
// in React Native, `process.nextTick` doesn't exist.
process.nextTick = setImmediate;
startNetworkLogging({ maxRequests: 500 });
if (__DEV__) globalThis.RNFBDebug = true;

AppRegistry.registerComponent(appName, () => App);
