import * as React from 'react';

import { connect } from 'react-redux';

import { ILocalAttachment } from './Attachment';
import { AttachmentGroup } from './AttachmentGroup';
import { AttachmentGroupImages } from './AttachmentGroupImages';

import { ImagePicked } from '~/framework/components/menus/actions';
import { Trackers } from '~/framework/util/tracker';
import { ContentUri } from '~/types/contentUri';

class AttachmentPicker_Unconnected extends React.PureComponent<{
  attachments: ContentUri[] | ILocalAttachment[];
  attachmentsHeightHalfScreen?: number;
  imageCallback?: (image: ImagePicked) => void;
  isContainerHalfScreen?: boolean;
  notifierId: string;
  onAttachmentRemoved: (attachments: ContentUri[] | ILocalAttachment[]) => void;
  onlyImages?: boolean;
}> {
  public onRemoveAttachment(index: number) {
    const { attachments, onAttachmentRemoved } = this.props;
    const attachmentsToSend = [...attachments];
    attachmentsToSend.splice(index, 1);
    onAttachmentRemoved(attachmentsToSend);
  }

  public render() {
    const { attachments, attachmentsHeightHalfScreen, imageCallback, isContainerHalfScreen, notifierId, onlyImages } = this.props;
    return onlyImages ? (
      <AttachmentGroupImages
        imageCallback={imageCallback}
        onRemove={index => this.onRemoveAttachment(index)}
        images={attachments as ILocalAttachment[]}
        moduleName={notifierId}
      />
    ) : (
      <AttachmentGroup
        editMode
        attachments={attachments as ILocalAttachment[]}
        onRemove={index => this.onRemoveAttachment(index)}
        onOpen={() => Trackers.trackEvent('Conversation', 'OPEN ATTACHMENT', 'Edit mode')}
        isContainerHalfScreen={isContainerHalfScreen}
        attachmentsHeightHalfScreen={attachmentsHeightHalfScreen}
      />
    );
  }
}

export const AttachmentPicker = connect(null, null, null, { forwardRef: true })(AttachmentPicker_Unconnected);
