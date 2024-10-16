import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import { connect, useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import { EmptyConnectionScreen } from '~/framework/components/empty-screens';
import { ListItem } from '~/framework/components/listItem';
import { PageView } from '~/framework/components/page';
import { openPDFReader } from '~/framework/components/pdf/pdf-reader';
import { Icon } from '~/framework/components/picture';
import { SmallText } from '~/framework/components/text';
import { useConstructor } from '~/framework/hooks/constructor';
import { loadPlatformLegalUrlsAction } from '~/framework/modules/auth/actions';
import { getPlatform, getPlatformLegalUrls } from '~/framework/modules/auth/reducer';
import { UserNavigationParams, userRouteNames } from '~/framework/modules/user/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';
import { Loading } from '~/ui/Loading';

import styles from './styles';
import type { LegalItem, UserLegalNoticeScreenPrivateProps, UserLegalNoticeScreenProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<UserNavigationParams, typeof userRouteNames.legalNotice>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('user-legalnotice-title'),
    titleTestID: 'legal-title',
    backButtonTestID: 'legal-back',
  }),
});

const LEGAL_ITEMS: LegalItem[] = [
  { item: 'userCharter', testID: 'legal-user-charter' },
  { item: 'cgu', testID: 'legal-user-cgu' },
  { item: 'personalDataProtection', testID: 'legal-user-data-protection' },
  { item: 'cookies', testID: 'legal-cookies' },
];

function UserLegalNoticeScreen(
  props: UserLegalNoticeScreenPrivateProps & Pick<Required<UserLegalNoticeScreenPrivateProps>, 'legalUrls'>,
) {
  const openLegalItem = React.useCallback(
    (legalItem: string) => {
      const selectedLegalTitle = I18n.get(`user-legalnotice-${legalItem.toLowerCase()}`);
      const selectedLegalUrl = props.legalUrls[legalItem];
      openPDFReader({ title: selectedLegalTitle, src: selectedLegalUrl });
    },
    [props.legalUrls],
  );

  const renderLegalItem = React.useCallback(
    (legalItem: LegalItem) => (
      <TouchableOpacity onPress={() => openLegalItem(legalItem.item)} key={legalItem.item}>
        <ListItem
          leftElement={<SmallText>{I18n.get(`user-legalnotice-${legalItem.item.toLowerCase()}`)}</SmallText>}
          rightElement={<Icon name="arrow_down" color={theme.palette.primary.regular} style={styles.itemIcon} />}
          testID={legalItem.testID}
        />
      </TouchableOpacity>
    ),
    [openLegalItem],
  );

  return <PageView>{LEGAL_ITEMS.map(legalItem => renderLegalItem(legalItem))}</PageView>;
}

const UserLegalNoticeScreenLoader = (props: UserLegalNoticeScreenPrivateProps) => {
  const { legalUrls } = props;
  const platform = getPlatform();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

  useConstructor(async () => {
    if (/* !legalUrls && */ platform) {
      // here we re-fetch legalUrl every time we enter this screen to ensure we have updated versions
      dispatch(loadPlatformLegalUrlsAction(platform));
    }
  });

  if (!platform) return <EmptyConnectionScreen />;
  if (!legalUrls) return <Loading />;
  else return <UserLegalNoticeScreen {...props} legalUrls={legalUrls} />;
};

export default connect((state: IGlobalState, props: UserLegalNoticeScreenProps) => {
  return {
    legalUrls: getPlatformLegalUrls(),
  };
})(UserLegalNoticeScreenLoader);
