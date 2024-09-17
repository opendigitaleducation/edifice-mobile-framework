import * as React from 'react';
import { RefreshControl, TouchableOpacity, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import FlatList from '~/framework/components/list/flat-list';
import { ListItem } from '~/framework/components/listItem';
import { PageView } from '~/framework/components/page';
import { NamedSVG } from '~/framework/components/picture';
import { BodyBoldText, SmallText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import { Image } from '~/framework/util/media';

import styles from './styles';
import { ResourcePickerProps } from './types';

const ResourcePicker = ({ data, defaultThumbnail, emptyComponent, onPressItem, onRefresh }: ResourcePickerProps) => {
  const listAdditionalStyle = { paddingBottom: data?.length === 0 ? undefined : UI_SIZES.screen.bottomInset };

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await onRefresh();
    } catch {
      Toast.showError(I18n.get('resourcepicker-error-text'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const getKeyExtractor = item => item.id.toString();

  const renderItem = ({ item }) => {
    const shareNumber = item.shared?.length;
    const numberOfLines = 1;
    const shareText = I18n.get(shareNumber === 1 ? 'resourcepicker-sharedtonbperson' : 'resourcepicker-sharedtonbpersons', {
      nb: shareNumber || 0,
    });
    const defaultBackground = { backgroundColor: defaultThumbnail.background };
    const handleOnPress = () => onPressItem(item);

    return (
      <TouchableOpacity onPress={handleOnPress}>
        <ListItem
          leftElement={
            <View style={styles.item}>
              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, styles.itemNoImage, defaultBackground]}>
                  <NamedSVG
                    name={defaultThumbnail.name}
                    fill={defaultThumbnail.fill}
                    width={UI_SIZES.dimensions.width.hug}
                    height={UI_SIZES.dimensions.height.hug}
                  />
                </View>
              )}
              <View style={styles.itemTexts}>
                <BodyBoldText numberOfLines={numberOfLines}>{item.title}</BodyBoldText>
                <SmallText>{shareText}</SmallText>
              </View>
            </View>
          }
          rightElement={
            <NamedSVG
              name="ui-rafterRight"
              fill={theme.palette.primary.regular}
              width={UI_SIZES.elements.icon.small}
              height={UI_SIZES.elements.icon.small}
            />
          }
        />
      </TouchableOpacity>
    );
  };

  return (
    <PageView>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={getKeyExtractor}
        contentContainerStyle={[styles.list, listAdditionalStyle]}
        ListEmptyComponent={emptyComponent}
        refreshControl={<RefreshControl onRefresh={handleRefresh} refreshing={isRefreshing} />}
      />
    </PageView>
  );
};

export default ResourcePicker;
