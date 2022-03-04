import I18n from 'i18n-js';
import * as React from 'react';
import { View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Swiper from 'react-native-swiper';
import { NavigationInjectedProps } from 'react-navigation';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { TextSemiBold, H1 } from '~/framework/components/text';
import appConf from '~/framework/util/appConf';
import { openUrl } from '~/framework/util/linking';
import withViewTracking from '~/framework/util/tracker/withViewTracking';
import { getLoginRouteName } from '~/navigation/LoginNavigator';
import { FlatButton } from '~/ui';
import { selectPlatform } from '~/user/actions/platform';
import { NamedSVG } from '~/framework/components/namedSVG';

// TYPES ==========================================================================================

interface IOnboardingScreenProps extends NavigationInjectedProps<object> {
  dispatch: ThunkDispatch<any, any, any>;
}

// COMPONENT ======================================================================================

class OnboardingScreen extends React.PureComponent<IOnboardingScreenProps> {
  // DECLARATIONS ===================================================================================

  // RENDER =========================================================================================

  render() {
    const { navigation, dispatch } = this.props;
    const isPlatformIos = Platform.OS === 'ios';
    const appName = I18n.t('user.onboardingScreen.appName');
    const isOneOrNeo = appName.includes('ONE Pocket') || appName.includes('NEO Pocket');
    const { width } = UI_SIZES.screen;
    const svgSize = width * 0.8;
    const onboardingTexts = I18n.t('user.onboardingScreen.onboarding');

    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.color.background.page,
          paddingVertical: 20,
        }}>
        <View style={{ flex: 4 }}>
          <H1
            style={{
              color: theme.color.secondary.regular,
              alignSelf: 'center',
              fontSize: 24,
              height: 80,
              lineHeight: undefined,
            }}>
            {I18n.t('user.onboardingScreen.appName').toUpperCase()}
          </H1>
          <Swiper
            autoplay
            autoplayTimeout={5}
            dotStyle={{
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: theme.color.background.page,
              borderColor: theme.color.secondary.regular,
              borderWidth: 1.5,
            }}
            activeDotStyle={{
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: theme.color.secondary.regular,
            }}>
            {(onboardingTexts as unknown as string[]).map((onboardingText, index) => (
              <View
                style={{
                  justifyContent: 'space-around',
                  alignItems: 'center',
                  alignSelf: 'center',
                  height: '85%',
                  width: '80%',
                }}>
                <NamedSVG name={`onboarding-${index + 1}`} width={svgSize} height={svgSize} />
                <TextSemiBold style={{ textAlign: 'center', fontSize: 18 }}>{onboardingText}</TextSemiBold>
              </View>
            ))}
          </Swiper>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{ height: 90, justifyContent: 'space-between' }}>
            <FlatButton
              title={I18n.t('user.onboardingScreen.joinMyNetwork')}
              customButtonStyle={{
                backgroundColor: theme.color.secondary.regular,
                width: 230,
                alignItems: 'center',
              }}
              onPress={() => {
                const hasMultiplePlatforms = appConf.platforms.length > 1;
                if (!hasMultiplePlatforms) {
                  dispatch(selectPlatform(appConf.platforms[0].name));
                }
                navigation.navigate(hasMultiplePlatforms ? 'PlatformSelect' : getLoginRouteName());
              }}
            />
            {/* Note: This button has to be hidden on iOs (only for ONE/NEO), since Apple doesn't approve
            when the url directs the user to external mechanisms for purchase and subscription to the app. */}
            {isPlatformIos && isOneOrNeo ? null : (
              <FlatButton
                title={I18n.t('user.onboardingScreen.discover')}
                customTextStyle={{ color: theme.color.secondary.regular }}
                customButtonStyle={{
                  backgroundColor: theme.color.background.page,
                  borderColor: theme.color.secondary.regular,
                  borderWidth: 1,
                  width: 230,
                  alignItems: 'center',
                }}
                onPress={() => {
                  const url = I18n.t('user.onboardingScreen.discoverLink');
                  openUrl(url);
                }}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // LIFECYCLE ======================================================================================

  // METHODS ========================================================================================
}

// UTILS ==========================================================================================

// MAPPING ========================================================================================

const OnboardingScreen_Connected = connect()(OnboardingScreen);
export default withViewTracking('user/onboarding')(OnboardingScreen_Connected);
