import * as React from 'react';
import { Platform, ScrollView, TextInput, View } from 'react-native';

import { CommonActions } from '@react-navigation/native';
import { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import DropDownPicker from 'react-native-dropdown-picker';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import styles from './styles';
import { ISupportCreateTicketScreenEventProps, ISupportCreateTicketScreenProps } from './types';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import PrimaryButton from '~/framework/components/buttons/primary';
import { EmptyScreen } from '~/framework/components/empty-screens';
import { cameraAction, documentAction, galleryAction } from '~/framework/components/menus/actions';
import BottomMenu from '~/framework/components/menus/bottom';
import { KeyboardPageView, PageView } from '~/framework/components/page';
import { Svg } from '~/framework/components/picture';
import { BodyBoldText, NestedBoldText, SmallActionText, SmallBoldText, SmallText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import usePreventBack from '~/framework/hooks/prevent-back';
import { getSession } from '~/framework/modules/auth/reducer';
import { postSupportTicketAction, uploadSupportTicketAttachmentsAction } from '~/framework/modules/support/actions';
import { SupportNavigationParams, supportRouteNames } from '~/framework/modules/support/navigation';
import { getSupportWorkflowInformation } from '~/framework/modules/support/rights';
import { Attachment } from '~/framework/modules/zimbra/components/Attachment';
import { navBarOptions } from '~/framework/navigation/navBar';
import { LocalFile, SyncedFileWithId } from '~/framework/util/fileHandler';
import { tryActionLegacy } from '~/framework/util/redux/actions';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<SupportNavigationParams, typeof supportRouteNames.home>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('support-createticket-title'),
  }),
});

