import React from 'react';
import { ColorValue, View } from 'react-native';

import { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';

import styles from './styles';
import { AudienceViewsScreenProps } from './types';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyConnectionScreen } from '~/framework/components/empty-screens';
import { PageView } from '~/framework/components/page';
import { Svg } from '~/framework/components/picture';
import { BodyText, HeadingMText } from '~/framework/components/text';
import { ContentLoader } from '~/framework/hooks/loader';
import { audienceService } from '~/framework/modules/audience/service';
import { AccountType } from '~/framework/modules/auth/model';
import { IModalsNavigationParams, ModalsRouteNames } from '~/framework/navigation/modals';
import { navBarOptions } from '~/framework/navigation/navBar';
import { accountTypeInfos } from '~/framework/util/accountType';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<IModalsNavigationParams, typeof ModalsRouteNames.AudienceViews>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('audience-views-title'),
  }),
});

const AudienceViewsScreen = (props: AudienceViewsScreenProps) => {
  const { module, resourceId, resourceType } = props.route.params.referer;

  const [nbViews, setNbViews] = React.useState<number>(0);
  const [nbUniqueViews, setNbUniqueViews] = React.useState<number>(0);
  const [viewsPerProfile, setViewsPerProfile] = React.useState<{ profile: AccountType; counter: number }[]>([]);

  const loadData = React.useCallback(async () => {
    try {
      const dt = await audienceService.view.getDetails({ module, resourceId, resourceType });
      setNbViews(dt.viewsCounter);
      setNbUniqueViews(dt.uniqueViewsCounter);
      setViewsPerProfile(dt.uniqueViewsPerProfile);
    } catch (e) {
      console.error('[BlogAudienceScreen] error :', e);
      throw new Error();
    }
  }, [module, resourceId, resourceType]);

  const renderItem = ({
    color,
    icon,
    label,
    last,
    nb,
  }: {
    nb: number;
    label: string;
    icon: string;
    color: ColorValue;
    last?: boolean;
  }) => {
    return (
      <View style={[styles.item, last ? styles.lastItem : {}]}>
        <View style={[styles.icon, { backgroundColor: color ?? theme.palette.grey.pearl }]}>
          <Svg
            name={icon}
            fill={color ? theme.palette.grey.white : theme.palette.grey.black}
            height={UI_SIZES.elements.icon.small}
            width={UI_SIZES.elements.icon.small}
          />
        </View>
        <HeadingMText style={styles.nb}>{nb}</HeadingMText>
        <BodyText>{label}</BodyText>
      </View>
    );
  };

  const renderContent = () => {
    return (
      <PageView style={styles.container} showNetworkBar={false}>
        {renderItem({ icon: 'ui-see', label: I18n.get('audience-views-views'), nb: nbViews })}
        {renderItem({ icon: 'ui-users', label: I18n.get('audience-views-uniqueviews'), nb: nbUniqueViews })}
        <View style={styles.subItems}>
          {viewsPerProfile.map((item, index) =>
            renderItem({
              color: accountTypeInfos[item.profile].color.regular,
              icon: accountTypeInfos[item.profile].icon,
              label: accountTypeInfos[item.profile].text,
              last: index === viewsPerProfile.length - 1,
              nb: item.counter,
            }),
          )}
        </View>
      </PageView>
    );
  };

  return <ContentLoader loadContent={loadData} renderContent={renderContent} renderError={() => <EmptyConnectionScreen />} />;
};

export default AudienceViewsScreen;
