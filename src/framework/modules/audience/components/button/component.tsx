import * as React from 'react';
import { Animated, Modal, PanResponder, TouchableOpacity, View } from 'react-native';
import { connect } from 'react-redux';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import DefaultButton from '~/framework/components/buttons/default';
import { NamedSVG } from '~/framework/components/picture';
import { ScrollContext } from '~/framework/components/scrollView';
import { CaptionBoldText } from '~/framework/components/text';
import { getValidReactionTypes } from '~/framework/modules/auth/reducer';
import Feedback from '~/framework/util/feedback/feedback';

import styles from './styles';
import { AudienceReactButtonAllProps } from './types';

const REACTION_ICON_SIZE = 30;
const HEIGHT_VIEW_REACTIONS = REACTION_ICON_SIZE + styles.reactionsIcon.paddingVertical * 2 + styles.reactions.borderWidth * 2;
const WIDTH_ONE_REACTION = REACTION_ICON_SIZE + styles.reactionsIcon.paddingHorizontal * 2;
const WIDTH_VIEW_REACTIONS = WIDTH_ONE_REACTION * 4 + styles.reactions.borderWidth * 2;

const AudienceReactButton = (props: AudienceReactButtonAllProps) => {
  const { userReaction } = props;
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [itemSelected, setItemSelected] = React.useState<null | string>(null);
  const [longPressTimeout, setLongPressTimeout] = React.useState(null);

  let component = React.useRef(null);
  const [cPageX, setPageX] = React.useState<number>(0);
  const [cPageY, setPageY] = React.useState<number>(0);

  const scrollRef = React.useContext(ScrollContext);
  const opacityBlocReactions = React.useRef(new Animated.Value(0)).current;
  const scaleReactionButton = React.useRef(new Animated.Value(1)).current;
  const animationReactions = props.validReactionTypes.reduce((acc, reaction) => {
    acc[reaction] = {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      transform: React.useRef(new Animated.Value(-100)).current,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      opacity: React.useRef(new Animated.Value(0)).current,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      scale: React.useRef(new Animated.Value(1)).current,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      rotate: React.useRef(new Animated.Value(0)).current,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      textOpacity: React.useRef(new Animated.Value(0)).current,
    };
    return acc;
  }, {});

  const showReactions = () => {
    setIsOpen(true);

    Animated.timing(opacityBlocReactions, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
    props.validReactionTypes.forEach((reaction, index) => {
      Animated.parallel([
        Animated.timing(animationReactions[reaction].transform, {
          toValue: 0,
          duration: 150,
          delay: 50 * index,
          useNativeDriver: true,
        }),
        Animated.timing(animationReactions[reaction].opacity, {
          toValue: 1,
          duration: 150,
          delay: 50 * index,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const hideReactions = () => {
    Feedback.actionDone();
    props.validReactionTypes.forEach((reaction, index) => {
      Animated.parallel([
        Animated.timing(animationReactions[reaction].transform, {
          toValue: -100,
          duration: 150,
          delay: 50 * index,
          useNativeDriver: true,
        }),
        Animated.timing(animationReactions[reaction].opacity, {
          toValue: 0,
          duration: 150,
          delay: 50 * index,
          useNativeDriver: true,
        }),
      ]).start();
    });
    setTimeout(() => {
      Animated.timing(opacityBlocReactions, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, 200);
    setTimeout(() => setIsOpen(false), 400);
  };

  const animReactButton = () => {
    Animated.sequence([
      Animated.timing(scaleReactionButton, {
        toValue: 1.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleReactionButton, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const openReactions = () => {
    setLongPressTimeout(null);
    Feedback.actionDone();
    if (!isOpen) showReactions();
    else hideReactions();
  };

  const deleteReaction = () => {
    Feedback.actionDone();
    props.deleteReaction();

    if (isOpen) hideReactions();
    animReactButton();
  };

  const postReaction = (reaction: string) => {
    Feedback.actionDone();
    if (userReaction) props.postReaction(reaction);
    else props.updateReaction(reaction);

    hideReactions();
    setTimeout(() => {
      animReactButton();
    }, 200);
  };

  const removeZoomOnSelectedItem = () => {
    if (itemSelected) {
      Animated.timing(animationReactions[itemSelected].textOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();
      Animated.timing(animationReactions[itemSelected].rotate, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      Object.keys(animationReactions).forEach(itemAnim => {
        Animated.timing(animationReactions[itemAnim].scale, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
      setItemSelected(null);
    }
  };

  const zoomOnItem = reaction => {
    if (itemSelected !== reaction) {
      Feedback.actionDone();
      removeZoomOnSelectedItem();
      setItemSelected(reaction);
      Object.keys(animationReactions).forEach(itemAnim => {
        if (itemAnim === reaction) {
          Animated.timing(animationReactions[reaction].scale, {
            toValue: 1.8,
            duration: 250,
            useNativeDriver: true,
          }).start();
          Animated.timing(animationReactions[reaction].textOpacity, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }).start();
          Animated.loop(
            Animated.sequence([
              Animated.timing(animationReactions[reaction].rotate, {
                toValue: 6,
                duration: 150,
                useNativeDriver: true,
              }),
              Animated.timing(animationReactions[reaction].rotate, {
                toValue: -6,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(animationReactions[reaction].rotate, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
              }),
            ]),
          ).start();
        } else {
          Animated.timing(animationReactions[itemAnim].scale, {
            toValue: 0.8,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
      });
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => true,
    onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => true,
    onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
    onPanResponderGrant: (evt, gestureState) => {
      if (scrollRef?.current) scrollRef.current.setNativeProps({ scrollEnabled: false });
    },

    onPanResponderMove: (evt, gestureState) => {
      if (
        gestureState.moveY >= cPageY &&
        gestureState.moveY <= cPageY + HEIGHT_VIEW_REACTIONS &&
        gestureState.moveX >= cPageX &&
        gestureState.moveX <= cPageX + WIDTH_VIEW_REACTIONS
      ) {
        const x = gestureState.moveX - cPageX;
        const targetIndex = Math.floor(x / WIDTH_ONE_REACTION);

        zoomOnItem(props.validReactionTypes[targetIndex]);
      } else {
        removeZoomOnSelectedItem();
      }
    },
    onPanResponderTerminationRequest: (evt, gestureState) => {
      return false;
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (itemSelected) {
        postReaction(itemSelected);
        removeZoomOnSelectedItem();
      }
      if (scrollRef?.current) scrollRef.current.setNativeProps({ scrollEnabled: true });
    },
  });

  const onTouchStartButton = () => {
    if (isOpen) return;
    component.measure((x, y, width, height, pageX, pageY) => {
      setPageX(pageX);
      setPageY(pageY - HEIGHT_VIEW_REACTIONS);
    });
    const timerLongTouch = setTimeout(() => {
      openReactions();
    }, 300);
    setLongPressTimeout(timerLongTouch);
  };
  const onTouchEndButton = () => {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      if (userReaction) deleteReaction();
      else openReactions();
    }
  };

  const renderReactButton = () => {
    return (
      <Animated.View
        style={[styles.buttonView, { transform: [{ scale: scaleReactionButton }] }]}
        onTouchStart={onTouchStartButton}
        onTouchEnd={onTouchEndButton}
        ref={view => (component = view)}
        {...panResponder.panHandlers}>
        <DefaultButton
          text={I18n.get(userReaction ? `audience-${userReaction.toLowerCase()}` : 'audience-reactbutton')}
          iconLeft={userReaction ? userReaction.toLowerCase() : 'ui-reaction'}
          contentColor={theme.palette.grey.black}
          style={styles.button}
        />
      </Animated.View>
    );
  };

  return (
    <View>
      <Modal transparent animationType="fade" visible={isOpen} onRequestClose={hideReactions}>
        <TouchableOpacity style={styles.flex1} activeOpacity={1} onPress={hideReactions}>
          <Animated.View
            style={[
              styles.reactions,
              {
                opacity: opacityBlocReactions,
                top: cPageY,
                left: cPageX,
              },
            ]}>
            {props.validReactionTypes.map((reaction, i) => {
              const rotate = animationReactions[reaction].rotate.interpolate({
                inputRange: [-6, 0, 6],
                outputRange: ['-6deg', '0deg', '6deg'],
              });
              return (
                <>
                  <Animated.View
                    style={[
                      styles.reactionsTextView,
                      {
                        left: i * (WIDTH_VIEW_REACTIONS / 4),
                        opacity: animationReactions[reaction].textOpacity,
                      },
                    ]}>
                    <CaptionBoldText style={styles.reactionsText}>{I18n.get(`audience-${reaction.toLowerCase()}`)}</CaptionBoldText>
                  </Animated.View>
                  <Animated.View
                    key={reaction}
                    style={{
                      transform: [
                        { translateY: animationReactions[reaction].transform },
                        { scale: animationReactions[reaction].scale },
                        { rotate },
                      ],
                      opacity: animationReactions[reaction].opacity,
                    }}>
                    <TouchableOpacity style={styles.reactionsIcon} onPress={() => postReaction(reaction)}>
                      <NamedSVG name={reaction.toLowerCase()} width={REACTION_ICON_SIZE} height={REACTION_ICON_SIZE} />
                    </TouchableOpacity>
                  </Animated.View>
                </>
              );
            })}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
      {renderReactButton()}
    </View>
  );
};

export default connect(() => ({
  validReactionTypes: getValidReactionTypes(),
}))(AudienceReactButton);
