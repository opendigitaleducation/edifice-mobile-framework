import * as React from 'react';
import { ColorValue, TextStyle, TouchableOpacity, View } from 'react-native';

import styles from './styles';

import theme from '~/app/theme';
import { genericHitSlop, UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { SmallInverseText } from '~/framework/components/text';

export default function NavBarAction(props: {
  icon?: string;
  title?: string;
  titleStyle?: TextStyle;
  disabled?: boolean;
  color?: ColorValue;
  testID?: string;
  onPress?: () => void;
}) {
  const opacityIconStyle = React.useMemo(() => (props.disabled ? styles.navBarActionDisabled : undefined), [props.disabled]);
  const opacityTextStyle = React.useMemo(
    () => (props.disabled ? [styles.navBarActionText, styles.navBarActionDisabled] : styles.navBarActionText),
    [props.disabled],
  );

  const Component = props.onPress ? TouchableOpacity : View;

  return (
    <Component
      {...(props.onPress ? { onPress: props.onPress } : {})}
      hitSlop={genericHitSlop}
      disabled={props.disabled}
      style={[styles.navBarActionWrapper, { ...(props.icon ? styles.navBarActionWrapperIcon : {}) }]}
      {...(props.testID ? { testID: props.testID } : {})}>
      {props.icon ? (
        <Svg
          name={props.icon}
          fill={props.color ?? theme.ui.text.inverse}
          width={UI_SIZES.elements.navbarIconSize}
          height={UI_SIZES.elements.navbarIconSize}
          style={[opacityIconStyle, styles.navBarActionIcon]}
        />
      ) : null}
      {props.title ? <SmallInverseText style={[props.titleStyle, opacityTextStyle]}>{props.title}</SmallInverseText> : null}
    </Component>
  );
}
