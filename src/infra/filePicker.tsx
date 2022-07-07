import getPath from '@flyerhq/react-native-android-uri-path';
import I18n from 'i18n-js';
import * as React from 'react';
import { GestureResponderEvent, Platform, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import DocumentPicker, {
  DocumentPickerOptions,
  DocumentPickerResponse,
  DocumentType,
  PlatformTypes,
} from 'react-native-document-picker';
import { Asset, CameraOptions, ImageLibraryOptions } from 'react-native-image-picker';

import { UI_SIZES } from '~/framework/components/constants';
import { LocalFile } from '~/framework/util/fileHandler';
import { assertPermissions } from '~/framework/util/permissions';
import { ButtonTextIcon } from '~/ui/ButtonTextIcon';
import { ModalBox, ModalContent, ModalContentBlock } from '~/ui/Modal';

export type ImagePicked = Required<Pick<Asset, 'uri' | 'type' | 'fileName' | 'fileSize' | 'base64' | 'width' | 'height'>>;
export type DocumentPicked = Required<Pick<DocumentPickerResponse, 'uri' | 'type'>> & {
  fileName: string;
  fileSize: number;
};

export class FilePicker extends React.PureComponent<
  {
    callback: (document: ImagePicked | DocumentPicked, sourceType?: string) => void;
    options?: Partial<ImageLibraryOptions & CameraOptions & DocumentPickerOptions<keyof PlatformTypes>>;
    multiple?: boolean;
  } & TouchableOpacityProps,
  {
    enabled: boolean;
    showModal: boolean;
  }
> {
  state = { enabled: true, showModal: false };

  render() {
    const { callback, options, multiple, ...props } = this.props;
    const { enabled, showModal } = this.state;

    const imageCallback = (images: LocalFile[], sourceType: string) => {
      try {
        for (const img of images) {
          const imgFormatted = {
            ...img.nativeInfo,
            ...img,
          };
          callback(imgFormatted as ImagePicked);
        }
      } catch (error) {}
    };

    const documentCallback = async (files: DocumentPickerResponse[], sourceType: string) => {
      try {
        for (const file of files) {
          file.uri = Platform.select({
            android: getPath(file.uri),
            default: decodeURI(file.uri.indexOf('file://') > -1 ? file.uri.split('file://')[1] : file.uri),
          });
          callback({ fileName: file.name, fileSize: file.size!, uri: file.uri, type: file.type }, sourceType);
        }
      } catch (error) {}
    };

    const menuActions = [
      {
        id: 'camera',
        title: I18n.t('common-photoPicker-take'),
        action: async (sourceType: string) => {
          LocalFile.pick({ source: 'camera' })
            .then(lf => imageCallback(lf, sourceType))
            .finally(() => this.setState({ enabled: true, showModal: false }));
        },
      },
      {
        id: 'gallery',
        title: I18n.t('common-photoPicker-pick'),
        action: async (sourceType: string) => {
          LocalFile.pick({ source: 'galery', multiple })
            .then(lf => imageCallback(lf, sourceType))
            .finally(() => this.setState({ enabled: true, showModal: false }));
        },
      },
      {
        id: 'document',
        title: I18n.t('common-picker-document'),
        action: async (sourceType: string) => {
          await assertPermissions('documents.read');
          DocumentPicker.pick({
            type: DocumentPicker.types.allFiles as
              | PlatformTypes[keyof PlatformTypes][keyof PlatformTypes[keyof PlatformTypes]][]
              | DocumentType[keyof PlatformTypes],
            ...options,
          })
            .then(file => documentCallback(file, sourceType))
            .finally(() => this.setState({ enabled: true, showModal: false }));
        },
      },
      {
        id: 'cancel',
        title: I18n.t('Cancel'),
        action: (sourceType: string) => {
          this.setState({ enabled: true, showModal: false });
        },
      },
    ];

    return (
      <>
        <ModalBox backdropOpacity={0.5} isVisible={showModal}>
          <ModalContent>
            {menuActions.map(a => (
              <ModalContentBlock key={a.id} style={{ marginBottom: UI_SIZES.spacing.medium }}>
                <ButtonTextIcon
                  disabled={!enabled}
                  style={{ width: 250 }}
                  textStyle={{ fontSize: 18, padding: UI_SIZES.spacing.medium, marginTop: -UI_SIZES.spacing.small }}
                  title={a.title}
                  onPress={() => {
                    this.setState({ enabled: false });
                    a.action(a.id);
                  }}
                />
              </ModalContentBlock>
            ))}
          </ModalContent>
        </ModalBox>
        <TouchableOpacity
          {...props}
          disallowInterruption
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
