import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import {
  ImageSourcePropType,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import PrimaryButton from '~/framework/components/buttons/primary';
import SecondaryButton from '~/framework/components/buttons/secondary';
import { Checkbox } from '~/framework/components/checkbox';
import { UI_SIZES } from '~/framework/components/constants';
import { Icon, Svg } from '~/framework/components/picture';
import ScrollView from '~/framework/components/scrollView';
import { BodyBoldText, SmallText } from '~/framework/components/text';
import { ButtonGroup } from '~/framework/modules/mediacentre/components/ButtonGroup';
import { Source } from '~/framework/modules/mediacentre/reducer';
import { Image } from '~/framework/util/media';

const styles = StyleSheet.create({
  buttonGroupContainer: {
    marginBottom: UI_SIZES.spacing.tiny,
  },
  criteriaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  criteriaInput: {
    width: '75%',
    height: 45,
    paddingHorizontal: UI_SIZES.spacing.small,
    borderWidth: 2,
    borderRadius: UI_SIZES.radius.small,
    backgroundColor: theme.palette.grey.white,
    borderColor: theme.palette.primary.regular,
  },
  sourceCheckBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: UI_SIZES.spacing.minor,
  },
  sourceImage: {
    width: 30,
    height: 30,
    marginRight: UI_SIZES.spacing.minor,
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: theme.ui.background.page,
  },
  headerContainer: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: theme.palette.primary.regular,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: UI_SIZES.spacing.medium,
  },
  headerTitle: {
    color: theme.ui.text.inverse,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    marginHorizontal: UI_SIZES.spacing.medium,
    paddingTop: UI_SIZES.spacing.medium,
  },
  sourcesContainer: {
    marginBottom: UI_SIZES.spacing.tiny,
  },
  sourcesContentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: UI_SIZES.spacing.tiny,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    paddingBottom: UI_SIZES.spacing.medium,
  },
  searchButton: {
    marginLeft: UI_SIZES.spacing.medium,
  },
});

export enum Operand {
  OR = 0,
  AND = 1,
}

export interface IField {
  name: string;
  operand: Operand;
  value: string;
}

export interface ISources {
  GAR: boolean;
  Moodle: boolean;
  PMB: boolean;
  Signet: boolean;
}

const defaultFields: IField[] = [
  { name: 'title', value: '', operand: Operand.OR },
  { name: 'authors', value: '', operand: Operand.OR },
  { name: 'editors', value: '', operand: Operand.OR },
  { name: 'disciplines', value: '', operand: Operand.OR },
  { name: 'levels', value: '', operand: Operand.OR },
];

const defaultSources = {
  GAR: false,
  Moodle: false,
  PMB: false,
  Signet: false,
};

interface ICriteriaInputProps {
  field: IField;

  onChange: (field: IField) => void;
}

interface ISourceCheckboxProps {
  checked: boolean;
  iconName?: string;
  source?: ImageSourcePropType;

  onChange: (value: boolean) => void;
}

export interface ISearchModalHandle {
  resetParams: () => void;
}

interface IAdvancedSearchModalProps {
  availableSources: string[];
  isVisible: boolean;
  ref: React.RefObject<ISearchModalHandle>;

  closeModal: () => void;
  onSearch: (fields: IField[], sources: ISources) => void;
}

const CriteriaInput: React.FunctionComponent<ICriteriaInputProps> = (props: ICriteriaInputProps) => {
  const buttons = [
    I18n.get('mediacentre-advancedsearch-or').toUpperCase(),
    I18n.get('mediacentre-advancedsearch-and').toUpperCase(),
  ];
  const onChangeOperand = (value: number) => {
    props.field.operand = value;
    props.onChange(props.field);
  };
  const onChangeText = (text: string) => {
    props.field.value = text;
    props.onChange(props.field);
  };
  return (
    <View>
      {props.field.name !== 'title' ? (
        <ButtonGroup
          buttons={buttons}
          selectedButton={props.field.operand}
          onPress={onChangeOperand}
          containerStyle={styles.buttonGroupContainer}
        />
      ) : null}
      <View style={styles.criteriaContainer}>
        <SmallText>{I18n.get(`mediacentre-advancedsearch-${props.field.name}-label`)}</SmallText>
        <TextInput
          defaultValue={props.field.value}
          placeholder={I18n.get(`mediacentre-advancedsearch-${props.field.name}-placeholder`)}
          clearButtonMode="always"
          maxLength={30}
          onChangeText={onChangeText}
          style={styles.criteriaInput}
        />
      </View>
    </View>
  );
};

