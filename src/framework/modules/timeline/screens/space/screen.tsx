import * as React from 'react';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import LottieView from 'lottie-react-native';

import styles from './styles';
import { TimelineSpaceScreenPrivateProps } from './types';

import { I18n } from '~/app/i18n';
import PrimaryButton from '~/framework/components/buttons/primary';
import { Svg } from '~/framework/components/picture';
import ScrollView from '~/framework/components/scrollView';
import { BodyText, HeadingXSText } from '~/framework/components/text';
import { ITimelineNavigationParams, timelineRouteNames } from '~/framework/modules/timeline/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';
import { openUrl } from '~/framework/util/linking';
import { Image } from '~/framework/util/media';
import { Trackers } from '~/framework/util/tracker';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<ITimelineNavigationParams, typeof timelineRouteNames.space>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('user-space-title'),
  }),
  headerShadowVisible: false,
  headerStyle: { backgroundColor: '#1C1C73' },
});

const animationSource = require('ASSETS/animations/space/modal.json');
const pic = require('ASSETS/images/space/person.png');

function TimelineSpaceScreen(props: TimelineSpaceScreenPrivateProps) {
  const onPressButton = () => {
    Trackers.trackEvent('onboarding', 'Inscription classe découverte');
    openUrl(I18n.get('user-space-buttonurl'));
  };
  return (
    <ScrollView bottomInset style={styles.content}>
      <LottieView source={animationSource} autoPlay loop={false} speed={0.5} style={styles.animation} />
      <Image source={pic} style={styles.pic} />
      <HeadingXSText style={styles.title}>{I18n.get('user-space-titlecontent')}</HeadingXSText>
      <BodyText style={styles.text}>{I18n.get('user-space-text')}</BodyText>
      <PrimaryButton
        style={styles.button}
        text={I18n.get('user-space-button')}
        iconRight="pictos-external-link"
        action={onPressButton}
      />
      <Svg name="space-edi2" style={styles.svgEdi} />
      <Svg name="space-rocket" style={styles.svgRocket} />
      <Svg name="space-moon" style={styles.svgMoon} />
      <Svg name="space-star1" style={styles.svgStar1} />
      <Svg name="space-star2" style={styles.svgStar2} />
      <Svg name="space-star3" style={styles.svgStar3} />
    </ScrollView>
  );
}

export default TimelineSpaceScreen;
