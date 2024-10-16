export enum LabelIndicator {
  OPTIONAL,
  REQUIRED,
}

export interface LabelProps {
  text: string;
  icon?: string;
  indicator?: LabelIndicator;
  testID?: string;
}
