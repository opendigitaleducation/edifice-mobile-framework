import { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ColorValue, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyConnectionScreen } from '~/framework/components/empty-screens';
import { PageView } from '~/framework/components/page';
import { NamedSVG } from '~/framework/components/picture';
import { BodyText, HeadingMText } from '~/framework/components/text';
import { ContentLoader } from '~/framework/hooks/loader';
import { AccountType } from '~/framework/modules/auth/model';
import { audienceService } from '~/framework/modules/core/audience/service';
import { IModalsNavigationParams, ModalsRouteNames } from '~/framework/navigation/modals';
import { navBarOptions } from '~/framework/navigation/navBar';
import { accountTypeInfos } from '~/framework/util/accountType';

import styles from './styles';
import { AudienceViewsScreenProps } from './types';

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
  const { module, resourceType, resourceId } = props.route.params.referer;

  const [nbViews, setNbViews] = React.useState<number>(0);
  const [nbUniqueViews, setNbUniqueViews] = React.useState<number>(0);
  const [viewsPerProfile, setViewsPerProfile] = React.useState<{ profile: AccountType; counter: number }[]>([]);

  const loadData = React.useCallback(async () => {
    try {
      const dt = await audienceService.view.getDetails({ module, resourceType, resourceId });
      setNbViews(dt.viewsCounter);
      setNbUniqueViews(dt.uniqueViewsCounter);
      setViewsPerProfile(dt.uniqueViewsPerProfile);
    } catch (e) {
      console.error('[BlogAudienceScreen] error :', e);
      throw new Error();
    }
  }, [module, resourceId, resourceType]);

  const renderItem = ({
    nb,
    label,
    icon,
    color,
    last,
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
          <NamedSVG
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
        {renderItem({ nb: nbViews, label: I18n.get('audience-views-views'), icon: 'ui-see' })}
        {renderItem({ nb: nbUniqueViews, label: I18n.get('audience-views-uniqueviews'), icon: 'ui-users' })}
        <View style={styles.subItems}>
          {viewsPerProfile.map((item, index) =>
            renderItem({
              nb: item.counter,
              label: accountTypeInfos[item.profile].text,
              icon: accountTypeInfos[item.profile].icon,
              color: accountTypeInfos[item.profile].color.regular,
              last: index === viewsPerProfile.length - 1,
            }),
          )}
        </View>
      </PageView>
    );
  };

  return <ContentLoader loadContent={loadData} renderContent={renderContent} renderError={() => <EmptyConnectionScreen />} />;
};

export default AudienceViewsScreen;
