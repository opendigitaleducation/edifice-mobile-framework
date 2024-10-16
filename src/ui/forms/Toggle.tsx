import styled from '@emotion/native';
import * as React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import theme from '~/app/theme';
import TouchableOpacity from '~/ui/CustomTouchableOpacity';

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 22,
  },
});

// eslint-disable-next-line @typescript-eslint/naming-convention
const TapCircle = styled(TouchableOpacity)<{ checked: boolean }>(
  {
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: 22,
    height: 22,
    backgroundColor: theme.ui.background.card,
    position: 'absolute',
    left: 0,
    top: 0,
    borderWidth: 1,
    elevation: 2,
  },
  ({ checked = false }) => ({
    borderColor: checked ? theme.palette.primary.regular : theme.palette.grey.grey,
  }),
);

// eslint-disable-next-line @typescript-eslint/naming-convention
const Container = styled(TouchableOpacity)<{ checked: boolean }>(
  {
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 22,
    borderColor: theme.palette.grey.cloudy,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  ({ checked = false }) => ({
    backgroundColor: checked ? theme.palette.primary.regular : theme.palette.grey.cloudy,
    borderColor: checked ? theme.palette.primary.regular : theme.palette.grey.grey,
    borderWidth: checked ? 0 : 1,
  }),
);

export class Toggle extends React.Component<
  { checked: boolean; testID?: string; onUncheck?: () => void; onCheck?: () => void },
  { positionAnim: any }
> {
  constructor(props) {
    super(props);

    this.state = {
      positionAnim: new Animated.Value(props.checked ? 20 : 0),
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.checked !== prevProps.checked) {
      Animated.timing(this.state.positionAnim, {
        toValue: this.props.checked ? 20 : 0,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }

  switchCheck() {
    if (this.props.checked) this.props?.onUncheck?.();
    else this.props?.onCheck?.();
  }

  render() {
    return (
      <View style={styles.container} {...(this.props.testID ? { testID: this.props.testID } : {})}>
        <Container onPress={() => this.switchCheck()} checked={this.props.checked} />
        <Animated.View style={{ left: this.state.positionAnim }}>
          <TapCircle onPress={() => this.switchCheck()} checked={this.props.checked} />
        </Animated.View>
      </View>
    );
  }
}
