import * as React from 'react';
import I18n from 'i18n-js';

import { EmptyScreen } from './emptyScreen';
import EmptyLight from 'ode-images/empty-screen/empty-light.svg';

export const EmptyConnectionScreen = () => {
  return (
    <EmptyScreen
      svgImage={<EmptyLight />}
      title={I18n.t('common.error.connection.title')}
      text={I18n.t('common.error.connection.text')}
    />
  );
};
