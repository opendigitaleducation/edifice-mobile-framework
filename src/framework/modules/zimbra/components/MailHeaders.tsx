import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES, UI_STYLES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { HeadingSText, SmallText } from '~/framework/components/text';
import { IMail } from '~/framework/modules/zimbra/model';
import { getUserColor } from '~/framework/modules/zimbra/utils/userColor';
import { displayPastDate } from '~/framework/util/date';
import { GridAvatars } from '~/ui/avatars/GridAvatars';

const styles = StyleSheet.create({
  dateText: {
    color: theme.ui.text.light,
  },
  detailsContainer: {
    marginTop: UI_SIZES.spacing.small,
  },
  dotReceiverColor: {
    borderRadius: 4,
    height: 8,
    marginRight: UI_SIZES.spacing.tiny,
    width: 8,
  },
  headerPrefixText: {
    color: theme.ui.text.light,
  },
  primaryContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginTop: UI_SIZES.spacing.small,
  },
  primaryInfoContainer: {
    flex: 1,
    marginLeft: UI_SIZES.spacing.small,
  },
  recipientsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  recipientsText: {
    color: theme.ui.text.light,
    flexShrink: 1,
    marginRight: UI_SIZES.spacing.tiny,
  },
  rowContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  senderText: {
    flexShrink: 1,
    marginRight: UI_SIZES.spacing.tiny,
  },
  userContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: UI_SIZES.spacing.tiny,
  },
  userListContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

const User = ({ id, name }: { id: string; name?: string }) => {
  const [dotColor, setDotColor] = React.useState(theme.palette.grey.white);

  getUserColor(id).then(setDotColor);

  return (
    <View style={styles.userContainer}>
      <View style={[styles.dotReceiverColor, { backgroundColor: dotColor }]} />
      <SmallText>{name}</SmallText>
    </View>
  );
};

export const MailHeaders = ({ mail }: { mail: IMail }) => {
  const [areDetailsVisible, setDetailsVisible] = React.useState<boolean>(false);

  return (
    <View>
      <HeadingSText>{mail.subject}</HeadingSText>
      <Pressable onPress={() => setDetailsVisible(!areDetailsVisible)} style={styles.primaryContainer}>
        <GridAvatars users={[mail.from]} />
        <View style={styles.primaryInfoContainer}>
          <View style={styles.rowContainer}>
            <SmallText numberOfLines={1} style={styles.senderText}>
              {mail.displayNames.find(item => item[0] === mail.from)?.[1] ?? I18n.get('zimbra-mail-unknownuser')}
            </SmallText>
            <SmallText style={styles.dateText}>{displayPastDate(mail.date)}</SmallText>
          </View>
          <View style={styles.recipientsContainer}>
            <SmallText numberOfLines={1} style={styles.recipientsText}>
              {I18n.get('zimbra-mail-headers-torecipient') +
                ' ' +
                mail.to.map(id => mail.displayNames.find(item => item[0] === id)?.[1] ?? id).join(', ')}
            </SmallText>
            <Svg name={areDetailsVisible ? 'ui-rafterUp' : 'ui-rafterDown'} width={14} height={14} fill={theme.ui.text.light} />
          </View>
        </View>
      </Pressable>
      {areDetailsVisible ? (
        <View style={styles.detailsContainer}>
          <View style={UI_STYLES.row}>
            <SmallText style={styles.headerPrefixText}>{I18n.get('zimbra-mail-headers-to')}</SmallText>
            <View style={styles.userListContainer}>
              {mail.to.map(id => (
                <User key={id} id={id} name={mail.displayNames.find(item => item[0] === id)?.[1]} />
              ))}
            </View>
          </View>
          {mail.cc.length ? (
            <View style={UI_STYLES.row}>
              <SmallText style={styles.headerPrefixText}>{I18n.get('zimbra-mail-headers-cc')}</SmallText>
              <View style={styles.userListContainer}>
                {mail.cc.map(id => (
                  <User key={id} id={id} name={mail.displayNames.find(item => item[0] === id)?.[1]} />
                ))}
              </View>
            </View>
          ) : null}
          <View style={UI_STYLES.row}>
            <SmallText style={styles.headerPrefixText}>{I18n.get('zimbra-mail-headers-date') + ' '}</SmallText>
            <SmallText>{mail.date.format('dddd LL - LT')}</SmallText>
          </View>
        </View>
      ) : null}
    </View>
  );
};
