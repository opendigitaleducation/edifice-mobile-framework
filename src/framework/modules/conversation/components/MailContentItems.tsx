import * as React from 'react';
import { ColorValue, Platform, StyleSheet, View } from 'react-native';

import moment from 'moment';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { ListItem } from '~/framework/components/listItem';
import { Icon } from '~/framework/components/picture';
import { CaptionText, NestedText, SmallBoldText, SmallText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import { getFileIcon } from '~/framework/modules/conversation/utils/fileIcon';
import { getMailPeople } from '~/framework/modules/conversation/utils/mailInfos';
import { getUserColor } from '~/framework/modules/conversation/utils/userColor';
import { displayPastDate } from '~/framework/util/date';
import { IDistantFileWithId, SyncedFileWithId } from '~/framework/util/fileHandler';
import { downloadFileAction } from '~/framework/util/fileHandler/actions';
import { GridAvatars } from '~/ui/avatars/GridAvatars';
import TouchableOpacity from '~/ui/CustomTouchableOpacity';

const styles = StyleSheet.create({
  additionalInfos: { flex: 0, flexDirection: 'row' },
  attachmentContainer: { flex: 0 },
  attachmentSubContainer: { flexDirection: 'row', flex: 0, alignItems: 'center', borderRadius: 6 },
  attachmentsToggle: { padding: UI_SIZES.spacing.tiny, flex: 0 },
  contactName: { flex: 1 },
  contactNameContainer: { flex: 0 },
  contactNameSubContainer: { flex: 0, flexDirection: 'row' },
  containerMail: {
    backgroundColor: theme.ui.background.card,
    flex: 0,
    flexDirection: 'column',
  },
  dotReceiverColor: {
    borderRadius: 4,
    height: 8,
    marginRight: UI_SIZES.spacing.tiny,
    overflow: 'hidden',
    width: 8,
  },
  fileIcon: { flex: 0 },
  footerButtonContainer: {
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  greyColor: {
    color: theme.palette.grey.graphite,
  },
  gridAvatarsContainer: { alignSelf: 'flex-start', marginTop: UI_SIZES.spacing.medium + UI_SIZES.spacing.tiny },
  gridButtonTextPJnames: {
    color: theme.palette.primary.regular,
    flex: 1,
    marginLeft: UI_SIZES.spacing.tiny,
  },
  gridButtonTextPJnb: {
    alignItems: 'flex-end',
    color: theme.palette.primary.regular,
    justifyContent: 'flex-end',
    textAlign: 'right',
  },
  headerMailSubContainer: { borderBottomWidth: 0, paddingVertical: UI_SIZES.spacing.small },
  mailDate: {
    alignItems: 'center',
    color: theme.ui.text.light,
    justifyContent: 'flex-end',
    textAlign: 'right',
  },
  mailIndicator: {
    alignItems: 'flex-start',
    flex: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: UI_SIZES.spacing.small,
    textAlign: 'center',
  },
  mailInfos: {
    alignSelf: 'flex-start',
    flex: 1,
    paddingLeft: UI_SIZES.spacing.small,
  },
  sendersCollapsed: { flex: 0, marginTop: UI_SIZES.spacing.tiny },
  sendersContainer: { flex: 1 },
  userContainer: { alignItems: 'center', flexDirection: 'row', marginLeft: UI_SIZES.spacing.tiny },
  users: { flexDirection: 'row', flexWrap: 'wrap' },
  usersContainer: { alignItems: 'center', flexDirection: 'row' },
});

const User = ({ userId, userName }) => {
  const [dotColor, setDotColor] = React.useState<undefined | ColorValue>();
  getUserColor(userId).then(setDotColor);
  return (
    <View style={styles.userContainer} key={userId}>
      <View style={[styles.dotReceiverColor, { backgroundColor: dotColor }]} />
      <CaptionText>{userName}</CaptionText>
    </View>
  );
};

const SendersDetails = ({ inInbox, mailInfos }) => {
  const contacts = getMailPeople(mailInfos);
  return (
    <View style={{ marginTop: UI_SIZES.spacing.tiny }} testID="message-read-to">
      {inInbox || (
        <View style={styles.usersContainer}>
          <CaptionText style={styles.greyColor}>{I18n.get('conversation-mailcontentitems-fromprefix')}</CaptionText>
          <User userId={contacts.from[0]} userName={contacts.from[1]} />
        </View>
      )}
      <View style={styles.usersContainer}>
        <SmallText style={styles.greyColor}>{I18n.get('conversation-mailcontentitems-toprefix')}</SmallText>
        <View style={styles.users}>
          {contacts.to.map(person => (
            <User userId={person[0]} userName={person[1]} />
          ))}
        </View>
      </View>
      {contacts.cc && contacts.cc.length > 0 && (
        <View style={styles.usersContainer}>
          <SmallText style={styles.greyColor}>{I18n.get('conversation-mailcontentitems-ccprefix')}</SmallText>
          <View style={styles.users}>
            {contacts.cc.map(person => (
              <User userId={person[0]} userName={person[1]} />
            ))}
          </View>
        </View>
      )}
      {contacts.cci && contacts.cci.length > 0 && (
        <View style={styles.usersContainer}>
          <SmallText style={styles.greyColor}>{I18n.get('conversation-mailcontentitems-bccprefix')}</SmallText>
          <View style={styles.users}>
            {contacts.cci.map(person => (
              <User userId={person[0]} userName={person[1]} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

// EXPORTED COMPONENTS

export const HeaderMail = ({ currentFolder, mailInfos }) => {
  const [isVisible, toggleVisible] = React.useState(false);
  const isFolderInbox = currentFolder === 'inbox';
  const mailContacts = getMailPeople(mailInfos);
  if (mailContacts.to.length === 0) mailContacts.to = [[undefined, I18n.get('conversation-mailcontentitems-emptyto'), false]];
  const contactsToMore = mailContacts.to.length + mailContacts.cc.length + mailContacts.cci.length - 1;
  return (
    <TouchableOpacity onPress={() => toggleVisible(!isVisible)} activeOpacity={1}>
      <ListItem
        style={styles.headerMailSubContainer}
        leftElement={
          <View style={styles.gridAvatarsContainer}>
            <GridAvatars
              users={[
                {
                  id: mailContacts.from ? mailContacts.from[0] : undefined,
                  isGroup: mailContacts.from ? mailContacts.from[2] : false,
                },
              ]}
            />
          </View>
        }
        rightElement={
          <View style={styles.mailInfos}>
            {/* Date */}
            <SmallText style={styles.mailDate} numberOfLines={1} testID="message-read-date">
              {displayPastDate(moment(mailInfos.date), true)}
            </SmallText>
            <View style={styles.contactNameContainer}>
              {/* Contact name */}
              <View style={styles.contactNameSubContainer}>
                <SmallBoldText numberOfLines={1} style={styles.contactName} testID="message-read-from">
                  {mailContacts.from ? mailContacts.from[1] : I18n.get('conversation-maillist-nosender')}
                </SmallBoldText>
              </View>
            </View>
            <View style={styles.additionalInfos}>
              <View style={styles.sendersContainer}>
                {isVisible ? (
                  <SendersDetails mailInfos={mailInfos} inInbox={isFolderInbox} />
                ) : (
                  <CaptionText style={styles.sendersCollapsed} numberOfLines={1}>
                    <NestedText style={{ color: styles.greyColor.color }}>
                      {I18n.get('conversation-mailcontentitems-toprefix') + ' '}
                    </NestedText>
                    <NestedText style={{ color: theme.palette.primary.regular }}>
                      {mailContacts.to[0][1]}
                      {contactsToMore > 0 ? I18n.get('conversation-mailcontentitems-tomore', { count: contactsToMore }) : null}
                    </NestedText>
                  </CaptionText>
                )}
              </View>
              {/* Mail attachment indicator */}
              {mailInfos.attachments.length > 0 && (
                <View style={styles.mailIndicator}>
                  <Icon name="attachment" size={16} color={theme.ui.text.regular} />
                </View>
              )}
            </View>
          </View>
        }
      />
    </TouchableOpacity>
  );
};

export const FooterButton = ({ icon, onPress, testID, text }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.footerButtonContainer} testID={testID}>
      <Icon name={icon} size={24} style={{ color: theme.ui.text.light }} />
      <CaptionText style={{ color: theme.ui.text.light }}>{text}</CaptionText>
    </TouchableOpacity>
  );
};

export const RenderPJs = ({
  attachments,
  dispatch,
  mailId,
}: {
  attachments: any[];
  mailId: string;
  dispatch: ThunkDispatch<any, any, any>;
}) => {
  const [isVisible, toggleVisible] = React.useState(false);
  const displayedAttachments = isVisible ? attachments : attachments.slice(0, 1);
  return (
    <View style={styles.containerMail}>
      {displayedAttachments.map((item, index) => {
        const df: IDistantFileWithId = {
          filename: item.filename,
          filesize: item.size,
          filetype: item.contentType,
          id: item.id,
          url: `/conversation/message/${mailId}/attachment/${item.id}`,
        };
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.attachmentContainer}
            onPress={async () => {
              const sf = (await dispatch(downloadFileAction<SyncedFileWithId>(df, {}))) as unknown as SyncedFileWithId;
              try {
                await sf.open();
              } catch {
                Toast.showError(I18n.get('conversation-mailcontent-download-error'));
              }
            }}>
            <View style={styles.attachmentSubContainer}>
              <Icon size={24} color={theme.palette.primary.regular} name={getFileIcon(item.contentType)} style={styles.fileIcon} />
              <SmallText style={styles.gridButtonTextPJnames} key={item.id} numberOfLines={1} ellipsizeMode="middle">
                {item.filename}
              </SmallText>
              {index === 0 && (
                <TouchableOpacity onPress={() => toggleVisible(!isVisible)} style={styles.attachmentsToggle}>
                  {attachments.length > 1 && (
                    <SmallText style={styles.gridButtonTextPJnb}>
                      {isVisible ? '-' : '+'}
                      {attachments.length - 1}
                    </SmallText>
                  )}
                </TouchableOpacity>
              )}
              {Platform.OS !== 'ios' ? (
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      const sf = (await dispatch(downloadFileAction<SyncedFileWithId>(df, {}))) as unknown as SyncedFileWithId;
                      await sf.mirrorToDownloadFolder();
                      Toast.showSuccess(I18n.get('conversation-mailcontent-downloadsuccess-name', { name: sf.filename }));
                    } catch {
                      Toast.showError(I18n.get('conversation-mailcontent-download-error'));
                    }
                  }}
                  style={{ paddingHorizontal: UI_SIZES.spacing.small }}>
                  <Icon name="download" size={18} color={theme.palette.primary.regular} />
                </TouchableOpacity>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
