import { I18n } from '~/app/i18n';
import { LocalFile } from '~/framework/util/fileHandler';

import { MenuPickerActionProps } from './types';

export default function documentAction(props: MenuPickerActionProps & { synchrone?: boolean }) {
  const action = () => LocalFile.pickFromDocuments(props.callback, props.synchrone);

  return {
    title: I18n.get('documentaction-document'),
    icon: {
      ios: 'doc.badge.plus',
      android: 'ic_upload_file',
    },
    action,
  };
}
