/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

// Add URLSearchParams polyfill as it is not implemented in React Native.
// @see https://github.com/facebook/react-native/issues/23922#issuecomment-648096619
import 'react-native-url-polyfill/auto';

// from https://stackoverflow.com/a/35305611/6111343
// in React Native, `proess.nextTick` doesn't exist.
process.nextTick = setImmediate;

AppRegistry.registerComponent(appName, () => App);
