import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import moment, { Moment } from 'moment';
import * as React from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { connect } from 'react-redux';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import PrimaryButton from '~/framework/components/buttons/primary';
import { UI_STYLES } from '~/framework/components/constants';
import InputContainer from '~/framework/components/inputs/container';
import { LabelIndicator } from '~/framework/components/inputs/container/label';
import TextInput from '~/framework/components/inputs/text';
import { DocumentPicked, ImagePicked, cameraAction, documentAction, galleryAction } from '~/framework/components/menus/actions';
import BottomMenu from '~/framework/components/menus/bottom';
import { KeyboardPageView, PageView } from '~/framework/components/page';
import { NamedSVG } from '~/framework/components/picture';
import { BodyText, SmallActionText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import usePreventBack from '~/framework/hooks/prevent-back';
import { getFlattenedChildren } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import { getChildStructureId } from '~/framework/modules/viescolaire/common/utils/child';
import AbsenceDatesSelector from '~/framework/modules/viescolaire/presences/components/absence-dates-selector';
import { PresencesNavigationParams, presencesRouteNames } from '~/framework/modules/viescolaire/presences/navigation';
import { presencesService } from '~/framework/modules/viescolaire/presences/service';
import { Attachment } from '~/framework/modules/zimbra/components/Attachment';
import { navBarOptions } from '~/framework/navigation/navBar';
import { LocalFile } from '~/framework/util/fileHandler';
import { Trackers } from '~/framework/util/tracker';
import { SingleAvatar } from '~/ui/avatars/SingleAvatar';

import { Asset } from '~/framework/util/fileHandler/types';
import styles from './styles';
import type { PresencesDeclareAbsenceScreenPrivateProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<PresencesNavigationParams, typeof presencesRouteNames.declareAbsence>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('presences-declareabsence-title'),
  }),
});

const PresencesDeclareAbsenceScreen = (props: PresencesDeclareAbsenceScreenPrivateProps) => {
  const [startDate, setStartDate] = React.useState<Moment>(moment().startOf('day').hour(7));
  const [endDate, setEndDate] = React.useState<Moment>(moment().startOf('day').hour(18));
  const [reason, setReason] = React.useState<string>('');
  const [attachment, setAttachment] = React.useState<LocalFile | undefined>();
  const [isCreating, setCreating] = React.useState<boolean>(false);

  const onPickAttachment = (att: ImagePicked | DocumentPicked) => {
    setAttachment(new LocalFile(att as Asset | DocumentPicked, { _needIOSReleaseSecureAccess: false }));
  };

  const createAbsence = async () => {
    try {
      const { navigation, session } = props;
      const { childId } = props.route.params;
      const structureId = getChildStructureId(childId);

      setCreating(true);
      if (!childId || !session || !structureId) throw new Error();
      if (attachment) {
        await presencesService.absence.createWithFile(session, structureId, childId, startDate, endDate, reason, attachment);
      } else {
        await presencesService.absence.create(session, structureId, childId, startDate, endDate, reason);
      }
      navigation.goBack();
      Trackers.trackEvent('Présences', 'déclarer-absence', 'déclarer');
      Toast.showSuccess(I18n.get('presences-declareabsence-successmessage'));
    } catch {
      setCreating(false);
      Toast.showError(I18n.get('presences-declareabsence-error-text'));
    }
  };

  const renderPage = () => {
    const areDatesValid = startDate.isBefore(endDate) && startDate.isSameOrAfter(moment(), 'day');
    const { childId } = props.route.params;

    return (
      <ScrollView alwaysBounceVertical={false} contentContainerStyle={styles.container}>
        <View style={styles.childInfoContainer}>
          <SingleAvatar size={48} userId={childId} status={2} />
          <BodyText numberOfLines={1} style={UI_STYLES.flexShrink1}>
            {getFlattenedChildren(props.session?.user.children)?.find(child => child.id === childId)?.displayName}
          </BodyText>
        </View>
        <AbsenceDatesSelector
          startDate={startDate}
          endDate={endDate}
          onChangeStartDate={setStartDate}
          onChangeEndDate={setEndDate}
        />
        <InputContainer
          label={{
            text: I18n.get('presences-declareabsence-reasoninput-label'),
            icon: 'ui-textPage',
            indicator: LabelIndicator.REQUIRED,
          }}
          input={
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder={I18n.get('presences-declareabsence-reasoninput-placeholder')}
            />
          }
        />
        {attachment ? (
          <Attachment name={attachment.filename} type={attachment.filetype} onRemove={() => setAttachment(undefined)} />
        ) : (
          <BottomMenu
            title={I18n.get('presences-declareabsence-attachment')}
            actions={[
              cameraAction({ callback: onPickAttachment }),
              galleryAction({ callback: onPickAttachment }),
              documentAction({ callback: onPickAttachment }),
            ]}>
            <View style={styles.filePickerContainer}>
              <NamedSVG
                name="ui-attachment"
                width={20}
                height={20}
                fill={theme.palette.primary.regular}
                style={styles.iconAttMarginRight}
              />
              <SmallActionText>{I18n.get('presences-declareabsence-attachment')}</SmallActionText>
            </View>
          </BottomMenu>
        )}
        <PrimaryButton
          text={I18n.get('presences-declareabsence-action')}
          action={createAbsence}
          disabled={!reason || !areDatesValid}
          loading={isCreating}
        />
      </ScrollView>
    );
  };

  usePreventBack({
    title: I18n.get('presences-declareabsence-leavealert-title'),
    text: I18n.get('presences-declareabsence-leavealert-text'),
    showAlert: !!(reason || attachment) && !isCreating,
  });

  const PageComponent = Platform.select<typeof KeyboardPageView | typeof PageView>({ ios: KeyboardPageView, android: PageView })!;

  return <PageComponent style={styles.pageContainer}>{renderPage()}</PageComponent>;
};

export default connect((state: IGlobalState) => {
  const session = getSession();

  return {
    session,
  };
})(PresencesDeclareAbsenceScreen);
