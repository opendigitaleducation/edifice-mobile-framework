import I18n from 'i18n-js';
import React, { useState } from 'react';
import { Image, ImageSourcePropType, Modal, StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';

import { CommonStyles } from '~/styles/common/styles';
import { Icon } from '~/ui';
import { ButtonGroup } from '~/ui/ButtonGroup';
import { DialogButtonCancel, DialogButtonOk } from '~/ui/ConfirmDialog';
import { ModalContentBlock } from '~/ui/Modal';
import { Text, TextBold } from '~/ui/Typography';
import { Checkbox } from '~/ui/forms/Checkbox';

const styles = StyleSheet.create({
  criteriaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  criteriaText: {
    fontSize: 14,
  },
  criteriaInput: {
    width: '75%',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 2,
    borderRadius: 5,
    borderColor: CommonStyles.actionColor,
  },
  sourceCheckBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceImage: {
    width: 30,
    height: 30,
    marginRight: 5,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#F53B56',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    color: 'white',
  },
  contentContainer: {
    flexGrow: 1,
    marginVertical: 20,
    justifyContent: 'space-between',
  },
  sourcesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  dialogButtonsContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
  },
  searchButton: {
    backgroundColor: '#F53B56',
  },
});

export enum Operand {
  OR = 0,
  AND = 1,
}

export interface Field {
  name: string;
  operand: Operand;
  value: string;
}

export interface AdvancedSearchParams {
  fields: Field[];
  sources: {
    GAR: boolean;
    Moodle: boolean;
    PMB: boolean;
    Signets: boolean;
  };
}

export const defaultParams: AdvancedSearchParams = {
  fields: [
    { name: 'title', value: '', operand: Operand.OR },
    { name: 'author', value: '', operand: Operand.OR },
    { name: 'editor', value: '', operand: Operand.OR },
    { name: 'discipline', value: '', operand: Operand.OR },
    { name: 'level', value: '', operand: Operand.OR },
  ],
  sources: {
    GAR: true,
    Moodle: true,
    PMB: true,
    Signets: true,
  },
};

const defaultFields: Field[] = [
  { name: 'title', value: '', operand: Operand.OR },
  { name: 'authors', value: '', operand: Operand.OR },
  { name: 'editors', value: '', operand: Operand.OR },
  { name: 'disciplines', value: '', operand: Operand.OR },
  { name: 'levels', value: '', operand: Operand.OR },
];

const defaultSources = {
  GAR: true,
  Moodle: true,
  PMB: true,
  Signets: true,
};

type CriteriaInputProps = {
  field: Field;

  onChange: (field: Field) => void;
};

type SourceCheckboxProps = {
  checked: boolean;
  iconName?: string;
  source?: ImageSourcePropType;

  onChange: (value: boolean) => void;
};

type AdvancedSearchModalProps = {
  isVisible: boolean;

  closeModal: () => void;
  onSearch: (params: AdvancedSearchParams) => void;
};

const CriteriaInput: React.FunctionComponent<CriteriaInputProps> = (props: CriteriaInputProps) => {
  const buttons = [I18n.t('mediacentre.advancedSearch.or'), I18n.t('mediacentre.advancedSearch.and')];
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
          color={CommonStyles.actionColor}
          onPress={onChangeOperand}
        />
      ) : null}
      <View style={styles.criteriaContainer}>
        <Text style={styles.criteriaText}>{I18n.t(`mediacentre.advancedSearch.${props.field.name}`)}</Text>
        <TextInput
          defaultValue={props.field.value}
          placeholder={I18n.t(`mediacentre.advancedSearch.search-${props.field.name}`)}
          onChangeText={onChangeText}
          style={styles.criteriaInput}
        />
      </View>
    </View>
  );
};

const SourceCheckbox: React.FunctionComponent<SourceCheckboxProps> = (props: SourceCheckboxProps) => {
  const onCheck = () => {
    props.onChange(true);
  };
  const onUncheck = () => {
    props.onChange(false);
  };
  return (
    <View style={styles.sourceCheckBoxContainer}>
      {props.source ? <Image source={props.source} style={styles.sourceImage} /> : <Icon name={props.iconName} size={30} />}
      <Checkbox checked={props.checked} onCheck={onCheck} onUncheck={onUncheck} />
    </View>
  );
};

export const AdvancedSearchModal: React.FunctionComponent<AdvancedSearchModalProps> = (props: AdvancedSearchModalProps) => {
  const [fields, setFields] = useState<Field[]>(defaultFields);
  const [sources, setSources] = useState(defaultSources);
  const areFieldsEmpty = !fields.some(field => field.value !== '');
  const updateField = (index: number, field: Field) => {
    const newFields = [...fields];
    newFields[index] = field;
    setFields(newFields);
  };
  const onSearch = () => {
    props.onSearch({ fields, sources });
  };
  return (
    <Modal visible={props.isVisible}>
      <View style={styles.headerContainer}>
        <TextBold style={styles.headerTitle}>{I18n.t('mediacentre.advanced-search')}</TextBold>
        <Icon name="close" color="white" size={24} onPress={props.closeModal} />
      </View>
      <ModalContentBlock style={styles.contentContainer}>
        {fields.map((field, index) => (
          <CriteriaInput field={field} onChange={newField => updateField(index, newField)} />
        ))}
        <Text style={styles.criteriaText}>{I18n.t('mediacentre.advancedSearch.sources')}</Text>
        <View style={styles.sourcesContainer}>
          <SourceCheckbox
            source={require('ASSETS/images/logo-gar.png')}
            checked={sources.GAR}
            onChange={value => setSources({ ...sources, GAR: value })}
          />
          <SourceCheckbox
            source={require('ASSETS/images/logo-moodle.png')}
            checked={sources.Moodle}
            onChange={value => setSources({ ...sources, Moodle: value })}
          />
          <SourceCheckbox
            source={require('ASSETS/images/logo-pmb.png')}
            checked={sources.PMB}
            onChange={value => setSources({ ...sources, PMB: value })}
          />
          <SourceCheckbox
            iconName="bookmark_outline"
            checked={sources.Signets}
            onChange={value => setSources({ ...sources, Signets: value })}
          />
        </View>
        <View style={styles.dialogButtonsContainer}>
          <DialogButtonCancel onPress={props.closeModal} />
          <DialogButtonOk
            onPress={onSearch}
            disabled={areFieldsEmpty}
            label={I18n.t('common.search')}
            style={styles.searchButton}
          />
        </View>
      </ModalContentBlock>
    </Modal>
  );
};
