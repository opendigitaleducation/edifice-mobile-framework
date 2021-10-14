import * as React from 'react';
import I18n from 'i18n-js';
import { View, RefreshControl, FlatList } from 'react-native';
import { NavigationScreenProp, NavigationState } from 'react-navigation';
import Toast from 'react-native-tiny-toast';

import { Loading } from '../../../ui';
import { PageContainer } from '../../../ui/ContainerContent';
import { EmptyScreen } from '../../../ui/EmptyScreen';
import { DraftType } from '../containers/NewMail';
import MoveModal from '../containers/MoveToFolderModal';
import { IMail } from '../state/mailContent';
import moduleConfig from '../moduleConfig';
import MailListItem from './MailListItem';
import DrawerMenu from './DrawerMenu';
import { HeaderAction } from '../../../ui/headers/NewHeader';
import TempFloatingAction from '../../../ui/FloatingButton/TempFloatingAction';
import { Trackers } from '../../../framework/util/tracker';
import { IInit } from '../containers/MailList';
import { FakeHeader, HeaderCenter, HeaderLeft, HeaderRow, HeaderTitle } from '../../../framework/components/header';

type MailListProps = {
  notifications: any;
  isFetching: boolean;
  firstFetch: boolean;
  fetchInit: () => IInit;
  fetchCompleted: () => any;
  fetchMails: (page: number) => any;
  trashMails: (mailIds: string[]) => void;
  deleteDrafts: (mailIds: string[]) => void;
  deleteMails: (mailIds: string[]) => void;
  toggleRead: (mailIds: string[], read: boolean) => void;
  moveToFolder: (mailIds: string[], folderId: string) => void,
  moveToInbox: (mailIds: string[]) => void,
  restoreToFolder: (mailIds: string[], folderId: string) => void,
  restoreToInbox: (mailIds: string[]) => void,
  folders: any;
  isTrashed: boolean;
  fetchRequested: boolean;
  navigation: NavigationScreenProp<any>;
};

type MailListState = {
  indexPage: number;
  mails: any;
  nextPageCallable: boolean;
  showModal: boolean;
  selectedMail: IMail | undefined;
  isRefreshing: boolean;
  isSwipingMail: boolean;
  currentlySwipedMail: boolean;
};

let lastFolderCache = '';

export default class MailList extends React.PureComponent<MailListProps, MailListState> {
  swipeableRef = null;

  constructor(props) {
    super(props);

    const { notifications } = this.props;
    this.state = {
      indexPage: 0,
      mails: notifications,
      nextPageCallable: false,
      showModal: false,
      selectedMail: undefined,
      isRefreshing: false,
      isSwipingMail: false,
      currentlySwipedMail: false
    };
  }

  componentDidUpdate(prevProps) {
    const { notifications, isFetching, fetchCompleted } = this.props;
    if (this.state.indexPage === 0 && !isFetching && prevProps.isFetching && this.props.fetchRequested) {
      this.setState({ mails: notifications });
      fetchCompleted();
    }

    if (
      notifications !== prevProps.notifications &&
      this.state.indexPage > 0 &&
      prevProps.isFetching &&
      !isFetching &&
      this.props.fetchRequested
    ) {
      let { mails } = this.state;
      if (lastFolderCache && this.props.navigation.state?.params?.key !== lastFolderCache) {
        // THIS IS A BIG HACK BECAUSE DATA FLOW IS TOTALLY FUCKED UP IN THIS MODULE !!!!!!!! 🤬🤬🤬
        // So we force here mail state flush when folder has changed.
        mails = [];
      }
      lastFolderCache = this.props.navigation.state?.params?.key;
      const joinedList = mails.concat(this.props.notifications);
      this.setState({ mails: joinedList });
      fetchCompleted();
    }
  }

