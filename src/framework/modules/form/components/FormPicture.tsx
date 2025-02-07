import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { Image } from '~/framework/util/media';

const styles = StyleSheet.create({
  container: {
    borderRadius: UI_SIZES.radius.medium,
    height: 75,
    marginRight: UI_SIZES.spacing.minor,
    overflow: 'hidden',
    width: 75,
  },
});

interface IFormPictureProps {
  pictureUri?: string;
}

export const FormPicture = ({ pictureUri }: IFormPictureProps) => {
  const [loadingFailed, setLoadingFailed] = useState<boolean>(false);
  const onError = () => setLoadingFailed(true);

  return (
    <View style={styles.container}>
      {!pictureUri || loadingFailed ? (
        <Svg name="form-default" width={75} height={75} />
      ) : (
        <Image source={{ height: 75, uri: pictureUri, width: 75 }} onError={onError} />
      )}
    </View>
  );
};
