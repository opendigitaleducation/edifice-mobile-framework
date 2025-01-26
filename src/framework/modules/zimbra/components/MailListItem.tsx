import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { ListItem } from '~/framework/components/listItem';
import { Svg } from '~/framework/components/picture';
import { SmallBoldText, SmallText } from '~/framework/components/text';
import { IMail } from '~/framework/modules/zimbra/model';
import { displayPastDate } from '~/framework/util/date';
import { GridAvatars } from '~/ui/avatars/GridAvatars';

const styles = StyleSheet.create({
  contactContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
  },
  contactText: {
    flexShrink: 1,
    marginRight: UI_SIZES.spacing.tiny,
  },
  container: {
    borderBottomWidth: 0,
  },
  dateText: {
    color: theme.ui.text.light,
  },
  draftRecipientsText: {
    color: theme.palette.secondary.dark,
  },
  lineContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  rightContainer: {
    flex: 1,
    marginLeft: UI_SIZES.spacing.small,
  },
  selectedContainer: {
    backgroundColor: theme.palette.primary.pale,
    borderBottomWidth: 0,
    borderRadius: UI_SIZES.radius.medium,
    margin: UI_SIZES.spacing.tiny,
    padding: UI_SIZES.spacing.minor,
  },
  subjectText: {
    color: theme.ui.text.light,
    flexShrink: 1,
  },
  unreadIndicator: {
    backgroundColor: theme.palette.secondary.regular,
    borderRadius: 5,
    height: 10,
    marginRight: UI_SIZES.spacing.tiny,
    width: 10,
  },
});

interface IMailListItemProps {
  isSelected: boolean;
  mail: Omit<IMail, 'body'>;
  onPress: (mail: Omit<IMail, 'body'>) => void;
  selectMail: (mail: Omit<IMail, 'body'>) => void;
}

export class MailListItem extends React.PureComponent<IMailListItemProps> {
  getSenderName = (id: string): string => {
    const { mail } = this.props;

    const displayName = mail.displayNames.find(item => item[0] === id)?.[1];
    return displayName ?? I18n.get('zimbra-mail-unknownuser');
  };

  getRecipientsName = (ids: string[]): string => {
    const { mail } = this.props;

    if (!ids.length) return I18n.get('zimbra-maillist-listitem-norecipient');
    return ids.map(id => mail.displayNames.find(item => item[0] === id)?.[1] ?? id).join(', ');
  };

  public render() {
    const { isSelected, mail, onPress, selectMail } = this.props;
    const isReceived = mail.systemFolder !== 'OUTBOX' && mail.systemFolder !== 'DRAFT';
    const contactIds = isReceived ? [mail.from] : mail.to;
    const contactName = isReceived ? this.getSenderName(contactIds[0]) : this.getRecipientsName(contactIds);
    const ContactText = mail.unread ? SmallBoldText : SmallText;
    const SubjectText = mail.unread ? SmallBoldText : SmallText;

    return (
      <TouchableOpacity onPress={() => onPress(mail)} onLongPress={() => selectMail(mail)}>
        <ListItem
          leftElement={<GridAvatars users={contactIds.length ? contactIds : ['']} />}
          rightElement={
            <View style={styles.rightContainer}>
              <View style={styles.lineContainer}>
                <View style={styles.contactContainer}>
                  {mail.unread ? <View style={styles.unreadIndicator} /> : null}
                  {!isReceived ? <SmallText>{I18n.get('zimbra-maillist-listitem-toprefix')}</SmallText> : null}
                  <ContactText
                    numberOfLines={1}
                    style={[styles.contactText, mail.systemFolder === 'DRAFT' && styles.draftRecipientsText]}>
                    {contactName}
                  </ContactText>
                </View>
                <SmallText numberOfLines={1} style={styles.dateText}>
                  {displayPastDate(mail.date)}
                </SmallText>
              </View>
              <View style={styles.lineContainer}>
                <SubjectText numberOfLines={1} style={styles.subjectText}>
                  {mail.subject}
                </SubjectText>
                {mail.hasAttachment ? <Svg name="ui-attachment" width={18} height={18} fill={theme.ui.text.light} /> : null}
              </View>
            </View>
          }
          style={isSelected ? styles.selectedContainer : styles.container}
        />
      </TouchableOpacity>
    );
  }
}