  selectItem = mailInfos => {
    mailInfos.isChecked = !mailInfos.isChecked;

    const { mails } = this.state;
    let indexMail = mails.findIndex(item => item.id === mailInfos.id);
    this.setState(prevState => ({ mails: { ...prevState.mails, [prevState.mails[indexMail]]: mailInfos } }));
  };

  renderMailContent = mailInfos => {
    const navigationKey = this.props.navigation.getParam('key');
    const isFolderDrafts = navigationKey === 'drafts';
    const isStateDraft = mailInfos.state === 'DRAFT';

    if (isStateDraft && isFolderDrafts) {
      this.props.navigation.navigate(`${moduleConfig.routeName}/new`, {
        type: DraftType.DRAFT,
        mailId: mailInfos.id,
        onGoBack: () => {
          this.refreshMailList();
          this.props.fetchInit();
        },
      });
    } else {
      this.props.navigation.navigate(`${moduleConfig.routeName}/mail`, {
        mailId: mailInfos.id,
        subject: mailInfos.subject,
        currentFolder: navigationKey || 'inbox',
        onGoBack: () => {
          this.refreshMailList();
          this.props.fetchInit();
        },
        isTrashed: this.props.isTrashed,
      });
    }
  };

  mailRestored = async () => {
    const { fetchInit } = this.props;
    await this.refreshMailList();
    await fetchInit();
    Toast.show(I18n.t('conversation.messageMoved'), {
      position: Toast.position.BOTTOM,
      mask: false,
      containerStyle: { width: '95%', backgroundColor: 'black' },
    });
  };

  toggleRead = async (unread: boolean, mailId: string) => {
    const { toggleRead, fetchInit } = this.props;
    try {
      await toggleRead([mailId], unread);
      this.refreshMailList();
      fetchInit();
    } catch (error) {
      console.error(error);
    }
  };

  delete = async (mailId: string) => {
    const { navigation, isTrashed, deleteMails, deleteDrafts, trashMails, fetchInit } = this.props;
    const navigationKey = navigation.getParam('key');
    const isFolderDrafts = navigationKey === 'drafts';
    const isTrashedOrDraft = isTrashed || isFolderDrafts;
    try {
      if (isTrashed) {
        await deleteMails([mailId]);
      } else if (isFolderDrafts) {
        await deleteDrafts([mailId]);
      } else await trashMails([mailId]);
      await this.refreshMailList();
      await fetchInit();
      Toast.show(I18n.t(`conversation.message${isTrashedOrDraft ? 'Deleted' : 'Trashed'}`), {
        position: Toast.position.BOTTOM,
        mask: false,
        containerStyle: { width: '95%', backgroundColor: 'black' },
      });
    } catch (error) {
      console.error(error);
    }
  };

  onChangePage = () => {
    if (!this.props.isFetching && this.props.notifications !== undefined) {
      const { indexPage } = this.state;
      const currentPage = indexPage + 1;
      this.setState({ indexPage: currentPage });
      this.props.fetchMails(currentPage);
    }
  };

  refreshMailList = () => {
    this.props.fetchMails(0);
    this.setState({ indexPage: 0 });
  };

  toggleUnread = () => {
    let toggleListIds = '';
    for (let i = 0; i < this.state.mails.length - 1; i++) {
      if (this.state.mails[i].isChecked) toggleListIds = toggleListIds.concat('id=', this.state.mails[i].id, '&');
    }
    if (toggleListIds === '') return;
    toggleListIds = toggleListIds.slice(0, -1);
  };

  getActiveRouteState = (route: NavigationState) => {
    if (!route.routes || route.routes.length === 0 || route.index >= route.routes.length) {
      return route;
    }

    const childActiveRoute = route.routes[route.index] as NavigationState;
    return this.getActiveRouteState(childActiveRoute);
  };

