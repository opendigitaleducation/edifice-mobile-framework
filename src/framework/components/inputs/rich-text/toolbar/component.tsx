import React, { Component } from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';

import theme from '~/app/theme';
import IconButton from '~/framework/components/buttons/icon';
import { UI_SIZES } from '~/framework/components/constants';
import RichEditor from '~/framework/components/inputs/rich-text/editor/RichEditor';
import { actions } from '~/framework/components/inputs/rich-text/editor/const';
import { RichToolbarItemsList } from '~/framework/components/inputs/rich-text/toolbar/list';
import { NamedSVG } from '~/framework/components/picture';

import { RichToolbarActionItem } from './item/action/component';
import { RichToolbarCustomItem } from './item/custom/component';
import { RichToolbarSeparator } from './item/separator';
import styles from './styles';
import { RichToolbarProps, RichToolbarState } from './types';

export default class RichToolbar extends Component<RichToolbarProps, RichToolbarState> {
  editor: RichEditor | undefined = undefined;

  state = {
    selectedItems: [],
    animatedValueEnter: new Animated.Value(0),
    animatedValueExit: new Animated.Value(0),
    animatedValueOpacityExit: new Animated.Value(0),
    animatedValueOpacityEnter: new Animated.Value(0),
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
      // TODO LEA: Fix that
      const { editor: { current: editor } = { current: this.props.getEditor?.() } } = this.props;
      if (!editor) {
        // No longer throw an error, just try to re-load it when needed.
        // This is because the webview may go away during long periods of inactivity,
        // and the ref will be lost, causing the entire app to crash in this throw new error.
        //throw new Error('Toolbar has no editor!');
        if (__DEV__) {
          console.warn('Toolbar has no editor. Please make sure the prop getEditor returns a ref to the editor component.');
        }
      } else {
        editor.registerToolbar(selectedItems => this.setSelectedItems(selectedItems));
        this.editor = editor;
      }
    });
  }

  animate(inverse: boolean) {
    Animated.parallel([
      Animated.timing(this.state.animatedValueExit, {
        toValue: inverse ? 0 : 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(this.state.animatedValueEnter, {
        toValue: inverse ? 0 : 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(this.state.animatedValueOpacityExit, {
        toValue: inverse ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(this.state.animatedValueOpacityEnter, {
        toValue: inverse ? 0 : 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }

  inverseAnimation() {
    this.animate(true);
  }

  setSelectedItems(selectedItems) {
    this.setState({ selectedItems });
  }

  showBottomSheet() {
    this.editor?.blurContentEditor();
    this.props.showBottomSheet();
  }

  startAnimation() {
    this.animate(false);
  }

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
      transform: [{ translateY: interpolatedValueEnter }],
      opacity: interpolatedValueOpacityEnter,
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
      transform: [{ translateY: interpolatedValueExit }],
      opacity: interpolatedValueOpacityExit,
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
                  key="undo"
                />,
                <RichToolbarActionItem
                  action={actions.redo}
                  disabled={!isSelected(actions.redo)}
                  editor={this.editor}
                  icon={`ui-${actions.redo}`}
                  key="redo"
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
              <RichToolbarCustomItem icon="ui-keyboardHide" action={() => this.editor?.blurContentEditor()} />
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
              <NamedSVG
                fill={theme.palette.grey.black}
                name="ui-text-options"
                width={UI_SIZES.elements.icon.small}
                height={UI_SIZES.elements.icon.small}
              />
            </TouchableOpacity>
            <RichToolbarItemsList
              list={[
                <RichToolbarActionItem
                  action={actions.setBold}
                  editor={this.editor}
                  icon={`ui-${actions.setBold}`}
                  key="bold"
                  selected={isSelected(actions.setBold)}
                />,
                <RichToolbarActionItem
                  action={actions.setItalic}
                  editor={this.editor}
                  icon={`ui-${actions.setItalic}`}
                  key="italic"
                  selected={isSelected(actions.setItalic)}
                />,
                <RichToolbarActionItem
                  action={actions.setUnderline}
                  editor={this.editor}
                  icon={`ui-${actions.setUnderline}`}
                  key="underline"
                  selected={isSelected(actions.setUnderline)}
                />,
                <RichToolbarActionItem
                  action={actions.insertBulletsList}
                  editor={this.editor}
                  icon={`ui-${actions.insertBulletsList}`}
                  key="bulletList"
                  selected={isSelected(actions.insertBulletsList)}
                />,
                <RichToolbarActionItem
                  action={actions.insertOrderedList}
                  editor={this.editor}
                  icon={`ui-${actions.insertOrderedList}`}
                  key="orderedList"
                  selected={isSelected(actions.insertOrderedList)}
                />,
                <RichToolbarActionItem
                  action={actions.setSubscript}
                  editor={this.editor}
                  icon={`ui-${actions.setSubscript}`}
                  key="index"
                  selected={isSelected(actions.setSubscript)}
                />,
                <RichToolbarActionItem
                  action={actions.setSuperscript}
                  editor={this.editor}
                  icon={`ui-${actions.setSuperscript}`}
                  key="exponent"
                  selected={isSelected(actions.setSuperscript)}
                />,
              ]}
            />
          </Animated.View>
        </View>
      </View>
    );
  }
}
