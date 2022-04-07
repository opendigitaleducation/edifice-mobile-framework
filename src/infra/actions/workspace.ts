import ImagePicker from 'react-native-image-picker';

import { DEPRECATED_getCurrentPlatform } from '~/framework/util/_legacy_appConf';
import { signedFetch } from '~/infra/fetchWithCache';

export const takePhoto = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    ImagePicker.launchCamera(
      {
        quality: 0.7,
        allowsEditing: true,
      },
      response => {
        resolve(response.uri);
      },
    );
  });
};

export const uploadImage = async (uri: string) => {
  const formData = new FormData();
  formData.append('photo', {
    uri,
    type: 'image/jpeg', // or photo.type
    name: 'mobile-photo',
  } as any);
  if (!DEPRECATED_getCurrentPlatform()) throw new Error('must specify a platform');
  const response = await signedFetch(
    `
        ${
          DEPRECATED_getCurrentPlatform()!.url
        }/workspace/document?protected=true&application=media-library?thumbnail=120x120&thumbnail=100x100&thumbnail=290x290&thumbnail=381x381&thumbnail=1600x0
    `,
    {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  const file = await response.json();
  return `/workspace/document/${file._id}`;
};