  public render() {
    const { isFetching, firstFetch, navigation } = this.props;
    const { showModal, selectedMail, isRefreshing, isSwipingMail, currentlySwipedMail } = this.state;
    const navigationKey = navigation.getParam("key");
    const uniqueId = [];
    const uniqueMails =
      this.state.mails?.filter((mail: IMail) => {
        // @ts-ignore
        if (uniqueId.indexOf(mail.id) == -1) {
          // @ts-ignore
          uniqueId.push(mail.id);
          return true;
        }
      }) || [];
    return (
      <>
        <PageContainer>
          <FakeHeader>
            <HeaderRow>
              {/* <HeaderLeft> // TODO: add action for searching messages 
                <HeaderAction name="search"/>
              </HeaderLeft> */}
              <HeaderCenter>
                <HeaderTitle>{I18n.t("conversation.appName")}</HeaderTitle>
              </HeaderCenter>
            </HeaderRow>
          </FakeHeader>
          <TempFloatingAction
            buttonStyle={{ zIndex: 1 }}
            iconName="new_message"
            onEvent={() => {
              Trackers.trackEventOfModule(moduleConfig, "Ecrire un mail", "Nouveau mail");
              this.props.navigation.navigate(`${moduleConfig.routeName}/new`, {
                type: DraftType.NEW,
                mailId: undefined,
                currentFolder: this.getActiveRouteState(navigation.state).key,
              });
            }}
          />
          <View style={{ flex: 1 }}>
            <DrawerMenu {...this.props} {...this.state} />
            <FlatList
              scrollEnabled={!isSwipingMail}
              onMomentumScrollBegin={() => this.setState({ currentlySwipedMail: false })}
              style={{ marginTop: 45 }}
              contentContainerStyle={{ flexGrow: 1 }}
              data={uniqueMails.length > 0 ? uniqueMails : []}
              renderItem={({ item }) => {
                const isFolderOutbox = navigationKey === 'sendMessages';
                const isFolderDrafts = navigationKey === 'drafts';
                const isMailUnread = item.unread && !isFolderDrafts && !isFolderOutbox;
                const mailId = item.id;
                return (
                  <MailListItem
                    {...this.props}
                    mailInfos={item}
                    renderMailContent={() => this.renderMailContent(item)}
                    deleteMail={() => this.delete(mailId)}
                    toggleRead={() => this.toggleRead(isMailUnread, mailId)}
                    restoreMail={() => this.setState({ showModal: true, selectedMail: item })}
                    onSwipeStart={() => this.setState({ isSwipingMail: true, currentlySwipedMail: false })}
                    onSwipeRelease={() => this.setState({ isSwipingMail: false })}
                    onButtonsOpenRelease={() => this.setState({ currentlySwipedMail: true })}
                    currentlySwipedMail={currentlySwipedMail}
                  />
                )
              }}
              extraData={uniqueMails}
              keyExtractor={(item: IMail) => item.id}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={async () => {
                    this.setState({ isRefreshing: true });
                    await this.refreshMailList();
                    this.setState({ isRefreshing: false });
                  }}
                />
              }
              ListFooterComponent={isFetching && !firstFetch ? <Loading /> : null}
              ListEmptyComponent={
                isFetching && firstFetch ? (
                  <Loading />
                ) : (
                  <View style={{ flex: 1 }}>
                    <EmptyScreen
                      imageSrc={require('../../../../assets/images/empty-screen/conversations.png')}
                      imgWidth={571}
                      imgHeight={261}
                      text={I18n.t('conversation.emptyScreenText')}
                      title={I18n.t('conversation.emptyScreenTitle')}
                      scale={0.76}
                    />
                  </View>
                )
              }
            />
          </View>
        </PageContainer> 
        <MoveModal
          currentFolder={navigationKey}
          mail={selectedMail}
          show={showModal}
          closeModal={() => this.setState({ showModal: false })}
          successCallback={this.mailRestored}
          moveToFolder={this.props.moveToFolder}
          moveToInbox={this.props.moveToInbox}
          restoreToFolder={this.props.restoreToFolder}
          restoreToInbox={this.props.restoreToInbox}
        />
      </>
    );
  }
}
