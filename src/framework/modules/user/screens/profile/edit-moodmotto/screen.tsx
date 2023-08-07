import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';

import { I18n } from '~/app/i18n';
import { KeyboardPageView, PageView } from '~/framework/components/page';
import { UserNavigationParams, userRouteNames } from '~/framework/modules/user/navigation';
import { navBarOptions } from '~/framework/navigation/navBar';

import styles from './styles';
import type { UserEditMoodMottoScreenProps } from './types';
import { Alert, Image, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { NavBarAction } from '~/framework/components/navigation';
import { userService } from '~/framework/modules/user/service';
import Toast from '~/framework/components/toast';
import { UNSTABLE_usePreventRemove } from '@react-navigation/native';
import { clearConfirmNavigationEvent, handleRemoveConfirmNavigationEvent } from '~/framework/navigation/helper';
import InputContainer from '~/framework/components/inputs/container';
import MultilineTextInput from '~/framework/components/inputs/multiline';
import { CaptionText } from '~/framework/components/text';
import appConf from '~/framework/util/appConf';
import { View } from 'react-native';
import { UI_SIZES } from '~/framework/components/constants';
export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<UserNavigationParams, typeof userRouteNames.editMoodMotto>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('user-profile-mood-motto'),
  }),
});

const UserEditMoodMottoScreen = (props: UserEditMoodMottoScreenProps) => {
  const { route, navigation } = props;

  const [mood, setMood] = React.useState<string>();
  const [motto, setMotto] = React.useState<string>();
  const [isSending, setIsSending] = React.useState<boolean>(false);

  const PageComponent = React.useMemo(() => {
    return Platform.select<typeof KeyboardPageView | typeof PageView>({ ios: KeyboardPageView, android: PageView })!;
  }, []);

  const scrollViewRef = React.useRef<ScrollView>(null);

  const moods = ['default', 'happy', 'proud', 'dreamy', 'love', 'tired', 'angry', 'worried', 'sick', 'joker', 'sad'];

  const widthMood = React.useMemo(() => (UI_SIZES.screen.width - 2 * UI_SIZES.spacing.medium - 3 * UI_SIZES.spacing.small) / 4, []);

  const renderMoodPicture = {
    ['1d']: {
      ['angry']: require('ASSETS/images/moods/1d/angry.png'),
      ['dreamy']: require('ASSETS/images/moods/1d/dreamy.png'),
      ['happy']: require('ASSETS/images/moods/1d/happy.png'),
      ['joker']: require('ASSETS/images/moods/1d/joker.png'),
      ['love']: require('ASSETS/images/moods/1d/love.png'),
      ['default']: require('ASSETS/images/moods/1d/none.png'),
      ['proud']: require('ASSETS/images/moods/1d/proud.png'),
      ['sad']: require('ASSETS/images/moods/1d/sad.png'),
      ['sick']: require('ASSETS/images/moods/1d/sick.png'),
      ['tired']: require('ASSETS/images/moods/1d/tired.png'),
      ['worried']: require('ASSETS/images/moods/1d/worried.png'),
    },
    ['2d']: {
      ['angry']: require('ASSETS/images/moods/2d/angry.png'),
      ['dreamy']: require('ASSETS/images/moods/2d/dreamy.png'),
      ['happy']: require('ASSETS/images/moods/2d/happy.png'),
      ['joker']: require('ASSETS/images/moods/2d/joker.png'),
      ['love']: require('ASSETS/images/moods/2d/love.png'),
      ['default']: require('ASSETS/images/moods/2d/none.png'),
      ['proud']: require('ASSETS/images/moods/2d/proud.png'),
      ['sad']: require('ASSETS/images/moods/2d/sad.png'),
      ['sick']: require('ASSETS/images/moods/2d/sick.png'),
      ['tired']: require('ASSETS/images/moods/2d/tired.png'),
      ['worried']: require('ASSETS/images/moods/2d/worried.png'),
    },
  };

  const onSaveMoodMotto = async () => {
    if (mood === route.params.mood && motto === route.params.motto) navigation.goBack();
    try {
      setIsSending(true);

      const body = JSON.stringify({ mood, motto });
      await userService.person.put(route.params.userId, body);
      navigation.navigate(userRouteNames.profile, { newMood: mood, newMotto: motto });
      Toast.showSuccess(I18n.get('user-profile-toast-editMoodMottoSuccess'));
    } catch {
      Toast.showError(I18n.get('toast-error-text'));
    } finally {
      setIsSending(false);
    }
  };

  const renderMoodItem = moodValue => {
    const degre = appConf.is1d ? '1d' : '2d';
    return (
      <TouchableOpacity
        style={[styles.mood, { width: widthMood }, moodValue === mood ? styles.moodActive : null]}
        onPress={() => setMood(moodValue)}>
        <Image source={renderMoodPicture[degre][moodValue]} style={styles.moodPicture} />
        <CaptionText>{I18n.get(`user-profile-mood-${moodValue}-${degre}`).toLowerCase()}</CaptionText>
      </TouchableOpacity>
    );
  };

  UNSTABLE_usePreventRemove((route.params.mood !== mood || route.params.motto !== motto) && !isSending, ({ data }) => {
    Alert.alert(I18n.get('user-profile-preventremove-title'), I18n.get('user-profile-preventremove-text'), [
      {
        text: I18n.get('common-quit'),
        style: 'destructive',
        onPress: () => {
          handleRemoveConfirmNavigationEvent(data.action, navigation);
        },
      },
      {
        text: I18n.get('common-continue'),
        style: 'default',
        onPress: () => {
          clearConfirmNavigationEvent();
        },
      },
    ]);
  });

  React.useEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => <NavBarAction icon="ui-check" onPress={onSaveMoodMotto} />,
    });
  });

  React.useEffect(() => {
    setMood(route.params.mood);
    setMotto(route.params.motto);
  }, []);

  return (
    <PageComponent style={styles.page}>
      <ScrollView ref={scrollViewRef}>
        <InputContainer
          label={{ text: I18n.get('user-profile-mood') }}
          input={<View style={styles.moods}>{moods.map(mood => renderMoodItem(mood))}</View>}
        />
        <InputContainer
          label={{ text: I18n.get('user-profile-motto') }}
          input={
            <MultilineTextInput
              placeholder={I18n.get('user-profile-mottoEmpty')}
              value={motto}
              numberOfLines={4}
              onChangeText={txt => setMotto(txt)}
              maxLength={75}
              onFocus={() => scrollViewRef.current?.scrollToEnd()}
            />
          }
        />
      </ScrollView>
    </PageComponent>
  );
};

export default UserEditMoodMottoScreen;