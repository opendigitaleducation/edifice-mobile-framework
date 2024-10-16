import { I18n } from '~/app/i18n';
import { LocalFile } from '~/framework/util/fileHandler';

import { MenuPickerActionProps } from './types';

export default function cameraAction(props: MenuPickerActionProps & { useFrontCamera?: boolean; synchrone?: boolean }) {
  const action = async ({ callbackOnce }: { callbackOnce: boolean } = { callbackOnce: false }) =>
    LocalFile.pickFromCamera(props.callback, props.useFrontCamera, props.synchrone, callbackOnce);

  return {
    title: I18n.get('cameraaction-take'),
    icon: {
      ios: 'camera',
      android: 'ic_camera',
    },
    action,
  };
}
