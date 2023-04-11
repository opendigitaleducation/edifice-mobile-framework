import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { setFruitAction } from '~/framework/modules/module-name/actions';
import type { {{moduleName | toCamelCase | capitalize}}NavigationParams } from '~/framework/modules/module-name/navigation';
import type { {{moduleName | toCamelCase | capitalize}}State } from '~/framework/modules/module-name/reducer';

export interface {{moduleName | toCamelCase | capitalize}}HomeScreenProps {
  // @scaffolder add props here
}

export interface {{moduleName | toCamelCase | capitalize}}HomeScreenNavParams {
  // requiredFoo: string; // @scaffolder remove example
  // optionalBar?: number; // @scaffolder remove example
  // @scaffolder add nav params here
}

export interface {{moduleName | toCamelCase | capitalize}}HomeScreenStoreProps {
  fruit: {{moduleName | toCamelCase | capitalize}}State['fruit'];
}

export interface {{moduleName | toCamelCase | capitalize}}HomeScreenDispatchProps {
  handleChangeFruit: (...args: Parameters<typeof setFruitAction>) => Promise<void>;
}


export interface {{moduleName | toCamelCase | capitalize}}HomeScreenPrivateProps
  extends NativeStackScreenProps<{{moduleName | toCamelCase | capitalize}}NavigationParams, 'home'>,
    {{moduleName | toCamelCase | capitalize}}HomeScreenProps,
    {{moduleName | toCamelCase | capitalize}}HomeScreenStoreProps,
    {{moduleName | toCamelCase | capitalize}}HomeScreenDispatchProps {
  // @scaffolder add HOC props here
}
