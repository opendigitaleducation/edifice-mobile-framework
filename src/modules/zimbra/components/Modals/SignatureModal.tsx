import I18n from 'i18n-js';
import * as React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import theme from '~/app/theme';
import { Checkbox } from '~/framework/components/checkbox';
import { UI_SIZES } from '~/framework/components/constants';
import { Text, TextSizeStyle } from '~/framework/components/text';
import { putSignatureAction } from '~/modules/zimbra/actions/signature';
import { ISignature, getSignatureState } from '~/modules/zimbra/state/signature';
import { DialogButtonCancel, DialogButtonOk } from '~/ui/ConfirmDialog';
import { ModalBox, ModalContent } from '~/ui/Modal';

const styles = StyleSheet.create({
  containerView: {
    flexGrow: 1,
    width: '100%',
    marginTop: -25,
  },
  titleContainer: {
    alignSelf: 'baseline',
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  titleText: {
    ...TextSizeStyle.SlightBig,
  },
  textZone: {
    marginHorizontal: 10,
    borderBottomWidth: 0.5,
    borderColor: theme.palette.grey.cloudy,
    maxHeight: UI_SIZES.screen.height / 4,
  },
  infosView: {
    flexDirection: 'row',
    marginTop: 10,
    marginHorizontal: 10,
  },
  useSignatureText: {
    paddingTop: 3,
    paddingLeft: 10,
  },
  actionsButtonsContainer: {
    flexDirection: 'row-reverse',
    padding: 20,
    paddingBottom: 10,
  },
});

type SignatureModalProps = {
  show: boolean;
  signature: string;
  signatureData: ISignature;
  closeModal: () => any;
  putSignature: (signatureData: string, isGlobalSignature: boolean) => any;
  successCallback: () => any;
};

type SignatureModalState = {
  isGlobalSignature: boolean;
  isUpdated: boolean;
  signature: string;
};

class SignatureModal extends React.Component<SignatureModalProps, SignatureModalState> {
  constructor(props) {
    super(props);

    const { preference } = this.props.signatureData;
    let signatureCheck = false;
    if (preference !== undefined) {
      if (typeof preference === 'object') signatureCheck = preference.useSignature;
      else signatureCheck = JSON.parse(preference).useSignature;
    }

    this.state = {
      signature: this.props.signature,
      isGlobalSignature: signatureCheck,
      isUpdated: false,
    };
  }

  componentDidUpdate = () => {
    if (!this.state.isUpdated && this.props.signature !== this.state.signature)
      this.setState({ isUpdated: true, signature: this.props.signature });
  };

  setSignature = (text: string) => {
    this.setState({ signature: text });
  };

  toggleGlobal = () => {
    const { isGlobalSignature } = this.state;
    this.setState({ isGlobalSignature: !isGlobalSignature });
  };

  confirm = async () => {
    const { putSignature, successCallback } = this.props;
    const { signature, isGlobalSignature } = this.state;
    this.props.closeModal();

    await putSignature(signature, isGlobalSignature);
    successCallback();
  };

  public render() {
    const { show, closeModal } = this.props;
    return (
      <ModalBox isVisible={show}>
        <ModalContent style={{ width: UI_SIZES.screen.width - 80 }}>
          <View style={styles.containerView}>
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>{I18n.t('zimbra-signature')}</Text>
            </View>
            <TextInput
              textAlignVertical="top"
              multiline
              scrollEnabled
              style={styles.textZone}
              defaultValue={this.state.signature}
              onChangeText={(text: string) => this.setSignature(text)}
            />
            <View style={styles.infosView}>
              <Checkbox checked={this.state.isGlobalSignature} onPress={this.toggleGlobal} />
              <Text style={styles.useSignatureText}>{I18n.t('zimbra-signature-use')}</Text>
            </View>
            <View style={styles.actionsButtonsContainer}>
              <DialogButtonOk label={I18n.t('zimbra-add')} onPress={this.confirm} />
              <DialogButtonCancel onPress={closeModal} />
            </View>
          </View>
        </ModalContent>
      </ModalBox>
    );
  }
}

const mapStateToProps = (state: any) => {
  const { data, isFetching } = getSignatureState(state);
  return {
    signatureMail: data.preference,
    isFetching,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return bindActionCreators(
    {
      putSignature: putSignatureAction,
    },
    dispatch,
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(SignatureModal);
