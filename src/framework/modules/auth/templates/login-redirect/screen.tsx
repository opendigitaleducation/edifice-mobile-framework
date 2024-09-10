import * as React from 'react';
import { Platform, SafeAreaView, View } from 'react-native';

import { I18n } from '~/app/i18n';
import PrimaryButton from '~/framework/components/buttons/primary';
import { PageView } from '~/framework/components/page';
import { PFLogo } from '~/framework/components/pfLogo';
import { BodyText } from '~/framework/components/text';
import { Image } from '~/framework/util/media';

import styles from './styles';
import { LoginRedirectScreenPrivateProps } from './types';

const LoginRedirectPage = (props: LoginRedirectScreenPrivateProps) => {
  const { route } = props;

  return (
    <PageView>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <PFLogo pf={route.params.platform} />
          <View style={styles.infos}>
            <BodyText style={styles.text}>{I18n.get('auth-redirect-text')}</BodyText>
            <Image source={require('ASSETS/platforms/icon-ent77.png')} style={styles.icon} />
          </View>
          <PrimaryButton
            text={I18n.get('auth-redirect-button')}
            url={I18n.get(Platform.OS === 'android' ? 'auth-redirect-androidurl' : 'auth-redirect-iosurl')}
          />
        </View>
      </SafeAreaView>
    </PageView>
  );
};

export default LoginRedirectPage;
