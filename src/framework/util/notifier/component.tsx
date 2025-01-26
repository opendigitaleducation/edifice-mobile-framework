import * as React from 'react';
import {
  ActivityIndicator,
  Animated,
  ColorValue,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  TextLayoutEventData,
  View,
} from 'react-native';

import styled from '@emotion/native';
import { connect } from 'react-redux';

import type { NotifierState } from './reducer';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Icon } from '~/framework/components/picture';
import { SmallInverseText } from '~/framework/components/text';
import TouchableOpacity from '~/ui/CustomTouchableOpacity';

const NotifierWrapper = styled(TouchableOpacity)({
  flex: 1,
  flexDirection: 'row',
});

class Notifier extends React.Component<
  {
    id: string;
    notifiers: {
      [key: string]: NotifierState;
    };
    style?: any;
  },
  {
    fadeAnim: Animated.AnimatedValue;
    slideAnim: Animated.AnimatedValue;
    measuredText: boolean;
    longText: boolean;
    notifierHeight: number;
  }
> {
  previousVisible: boolean = false;

  state = {
    fadeAnim: new Animated.Value(0),
    longText: false,
    measuredText: false,
    notifierHeight: 0,
    slideAnim: new Animated.Value(0),
  };

  animate() {
    const { id } = this.props;
    const { fadeAnim, notifierHeight, slideAnim } = this.state;
    const notifier = this.props.notifiers[id];
    const visible = notifier && notifier.visible;

    if (notifierHeight > 0) {
      setTimeout(() => {
        if (visible && !this.previousVisible) {
          this.previousVisible = true;
          Animated.timing(fadeAnim, {
            duration: 500,
            toValue: 1,
            useNativeDriver: false,
          }).start();

          Animated.timing(slideAnim, {
            duration: 500,
            toValue: notifierHeight,
            useNativeDriver: false,
          }).start();
        }

        if (!visible && this.previousVisible) {
          this.previousVisible = false;
          Animated.timing(fadeAnim, {
            duration: 500,
            toValue: 0,
            useNativeDriver: false,
          }).start();

          Animated.timing(slideAnim, {
            duration: 500,
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      }, 200);
    }
  }

  get barColor(): ColorValue {
    const { id } = this.props;
    const notifier = this.props.notifiers[id];
    const type = (notifier && notifier.notifierType) || 'info';

    return {
      error: theme.palette.status.failure.regular,
      info: theme.palette.complementary.blue.regular,
      success: theme.palette.status.success.regular,
      warning: theme.palette.status.warning.regular,
    }[type];
  }

  public measureText = (evt: NativeSyntheticEvent<TextLayoutEventData>) => {
    const textBlockHeight = evt.nativeEvent.lines[0].height * evt.nativeEvent.lines.length;
    if (evt.nativeEvent.lines.length > 1) {
      this.setState({ longText: true, measuredText: true, notifierHeight: textBlockHeight + 40 });
    } else {
      this.setState({ longText: false, measuredText: true, notifierHeight: 40 });
    }
  };

  componentDidMount() {
    this.animate();
  }

  componentDidUpdate() {
    this.animate();
  }

  public render() {
    const { id, style } = this.props;
    const { fadeAnim, longText, measuredText, notifierHeight, slideAnim } = this.state;
    const notifier = this.props.notifiers[id];

    if (!notifier) return null;

    const loading = notifier && notifier.loading;
    const text = notifier && notifier.text;
    const icon = notifier && notifier.icon;
    const heightIos = measuredText && !longText ? undefined : notifierHeight;
    const height = Platform.OS === 'ios' ? heightIos : undefined;
    const marginLeft = !icon && !loading ? undefined : UI_SIZES.spacing.large;

    const styles = StyleSheet.create({
      alignCenter: { alignItems: 'center' },
      innerAnimatedView: { flex: 1, flexDirection: 'row', ...style },
      outerAnimatedView: {
        ...style,
        backgroundColor: theme.palette.grey.white,
        elevation: 6,
        height: slideAnim,
        opacity: fadeAnim,
        width: '100%',
      },
      textAnimated: {
        alignSelf: 'center',
        flex: 1,
        height,
        marginLeft,
        paddingBottom: longText ? UI_SIZES.spacing.medium : undefined,
        paddingTop: longText ? UI_SIZES.spacing.medium : undefined,
        textAlign: longText ? 'left' : 'center',
      },
    });

    return (
      <Animated.View style={styles.outerAnimatedView}>
        <NotifierWrapper style={{ backgroundColor: this.barColor }}>
          <View style={[styles.innerAnimatedView, icon && !loading && styles.alignCenter]}>
            {text ? (
              <SmallInverseText onTextLayout={this.measureText} style={styles.textAnimated}>
                {text}
              </SmallInverseText>
            ) : null}
            {loading ? (
              <ActivityIndicator size="small" color={theme.ui.text.inverse} style={{ marginRight: UI_SIZES.spacing.big }} />
            ) : icon ? (
              <Icon name={icon} size={18} style={{ marginRight: UI_SIZES.spacing.big }} color={theme.ui.text.inverse} />
            ) : null}
          </View>
        </NotifierWrapper>
      </Animated.View>
    );
  }
}

export default connect((state: any) => ({
  notifiers: state.notifiers,
}))(Notifier);
