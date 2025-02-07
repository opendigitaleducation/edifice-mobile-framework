import * as React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES, UI_STYLES } from '~/framework/components/constants';
import { Icon, Svg } from '~/framework/components/picture';
import { SmallText } from '~/framework/components/text';
import { getFileIcon } from '~/framework/modules/zimbra/utils/fileIcon';

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 48,
  },
  mainContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

interface IAttachmentProps {
  name?: string;
  type?: string;
  uploadSuccess?: boolean;
  onRemove?: () => void;
}

export const Attachment = ({ name, onRemove, type, uploadSuccess = true }: IAttachmentProps) => {
  const iconName = getFileIcon(type);
  return (
    <View style={styles.mainContainer}>
      <View style={styles.iconContainer}>
        {uploadSuccess ? (
          <Icon name={iconName} size={24} color={theme.palette.primary.regular} />
        ) : (
          <ActivityIndicator color={theme.palette.primary.regular} />
        )}
      </View>
      <SmallText numberOfLines={1} ellipsizeMode="middle" style={UI_STYLES.flex1}>
        {name}
      </SmallText>
      <TouchableOpacity onPress={onRemove} disabled={!uploadSuccess} style={styles.iconContainer}>
        <Svg
          name="pictos-close"
          width={UI_SIZES.dimensions.width.medium}
          height={UI_SIZES.dimensions.height.medium}
          fill={uploadSuccess ? theme.palette.complementary.red.regular : theme.palette.grey.grey}
        />
      </TouchableOpacity>
    </View>
  );
};
