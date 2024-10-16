import { I18n } from '~/app/i18n';
import { LocalFile } from '~/framework/util/fileHandler';

import { MenuPickerActionProps } from './types';

export default function galleryAction(props: MenuPickerActionProps & { multiple?: boolean; synchrone?: boolean }) {
  const action = async ({ callbackOnce }: { callbackOnce: boolean } = { callbackOnce: false }) =>
    LocalFile.pickFromGallery(props.callback, props.multiple ?? false, props.synchrone, callbackOnce);

  return {
    title: I18n.get('galleryaction-pick'),
    icon: {
      ios: 'photo.on.rectangle.angled',
      android: 'ic_gallery',
    },
    action,
  };
}
