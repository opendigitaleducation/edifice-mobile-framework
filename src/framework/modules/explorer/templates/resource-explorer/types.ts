import { ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';

import { AnyNavigableModuleConfig } from '~/framework/util/moduleTool';

export namespace ResourceExplorerTemplate {
  export interface Props {
    moduleConfig: Pick<AnyNavigableModuleConfig, 'displayPicture' | 'displayColor'>;
  }

  export interface NavParams { }

  type NavigationProps<
    T extends ParamListBase = {
      [key: string]: NavParams;
    },
  > = NativeStackScreenProps<T, keyof T>;

  export type NavBarConfig = ({ navigation, route }: NavigationProps) => NativeStackNavigationOptions;

  export interface AllProps extends Props, NavigationProps { }

  export type ScreenProps = Omit<AllProps, keyof Props>;
}
