import React from 'react';
import { FlatList, Image, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { navigateCarousel } from '~/framework/components/carousel';
import { UI_SIZES, UI_STYLES } from '~/framework/components/constants';
import { SmallText } from '~/framework/components/text';
import { FormQuestionCard } from '~/framework/modules/form/components/FormQuestionCard';
import { IQuestion, IQuestionChoice, IQuestionResponse } from '~/framework/modules/form/model';
import { urlSigner } from '~/infra/oauth';

import { FormAnswerText } from './FormAnswerText';
import { FormCheckbox } from './FormCheckbox';

const styles = StyleSheet.create({
  choiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerMargin: {
    marginTop: UI_SIZES.spacing.minor,
  },
  customAnswerInput: {
    flex: 1,
    marginLeft: UI_SIZES.spacing.small,
    paddingVertical: UI_SIZES.spacing.tiny,
    color: theme.ui.text.regular,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.grey.grey,
  },
  imageContainer: {
    marginLeft: UI_SIZES.spacing.minor,
  },
  valueText: {
    marginLeft: UI_SIZES.spacing.minor,
  },
});

interface IFormMultipleAnswerCardProps {
  isDisabled: boolean;
  question: IQuestion;
  responses: IQuestionResponse[];
  onChangeAnswer: (questionId: number, newResponses: IQuestionResponse[]) => void;
  onEditQuestion?: () => void;
}

export const FormMultipleAnswerCard = ({
  isDisabled,
  question,
  responses,
  onChangeAnswer,
  onEditQuestion,
}: IFormMultipleAnswerCardProps) => {
  const [selectedChoices, setSelectedChoices] = React.useState<number[]>(responses.map(response => response.choiceId!));
  const [customAnswer, setCustomAnswer] = React.useState<string>(responses.find(r => r.customAnswer?.length)?.customAnswer ?? '');
  const { title, mandatory, choices } = question;

  const onSelectChoice = (choice: IQuestionChoice) => {
    const { id, value } = choice;

    if (selectedChoices.includes(id)) {
      setSelectedChoices(selectedChoices.filter(choiceId => choiceId !== id));
      responses = responses.filter(response => response.choiceId !== id);
      if (choice.isCustom) setCustomAnswer('');
    } else {
      setSelectedChoices([...selectedChoices, id]);
      responses = responses.filter(r => r.choiceId);
      responses.push({
        questionId: question.id,
        answer: value,
        choiceId: id,
        customAnswer: choice.isCustom ? customAnswer : undefined,
      });
    }
    onChangeAnswer(question.id, responses);
  };

  const onChangeCustomAnswer = (text: string, choice: IQuestionChoice) => {
    setCustomAnswer(text);
    if (selectedChoices.includes(choice.id) && text.length) {
      const newResponses = responses.map(r => {
        if (r.choiceId === choice.id) r.customAnswer = text;
        return r;
      });
      onChangeAnswer(question.id, newResponses);
    } else {
      onSelectChoice(choice);
    }
  };

  return (
    <FormQuestionCard title={title} isMandatory={mandatory} onEditQuestion={onEditQuestion}>
      {isDisabled && (!responses.length || !responses[0].choiceId) ? (
        <FormAnswerText />
      ) : (
        <FlatList
          data={choices}
          keyExtractor={choice => choice.id.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => onSelectChoice(item)}
              disabled={isDisabled}
              style={[styles.choiceContainer, index > 0 && styles.containerMargin]}>
              <FormCheckbox checked={selectedChoices.includes(item.id)} disabled={isDisabled} />
              <SmallText style={[styles.valueText, !item.isCustom && UI_STYLES.flex1]}>{item.value}</SmallText>
              {item.isCustom ? (
                <TextInput
                  value={customAnswer}
                  onChangeText={text => onChangeCustomAnswer(text, item)}
                  editable={!isDisabled}
                  placeholder={I18n.get('form-distribution-questioncard-enteryouranswer')}
                  style={styles.customAnswerInput}
                />
              ) : null}
              {item.image ? (
                <TouchableOpacity
                  // onPress={() => openCarousel({ data: [{ type: 'image', src: item.image }] })}
                  onPress={() => navigateCarousel({ medias: [{ type: 'image', src: item.image }] })}
                  style={styles.imageContainer}>
                  <Image source={{ uri: item.image, headers: urlSigner.getAuthHeader(), width: 75, height: 75 }} />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}
    </FormQuestionCard>
  );
};
