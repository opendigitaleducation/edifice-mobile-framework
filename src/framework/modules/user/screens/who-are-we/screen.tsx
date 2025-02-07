import * as React from 'react';
import { Alert, Platform, View } from 'react-native';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import LottieView from 'lottie-react-native';
import DeviceInfo from 'react-native-device-info';
import Rate, { AndroidMarket } from 'react-native-rate';

import styles from './styles';
import type { UserWhoAreWeScreenPrivateProps } from './types';
import { WhoAreWellustrationType, WhoAreWeQuoteType } from './types';

import { I18n } from '~/app/i18n';
import PrimaryButton from '~/framework/components/buttons/primary';
import SecondaryButton from '~/framework/components/buttons/secondary';
import ScrollView from '~/framework/components/scrollView';
import { BodyBoldText, BodyText, HeadingXSText } from '~/framework/components/text';
import { getPlatform } from '~/framework/modules/auth/reducer';
import { UserNavigationParams, userRouteNames } from '~/framework/modules/user/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';
import appConf from '~/framework/util/appConf';
import { Image } from '~/framework/util/media';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<UserNavigationParams, typeof userRouteNames.whoAreWe>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('user-whoarewe-title'),
  }),
});

const animationSource = require('ASSETS/animations/who-are-we.json');
const imageSource = require('ASSETS/images/who-are-we.png');

const { appleId, discoverUrl, entButton, illustration, quote } = appConf.whoAreWe ?? {};

function UserWhoAreWeScreen(props: UserWhoAreWeScreenPrivateProps) {
  const renderIllustration = React.useCallback((type?: WhoAreWellustrationType) => {
    switch (type) {
      case WhoAreWellustrationType.Animation:
        return (
          <View style={styles.animationWrapper}>
            <LottieView source={animationSource} autoPlay loop={false} speed={0.8} style={styles.animationView} />
          </View>
        );
      case WhoAreWellustrationType.Image:
        return (
          <View style={styles.imageWrapper}>
            <Image source={imageSource} style={styles.imageView} resizeMode="contain" />
          </View>
        );
      default:
        return null;
    }
  }, []);

  const renderQuote = React.useCallback((component?: WhoAreWeQuoteType) => {
    switch (component) {
      case WhoAreWeQuoteType.HeadingXSText:
        return (
          <>
            <HeadingXSText>{I18n.get('user-whoarewe-quote-text')}</HeadingXSText>
            <HeadingXSText style={styles.quoteAuthor}>{I18n.get('user-whoarewe-quote-author')}</HeadingXSText>
          </>
        );
      case WhoAreWeQuoteType.BodyBoldText:
        return (
          <>
            <BodyBoldText>{I18n.get('user-whoarewe-quote-text')}</BodyBoldText>
            <HeadingXSText style={[styles.quoteAuthor, styles.noMarginBottom]}>
              {I18n.get('user-whoarewe-quote-author')}
            </HeadingXSText>
          </>
        );
      default:
        return null;
    }
  }, []);

  const renderEntButton = React.useCallback((isEntButton?: boolean) => {
    const pf = getPlatform();
    if (isEntButton) return <SecondaryButton style={styles.buttonDiscover} text={I18n.get('user-whoarewe-entweb')} url={pf?.url} />;
    else return null;
  }, []);

  return (
    <ScrollView bottomInset>
      {renderIllustration(illustration)}
      <View style={styles.textWrapper}>
        {renderQuote(quote)}
        <BodyText>{I18n.get('user-whoarewe-description', { appName: DeviceInfo.getApplicationName() })}</BodyText>
        <PrimaryButton
          style={styles.buttonReview}
          text={I18n.get('user-whoarewe-reviewapp')}
          action={() => {
            const options = {
              AppleAppID: appleId,
              GooglePackageName: DeviceInfo.getBundleId(),
              inAppDelay: 0,
              preferInApp: Platform.OS !== 'android',
              preferredAndroidMarket: AndroidMarket.Google,
            };
            Rate.rate(options, (success, error) => {
              if (error) {
                Alert.alert(I18n.get('user-whoarewe-error-title'), I18n.get('user-whoarewe-error-text'));
                console.error(`WhoAreWeScreen Rate.rate() error: ${error}`);
              }
            });
          }}
        />
        {renderEntButton(entButton)}
        <SecondaryButton style={styles.buttonDiscover} text={I18n.get('user-whoarewe-discoveredifice')} url={discoverUrl} />
      </View>
    </ScrollView>
  );
}

export default UserWhoAreWeScreen;
