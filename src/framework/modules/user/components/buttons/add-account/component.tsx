import * as React from 'react';

import { I18n } from '~/app/i18n';
import { AddAccountButtonProps } from '~/framework/modules/user/components/buttons/add-account/types';
import LargeButton from '~/framework/modules/user/components/buttons/large';

const AddAccountButton = ({ action, style, testID }: AddAccountButtonProps) => {
  return <LargeButton style={style} icon="ui-plus" text={I18n.get('auth-accountbutton-add')} action={action} testID={testID} />;
};

export default AddAccountButton;
