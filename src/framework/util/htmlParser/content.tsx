import { decode } from 'html-entities';
import * as React from 'react';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { IMedia } from '~/framework//util/notifications';
import { UI_SIZES } from '~/framework/components/constants';
import MediaButton from '~/framework/components/media/button';
import { SmallItalicText } from '~/framework/components/text';
import { AudienceParameter } from '~/framework/modules/audience/types';
import { computeVideoThumbnail } from '~/framework/modules/workspace/service';
import { formatSource } from '~/framework/util/media';
import { IRemoteAttachment } from '~/ui/Attachment';
import { AttachmentGroup } from '~/ui/AttachmentGroup';
import Images from '~/ui/Images';

/**
 * Extracts text from an input html string
 * @param html
 */
export const extractTextFromHtml = (html: string) => {
  if (!html) return;
  const attachmentGroupRegex = /<div class="download-attachments">.*?<\/a><\/div><\/div>/g;
  const attachmentGroupRegexNewEditor = /<div class="attachments">.*?<\/div>/gs;
  let textWithoutAttachmentGroups = '';
  textWithoutAttachmentGroups = html.replaceAll(attachmentGroupRegex, '');
  textWithoutAttachmentGroups = textWithoutAttachmentGroups.replaceAll(attachmentGroupRegexNewEditor, '');
  const onlyText = textWithoutAttachmentGroups.replaceAll(/<(\/div|\/p|\/li|br|)>/g, '\n').replaceAll(/<.*?>/g, '');
  const unescaped = decode(onlyText);
  const trimmedToNull = unescaped === null ? null : unescaped.trim().length === 0 ? null : unescaped.trim();
  const trimmedToBlank = trimmedToNull !== null ? trimmedToNull : '';
  const formattedSpaces = trimmedToBlank
    .replaceAll(/\u200b/g, '') // Remove ZWSP
    .replaceAll(/^\s+|\s+$/g, '') // Trim blank from start and end
    .replaceAll(/\s+/g, ' '); // Compact spaces & new lines

  return formattedSpaces;
};

/**
 * Extracts media from an input html string
 * @param html
 */
export const extractMediaFromHtml = (html: string) => {
  if (!html) return;
  const imageRegex = /<img(\s+[^>]*)?\ssrc=\"([^\"]+)\"/g;
  const audioRegex = /<audio(\s+[^>]*)?\ssrc=\"([^\"]+)\"/g;
  const videoRegex = /<video(\s+[^>]*)>/g;
  const tagAttributesPattern = /(data-)?([^= ]+)=\"([^\"]*)\"/g;
  const iframeRegex = /<iframe(\s+[^>]*)?\ssrc=\"([^\"]+)\"/g;

  const attachmentGroupRegex = /<div class="download-attachments">.*?<\/a><\/div><\/div>/g;
  const attachmentRegex = /<a.*?>.*?<\/a>/g;
  const attachmentGroupRegexNewEditor = /<div class="attachments">.*?<\/div>/gs;
  const attachmentRegexNewEditor = /<a.*?>.*?<\/a>/gs;

  const foundImages = [...html.matchAll(imageRegex)];
  const foundAudios = [...html.matchAll(audioRegex)];
  const foundVideos = [...html.matchAll(videoRegex)];
  const foundIframes = [...html.matchAll(iframeRegex)];
  const foundAttachmentGroups = [...html.matchAll(attachmentGroupRegex)];
  const foundAttachmentGroupsNewEditor = [...html.matchAll(attachmentGroupRegexNewEditor)];
  const foundAttachmentsByGroup =
    foundAttachmentGroups &&
    foundAttachmentGroups.map(foundAttachmentGroup => ({
      index: foundAttachmentGroup.index,
      attachments: foundAttachmentGroup[0].match(attachmentRegex),
    }));
  const foundAttachmentsByGroupNewEditor =
    foundAttachmentGroupsNewEditor &&
    foundAttachmentGroupsNewEditor.map(foundAttachmentGroup => ({
      index: foundAttachmentGroup.index,
      attachments: foundAttachmentGroup[0].match(attachmentRegexNewEditor),
    }));

  const unsortedMedia = [] as IMedia[];

  foundImages &&
    foundImages.forEach(foundImage => {
      unsortedMedia.push({ type: 'image', src: foundImage[2], index: foundImage.index || 0 });
    });
  foundAudios &&
    foundAudios.forEach(foundAudio => {
      unsortedMedia.push({ type: 'audio', src: foundAudio[2], index: foundAudio.index || 0 });
    });
  foundVideos &&
    foundVideos.forEach(foundVideo => {
      const videoAttrs = [...foundVideo[1].matchAll(tagAttributesPattern)];
      unsortedMedia.push({
        type: 'video',
        src: foundVideo[2],
        index: foundVideo.index || 0,
        ...Object.fromEntries(videoAttrs.map(attr => attr.slice(2))),
      });
    });
  foundIframes &&
    foundIframes.forEach(foundIframe => {
      unsortedMedia.push({ type: 'iframe', src: foundIframe[2], index: foundIframe.index || 0 });
    });

  const unflattenedAttachments = [] as { index: number; type: string; src: string; name: string }[];
  foundAttachmentsByGroup &&
    foundAttachmentsByGroup.forEach(attGroup => {
      for (const attHtml of attGroup.attachments || []) {
        const attUrl = attHtml.match(/href="(.*?)"/g);
        const attDisplayName = attHtml.match(/<\/div>.*?<\/a>/g);
        attUrl &&
          attDisplayName &&
          unflattenedAttachments.push({
            type: 'attachment',
            src: attUrl && `${attUrl[0].replace('href="', '').replace('"', '')}`,
            name: attDisplayName && attDisplayName[0].replace(/<\/div>/g, '').replace(/<\/a>/g, ''),
            index: attGroup.index || 0,
          });
      }
    });
  foundAttachmentsByGroupNewEditor &&
    foundAttachmentsByGroupNewEditor.forEach(attGroup => {
      for (const attHtml of attGroup.attachments || []) {
        const attUrl = attHtml.match(/href="(.*?)"/gs);
        const attDisplayName = attHtml.match(/<a\s+[^>]*>(.*?)<\/a>/s);
        attUrl &&
          attDisplayName &&
          unflattenedAttachments.push({
            type: 'attachment',
            src: attUrl && `${attUrl[0].replace('href="', '').replace('"', '')}`,
            name: attDisplayName && attDisplayName[1].trim(),
            index: attGroup.index || 0,
          });
      }
    });
  unsortedMedia.push(...unflattenedAttachments.flat());

  return unsortedMedia.sort((a, b) => a.index - b.index);
};