const SupportCreateTicketScreen = (props: ISupportCreateTicketScreenProps) => {
  const hasTicketCreationRights = props.session && getSupportWorkflowInformation(props.session)?.createTicket;
  const [isCategoryDropdownOpen, setCategoryDropdownOpen] = React.useState(false);
  const [isStructureDropdownOpen, setStructureDropdownOpen] = React.useState(false);
  const [category, setCategory] = React.useState(props.apps[0]?.value);
  const [structure, setStructure] = React.useState(props.structures[0]?.value);
  const [subject, setSubject] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [attachments, setAttachments] = React.useState<LocalFile[]>([]);
  const [isSending, setSending] = React.useState(false);

  const addAttachment = file => {
    setAttachments(previousAttachments => [...previousAttachments, new LocalFile(file, { _needIOSReleaseSecureAccess: false })]);
  };

  const removeAttachment = (filepath: string) => {
    setAttachments(attachments.filter(a => a.filepath !== filepath));
  };

  const sendTicket = async () => {
    try {
      let uploadedAttachments: undefined | SyncedFileWithId[];
      setSending(true);
      if (attachments.length) {
        uploadedAttachments = await props.uploadAttachments(attachments);
      }
      const ticketId = await props.postTicket(category, structure, subject, description, uploadedAttachments);
      props.navigation.dispatch(CommonActions.goBack());
      Toast.showSuccess(I18n.get('support-createticket-successmessage', { id: ticketId }));
    } catch {
      setSending(false);
      Toast.showError(I18n.get('support-createticket-errormessage'));
    }
  };

  const onCategoryOpen = React.useCallback(() => {
    setStructureDropdownOpen(false);
  }, []);

  const onStructureOpen = React.useCallback(() => {
    setCategoryDropdownOpen(false);
  }, []);

  const renderPage = () => {
    const { apps, structures } = props;
    const mandatoryText = ' *';
    const filesAdded = attachments.length > 0;
    const isActionDisabled = subject === '' || subject.length > 255 || description === '';

    return hasTicketCreationRights ? (
      <ScrollView contentContainerStyle={styles.container}>
        <View>
          <BodyBoldText style={styles.titleText}>{I18n.get('support-createticket-reportincident')}</BodyBoldText>
          <SmallText style={styles.informationText}>{I18n.get('support-createticket-mobileonly')}</SmallText>
          <DropDownPicker
            open={isCategoryDropdownOpen}
            value={category}
            items={apps}
            setOpen={setCategoryDropdownOpen}
            setValue={setCategory}
            onOpen={onCategoryOpen}
            style={styles.dropdownContainer}
            dropDownContainerStyle={[styles.dropdownContainer, Platform.OS === 'android' && { position: 'relative', top: -16 }]}
            textStyle={styles.dropdownText}
            listMode="SCROLLVIEW"
          />
          {structures.length > 1 ? (
            <DropDownPicker
              open={isStructureDropdownOpen}
              value={structure}
              items={structures}
              setOpen={setStructureDropdownOpen}
              setValue={setStructure}
              onOpen={onStructureOpen}
              style={styles.dropdownContainer}
              containerStyle={{ zIndex: -1 }}
              dropDownContainerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
              listMode="SCROLLVIEW"
            />
          ) : null}
          <View style={{ zIndex: -2 }}>
            <SmallBoldText style={styles.inputLabelText}>
              {I18n.get('support-createticket-subject')}
              <NestedBoldText style={styles.mandatoryText}>{mandatoryText}</NestedBoldText>
            </SmallBoldText>
            <TextInput value={subject} onChangeText={text => setSubject(text)} style={styles.subjectInput} />
            <SmallBoldText style={styles.inputLabelText}>
              {I18n.get('support-createticket-description')}
              <NestedBoldText style={styles.mandatoryText}>{mandatoryText}</NestedBoldText>
            </SmallBoldText>
            <TextInput
              value={description}
              onChangeText={text => setDescription(text)}
              multiline
              textAlignVertical="top"
              style={styles.descriptionInput}
            />
            <View style={styles.attachmentsContainer}>
              <BottomMenu
                title={I18n.get('support-createticket-addfiles')}
                actions={[
                  cameraAction({ callback: addAttachment }),
                  galleryAction({ callback: addAttachment, multiple: true }),
                  documentAction({ callback: addAttachment }),
                ]}>
                <View style={[styles.textIconContainer, filesAdded && styles.textIconContainerSmallerMargin]}>
                  <SmallActionText style={styles.actionText}>{I18n.get('support-createticket-addfiles')}</SmallActionText>
                  <Svg name="ui-attachment" width={18} height={18} fill={theme.palette.primary.regular} />
                </View>
              </BottomMenu>
              {attachments.map(attachment => (
                <Attachment
                  key={attachment.filename}
                  name={attachment.filename}
                  type={attachment.filetype}
                  onRemove={() => removeAttachment(attachment.filepath)}
                />
              ))}
            </View>
          </View>
        </View>
        <PrimaryButton
          text={I18n.get('support-createticket-sendaction')}
          action={sendTicket}
          disabled={isActionDisabled}
          loading={isSending}
        />
      </ScrollView>
    ) : (
      <EmptyScreen svgImage="empty-support" title={I18n.get('support-createticket-emptyscreen-title')} />
    );
  };

  usePreventBack({
    showAlert: !!(subject || description) && !isSending,
    text: I18n.get('support-createticket-leavealert-title'),
    title: I18n.get('support-createticket-leavealert-title'),
  });

  const PageComponent = Platform.select<typeof KeyboardPageView | typeof PageView>({ android: PageView, ios: KeyboardPageView })!;

  return <PageComponent>{renderPage()}</PageComponent>;
};

export default connect(
  (state: IGlobalState) => {
    const session = getSession();
    const apps =
      session?.rights.apps
        ?.filter(app => app.address && app.name)
        .map(app => {
          const translation = I18n.get('support-createticket-category-' + app.displayName.toLowerCase());
          return {
            label: translation.startsWith('support-') ? app.displayName : translation,
            value: app.address,
          };
        }) ?? [];
    apps.push({
      label: I18n.get('support-createticket-category-other'),
      value: 'other',
    });

    return {
      apps: apps.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase())),
      session,
      structures:
        session?.user.structures?.map(structure => ({
          label: structure.name,
          value: structure.id,
        })) ?? [],
    };
  },
  (dispatch: ThunkDispatch<any, any, any>) =>
    bindActionCreators(
      {
        postTicket: tryActionLegacy(postSupportTicketAction, undefined, true) as ISupportCreateTicketScreenEventProps['postTicket'],
        uploadAttachments: tryActionLegacy(
          uploadSupportTicketAttachmentsAction,
          undefined,
          true,
        ) as unknown as ISupportCreateTicketScreenEventProps['uploadAttachments'],
      },
      dispatch,
    ),
)(SupportCreateTicketScreen);
