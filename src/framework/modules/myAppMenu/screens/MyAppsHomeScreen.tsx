import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { I18n } from '~/app/i18n';
import GridList from '~/framework/components/GridList';
import SecondaryButton from '~/framework/components/buttons/secondary';
import { TouchableSelectorPictureCard } from '~/framework/components/card/pictureCard';
import { UI_SIZES } from '~/framework/components/constants';
import { InfoBubble } from '~/framework/components/infoBubble';
import { PageView } from '~/framework/components/page';
import { IMyAppsNavigationParams, myAppsRouteNames } from '~/framework/modules/myAppMenu/navigation';
import { storage } from '~/framework/modules/myAppMenu/storage';
import { AnyNavigableModule, NavigableModuleArray } from '~/framework/util/moduleTool';

export interface MyAppsHomeScreenProps extends NativeStackScreenProps<IMyAppsNavigationParams, typeof myAppsRouteNames.Home> {
  modules: NavigableModuleArray;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  footer: { flexGrow: 1, justifyContent: 'flex-end', marginVertical: UI_SIZES.spacing.big },
  image: { height: 64, width: '100%' },
});

const MyAppsHomeScreen = (props: MyAppsHomeScreenProps) => {
  const renderFooter = () => {
    return (
      <View>
        <SecondaryButton text={I18n.get('myapp-accessweb')} url="/welcome" />
        <InfoBubble
          infoText={I18n.get('myapp-infobubble-text', { appName: DeviceInfo.getApplicationName() })}
          infoTitle={I18n.get('myapp-infobubble-title')}
          infoImage={require('ASSETS/images/my-apps-infobubble.png')}
          infoBubbleType="floating"
          storageKey={storage.computeKey('infobubble-ack')}
        />
      </View>
    );
  };

  const renderGrid = (modules?: NavigableModuleArray) => {
    const allModules = (modules ?? [])?.sort((a, b) =>
      I18n.get(a.config.displayI18n).localeCompare(I18n.get(b.config.displayI18n)),
    ) as NavigableModuleArray;

    const renderGridItem = ({ item }: { item: AnyNavigableModule }) => {
      return (
        <TouchableSelectorPictureCard
          onPress={() => props.navigation.navigate(item.config.routeName)}
          text={I18n.get(item.config.displayI18n)}
          picture={
            item.config.displayPicture
              ? item.config.displayPicture.type === 'NamedSvg'
                ? { ...item.config.displayPicture, height: 64, width: '100%' }
                : item.config.displayPicture.type === 'Image'
                  ? { ...item.config.displayPicture }
                  : /* item.config.displayPicture.type === 'Icon' */ { ...item.config.displayPicture, size: 64 }
              : {
                  // Fallback on legacy moduleConfig properties
                  type: 'Icon',
                  // eslint-disable-next-line @typescript-eslint/dot-notation
                  color: item.config['iconColor'],
                  // eslint-disable-next-line @typescript-eslint/dot-notation
                  name: item.config['iconName'],
                  size: 64,
                }
          }
          pictureStyle={item.config.displayPicture?.type === 'Image' ? styles.image : {}}
        />
      );
    };

    return (
      <GridList
        data={allModules}
        renderItem={renderGridItem}
        keyExtractor={item => item.config.name}
        gap={UI_SIZES.spacing.big}
        gapOutside={UI_SIZES.spacing.big}
        ListFooterComponent={renderFooter()}
        ListFooterComponentStyle={styles.footer}
        alwaysBounceVertical={false}
        overScrollMode="never"
        contentContainerStyle={styles.container}
      />
    );
  };

  return <PageView>{renderGrid(props.modules)}</PageView>;
};

export default MyAppsHomeScreen;
