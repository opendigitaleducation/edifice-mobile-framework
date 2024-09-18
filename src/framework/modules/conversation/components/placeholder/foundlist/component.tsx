import * as React from 'react';
import { View } from 'react-native';
import { Fade, Placeholder, PlaceholderLine, PlaceholderMedia } from 'rn-placeholder';

import { avatarSize } from '~/framework/modules/conversation/components/result-item';

import styles from './styles';

const renderElement = () => (
  <View style={styles.element}>
    <PlaceholderMedia isRound size={avatarSize} />
    <Placeholder style={styles.texts}>
      <PlaceholderLine width={50} style={[styles.name, styles.h14]} />
      <PlaceholderLine width={65} style={[styles.mb0, styles.h14]} />
    </Placeholder>
  </View>
);

export default function FoundListPlaceholder() {
  return (
    <Placeholder style={styles.page} Animation={Fade}>
      <PlaceholderLine width={30} style={[styles.title, styles.h14]} />
      {renderElement()}
      {renderElement()}
      {renderElement()}
      {renderElement()}
      {renderElement()}
      {renderElement()}
      {renderElement()}
      {renderElement()}
    </Placeholder>
  );
}
