/**
 * Icon
 *
 * Display an icon from the icon font.
 */
import { createIconSetFromIcoMoon } from 'react-native-vector-icons';

const icoMoonConfig = require('ASSETS/selection.json');

export const Icon = createIconSetFromIcoMoon(icoMoonConfig);
export const { hasIcon } = Icon;
export type { IconProps } from 'react-native-vector-icons/Icon';
