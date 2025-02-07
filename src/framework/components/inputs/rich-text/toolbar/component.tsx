import React, { Component } from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';

import { RichToolbarActionItem } from './item/action/component';
import { RichToolbarCustomItem } from './item/custom/component';
import { RichToolbarSeparator } from './item/separator';
import styles from './styles';
import { RichToolbarProps, RichToolbarState } from './types';

import theme from '~/app/theme';
import IconButton from '~/framework/components/buttons/icon';
import { UI_SIZES } from '~/framework/components/constants';
import { actions } from '~/framework/components/inputs/rich-text/editor/const';
import type RichEditor from '~/framework/components/inputs/rich-text/editor/RichEditor';
import { RichToolbarItemsList } from '~/framework/components/inputs/rich-text/toolbar/list';
import { Svg } from '~/framework/components/picture';

const toolbarTextOptions = [
  actions.setBold,
  actions.setItalic,
  actions.setUnderline,
  actions.insertBulletsList,
  actions.insertOrderedList,
  actions.setSubscript,
  actions.setSuperscript,
];
const animationDuration = 200;

export default class RichToolbar extends Component<RichToolbarProps, RichToolbarState> {
  editor: RichEditor | undefined = undefined;

  state = {
    animatedValueEnter: new Animated.Value(0),
    animatedValueExit: new Animated.Value(0),
    animatedValueOpacityEnter: new Animated.Value(0),
    animatedValueOpacityExit: new Animated.Value(0),
    selectedItems: [],
  };

  constructor(props) {
    super(props);
    this.animate = this.animate.bind(this);
    this.inverseAnimation = this.inverseAnimation.bind(this);
    this.setSelectedItems = this.setSelectedItems.bind(this);
    this.showBottomSheet = this.showBottomSheet.bind(this);
    this.startAnimation = this.startAnimation.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      const { editor: { current: editor } = { current: this.props.getEditor?.() } } = this.props;
      if (!editor) {
        // No longer throw an error, just try to re-load it when needed.
        // This is because the webview may go away during long periods of inactivity,
        // and the ref will be lost, causing the entire app to crash in this throw new error.
        //throw new Error('Toolbar has no editor!');
        console.error('Toolbar has no editor. Please make sure the prop getEditor returns a ref to the editor component.');
      } else {
        editor.registerToolbar(selectedItems => this.setSelectedItems(selectedItems));
        this.editor = editor;
      }
    });
  }

  animate(inverse: boolean) {
    Animated.parallel([
      Animated.timing(this.state.animatedValueExit, {
        duration: animationDuration,
        toValue: inverse ? 0 : 1,
        useNativeDriver: false,
      }),
      Animated.timing(this.state.animatedValueEnter, {
        duration: animationDuration,
        toValue: inverse ? 0 : 1,
        useNativeDriver: false,
      }),
      Animated.timing(this.state.animatedValueOpacityExit, {
        duration: animationDuration,
        toValue: inverse ? 1 : 0,
        useNativeDriver: false,
      }),
      Animated.timing(this.state.animatedValueOpacityEnter, {
        duration: animationDuration,
        toValue: inverse ? 0 : 1,
        useNativeDriver: false,
      }),
    ]).start();
  }

  inverseAnimation() {
    this.animate(true);
  }

  setSelectedItems(selectedItems) {
    if (selectedItems.includes(actions.selection)) {
      this.startAnimation();
    }
    this.setState({ selectedItems });
  }

  showBottomSheet() {
    this.editor?.blurContentEditor();
    this.props.showBottomSheet();
  }

  startAnimation() {
    this.animate(false);
  }

  hideKeyboard = () => {
    this.editor?.blurContentEditor();
  };

  render() {
    const interpolatedValueEnter = this.state.animatedValueEnter.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -UI_SIZES.elements.editor.toolbarHeight], // plage de valeurs pour la translation
    });

    const interpolatedValueOpacityEnter = this.state.animatedValueEnter.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1], // plage de valeurs pour la translation
    });

    const animatedStyleEnter = {
      opacity: interpolatedValueOpacityEnter,
      transform: [{ translateY: interpolatedValueEnter }],
    };

    const interpolatedValueExit = this.state.animatedValueExit.interpolate({
      inputRange: [0, 1],
      outputRange: [0, UI_SIZES.elements.editor.toolbarHeight], // plage de valeurs pour la translation
    });

    const interpolatedValueOpacityExit = this.state.animatedValueEnter.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0], // plage de valeurs pour la translation
    });

    const animatedStyleExit = {
      opacity: interpolatedValueOpacityExit,
      transform: [{ translateY: interpolatedValueExit }],
    };

    const isSelected = (action: string) => {
      return this.state.selectedItems.includes(action);
    };

    return (
      <View>
        <View style={styles.container}>
          <Animated.View style={[animatedStyleExit, styles.row]}>
            <RichToolbarItemsList
              list={[
                <RichToolbarActionItem
                  action={actions.undo}
                  disabled={!isSelected(actions.undo)}
                  editor={this.editor}
                  icon={`ui-${actions.undo}`}
                  key={actions.undo}
                />,
                <RichToolbarActionItem
                  action={actions.redo}
                  disabled={!isSelected(actions.redo)}
                  editor={this.editor}
                  icon={`ui-${actions.redo}`}
                  key={actions.redo}
                />,
                <RichToolbarSeparator key="separator1" />,
                <RichToolbarCustomItem
                  action={this.showBottomSheet}
                  fill={theme.palette.complementary.green.regular}
                  icon="ui-image"
                  key="bottomSheet"
                />,
                <RichToolbarCustomItem icon="ui-text-options" key="text" action={this.startAnimation} />,
              ]}
            />
            <View>
              <RichToolbarCustomItem icon="ui-keyboardHide" action={this.hideKeyboard} />
            </View>
          </Animated.View>
          <Animated.View style={[animatedStyleEnter, styles.row]}>
            <TouchableOpacity style={styles.closeUnderMenu} onPress={this.inverseAnimation}>
              <IconButton
                icon="ui-close"
                size={UI_SIZES.elements.icon.xxsmall}
                color={theme.palette.grey.white}
                style={styles.closeUnderMenuCross}
              />
              <Svg
                fill={theme.palette.grey.black}
                name="ui-text-options"
                width={UI_SIZES.elements.icon.small}
                height={UI_SIZES.elements.icon.small}
              />
            </TouchableOpacity>
            <RichToolbarItemsList
              list={toolbarTextOptions.map(action => (
                <RichToolbarActionItem
                  action={action}
                  editor={this.editor}
                  icon={`ui-${action}`}
                  key={action}
                  selected={isSelected(action)}
                />
              ))}
            />
          </Animated.View>
        </View>
      </View>
    );
  }
}
