import * as React from 'react';

import { PageView } from '~/framework/components/page';
import { BodyBoldText } from '~/framework/components/text';

import type { {{moduleName | capitalize}}HomeScreenPrivateProps } from './types';

export default function {{moduleName | capitalize}}HomeScreen(props: {{moduleName | capitalize}}HomeScreenPrivateProps) {
  // HOOKS ========================================================================================

  const [someState, setSomeState] = React.useState<boolean>(false);

  // RENDER =======================================================================================

  return (
    <PageView>
      <BodyBoldText>{{moduleName}} Home</BodyBoldText>
    </PageView>
  );
}