const renderAttachementsPreview = (medias: IMedia[], referer: AudienceParameter) => {
  const mediaAttachments: IMedia[] = [];
  for (const mediaItem of medias) {
    if (mediaAttachments.length === 4 || mediaItem.type !== 'attachment') break;
    mediaAttachments.push(mediaItem);
  }
  const attachments = mediaAttachments.map(mediaAtt => ({
    url: mediaAtt.src as string,
    displayName: mediaAtt.name,
  }));
  return <AttachmentGroup attachments={attachments as IRemoteAttachment[]} containerStyle={{ flex: 1 }} referer={referer} />;
};

export const extractVideoResolution = (resolutionAsString: string) => {
  const match = resolutionAsString ? /^(\d+)x(\d+)$/.exec(resolutionAsString) : undefined;
  return match ? [parseInt(match[1]), parseInt(match[2])] : undefined;
};

const notAvailableMediaTexts = {
  audio: 'htmlparser-audio-notavailable',
  video: 'htmlparser-video-notavailable',
  image: 'htmlparser-image-notavailable',
  media: 'htmlparser-media-notavailable',
};

const renderAudioVideoPreview = (media: IMedia, referer: AudienceParameter) => {
  const videoDimensions = media['video-resolution'] ? extractVideoResolution(media['video-resolution']) : undefined;
  const videoId = media['document-id'] as string | undefined;
  if (!media.src) {
    return (
      <SmallItalicText style={{ backgroundColor: theme.palette.grey.cloudy, width: '100%', padding: UI_SIZES.spacing.small }}>
        {I18n.get(notAvailableMediaTexts[media.type || 'media'])}
      </SmallItalicText>
    );
  }
  return (
    <MediaButton
      type={media.type as 'audio' | 'video'}
      source={formatSource(media.src as string)}
      posterSource={videoId && videoDimensions ? formatSource(computeVideoThumbnail(videoId, videoDimensions)) : undefined}
      ratio={videoDimensions && videoDimensions[1] !== 0 ? videoDimensions[0] / videoDimensions[1] : undefined}
      referer={referer}
    />
  );
};

const renderIframePreview = (media: IMedia, referer: AudienceParameter) => {
  return <MediaButton type="web" source={formatSource(media.src as string)} referer={referer} />;
};

const renderImagesPreview = (medias: IMedia[], referer: AudienceParameter) => {
  const images: IMedia[] = [];
  for (const mediaItem of medias) {
    if (mediaItem.type !== 'image') break;
    images.push(mediaItem);
  }
  const imageSrcs = images.map((image, index) => ({
    src: formatSource(image.src as string),
    alt: `image-${index}`,
  }));
  return <Images images={imageSrcs} referer={referer} />;
};

/**
 * Renders first medias from an input media array
 * @param medias
 */
export const renderMediaPreview = (medias: IMedia[], referer: AudienceParameter) => {
  const firstMedia = medias && medias[0];
  const components = {
    attachment: () => renderAttachementsPreview(medias, referer),
    audio: () => renderAudioVideoPreview(firstMedia, referer),
    iframe: () => renderIframePreview(firstMedia, referer),
    image: () => renderImagesPreview(medias, referer),
    video: () => renderAudioVideoPreview(firstMedia, referer),
  };
  return firstMedia && components[firstMedia.type]?.();
};
