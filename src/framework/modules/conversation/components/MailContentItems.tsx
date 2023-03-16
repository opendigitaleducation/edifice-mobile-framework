import I18n from 'i18n-js';
import moment from 'moment';
import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Toast from 'react-native-tiny-toast';
import { ThunkDispatch } from 'redux-thunk';

import theme from '~/app/theme';
import { UI_ANIMATIONS, UI_SIZES } from '~/framework/components/constants';
import { ListItem } from '~/framework/components/listItem';
import { Icon } from '~/framework/components/picture/Icon';
import { CaptionText, NestedText, SmallBoldText, SmallText } from '~/framework/components/text';
import { getFileIcon } from '~/framework/modules/conversation/utils/fileIcon';
import { getMailPeople } from '~/framework/modules/conversation/utils/mailInfos';
import { getProfileColor, getUserColor } from '~/framework/modules/conversation/utils/userColor';
import { displayPastDate } from '~/framework/util/date';
import { IDistantFileWithId, SyncedFileWithId } from '~/framework/util/fileHandler';
import { downloadFileAction } from '~/framework/util/fileHandler/actions';
import TouchableOpacity from '~/ui/CustomTouchableOpacity';
import { GridAvatars } from '~/ui/avatars/GridAvatars';

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
    flexDirection: 'column',
    flex: 0,
  },
  dotReceiverColor: {
    width: 8,
    height: 8,
    borderRadius: 15,
    marginTop: UI_SIZES.spacing.tiny,
    marginRight: UI_SIZES.spacing.tiny,
  },
  fileIcon: { flex: 0 },
  footerButtonContainer: {
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  gridButtonTextPJnb: {
    color: theme.palette.primary.regular,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    textAlign: 'right',
  },
  gridButtonTextPJnames: {
    color: theme.palette.primary.regular,
    marginLeft: UI_SIZES.spacing.tiny,
    flex: 1,
  },
  greyColor: {
    color: theme.palette.grey.graphite,
  },
  gridAvatarsContainer: { alignSelf: 'flex-start', marginTop: UI_SIZES.spacing.medium + UI_SIZES.spacing.tiny },
  headerMailSubContainer: { paddingVertical: UI_SIZES.spacing.small, borderBottomWidth: 0 },
  mailInfos: {
    paddingLeft: UI_SIZES.spacing.small,
    flex: 1,
    alignSelf: 'flex-start',
  },
  mailDate: {
    textAlign: 'right',
    alignItems: 'center',
    justifyContent: 'flex-end',
    color: theme.ui.text.light,
  },
  mailIndicator: {
    flexDirection: 'row',
    textAlign: 'center',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingHorizontal: UI_SIZES.spacing.small,
    flex: 0,
  },
  sendersCollapsed: { marginTop: UI_SIZES.spacing.tiny, flex: 0 },
  sendersContainer: { flex: 1 },
  userContainer: { flexDirection: 'row', marginLeft: UI_SIZES.spacing.tiny, alignItems: 'baseline' },
  users: { flexDirection: 'row', flexWrap: 'wrap' },
  usersContainer: { flexDirection: 'row' },
});

const User = ({ userId, userName }) => {
  const [dotColor, setDotColor] = React.useState(getProfileColor('Guest'));
  getUserColor(userId).then(setDotColor);
  return (
    <View style={styles.userContainer} key={userId}>
      <View style={[styles.dotReceiverColor, { backgroundColor: dotColor }]} />
      <CaptionText>{userName}</CaptionText>
    </View>
  );
};

