import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { Card } from '~/framework/components/card/base';
import { UI_SIZES } from '~/framework/components/constants';
import { BodyBoldText, NestedBoldText, SmallActionText } from '~/framework/components/text';
import { ArticleContainer } from '~/ui/ContainerContent';

const styles = StyleSheet.create({
  actionContainer: {
    flexGrow: 1,
    alignItems: 'flex-end',
    marginTop: UI_SIZES.spacing.small,
  },
  childrenContainer: {
    flexGrow: 1,
    marginTop: UI_SIZES.spacing.small,
  },
  mandatoryText: {
    color: theme.palette.complementary.red.regular,
  },
});

interface IFormQuestionCardProps {
  title: string;
  children?: React.ReactNode;
  isMandatory?: boolean;
  onClearAnswer?: () => void;
  onEditQuestion?: () => void;
}

export class FormQuestionCard extends React.PureComponent<IFormQuestionCardProps> {
  public render() {
    const { title, children, isMandatory, onClearAnswer, onEditQuestion } = this.props;
    const mandatoryText = ' *';
    return (
      <ArticleContainer>
        <Card>
          <BodyBoldText>
            {title}
            {isMandatory ? <NestedBoldText style={styles.mandatoryText}>{mandatoryText}</NestedBoldText> : null}
          </BodyBoldText>
          <View style={styles.childrenContainer}>{children}</View>
          {onClearAnswer ? (
            <TouchableOpacity onPress={onClearAnswer} style={styles.actionContainer}>
              <SmallActionText>{I18n.get('form-distribution-questioncard-clearanswer')}</SmallActionText>
            </TouchableOpacity>
          ) : null}
          {onEditQuestion ? (
            <TouchableOpacity onPress={onEditQuestion} style={styles.actionContainer}>
              <SmallActionText>{I18n.get('form-distribution-questioncard-edit')}</SmallActionText>
            </TouchableOpacity>
          ) : null}
        </Card>
      </ArticleContainer>
    );
  }
}
