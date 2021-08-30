import * as React from 'react';
import I18n from 'i18n-js';
import {
  CameraOptions,
  ImageLibraryOptions,
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ModalBox, ModalContent, ModalContentBlock } from '../ui/Modal';
import { ButtonTextIcon } from '../ui';
import { GestureResponderEvent, Platform, TouchableOpacityProps } from 'react-native';
import DocumentPicker, {
  DocumentPickerOptions,
  DocumentPickerResponse,
  DocumentType,
  PlatformTypes,
} from 'react-native-document-picker';
import getPath from '@flyerhq/react-native-android-uri-path';
import { assertPermissions } from '../framework/util/permissions';

export type ImagePicked = Required<
  Pick<ImagePickerResponse, 'uri' | 'type' | 'fileName' | 'fileSize' | 'base64' | 'width' | 'height'>
>;
export type DocumentPicked = Required<Pick<DocumentPickerResponse, 'uri' | 'type'>> & {
  fileName: string;
  fileSize: number;
};

export class FilePicker extends React.PureComponent<
  {
    callback: (document: ImagePicked | DocumentPicked) => void;
    options?: Partial<ImageLibraryOptions & CameraOptions & DocumentPickerOptions<keyof PlatformTypes>>;
  } & TouchableOpacityProps,
  {
    showModal: boolean;
  }
> {
  state = { showModal: false };

  render() {
    const { callback, options, ...props } = this.props;

    const imageCallback = (image: ImagePickerResponse) => {
      // console.log("image", image);
      !image.didCancel &&
        !image.errorCode &&
        !image.errorMessage &&
        image.assets &&
        image.assets.length > 0 &&
        image.assets[0].uri &&
        callback(image.assets[0] as ImagePicked);
      this.setState({ showModal: false });
    };

    const documentCallback = async (file: DocumentPickerResponse) => {
      !file.copyError && file.uri;
      file.uri = Platform.select({
        android: getPath(file.uri),
        default: decodeURI(file.uri.indexOf('file://') > -1 ? file.uri.split('file://')[1] : file.uri),
      });
      const { name, size, ...fileResolved } = file;
      callback({ ...fileResolved, fileName: file.name, fileSize: file.size });
      this.setState({ showModal: false });
    };

    const menuActions = [
      {
        id: 'camera',
        title: I18n.t('common-photoPicker-take'),
        action: async () => {
          // console.log("menu select camera");
          await assertPermissions("camera");
          launchCamera(
            {
              ...options,
              mediaType: 'photo',
            },
            imageCallback,
          );
        },
      },
      {
        id: 'gallery',
        title: I18n.t('common-photoPicker-pick'),
        action: async () => {
          await assertPermissions("galery.read");
          launchImageLibrary(
            {
              ...this.props.options,
              mediaType: 'photo',
            },
            imageCallback,
          );
        },
      },
      {
        id: 'document',
        title: I18n.t('common-picker-document'),
        action: async () => {
          await assertPermissions("documents.read");
          DocumentPicker.pick({
            type: DocumentPicker.types.allFiles as
              | Array<PlatformTypes[keyof PlatformTypes][keyof PlatformTypes[keyof PlatformTypes]]>
              | DocumentType[keyof PlatformTypes],
            ...options,
          }).then(documentCallback);
        },
      },
      {
        id: 'cancel',
        title: I18n.t('Cancel'),
        action: () => {
          this.setState({ showModal: false });
        },
      },
    ];

    return (
      <>
        <ModalBox backdropOpacity={0.5} isVisible={this.state.showModal}>
          <ModalContent>
            {menuActions.map(a => (
              <ModalContentBlock style={{ marginBottom: 20 }}>
                <ButtonTextIcon
                  style={{ width: 250 }}
                  textStyle={{ fontSize: 18, padding: 15, marginTop: -10 }}
                  title={a.title}
                  onPress={() => {
                    // console.log("clicked", a.id);
                    a.action();
                  }}
                />
              </ModalContentBlock>
            ))}
          </ModalContent>
        </ModalBox>
        <TouchableOpacity
          {...props}
          disallowInterruption={true}
          onPress={(event: GestureResponderEvent) => {
            this.setState({ showModal: true });
            props.onPress && props.onPress(event);
          }}>
          {this.props.children}
        </TouchableOpacity>
      </>
    );
  }
}
