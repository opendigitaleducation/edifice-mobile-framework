import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import moment from 'moment';

import styles from './styles';
import { TimelineSpaceProps } from './types';

import { I18n } from '~/app/i18n';
import { Svg } from '~/framework/components/picture';
import { HeadingXSText, HeadingXXSText } from '~/framework/components/text';
import { timelineRouteNames } from '~/framework/modules/timeline/navigation';
import appConf from '~/framework/util/appConf';

const animationSpaceSource = require('ASSETS/animations/space/card.json');

export function TimelineSpace(props: TimelineSpaceProps) {
  const animationSpaceRef = React.useRef<LottieView>(null);
  const navigation = useNavigation();

  useFocusEffect(() => {
    animationSpaceRef.current?.play();
  });

  const spaceIsVisible = () => {
    if (appConf.space.userType !== props.session?.user.type) return false;
    if (appConf.space.exceptionProject.includes(props.session.platform.name)) return false;
    if (moment().isAfter(appConf.space.expirationDate)) return false;
    if (appConf.space.lang !== I18n.getLanguage()) return false;
    return true;
  };

  return spaceIsVisible() ? (
    <TouchableOpacity
      style={styles.space}
      onPress={() => {
        navigation.navigate(timelineRouteNames.space, {});
      }}>
      <LottieView
        ref={animationSpaceRef}
        source={animationSpaceSource}
        autoPlay
        loop={false}
        speed={0.6}
        style={styles.spaceAnim}
      />
      <View style={styles.spaceBadge}>
        <HeadingXXSText style={styles.spaceBadgeText}>{I18n.get('user-page-spacebadge')}</HeadingXXSText>
      </View>
      <HeadingXSText style={styles.spaceText}>{I18n.get('user-page-spacetext')}</HeadingXSText>
      <Svg name="space-edi" style={styles.spaceSvg} />
    </TouchableOpacity>
  ) : null;
}
