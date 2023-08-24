import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Platform } from 'react-native';

import { I18n } from '~/app/i18n';
import InputContainer from '~/framework/components/inputs/container';
import MultilineTextInput from '~/framework/components/inputs/multiline';
import { NavBarAction } from '~/framework/components/navigation';
import { KeyboardPageView, PageView } from '~/framework/components/page';
import ScrollView from '~/framework/components/scrollView';
import Toast from '~/framework/components/toast';
import usePreventBack from '~/framework/hooks/usePreventBack';
import { UserNavigationParams, userRouteNames } from '~/framework/modules/user/navigation';
import { userService } from '~/framework/modules/user/service';
import { navBarOptions } from '~/framework/navigation/navBar';

import styles from './styles';
import type { UserEditDescriptionScreenProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<UserNavigationParams, typeof userRouteNames.editDescription>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('user-profile-about'),
  }),
});

const UserEditDescriptionScreen = (props: UserEditDescriptionScreenProps) => {
  const { route, navigation } = props;

  const [description, setDescription] = React.useState<string>();
  const [isSending, setIsSending] = React.useState<boolean>(false);

  const PageComponent = React.useMemo(() => {
    return Platform.select<typeof KeyboardPageView | typeof PageView>({ ios: KeyboardPageView, android: PageView })!;
  }, []);

  const onSaveDescription = async () => {
    if (description === route.params.description) navigation.goBack();
    try {
      setIsSending(true);

      const body = JSON.stringify({ health: description?.trim() });
      await userService.person.put(route.params.userId, body);
      navigation.navigate(userRouteNames.profile, { newDescription: description?.trim() });
      Toast.showSuccess(I18n.get('user-profile-toast-editAboutSuccess'));
    } catch {
      Toast.showError(I18n.get('toast-error-text'));
    } finally {
      setIsSending(false);
    }
  };

  usePreventBack({
    title: I18n.get('user-profile-preventremove-title'),
    text: I18n.get('user-profile-preventremove-text'),
    showAlert: route.params.description !== description && !isSending,
  });

  React.useEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => <NavBarAction icon="ui-check" onPress={onSaveDescription} />,
    });
  });

  React.useEffect(() => {
    setDescription(route.params.description);
  }, []);

  return (
    <PageComponent style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <InputContainer
          label={{ text: 'Description' }}
          input={
            <MultilineTextInput
              placeholder={I18n.get('user-profile-about-empty')}
              numberOfLines={15}
              value={description}
              onChangeText={txt => setDescription(txt)}
            />
          }
        />
      </ScrollView>
    </PageComponent>
  );
};

export default UserEditDescriptionScreen;