const SourceCheckbox: React.FunctionComponent<ISourceCheckboxProps> = (props: ISourceCheckboxProps) => {
  const onCheck = () => {
    props.onChange(!props.checked);
  };
  return (
    <View style={styles.sourceCheckBoxContainer}>
      {props.source ? (
        <Image source={props.source} style={styles.sourceImage} />
      ) : (
        props.iconName && <Icon name={props.iconName} size={30} />
      )}
      <Checkbox checked={props.checked} onPress={onCheck} />
    </View>
  );
};

export const AdvancedSearchModal: React.FunctionComponent<IAdvancedSearchModalProps> = forwardRef<
  ISearchModalHandle,
  IAdvancedSearchModalProps
>((props: IAdvancedSearchModalProps, ref) => {
  const [fields, setFields] = useState<IField[]>(defaultFields);
  const [sources, setSources] = useState<ISources>(defaultSources);
  const areFieldsEmpty = !fields.some(field => field.value !== '');

  const updateField = (index: number, field: IField) => {
    const newFields = [...fields];
    newFields[index] = field;
    setFields(newFields);
  };

  const onSearch = () => {
    props.onSearch(fields, sources);
  };

  const resetSources = () => {
    setSources({
      GAR: props.availableSources.includes(Source.GAR),
      Moodle: props.availableSources.includes(Source.MOODLE),
      PMB: props.availableSources.includes(Source.PMB),
      Signet: props.availableSources.includes(Source.SIGNET),
    });
  };

  const resetParams = () => {
    for (const field of fields) {
      field.value = '';
      field.operand = Operand.OR;
    }
    setFields(fields);
    resetSources();
  };

  useEffect(() => {
    resetSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.availableSources]);

  useImperativeHandle(ref, () => ({ resetParams }));

  return (
    <Modal visible={props.isVisible} animationType="slide" presentationStyle="formSheet" onRequestClose={props.closeModal}>
      <KeyboardAvoidingView
        enabled={Platform.OS === 'ios'}
        behavior="padding"
        keyboardVerticalOffset={60}
        style={styles.safeAreaContainer}>
        <View style={styles.headerContainer}>
          <BodyBoldText style={styles.headerTitle}>{I18n.get('mediacentre-advancedsearch-title')}</BodyBoldText>
          <TouchableOpacity onPress={props.closeModal}>
            <Svg name="ui-close" width={24} height={24} fill={theme.ui.text.inverse} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
          {fields.map((field, index) => (
            <CriteriaInput field={field} onChange={newField => updateField(index, newField)} key={index} />
          ))}
          <View style={styles.sourcesContainer}>
            <SmallText>{I18n.get('mediacentre-advancedsearch-sources')}</SmallText>
            <View style={styles.sourcesContentContainer}>
              {props.availableSources.includes(Source.GAR) ? (
                <SourceCheckbox
                  source={require('ASSETS/images/logo-gar.png')}
                  checked={sources.GAR}
                  onChange={value => setSources({ ...sources, GAR: value })}
                />
              ) : null}
              {props.availableSources.includes(Source.MOODLE) ? (
                <SourceCheckbox
                  source={require('ASSETS/images/logo-moodle.png')}
                  checked={sources.Moodle}
                  onChange={value => setSources({ ...sources, Moodle: value })}
                />
              ) : null}
              {props.availableSources.includes(Source.PMB) ? (
                <SourceCheckbox
                  source={require('ASSETS/images/logo-pmb.png')}
                  checked={sources.PMB}
                  onChange={value => setSources({ ...sources, PMB: value })}
                />
              ) : null}
              {props.availableSources.includes(Source.SIGNET) ? (
                <SourceCheckbox
                  iconName="bookmark_outline"
                  checked={sources.Signet}
                  onChange={value => setSources({ ...sources, Signet: value })}
                />
              ) : null}
            </View>
          </View>
          <View style={styles.buttonsContainer}>
            <SecondaryButton text={I18n.get('mediacentre-advancedsearch-cancel')} action={props.closeModal} />
            <PrimaryButton
              text={I18n.get('mediacentre-advancedsearch-search')}
              action={onSearch}
              disabled={areFieldsEmpty}
              style={styles.searchButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
});
