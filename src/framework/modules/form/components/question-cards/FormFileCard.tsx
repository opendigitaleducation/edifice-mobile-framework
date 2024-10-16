import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { DocumentPicked, cameraAction, documentAction, galleryAction } from '~/framework/components/menus/actions';
import BottomMenu from '~/framework/components/menus/bottom';
import { NamedSVG } from '~/framework/components/picture';
import { SmallActionText } from '~/framework/components/text';
import { FormQuestionCard } from '~/framework/modules/form/components/FormQuestionCard';
import { IQuestion, IQuestionResponse, IResponseFile } from '~/framework/modules/form/model';
import { Attachment } from '~/framework/modules/zimbra/components/Attachment';
import { LocalFile } from '~/framework/util/fileHandler';

import { Asset } from '~/framework/util/fileHandler/types';
import { FormAnswerText } from './FormAnswerText';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.ui.background.card,
    borderColor: theme.ui.border.input,
    borderWidth: 1,
    borderRadius: 5,
  },
  textIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: UI_SIZES.spacing.big,
    marginRight: UI_SIZES.spacing.minor,
  },
  textIconContainerSmallerMargin: {
    marginVertical: UI_SIZES.spacing.small,
  },
  actionText: {
    textAlign: 'center',
    marginRight: UI_SIZES.spacing.minor,
  },
});

interface IFormFileCardProps {
  isDisabled: boolean;
  question: IQuestion;
  responses: IQuestionResponse[];
  onChangeAnswer: (questionId: number, newResponses: IQuestionResponse[]) => void;
  onEditQuestion?: () => void;
}

export const FormFileCard = ({ isDisabled, question, responses, onChangeAnswer, onEditQuestion }: IFormFileCardProps) => {
  const [files, setFiles] = React.useState<IResponseFile[]>(responses[0]?.files ?? []);
  const { title, mandatory } = question;
  const filesAdded = files.length > 0;

  React.useEffect(() => {
    const answer = files.length ? 'Fichier déposé' : '';

    if (responses.length) {
      responses[0].answer = answer;
      responses[0].files = files;
    } else {
      responses.push({
        questionId: question.id,
        answer,
        files,
      });
    }
    onChangeAnswer(question.id, responses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const addFile = (lf: LocalFile) => {
    const file = {
      id: null,
      filename: lf.filename,
      type: lf.filetype,
      lf,
    } as IResponseFile;

    setFiles(previousFiles => [...previousFiles, file]);
  };

  const removeFile = (file: IResponseFile) => {
    setFiles(files.filter(a => a !== file));
  };

  const filePickedToLocalFile = (img: Asset | DocumentPicked) =>
    new LocalFile(
      {
        filename: img.fileName as string,
        filepath: img.uri as string,
        filetype: img.type as string,
      },
      { _needIOSReleaseSecureAccess: false },
    );

  return (
    <FormQuestionCard title={title} isMandatory={mandatory} onEditQuestion={onEditQuestion}>
      {isDisabled ? (
        <FormAnswerText answer={responses[0]?.answer ? files.map(a => a.filename).join('\n') : undefined} />
      ) : (
        <View style={styles.container}>
          <BottomMenu
            title={I18n.get('form-distribution-filecard-addfiles')}
            actions={[
              cameraAction({ callback: file => addFile(filePickedToLocalFile(file)) }),
              galleryAction({ callback: file => addFile(filePickedToLocalFile(file)), multiple: true }),
              documentAction({ callback: file => addFile(filePickedToLocalFile(file)) }),
            ]}>
            <View style={[styles.textIconContainer, filesAdded && styles.textIconContainerSmallerMargin]}>
              <SmallActionText style={styles.actionText}>{I18n.get('form-distribution-filecard-addfiles')}</SmallActionText>
              <NamedSVG name="ui-attachment" width={18} height={18} fill={theme.palette.primary.regular} />
            </View>
          </BottomMenu>
          <FlatList
            data={files}
            keyExtractor={attachment => attachment.filename}
            renderItem={({ item }) => <Attachment name={item.filename} type={item.type} onRemove={() => removeFile(item)} />}
          />
        </View>
      )}
    </FormQuestionCard>
  );
};