const SendersDetails = ({ mailInfos, inInbox }) => {
  const contacts = getMailPeople(mailInfos);
  return (
    <View style={{ marginTop: UI_SIZES.spacing.tiny }}>
      {inInbox || (
        <View style={styles.usersContainer}>
          <CaptionText style={styles.greyColor}>{I18n.t('conversation.fromPrefix')}</CaptionText>
          <User userId={contacts.from[0]} userName={contacts.from[1]} />
        </View>
      )}
      <View style={styles.usersContainer}>
        <SmallText style={styles.greyColor}>{I18n.t('conversation.toPrefix')}</SmallText>
        <View style={styles.users}>
          {contacts.to.map(person => (
            <User userId={person[0]} userName={person[1]} />
          ))}
        </View>
      </View>
      {contacts.cc && contacts.cc.length > 0 && (
        <View style={styles.usersContainer}>
          <SmallText style={styles.greyColor}>{I18n.t('conversation.ccPrefix')}</SmallText>
          <View style={styles.users}>
            {contacts.cc.map(person => (
              <User userId={person[0]} userName={person[1]} />
            ))}
          </View>
        </View>
      )}
      {contacts.cci && contacts.cci.length > 0 && (
        <View style={styles.usersContainer}>
          <SmallText style={styles.greyColor}>{I18n.t('conversation.bccPrefix')}</SmallText>
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

export const HeaderMail = ({ mailInfos, currentFolder }) => {
  const [isVisible, toggleVisible] = React.useState(false);
  const isFolderInbox = currentFolder === 'inbox';
  const mailContacts = getMailPeople(mailInfos);
  if (mailContacts.to.length === 0) mailContacts.to = [[undefined, I18n.t('conversation.emptyTo'), false]];
  const contactsToMore = mailContacts.to.length + mailContacts.cc.length + mailContacts.cci.length - 1;

  return (
    <TouchableOpacity onPress={() => toggleVisible(!isVisible)} activeOpacity={1}>
      <ListItem
        style={styles.headerMailSubContainer}
        leftElement={
          <View style={styles.gridAvatarsContainer}>
            <GridAvatars users={[{ id: mailContacts.from[0], isGroup: mailContacts.from[2] }]} />
          </View>
        }
        rightElement={
          <View style={styles.mailInfos}>
            {/* Date */}
            <SmallText style={styles.mailDate} numberOfLines={1}>
              {displayPastDate(moment(mailInfos.date), true)}
            </SmallText>
            <View style={styles.contactNameContainer}>
              {/* Contact name */}
              <View style={styles.contactNameSubContainer}>
                <SmallBoldText numberOfLines={1} style={styles.contactName}>
                  {mailContacts.from[1]}
                </SmallBoldText>
              </View>
            </View>
            <View style={styles.additionalInfos}>
              <View style={styles.sendersContainer}>
                {isVisible ? (
                  <SendersDetails mailInfos={mailInfos} inInbox={isFolderInbox} />
                ) : (
                  <CaptionText style={styles.sendersCollapsed} numberOfLines={1}>
                    <NestedText style={{ color: styles.greyColor.color }}>{I18n.t('conversation.toPrefix') + ' '}</NestedText>
                    <NestedText style={{ color: theme.palette.primary.regular }}>
                      {mailContacts.to[0][1]}
                      {contactsToMore > 0 ? I18n.t('conversation.toMore', { count: contactsToMore }) : null}
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

export const FooterButton = ({ icon, text, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.footerButtonContainer}>
      <Icon name={icon} size={24} style={{ color: theme.ui.text.light }} />
      <CaptionText style={{ color: theme.ui.text.light }}>{text}</CaptionText>
    </TouchableOpacity>
  );
};

export const RenderPJs = ({
  attachments,
  mailId,
  dispatch,
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
          url: `/conversation/message/${mailId}/attachment/${item.id}`,
          id: item.id,
          filename: item.filename,
          filesize: item.size,
          filetype: item.contentType,
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
                Toast.show(I18n.t('download-error-generic'), { ...UI_ANIMATIONS.toast });
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
                      Toast.showSuccess(I18n.t('download-success-name', { name: sf.filename }), { ...UI_ANIMATIONS.toast });
                    } catch {
                      Toast.show(I18n.t('download-error-generic'), { ...UI_ANIMATIONS.toast });
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