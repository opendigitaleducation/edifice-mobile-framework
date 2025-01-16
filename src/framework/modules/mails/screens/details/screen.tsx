import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment from 'moment';

import stylesFolders from '~/framework/modules/mails/components/folder-item/styles';
import styles from './styles';
import type { MailsDetailsScreenPrivateProps } from './types';

import { HeaderBackButton } from '@react-navigation/elements';
import { FlatList, ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { connect } from 'react-redux';
import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import Attachments from '~/framework/components/attachments';
import SecondaryButton from '~/framework/components/buttons/secondary';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyConnectionScreen } from '~/framework/components/empty-screens';
import { RichEditorViewer } from '~/framework/components/inputs/rich-text';
import { deleteAction } from '~/framework/components/menus/actions';
import PopupMenu from '~/framework/components/menus/popup';
import BottomSheetModal, { BottomSheetModalMethods } from '~/framework/components/modals/bottom-sheet';
import HeaderBottomSheetModal from '~/framework/components/modals/bottom-sheet/header';
import { NavBarAction, NavBarActionsGroup } from '~/framework/components/navigation';
import { AvatarSize, NewAvatar } from '~/framework/components/newavatar';
import { PageView } from '~/framework/components/page';
import { Svg } from '~/framework/components/picture';
import ScrollView from '~/framework/components/scrollView';
import Separator from '~/framework/components/separator';
import { HeadingXSText, SmallBoldText, SmallItalicText, SmallText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import { ContentLoader } from '~/framework/hooks/loader';
import { getSession } from '~/framework/modules/auth/reducer';
import MailsFolderItem from '~/framework/modules/mails/components/folder-item';
import MailsPlaceholderDetails from '~/framework/modules/mails/components/placeholder/details';
import { MailsRecipientGroupItem, MailsRecipientUserItem } from '~/framework/modules/mails/components/recipient-item';
import {
  IMailsMailContent,
  MailsDefaultFolders,
  MailsFolderInfo,
  MailsRecipients,
  MailsVisible,
} from '~/framework/modules/mails/model';
import { MailsNavigationParams, mailsRouteNames } from '~/framework/modules/mails/navigation';
import { MailsEditType } from '~/framework/modules/mails/screens/edit';
import { mailsService } from '~/framework/modules/mails/service';
import {
  convertRecipientGroupInfoToVisible,
  convertRecipientUserInfoToVisible,
  mailsFormatRecipients,
} from '~/framework/modules/mails/util';
import { userRouteNames } from '~/framework/modules/user/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';
import { displayPastDate } from '~/framework/util/date';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<MailsNavigationParams, typeof mailsRouteNames.details>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: '',
  }),
});

