import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Keyboard, Platform } from 'react-native';
import { KeyboardAvoidingFlatList } from 'react-native-keyboard-avoiding-scroll-view';

import { I18n } from '~/app/i18n';
import { UI_SIZES } from '~/framework/components/constants';
import InputContainer from '~/framework/components/inputs/container';
import TextInput from '~/framework/components/inputs/text';
import FlatList from '~/framework/components/list/flat-list';
import { NavBarAction } from '~/framework/components/navigation';
import { KeyboardPageView, PageView } from '~/framework/components/page';
import Toast from '~/framework/components/toast';
import usePreventBack from '~/framework/hooks/prevent-back';
import { HobbieVisibility } from '~/framework/modules/user/model';
import { UserNavigationParams, userRouteNames } from '~/framework/modules/user/navigation';
import { userService } from '~/framework/modules/user/service';
import { navBarOptions } from '~/framework/navigation/navBar';

import styles from './styles';
import type { ObjectHobbies, UserEditHobbiesScreenProps } from './types';

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<UserNavigationParams, typeof userRouteNames.editHobbies>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('user-profile-hobbies'),
  }),
});

const i18nHobbies = {
  animals: {
    title: 'user-profile-editHobbies-animals',
    empty: 'user-profile-editHobbies-emptyanimals',
  },
  books: {
    title: 'user-profile-editHobbies-books',
    empty: 'user-profile-editHobbies-emptybooks',
  },
  cinema: {
    title: 'user-profile-editHobbies-cinema',
    empty: 'user-profile-editHobbies-emptycinema',
  },
  music: {
    title: 'user-profile-editHobbies-music',
    empty: 'user-profile-editHobbies-emptymusic',
  },
  places: {
    title: 'user-profile-editHobbies-places',
    empty: 'user-profile-editHobbies-emptyplaces',
  },
  sport: {
    title: 'user-profile-editHobbies-sport',
    empty: 'user-profile-editHobbies-emptysport',
  },
};

const UserEditHobbiesScreen = (props: UserEditHobbiesScreenProps) => {
  const { route, navigation } = props;
  const { userId, description, descriptionVisibility, mood, motto } = route.params;

  const [initialHobbies, setInitialHobbies] = React.useState<ObjectHobbies>();
  const [hobbies, setHobbies] = React.useState<ObjectHobbies>();
  const [isSending, setIsSending] = React.useState<boolean>(false);
  const [indexHobbie, setIndexHobbie] = React.useState<number>();

  const ListComponent = React.useMemo(() => {
    return Platform.select<React.ComponentType<any>>({
      ios: FlatList,
      android: KeyboardAvoidingFlatList,
    })!;
  }, []);
  const PageComponent = React.useMemo(() => {
    return Platform.select<typeof KeyboardPageView | typeof PageView>({ ios: KeyboardPageView, android: PageView })!;
  }, []);

  const flatListRef: { current: any } = React.useRef<typeof FlatList>(null);
  const inputRefs: any[] = [];

  const init = () => {
    const ObjectHobbies = route.params.hobbies.reduce((acc, obj) => {
      const { category, values, visibility } = obj;
      acc[category] = { values, visibility };
      return acc;
    }, {});
    setInitialHobbies(ObjectHobbies);
    setHobbies(ObjectHobbies);
  };

  const handleChangeText = (text, category) => {
    const newHobbies = { ...hobbies };
    newHobbies[category].values = text;
    setHobbies(newHobbies);
  };

  const handleChangeVisibility = (visibility, category) => {
    const newVisibility = visibility === HobbieVisibility.PUBLIC ? HobbieVisibility.PRIVE : HobbieVisibility.PUBLIC;
    const newHobbies = { ...hobbies };
    newHobbies[category].visibility = newVisibility;
    setHobbies(newHobbies);
  };

  const onSubmitEditingInput = index => {
    if (index === route.params.hobbies.length - 1) return;
    return inputRefs[index + 1].focus();
  };

  const onFocusInput = index => {
    setIndexHobbie(index);
    if (Platform.OS !== 'ios') {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index,
          viewPosition: 1,
        });
      }, 100);
    }
  };

  const onSaveHobbies = async () => {
    if (initialHobbies === hobbies) navigation.goBack();
    try {
      setIsSending(true);
      const arrayHobbies = Object.keys(hobbies!).map(category => ({
        category,
        values: hobbies![category].values.trim(),
        visibility: hobbies![category].visibility,
      }));
      const body = JSON.stringify({ hobbies: arrayHobbies });
      await userService.person.put(userId, body);
      navigation.navigate(userRouteNames.profile, {
        newHobbies: arrayHobbies,
        newDescriptionVisibility: descriptionVisibility,
        newDescription: description,
        newMood: mood,
        newMotto: motto,
      });
      Toast.showSuccess(I18n.get('user-profile-toast-editHobbiesSuccess'));
    } catch {
      Toast.showError(I18n.get('toast-error-text'));
    } finally {
      setIsSending(false);
    }
  };

  const renderInput = (item, index) => {
    return (
      <InputContainer
        style={styles.inputContainer}
        label={{ text: I18n.get(i18nHobbies[item.category].title) }}
        input={
          <TextInput
            placeholder={I18n.get(i18nHobbies[item.category].empty)}
            value={hobbies![item.category].values}
            toggleIconOn={hobbies![item.category].visibility === HobbieVisibility.PRIVE ? 'ui-lock' : 'ui-internet'}
            toggleIconOff={hobbies![item.category].visibility === HobbieVisibility.PRIVE ? 'ui-lock' : 'ui-internet'}
            onChangeText={txt => handleChangeText(txt, item.category)}
            onToggle={() => handleChangeVisibility(hobbies![item.category].visibility, item.category)}
            onSubmitEditing={() => onSubmitEditingInput(index)}
            onFocus={() => onFocusInput(index)}
            ref={element => (inputRefs[index] = element)}
            returnKeyType={index + 1 === route.params.hobbies.length ? 'done' : 'next'}
          />
        }
      />
    );
  };

  const renderInputs = () => {
    if (!hobbies) return;
    return (
      <ListComponent
        ref={flatListRef}
        keyboardShouldPersistTaps="handled"
        data={route.params.hobbies}
        removeClippedSubviews={false}
        renderItem={({ item, index }) => renderInput(item, index)}
        showsVerticalScrollIndicator={false}
        initialNumToRender={route.params.hobbies.length}
        keyExtractor={item => item.category}
        bounces={false}
      />
    );
  };

  usePreventBack({
    title: I18n.get('user-profile-preventremove-title'),
    text: I18n.get('user-profile-preventremove-text'),
    showAlert: initialHobbies !== hobbies && !isSending,
  });

  React.useEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => <NavBarAction icon="ui-check" onPress={onSaveHobbies} />,
    });
  });

  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      const keyboardSubscription = Keyboard.addListener('keyboardDidShow', () => {
        setTimeout(() => {
          if (indexHobbie !== undefined && indexHobbie > -1) {
            flatListRef.current?.scrollToIndex({
              index: indexHobbie,
              viewPosition: 1,
              viewOffset: -UI_SIZES.spacing.medium,
            });
          }
        }, 50);
      });
      return () => keyboardSubscription.remove();
    }
  }, [indexHobbie]);

  React.useEffect(() => {
    init();
  }, []);

  return <PageComponent style={styles.page}>{renderInputs()}</PageComponent>;
};

export default UserEditHobbiesScreen;
