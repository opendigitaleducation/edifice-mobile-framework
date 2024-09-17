import React from 'react';
import { View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { NamedSVG } from '~/framework/components/picture';
import { SmallBoldText, SmallText } from '~/framework/components/text';
import { containerStyle } from '~/framework/modules/conversation/components/result-item';
import { ConversationResultItemProps } from '~/framework/modules/conversation/components/result-item/types';
import { VisibleType } from '~/framework/modules/conversation/state/visibles';

import styles from './styles';

const iconType = {
  [VisibleType.SHAREBOOKMARK]: 'ui-bookmark',
  [VisibleType.GROUP]: 'ui-users',
  [VisibleType.BROADCASTGROUP]: 'ui-globe',
};

const renderSubtitle = (nbUsers, disabled) => {
  if (disabled) return <SmallText style={styles.graphite}>{I18n.get('conversation-newmail-broadcastgroupsubtitle')}</SmallText>;
  if (nbUsers)
    return (
      <SmallText style={styles.graphite}>
        {nbUsers} {I18n.get(nbUsers > 1 ? 'conversation-newmail-communicationmembres' : 'conversation-newmail-communicationmembre')}
      </SmallText>
    );
};

const ConversationResultGroupItem = (props: ConversationResultItemProps) => {
  const { displayName, type, nbUsers } = props.item;

  return (
    <View style={containerStyle}>
      <View style={[styles.iconView, type === VisibleType.SHAREBOOKMARK ? styles.iconViewBookmark : {}]}>
        <NamedSVG
          name={iconType[type]}
          height={UI_SIZES.elements.icon.xsmall}
          width={UI_SIZES.elements.icon.xsmall}
          fill={theme.palette.grey.black}
        />
      </View>
      <View style={styles.flex1}>
        <SmallBoldText numberOfLines={1} ellipsizeMode="tail" style={props.disabled ? styles.graphite : {}}>
          {displayName}
        </SmallBoldText>
        {renderSubtitle(nbUsers, props.disabled)}
      </View>
    </View>
  );
};

export default ConversationResultGroupItem;
