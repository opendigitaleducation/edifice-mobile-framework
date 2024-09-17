import * as React from 'react';
import { FlatList, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { TouchableOpacity as RNGHTouchableOpacity } from 'react-native-gesture-handler';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { CaptionText, SmallBoldText } from '~/framework/components/text';
import { markViewAudience } from '~/framework/modules/audience';
import { AudienceParameter } from '~/framework/modules/audience/types';

import Attachment, { IRemoteAttachment } from './Attachment';

const styles = StyleSheet.create({
  container: {
    padding: UI_SIZES.spacing.small,
    backgroundColor: theme.palette.grey.fog,
    borderRadius: UI_SIZES.radius.newCard,
    borderWidth: UI_SIZES.elements.border.thin,
    borderColor: theme.palette.grey.pearl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    const { attachments, editMode, containerStyle, onRemove, onDownload, onDownloadAll, onError, onOpen } = this.props;
    const { downloadAll } = this.state;
    return (
      <TouchableOpacity activeOpacity={1} style={[styles.container, containerStyle]}>
        {editMode ? null : (
          <View style={styles.header}>
            <SmallBoldText>{I18n.get(attachments.length > 1 ? 'attachment-attachments' : 'attachment-attachment')}</SmallBoldText>
            {attachments.length > 1 ? (
              <RNGHTouchableOpacity
                onPress={() => {
                  this.setState({ downloadAll: true });
                  onDownloadAll && onDownloadAll();
                  if (this.props.referer) markViewAudience(this.props.referer);
                }}>
                <CaptionText style={{ color: theme.palette.primary.regular }}>{I18n.get('attachment-download-all')}</CaptionText>
              </RNGHTouchableOpacity>
            ) : null}
          </View>
        )}
        <View
          style={{
            flex: 0,
            paddingVertical: UI_SIZES.spacing.tiny / 2,
            marginTop: 0,
            marginBottom: 0,
            maxHeight: editMode ? 150 : undefined,
          }}>
          <SafeAreaView>
            <FlatList
              style={{ flex: 0 }}
              data={attachments}
              renderItem={({ item, index }) => (
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