const MailsDetailsScreen = (props: MailsDetailsScreenPrivateProps) => {
  const bottomSheetModalRef = React.useRef<BottomSheetModalMethods>(null);
  const [mail, setMail] = React.useState<IMailsMailContent>();
  const [isInModalMove, setIsInModalMove] = React.useState<boolean>(false);
  const [newParentFolder, setNewParentFolder] = React.useState<MailsFolderInfo>();
  const [infosRecipients, setInfosRecipients] = React.useState<{ text: string; ids: string[] }>();

  const loadData = async () => {
    try {
      const mail = await mailsService.mail.get({ mailId: props.route.params.id });
      const infosRecipients = mailsFormatRecipients(mail.to, mail.cc, mail.cci);
      setInfosRecipients(infosRecipients);
      setMail(mail);
    } catch (e) {
      console.error('Failed to fetch mail content', e);
    }
  };

  const onDismissBottomSheet = () => {
    if (isInModalMove) setIsInModalMove(false);
  };

  const onReply = () => {
    let to: MailsVisible[] = [];
    if (mail?.from.id !== props.session?.user.id) to.push(convertRecipientUserInfoToVisible(mail!.from));
    else {
      let users = mail!.to.users.map(user => convertRecipientUserInfoToVisible(user));
      let groups = mail!.to.groups.map(group => convertRecipientGroupInfoToVisible(group));
      to = [...users, ...groups];
    }
    props.navigation.navigate(mailsRouteNames.edit, { to, subject: mail?.subject, type: MailsEditType.REPLY });
  };

  const onReplyAll = () => {
    let to: MailsVisible[] = [];
    if (mail?.from.id !== props.session?.user.id) {
      to.push(convertRecipientUserInfoToVisible(mail!.from));
      if (mail!.to.groups.length > 0 || mail!.to.users.length > 0) {
        let users = mail!.to.users
          .filter(user => user.id !== props.session?.user.id)
          .map(user => convertRecipientUserInfoToVisible(user));
        let groups = mail!.to.groups.map(group => convertRecipientGroupInfoToVisible(group));
        to = [...to, ...users, ...groups];
      }
    } else {
      let users = mail!.to.users.map(user => convertRecipientUserInfoToVisible(user));
      let groups = mail!.to.groups.map(group => convertRecipientGroupInfoToVisible(group));
      to = [...users, ...groups];
    }
    //TODO cc cci
    props.navigation.navigate(mailsRouteNames.edit, { to, subject: mail?.subject, type: MailsEditType.REPLY });
  };

  const onForward = () => {
    let users = mail!.to.users.map(user => convertRecipientUserInfoToVisible(user));
    let groups = mail!.to.groups.map(group => convertRecipientGroupInfoToVisible(group));
    const to: MailsVisible[] = [...users, ...groups];

    props.navigation.navigate(mailsRouteNames.edit, {
      from: mail?.from,
      to,
      body: mail?.body,
      subject: mail?.subject,
      type: MailsEditType.FORWARD,
    });
  };

  const handleMailAction = async (action: () => Promise<void>, successMessageKey: string) => {
    try {
      await action();
      props.navigation.navigate(mailsRouteNames.home, { from: props.route.params.from });
      Toast.showSuccess(I18n.get(successMessageKey));
    } catch (e) {
      console.error(e);
    }
  };

  const onMarkUnread = () =>
    handleMailAction(
      () => mailsService.mail.toggleUnread({ ids: [props.route.params.id], unread: true }),
      'mails-details-toastsuccessunread',
    );

  const onOpenMoveModal = () => {
    setIsInModalMove(true);
    bottomSheetModalRef.current?.present();
  };

  const onMove = () =>
    handleMailAction(
      () => mailsService.mail.moveToFolder({ folderId: newParentFolder!.id }, { ids: [props.route.params.id] }),
      'mails-details-toastsuccessmove',
    );

  const onRestore = () =>
    handleMailAction(() => mailsService.mail.restore({ ids: [props.route.params.id] }), 'mails-details-toastsuccessrestore');

  const onTrash = () =>
    handleMailAction(() => mailsService.mail.moveToTrash({ ids: [mail!.id] }), 'mails-details-toastsuccesstrash');

  const onDelete = () => handleMailAction(() => mailsService.mail.delete({ ids: [mail!.id] }), 'mails-details-toastsuccessdelete');

  const allPopupActionsMenu = [
    {
      action: onMarkUnread,
      icon: {
        android: 'ic_visibility_off',
        ios: 'eye.slash',
      },
      title: I18n.get('mails-details-markunread'),
    },
    {
      action: onOpenMoveModal,
      icon: {
        android: 'ic_move_to_inbox',
        ios: 'arrow.up.square',
      },
      title: I18n.get('mails-details-move'),
    },
    {
      action: onRestore,
      icon: {
        android: 'ic_restore',
        ios: 'arrow.uturn.backward.circle',
      },
      title: I18n.get('mails-details-restore'),
    },
    deleteAction({
      action: props.route.params.from === MailsDefaultFolders.TRASH ? onDelete : onTrash,
    }),
  ];

  const popupActionsMenu = () => {
    if (props.route.params.from === MailsDefaultFolders.OUTBOX) return allPopupActionsMenu.slice(-1);
    if (props.route.params.from === MailsDefaultFolders.TRASH) return allPopupActionsMenu.slice(-2);
    return [...allPopupActionsMenu.slice(0, 2), ...allPopupActionsMenu.slice(3)];
  };

  React.useEffect(() => {
    props.navigation.setOptions({
      headerLeft: () => (
        <HeaderBackButton
          labelVisible={false}
          tintColor={theme.palette.grey.white as string}
          onPress={() => props.navigation.navigate(mailsRouteNames.home, { from: props.route.params.from })}
        />
      ),
      headerRight: () => (
        <NavBarActionsGroup
          elements={[
            <NavBarAction icon="ui-undo" onPress={onReply} />,
            <PopupMenu actions={popupActionsMenu()}>
              <NavBarAction icon="ui-options" />
            </PopupMenu>,
          ]}
        />
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mail, newParentFolder, props]);

  const renderRecipients = () => {
    return (
      <TouchableOpacity onPress={() => bottomSheetModalRef.current?.present()} style={styles.recipients}>
        <SmallText numberOfLines={1} style={styles.recipientsText}>
          {infosRecipients?.text}
        </SmallText>
        <Svg
          name="ui-rafterDown"
          fill={theme.palette.grey.graphite}
          height={UI_SIZES.elements.icon.xsmall}
          width={UI_SIZES.elements.icon.xsmall}
        />
      </TouchableOpacity>
    );
  };

  const renderButtons = () => (
    <>
      <SecondaryButton iconLeft="ui-undo" text={I18n.get('mails-details-reply')} action={onReply} />
      {infosRecipients && infosRecipients.ids.length > 1 ? (
        <SecondaryButton iconLeft="ui-answerall" text={I18n.get('mails-details-replyall')} action={onReplyAll} />
      ) : (
        <SecondaryButton iconLeft="ui-redo" text={I18n.get('mails-details-forward')} action={onForward} />
      )}
    </>
  );

  const hasRecipients = (recipients: MailsRecipients) => recipients.users.length > 0 || recipients.groups.length > 0;

  const renderListRecipients = (recipients: MailsRecipients, prefix: string) => {
    if (!hasRecipients(recipients)) return;
    return (
      <View>
        <SmallBoldText style={styles.bottomSheetPrefix}>{I18n.get(prefix)}</SmallBoldText>
        {recipients.users.length > 0 ? recipients.users.map(user => <MailsRecipientUserItem item={user} />) : null}
        {recipients.groups.length > 0 ? recipients.groups.map(group => <MailsRecipientGroupItem item={group} />) : null}
      </View>
    );
  };

  const renderDetailsRecipients = () => (
    <View style={styles.contentBottomSheet}>
      {renderListRecipients(mail!.to, 'mails-prefixto')}
      {hasRecipients(mail!.to) && hasRecipients(mail!.cc) ? <Separator marginVertical={UI_SIZES.spacing.medium} /> : null}
      {renderListRecipients(mail!.cc, 'mails-prefixcc')}
      {hasRecipients(mail!.cc) && hasRecipients(mail!.cci) ? <Separator marginVertical={UI_SIZES.spacing.medium} /> : null}
      {renderListRecipients(mail!.cci, 'mails-prefixcci')}
    </View>
  );

  const renderMoveFolder = () => (
    <View style={styles.contentBottomSheet}>
      <HeaderBottomSheetModal
        title={I18n.get('mails-details-move')}
        iconRight="ui-check"
        iconRightDisabled={!newParentFolder}
        onPressRight={onMove}
      />
      <View style={stylesFolders.containerFolders}>
        <FlatList
          data={props.route.params.folders}
          renderItem={({ item }) =>
            item.depth === 1 ? (
              <MailsFolderItem
                key={item.id}
                icon="ui-folder"
                name={item.name}
                selected={newParentFolder?.id === item.id}
                disabled={item.id === mail!.folder_id}
                onPress={() => setNewParentFolder(item)}
              />
            ) : null
          }
        />
      </View>
    </View>
  );

  const renderBottomSheet = () => {
    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        onDismiss={onDismissBottomSheet}
        snapPoints={isInModalMove ? ['90%'] : ['35%']}
        enableDynamicSizing={false}
        containerStyle={styles.bottomSheet}>
        <GHScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {isInModalMove ? renderMoveFolder() : renderDetailsRecipients()}
        </GHScrollView>
      </BottomSheetModal>
    );
  };

  const renderContent = () => (
    <PageView>
      <ScrollView style={styles.page}>
        <HeadingXSText>{mail?.subject ?? I18n.get('mails-list-noobject')}</HeadingXSText>
        <View style={styles.topInfos}>
          <NewAvatar size={AvatarSize.lg} userId={mail?.from.id} />
          <View style={styles.topInfosText}>
            <View style={styles.sender}>
              <TouchableOpacity
                style={styles.touchableSender}
                onPress={() => props.navigation.navigate(userRouteNames.profile, { userId: mail?.from.id })}>
                <SmallBoldText style={styles.senderName} numberOfLines={1} ellipsizeMode="tail">
                  {mail?.from.displayName}
                </SmallBoldText>
              </TouchableOpacity>
              <SmallItalicText>{displayPastDate(moment(mail?.date))}</SmallItalicText>
            </View>
            {renderRecipients()}
          </View>
        </View>
        <RichEditorViewer content={mail?.body ?? ''} />
        {mail!.attachments.length > 0 ? <Attachments attachments={mail?.attachments} /> : null}
        <Separator marginVertical={UI_SIZES.spacing.big} />
        <View style={styles.buttons}>{renderButtons()}</View>
      </ScrollView>
      {renderBottomSheet()}
    </PageView>
  );

  return (
    <ContentLoader
      loadContent={loadData}
      renderContent={renderContent}
      renderError={() => <EmptyConnectionScreen />}
      renderLoading={() => <MailsPlaceholderDetails />}
    />
  );
};

export default connect(() => ({
  session: getSession(),
}))(MailsDetailsScreen);
