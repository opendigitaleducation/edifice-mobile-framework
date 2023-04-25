import I18n from 'i18n-js';
import ToastMessage from 'react-native-toast-message';

export default class Toast {
  static $showToast(type: string, text: string) {
    ToastMessage.show({
      type,
      text1: text,
      position: 'top',
      topOffset: 8,
    });
  }

  static showError(text: string = I18n.t('common.error.text')) {
    this.$showToast('error', text);
  }

  static showInfo(text: string) {
    this.$showToast('info', text);
  }

  static showSuccess(text: string) {
    this.$showToast('success', text);
  }
}
