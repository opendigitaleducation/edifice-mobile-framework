import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { NamedSVG } from '~/framework/components/picture';
import { SmallText } from '~/framework/components/text';
import { Image } from '~/framework/util/media';

import styles from './styles';
import { OtherModuleElementProps } from './types';

export const OtherModuleElement = (props: OtherModuleElementProps) => {
  const { item, type } = props;
  const navigation = useNavigation();

  const renderPicture = () => {
    switch (item.config.displayPicture?.type) {
      case 'NamedSvg':
        return (
          <NamedSVG {...item.config.displayPicture} height={UI_SIZES.elements.icon.xlarge} width={UI_SIZES.elements.icon.xlarge} />
        );
      case 'Image':
        return <Image source={item.config.displayPicture.source} style={styles.imagePicture} />;
      default:
        return null;
    }
  };
  return (
    <TouchableOpacity style={styles.container} onPress={() => navigation.navigate(item.config.routeName)}>
      <View style={styles.infos}>
        {renderPicture()}
        <SmallText>{I18n.get(item.config.displayI18n)}</SmallText>
      </View>
      <NamedSVG
        name={type === 'connector' ? 'ui-external-link' : 'ui-rafterRight'}
        fill={theme.palette.primary.regular}
        height={UI_SIZES.elements.icon.default}
        width={UI_SIZES.elements.icon.default}
      />
    </TouchableOpacity>
  );
};
