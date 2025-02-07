import * as React from 'react';
import { View } from 'react-native';

import styles from './styles';
import { CardTopContentCategoryProps } from './types';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import CardTopContent from '~/framework/components/card/top-content';
import { UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';

export const CardTopContentCategory = (props: CardTopContentCategoryProps) => {
  const { category } = props;

  return (
    <CardTopContent
      image={
        <View style={[styles.boxIcon, { backgroundColor: theme.color.schoolbook.categories[category] }]}>
          <Svg
            width={UI_SIZES.dimensions.width.medium}
            height={UI_SIZES.dimensions.height.medium}
            cached
            name={`schoolbook-${category}`}
          />
        </View>
      }
      text={I18n.get(`schoolbook-cardtopcontentcategory-categories-${category}`)}
      textColor={theme.color.schoolbook.categories[category]}
      bold
      {...props}
    />
  );
};
