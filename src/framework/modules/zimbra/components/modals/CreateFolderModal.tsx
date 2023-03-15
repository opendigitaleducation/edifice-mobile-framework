import I18n from 'i18n-js';
import * as React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Toast from 'react-native-tiny-toast';

import theme from '~/app/theme';
import ModalBox, { ModalBoxHandle } from '~/framework/components/ModalBox';
import ActionButton from '~/framework/components/buttons/action';
import { UI_ANIMATIONS, UI_SIZES } from '~/framework/components/constants';
import { BodyText } from '~/framework/components/text';
import { ISession } from '~/framework/modules/auth/model';
import { zimbraService } from '~/framework/modules/zimbra/service';

const styles = StyleSheet.create({
  textInput: {
    marginVertical: UI_SIZES.spacing.medium,
    padding: UI_SIZES.spacing.minor,
    backgroundColor: theme.palette.grey.fog,
    borderColor: theme.ui.border.input,
    borderWidth: 1,
    borderRadius: 5,
    color: theme.ui.text.regular,
  },
});

interface ICreateFolderModalProps {
  session?: ISession;
  creationCallback: () => void;
}

const CreateFolderModal = React.forwardRef<ModalBoxHandle, ICreateFolderModalProps>((props, ref) => {
  const [name, setName] = React.useState<string>('');
  const [isCreating, setCreating] = React.useState<boolean>(false);

  const createFolder = async () => {
    try {
      const { session } = props;

      setCreating(true);
      if (!session) throw new Error();
      await zimbraService.folder.create(session, name);
      props.creationCallback();
      setCreating(false);
      setName('');
      Toast.show(I18n.t('zimbra-create-directory-confirm'), { ...UI_ANIMATIONS.toast });
    } catch {
      setCreating(false);
      Toast.show(I18n.t('common.error.text'), { ...UI_ANIMATIONS.toast });
    }
  };

  return (
    <ModalBox
      ref={ref}
      content={
        <View>
          <BodyText>{I18n.t('create-folder')}</BodyText>
          <TextInput value={name} onChangeText={value => setName(value)} autoFocus style={styles.textInput} />
          <ActionButton text={I18n.t('create')} action={createFolder} disabled={!name} loading={isCreating} />
        </View>
      }
    />
  );
});

export default CreateFolderModal;
