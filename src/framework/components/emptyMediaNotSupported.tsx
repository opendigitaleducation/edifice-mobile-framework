import * as React from 'react';

import { I18n } from '~/app/i18n';

import { EmptyScreen } from './emptyScreen';

export const EmptyMediaNotSupportedScreen = () => {
  return (
    <EmptyScreen
      svgImage="empty-search"
      title={I18n.get('common.error.mediaNotSupported.title')}
      text={I18n.get('common.error.mediaNotSupported.text')}
    />
  );
};
