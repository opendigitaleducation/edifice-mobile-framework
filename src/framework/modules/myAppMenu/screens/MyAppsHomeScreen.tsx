import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { I18n } from '~/app/i18n';
import SecondaryButton from '~/framework/components/buttons/secondary';
import { TouchableSelectorPictureCard } from '~/framework/components/card/pictureCard';
import { UI_SIZES } from '~/framework/components/constants';
import GridList from '~/framework/components/GridList';
import FlatList from '~/framework/components/list/flat-list';
import { PageView } from '~/framework/components/page';
import ScrollView from '~/framework/components/scrollView';
import { HeadingSText } from '~/framework/components/text';
import OtherModuleElement from '~/framework/modules/myAppMenu/components/other-module';
import { IMyAppsNavigationParams, myAppsRouteNames } from '~/framework/modules/myAppMenu/navigation';
import { AnyNavigableModule, NavigableModuleArray } from '~/framework/util/moduleTool';
import { isEmpty } from '~/framework/util/object';

export interface MyAppsHomeScreenProps extends NativeStackScreenProps<IMyAppsNavigationParams, typeof myAppsRouteNames.Home> {
  modules: NavigableModuleArray;
  secondaryModules: NavigableModuleArray;
  connectors: NavigableModuleArray;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  flatlist: { paddingHorizontal: UI_SIZES.spacing.medium },
  image: { height: 64, width: '100%' },
  otherModules: { paddingBottom: UI_SIZES.spacing.major },
  otherModulesTitle: {
    marginBottom: UI_SIZES.spacing.small,
    marginTop: UI_SIZES.spacing.small,
    paddingHorizontal: UI_SIZES.spacing.medium,
  },
  webButton: { marginBottom: UI_SIZES.spacing.major },
});

const MyAppsHomeScreen = (props: MyAppsHomeScreenProps) => {
  const renderGrid = () => {
    const allModules = (props.modules ?? [])?.sort((a, b) =>
      I18n.get(a.config.displayI18n).localeCompare(I18n.get(b.config.displayI18n)),
    ) as NavigableModuleArray;

    const renderGridItem = ({ item }: { item: AnyNavigableModule }) => {
      return (
        <TouchableSelectorPictureCard
          onPress={() => props.navigation.navigate(item.config.routeName)}
          text={I18n.get(item.config.displayI18n)}
          picture={
            item.config.displayPicture
              ? item.config.displayPicture.type === 'Svg'
                ? { ...item.config.displayPicture, height: 64, width: '100%' }
                : item.config.displayPicture.type === 'Image'
                  ? { ...item.config.displayPicture }
                  : /* item.config.displayPicture.type === 'Icon' */ { ...item.config.displayPicture, size: 64 }
              : {
                  color: item.config.iconColor,

                  name: item.config.iconName,

                  size: 64,
                  // Fallback on legacy moduleConfig properties
                  type: 'Icon',
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
        alwaysBounceVertical={false}
        overScrollMode="never"
        contentContainerStyle={styles.container}
        bottomInset={false}
      />
    );
  };

  const renderOtherModules = () => {
    if (isEmpty(props.secondaryModules) && isEmpty(props.connectors)) return null;
    const secondaryModules = (props.secondaryModules ?? [])?.sort((a, b) =>
      I18n.get(a.config.displayI18n).localeCompare(I18n.get(b.config.displayI18n)),
    ) as NavigableModuleArray;
    const connectors = (props.connectors ?? [])?.sort((a, b) =>
      I18n.get(a.config.displayI18n).localeCompare(I18n.get(b.config.displayI18n)),
    ) as NavigableModuleArray;
    return (
      <View style={styles.otherModules}>
        <HeadingSText style={styles.otherModulesTitle}>{I18n.get('myapp-othermodules-title')}</HeadingSText>

        <FlatList
          bottomInset={false}
          renderItem={({ item }) => <OtherModuleElement item={item} type="secondaryModule" />}
          data={secondaryModules}
          style={styles.flatlist}
        />
        <FlatList
          bottomInset={false}
          renderItem={({ item }) => <OtherModuleElement item={item} type="connector" />}
          data={connectors}
          style={styles.flatlist}
        />
      </View>
    );
  };

  return (
    <PageView>
      <ScrollView bottomInset={false}>
        {renderGrid()}
        {renderOtherModules()}
        <View style={styles.webButton}>
          <SecondaryButton text={I18n.get('myapp-accessweb')} url="/welcome" />
        </View>
      </ScrollView>
    </PageView>
  );
};

export default MyAppsHomeScreen;
