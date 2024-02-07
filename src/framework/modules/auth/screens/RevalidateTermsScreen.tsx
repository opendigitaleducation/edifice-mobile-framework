/**
 * Revalidate terms screen
 */
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import PrimaryButton from '~/framework/components/buttons/primary';
import { UI_SIZES } from '~/framework/components/constants';
import { PageView, PageViewStyle } from '~/framework/components/page';
import { openPDFReader } from '~/framework/components/pdf/pdf-reader';
import { NamedSVG } from '~/framework/components/picture/NamedSVG';
import { HeadingSText, SmallActionText, SmallBoldText, SmallText } from '~/framework/components/text';
import { manualLogoutAction, revalidateTermsAction } from '~/framework/modules/auth/actions';
import { LegalUrls } from '~/framework/modules/auth/model';
import { IAuthNavigationParams, authRouteNames } from '~/framework/modules/auth/navigation';
import { getPlatformLegalUrls } from '~/framework/modules/auth/reducer';
import { tryAction } from '~/framework/util/redux/actions';

// TYPES ==========================================================================================

export interface IRevalidateTermsScreenDataProps {
  legalUrls?: LegalUrls;
}

export interface IRevalidateTermsScreenEventProps {
  tryLogout: (...args: Parameters<typeof manualLogoutAction>) => Promise<void>;
  tryRevalidate: (...args: Parameters<typeof revalidateTermsAction>) => ReturnType<ReturnType<typeof revalidateTermsAction>>;
}

export type IRevalidateTermsScreenProps = IRevalidateTermsScreenEventProps &
  IRevalidateTermsScreenDataProps &
  NativeStackScreenProps<IAuthNavigationParams, typeof authRouteNames.revalidateTerms>;

// COMPONENT ======================================================================================

const styles = StyleSheet.create({
  mustAccept: {
    textAlign: 'center',
    marginTop: UI_SIZES.spacing.small,
  },
  newEULALabel: {
    textAlign: 'center',
    color: theme.palette.primary.regular,
    marginTop: UI_SIZES.spacing.large,
  },
  newEULALink: {
    textDecorationLine: 'underline',
  },
  refuseButton: {
    color: theme.palette.status.failure.regular,
    textAlign: 'center',
  },
});

const RevalidateTermsScreen = (props: IRevalidateTermsScreenProps) => {
  // EVENTS =====================================================================================
  const { tryLogout, tryRevalidate, navigation } = props;

  const doRefuseTerms = React.useCallback(async () => {
    try {
      tryLogout();
    } catch (e) {
      if (__DEV__) console.warn('refuseTerms: could not refuse terms', e);
    }
  }, [tryLogout]);

  const doRevalidateTerms = React.useCallback(async () => {
    try {
      await tryRevalidate();
    } catch (e) {
      if (__DEV__) console.warn('revalidateTerms: could not revalidate terms', e);
    }
    // Manually specified deps here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const doOpenLegalUrl = React.useCallback((title: string, url?: string) => {
    openPDFReader({
      src: url,
      title,
    });
  }, []);

  // RENDER =======================================================================================

  const imageWidth = UI_SIZES.screen.width - 4 * UI_SIZES.spacing.big;
  const imageHeight = imageWidth / UI_SIZES.aspectRatios.thumbnail;
  const eulaUrl = props.legalUrls?.cgu;
  const userCharterUrl = props.legalUrls?.userCharter;

  return (
    <PageView>
      <PageViewStyle
        style={{
          backgroundColor: theme.ui.background.empty,
          paddingTop: UI_SIZES.spacing.huge,
          paddingHorizontal: UI_SIZES.spacing.big,
        }}>
        <View style={{ paddingHorizontal: UI_SIZES.spacing.big }}>
          <View style={{ height: imageHeight }}>
            <NamedSVG name="empty-eula" width={imageWidth} height={imageHeight} />
          </View>
        </View>
        <HeadingSText numberOfLines={2} style={styles.newEULALabel}>
          {I18n.get('user-revalidateterms-neweula')}
        </HeadingSText>
        <SmallText numberOfLines={3} style={styles.mustAccept}>
          {`${I18n.get('user-revalidateterms-mustaccept')} `}
          <SmallActionText
            onPress={() => doOpenLegalUrl(I18n.get('user-legalnotice-usercharter'), userCharterUrl)}
            style={styles.newEULALink}>
            {I18n.get('user-revalidateterms-newendusercharter')}
          </SmallActionText>
          {` ${I18n.get('user-revalidateterms-and')} `}
          <SmallActionText onPress={() => doOpenLegalUrl(I18n.get('auth-revalidateterms-cgu'), eulaUrl)} style={styles.newEULALink}>
            {I18n.get('user-revalidateterms-newenduserlicenseagreement')}
          </SmallActionText>
        </SmallText>
        <PrimaryButton
          style={{ marginTop: UI_SIZES.spacing.large }}
          text={I18n.get('auth-revalidateterms-accept')}
          action={doRevalidateTerms}
        />
        <TouchableOpacity style={{ marginTop: UI_SIZES.spacing.big }} onPress={doRefuseTerms}>
          <SmallBoldText style={styles.refuseButton}>{I18n.get('user-revalidateterms-refuseanddisconnect')}</SmallBoldText>
        </TouchableOpacity>
      </PageViewStyle>
    </PageView>
  );
};

// MAPPING ========================================================================================

export default connect(
  (state: IGlobalState) => ({
    legalUrls: getPlatformLegalUrls(),
  }),
  (dispatch: ThunkDispatch<any, any, any>) =>
    bindActionCreators<IRevalidateTermsScreenEventProps>(
      {
        tryLogout: tryAction(manualLogoutAction),
        tryRevalidate: tryAction(revalidateTermsAction),
      },
      dispatch,
    ),
)(RevalidateTermsScreen);
