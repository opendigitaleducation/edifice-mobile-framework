import * as React from 'react';
import { FlatList, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { TouchableOpacity as RNGHTouchableOpacity } from 'react-native-gesture-handler';

import Attachment, { IRemoteAttachment } from './Attachment';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { CaptionText, SmallBoldText } from '~/framework/components/text';
import { markViewAudience } from '~/framework/modules/audience';
import { AudienceParameter } from '~/framework/modules/audience/types';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.palette.grey.fog,
    borderColor: theme.palette.grey.pearl,
    borderRadius: UI_SIZES.radius.newCard,
    borderWidth: UI_SIZES.elements.border.thin,
    padding: UI_SIZES.spacing.small,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: UI_SIZES.spacing.small,
  },
});

export class AttachmentGroup extends React.PureComponent<
  {
    attachments: IRemoteAttachment[];
    containerStyle?: any;
    editMode?: boolean;
    isContainerHalfScreen?: boolean;
    attachmentsHeightHalfScreen?: number;
    onRemove?: (index: number) => void;
    onDownload?: () => void;
    onError?: () => void;
    onOpen?: () => void;
    onDownloadAll?: () => void;
    referer: AudienceParameter;
  },
  {
    downloadAll: boolean;
  }
> {
  public constructor(props) {
    super(props);
    this.state = {
      downloadAll: false,
    };
  }

  public render() {
    const { attachments, containerStyle, editMode, onDownload, onDownloadAll, onError, onOpen, onRemove } = this.props;
    const { downloadAll } = this.state;
    return (
      <TouchableOpacity activeOpacity={1} style={[styles.container, containerStyle]}>
        {editMode ? null : (
          <View style={styles.header}>
            <SmallBoldText>{I18n.get(attachments.length > 1 ? 'attachment-attachments' : 'attachment-attachment')}</SmallBoldText>
          </View>
        )}
        <View
          style={{
            flex: 0,
            marginBottom: 0,
            marginTop: 0,
            maxHeight: editMode ? 150 : undefined,
            paddingVertical: UI_SIZES.spacing.tiny / 2,
          }}>
          <SafeAreaView>
            <FlatList
              style={{ flex: 0 }}
              data={attachments}
              renderItem={({ index, item }) => (
                <View onStartShouldSetResponder={() => true}>
                  <Attachment
                    key={index}
                    attachment={item}
                    starDownload={downloadAll}
                    onDownload={() => {
                      onDownload?.();
                      if (this.props.referer) markViewAudience(this.props.referer);
                    }}
                    onError={onError}
                    onOpen={onOpen}
                    style={{ marginTop: index === 0 ? 0 : UI_SIZES.spacing.tiny / 2 }}
                    editMode={editMode && !item.hasOwnProperty('id')}
                    onRemove={() => onRemove && onRemove(index)}
                  />
                </View>
              )}
            />
          </SafeAreaView>
        </View>
      </TouchableOpacity>
    );
  }
}
