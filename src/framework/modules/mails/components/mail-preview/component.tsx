/* eslint-disable react-native/no-raw-text */
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';

import moment from 'moment';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import styles from './styles';
import { MailsMailPreviewProps } from './types';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { NamedSVG } from '~/framework/components/picture';
import { CaptionBoldText, SmallBoldText, SmallText } from '~/framework/components/text';
import { displayPastDate } from '~/framework/util/date';
import Avatar, { Size } from '~/ui/avatars/Avatar';

const unreadSwipeLeftAction = (prog: SharedValue<number>, drag: SharedValue<number>) => {
  const styleAnimation = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: drag.value - 80 }],
    };
  });

  return (
    <Reanimated.View style={styleAnimation}>
      <View style={[styles.swipeAction, styles.swipeLeftAction]}>
        <NamedSVG
          name="ui-eyeSlash"
          fill={theme.palette.grey.white}
          width={UI_SIZES.elements.icon.default}
          height={UI_SIZES.elements.icon.default}
        />
      </View>
    </Reanimated.View>
  );
};

const deleteSwipeRightAction = (prog: SharedValue<number>, drag: SharedValue<number>) => {
  const styleAnimation = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: drag.value + 80 }],
    };
  });

  return (
    <Reanimated.View style={styleAnimation}>
      <View style={[styles.swipeAction, styles.swipeRightAction]}>
        <NamedSVG
          name="ui-delete"
          fill={theme.palette.grey.white}
          width={UI_SIZES.elements.icon.default}
          height={UI_SIZES.elements.icon.default}
        />
      </View>
    </Reanimated.View>
  );
};

function formatRecipients(to, cc, cci): string {
  const formattedParts: string[] = [];

  if (to && to.length > 0) {
    const toNames = to.map(recipient => recipient.displayName).join(', ');
    formattedParts.push(`${I18n.get('mails-prefixto')} ${toNames}`);
  }

  if (cc && cc.length > 0) {
    const ccNames = cc.map(recipient => recipient.displayName).join(', ');
    formattedParts.push(`${I18n.get('mails-prefixcc')} ${ccNames}`);
  }

  if (cci && cci.length > 0) {
    const cciNames = cci.map(recipient => recipient.displayName).join(', ');
    formattedParts.push(`${I18n.get('mails-prefixcci')} ${cciNames}`);
  }

  return formattedParts.length > 0 ? formattedParts.join(' ') : I18n.get('mails-list-norecipient');
}

export const MailsMailPreview = (props: MailsMailPreviewProps) => {
  const { cc, cci, date, from, hasAttachment, state, subject, to, type, unread } = props.data;
  const TextComponent = unread ? SmallBoldText : SmallText;

  const onPress = () => {
    props.onPress();
  };

  const renderFirstText = () => {
    const recipientsText = formatRecipients(to, cc, cci);

    return (
      <TextComponent numberOfLines={1} style={styles.firstText}>
        {state === 'DRAFT' ? (
          <>
            <SmallBoldText style={styles.draftText}>{I18n.get('mails-list-draft')}</SmallBoldText> {recipientsText}
          </>
        ) : props.isSender ? (
          recipientsText
        ) : (
          from.displayName
        )}
      </TextComponent>
    );
  };

  return (
    <ReanimatedSwipeable
      friction={2}
      enableTrackpadTwoFingerGesture
      rightThreshold={80}
      leftThreshold={80}
      overshootFriction={8}
      renderRightActions={deleteSwipeRightAction}
      renderLeftActions={unreadSwipeLeftAction}>
      <TouchableOpacity style={[styles.container, unread ? styles.containerUnread : {}]} onPress={onPress}>
        <Avatar size={Size.large} sourceOrId={from.id} id="" />
        {type === 'ANSWERED' ? (
          <View style={styles.responseIcon}>
            <NamedSVG
              name="ui-undo"
              height={UI_SIZES.elements.icon.xsmall}
              width={UI_SIZES.elements.icon.xsmall}
              fill={theme.palette.grey.black}
            />
          </View>
        ) : null}
        <View style={styles.texts}>
          <View style={styles.line}>
            {renderFirstText()}
            <CaptionBoldText style={styles.date}>{displayPastDate(moment(date))}</CaptionBoldText>
          </View>
          <View style={styles.line}>
            <TextComponent>{subject}</TextComponent>
            {hasAttachment ? (
              <NamedSVG
                name="ui-attachment"
                height={UI_SIZES.elements.icon.xsmall}
                width={UI_SIZES.elements.icon.xsmall}
                fill={theme.palette.grey.black}
              />
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </ReanimatedSwipeable>
  );
};
