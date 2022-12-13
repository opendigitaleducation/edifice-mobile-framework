// Libraries
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import I18n from 'i18n-js';
import * as React from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { connect } from 'react-redux';

import theme from '~/app/theme';
import GridList from '~/framework/components/GridList';
import { TouchableSelectorPictureCard } from '~/framework/components/card/pictureCard';
import { UI_SIZES } from '~/framework/components/constants';
import { PageView } from '~/framework/components/page';
import appConf from '~/framework/util/appConf';
import { H1, LightP } from '~/ui/Typography';

import { AuthRouteNames, IAuthNavigationParams, getLoginRouteName } from '../navigation';

// Props definition -------------------------------------------------------------------------------

interface IPlatformSelectPageDataProps {
  // No props.
}

export type IPlatformSelectScreenProps = IPlatformSelectPageDataProps &
  NativeStackScreenProps<IAuthNavigationParams, AuthRouteNames.platforms>;

// State definition -------------------------------------------------------------------------------

// No state

// Styles -----------------------------------------------------------------------------------------

const styles = StyleSheet.create({
  h1: {
    color: theme.ui.text.regular,
    fontSize: 20,
    fontWeight: 'normal',
    marginTop: UI_SIZES.spacing.medium + UI_SIZES.screen.topInset,
    textAlign: 'center',
  },
  lightP: { textAlign: 'center', marginBottom: UI_SIZES.spacing.small },
  picture: { height: 64, width: '100%' },
});

// Main component ---------------------------------------------------------------------------------

export class PlatformSelectScreen extends React.PureComponent<IPlatformSelectScreenProps, object> {
  public render() {
    const { navigation } = this.props;

    return (
      <>
        <PageView>
          {Platform.select({
            ios: <StatusBar barStyle="dark-content" />,
            android: <StatusBar backgroundColor={theme.ui.background.page} barStyle="dark-content" />,
          })}
          <GridList
            data={appConf.platforms}
            renderItem={({ item }) => (
              <TouchableSelectorPictureCard
                picture={
                  item.logoType === 'Image' ? { type: 'Image', source: item.logo } : { type: item.logoType, name: item.logo }
                }
                pictureStyle={styles.picture}
                text={item.displayName}
                onPress={() => {
                  navigation.navigate(getLoginRouteName(item), { platform: item });
                }}
              />
            )}
            keyExtractor={item => item.url}
            ListHeaderComponent={
              <>
                <H1 style={styles.h1}>{I18n.t('welcome')}</H1>
                <LightP style={styles.lightP}>{I18n.t('select-platform')}</LightP>
              </>
            }
            alwaysBounceVertical={false}
            overScrollMode="never"
            ListFooterComponent={<View style={{ paddingBottom: UI_SIZES.screen.bottomInset }} />}
            gap={UI_SIZES.spacing.big}
            gapOutside={UI_SIZES.spacing.big}
          />
        </PageView>
      </>
    );
  }

  // Event handlers
}

export default connect(
  (state: any, props: any) => ({}),
  dispatch => ({}),
)(PlatformSelectScreen);
