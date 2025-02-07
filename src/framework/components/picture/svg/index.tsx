/**
 * Svg
 *
 * Display an SVG file through its name.
 *
 * To add an SVG in the app, add its path to the "imports" list below.
 * ToDo: make this list compute automatically.
 */
import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import type { SvgProps as RNSvgProps } from 'react-native-svg';

const imports = {
  // ModuleIcons
  admin: async () => import('ASSETS/icons/moduleIcons/admin.svg'),

  adressBook: async () => import('ASSETS/icons/moduleIcons/adressBook.svg'),

  archives: async () => import('ASSETS/icons/moduleIcons/archives.svg'),

  blog: async () => import('ASSETS/icons/moduleIcons/blog.svg'),

  calendar: async () => import('ASSETS/icons/moduleIcons/calendar.svg'),

  collaborativeWall: async () => import('ASSETS/icons/moduleIcons/collaborativeWall.svg'),

  community: async () => import('ASSETS/icons/moduleIcons/community.svg'),

  competences: async () => import('ASSETS/icons/moduleIcons/competences.svg'),

  'days-friday': async () => import('ASSETS/images/days/friday.svg'),

  // Images
  'days-monday': async () => import('ASSETS/images/days/monday.svg'),

  'days-saturday': async () => import('ASSETS/images/days/saturday.svg'),

  'days-thursday': async () => import('ASSETS/images/days/thursday.svg'),

  'days-tuesday': async () => import('ASSETS/images/days/tuesday.svg'),

  'days-wednesday': async () => import('ASSETS/images/days/wednesday.svg'),

  diary: async () => import('ASSETS/icons/moduleIcons/diary.svg'),

  edt: async () => import('ASSETS/icons/moduleIcons/edt.svg'),

  element: async () => import('ASSETS/icons/moduleIcons/element.svg'),

  'empty-blog': async () => import('ASSETS/images/empty-screen/empty-blog.svg'),

  'empty-content': async () => import('ASSETS/images/empty-screen/empty-content.svg'),

  'empty-conversation': async () => import('ASSETS/images/empty-screen/empty-conversation.svg'),

  'empty-eula': async () => import('ASSETS/images/empty-screen/empty-eula.svg'),

  'empty-evaluations': async () => import('ASSETS/images/empty-screen/empty-evaluations.svg'),

  'empty-form': async () => import('ASSETS/images/empty-screen/empty-form.svg'),

  'empty-form-access': async () => import('ASSETS/images/empty-screen/empty-form-access.svg'),

  'empty-hammock': async () => import('ASSETS/images/empty-screen/empty-hammock.svg'),

  'empty-homework': async () => import('ASSETS/images/empty-screen/empty-homework.svg'),

  'empty-light': async () => import('ASSETS/images/empty-screen/empty-light.svg'),

  'empty-mediacentre': async () => import('ASSETS/images/empty-screen/empty-mediacentre.svg'),

  'empty-news': async () => import('ASSETS/images/empty-screen/empty-news.svg'),

  'empty-presences': async () => import('ASSETS/images/empty-screen/empty-presences.svg'),

  'empty-pronote-uri': async () => import('ASSETS/images/empty-screen/pronote-error-uri.svg'),

  'empty-schoolbook': async () => import('ASSETS/images/empty-screen/empty-schoolbook.svg'),

  'empty-search': async () => import('ASSETS/images/empty-screen/empty-search.svg'),

  'empty-support': async () => import('ASSETS/images/empty-screen/empty-support.svg'),

  'empty-timeline': async () => import('ASSETS/images/empty-screen/empty-timeline.svg'),

  'empty-trash': async () => import('ASSETS/images/empty-screen/empty-trash.svg'),

  'empty-viesco': async () => import('ASSETS/images/empty-screen/empty-viesco.svg'),

  'empty-workspace': async () => import('ASSETS/images/empty-screen/empty-workspace.svg'),

  'empty-zimbra': async () => import('ASSETS/images/empty-screen/empty-zimbra.svg'),

  exercices: async () => import('ASSETS/icons/moduleIcons/exercices.svg'),

  files: async () => import('ASSETS/icons/moduleIcons/files.svg'),

  form: async () => import('ASSETS/icons/moduleIcons/form.svg'),

  'form-default': async () => import('ASSETS/images/form-default.svg'),

  forum: async () => import('ASSETS/icons/moduleIcons/forum.svg'),

  homeLiaisonDiary: async () => import('ASSETS/icons/moduleIcons/homeLiaisonDiary.svg'),

  'homework-assistance-home': async () => import('ASSETS/images/homework-assistance-home.svg'),

  homework1D: async () => import('ASSETS/icons/moduleIcons/homework1D.svg'),

  homework2D: async () => import('ASSETS/icons/moduleIcons/homework2D.svg'),

  homeworkAssistance: async () => import('ASSETS/icons/moduleIcons/homeworkAssistance.svg'),

  'image-not-found': async () => import('ASSETS/images/empty-screen/image-not-found.svg'),

  lvs: async () => import('ASSETS/icons/moduleIcons/lvs.svg'),

  mediacentre: async () => import('ASSETS/icons/moduleIcons/mediacentre.svg'),

  messages: async () => import('ASSETS/icons/moduleIcons/messages.svg'),

  moodle: async () => import('ASSETS/icons/moduleIcons/moodle.svg'),

  'multi-account': async () => import('ASSETS/images/multi-account.svg'),

  newsFeed: async () => import('ASSETS/icons/moduleIcons/newsFeed.svg'),

  pad: async () => import('ASSETS/icons/moduleIcons/pad.svg'),

  pages: async () => import('ASSETS/icons/moduleIcons/pages.svg'),

  peertube: async () => import('ASSETS/icons/moduleIcons/peertube.svg'),

  'pictos-answer': async () => import('ASSETS/images/pictos/answer.svg'),

  'pictos-arrow-right': async () => import('ASSETS/images/pictos/arrow-right.svg'),

  'pictos-close': async () => import('ASSETS/images/pictos/close.svg'),

  'pictos-error': async () => import('ASSETS/images/pictos/error.svg'),

  'pictos-external-link': async () => import('ASSETS/images/pictos/external-link.svg'),

  'pictos-mail': async () => import('ASSETS/images/pictos/mail.svg'),

  'pictos-redo': async () => import('ASSETS/images/pictos/redo.svg'),

  'pictos-save': async () => import('ASSETS/images/pictos/save.svg'),

  'pictos-send': async () => import('ASSETS/images/pictos/send.svg'),

  'pictos-smartphone': async () => import('ASSETS/images/pictos/smartphone.svg'),

  'pictos-success-outline': async () => import('ASSETS/images/pictos/success-outline.svg'),

  poll: async () => import('ASSETS/icons/moduleIcons/poll.svg'),

  presences: async () => import('ASSETS/icons/moduleIcons/presences.svg'),

  'rack:': async () => import('ASSETS/icons/moduleIcons/rack.svg'),

  rbs: async () => import('ASSETS/icons/moduleIcons/rbs.svg'),

  reaction_1: async () => import('ASSETS/images/reactions/reaction1.svg'),

  'reaction_1-round': async () => import('ASSETS/images/reactions/reaction1_round.svg'),

  reaction_2: async () => import('ASSETS/images/reactions/reaction2.svg'),

  'reaction_2-round': async () => import('ASSETS/images/reactions/reaction2_round.svg'),

  reaction_3: async () => import('ASSETS/images/reactions/reaction3.svg'),

  'reaction_3-round': async () => import('ASSETS/images/reactions/reaction3_round.svg'),

  reaction_4: async () => import('ASSETS/images/reactions/reaction4.svg'),

  'reaction_4-round': async () => import('ASSETS/images/reactions/reaction4_round.svg'),

  report: async () => import('ASSETS/icons/moduleIcons/report.svg'),

  'schoolbook-canteen': async () => import('ASSETS/images/schoolbook/canteen.svg'),

  'schoolbook-event': async () => import('ASSETS/images/schoolbook/event.svg'),

  'schoolbook-last-minute': async () => import('ASSETS/images/schoolbook/last-minute.svg'),

  'schoolbook-leisure': async () => import('ASSETS/images/schoolbook/leisure.svg'),

  'schoolbook-outing': async () => import('ASSETS/images/schoolbook/outing.svg'),

  'schoolbook-various': async () => import('ASSETS/images/schoolbook/various.svg'),

  scrapbook: async () => import('ASSETS/icons/moduleIcons/scrapbook.svg'),

  shareBigFiles: async () => import('ASSETS/icons/moduleIcons/shareBigFiles.svg'),

  siteMap: async () => import('ASSETS/icons/moduleIcons/siteMap.svg'),

  skills: async () => import('ASSETS/icons/moduleIcons/skills.svg'),

  'space-edi': async () => import('ASSETS/images/space/edi.svg'),

  'space-edi2': async () => import('ASSETS/images/space/edi2.svg'),

  'space-moon': async () => import('ASSETS/images/space/moon.svg'),

  'space-rocket': async () => import('ASSETS/images/space/rocket.svg'),

  'space-star1': async () => import('ASSETS/images/space/star1.svg'),

  'space-star2': async () => import('ASSETS/images/space/star2.svg'),

  'space-star3': async () => import('ASSETS/images/space/star3.svg'),

  stats: async () => import('ASSETS/icons/moduleIcons/stats.svg'),

  support: async () => import('ASSETS/icons/moduleIcons/support.svg'),

  'textbook-default': async () => import('ASSETS/images/textbook-default.svg'),

  // UI Icons
  'ui-addUser': async () => import('ASSETS/icons/uiIcons/addUser.svg'),

  timeLineGenerator: async () => import('ASSETS/icons/moduleIcons/timeLineGenerator.svg'),

  'ui-alert-triangle': async () => import('ASSETS/icons/uiIcons/alert-triangle.svg'),

  'ui-alertCircle': async () => import('ASSETS/icons/uiIcons/alertCircle.svg'),

  'ui-anniversary': async () => import('ASSETS/icons/uiIcons/anniversary.svg'),

  'ui-answer': async () => import('ASSETS/icons/uiIcons/answer.svg'),

  'ui-applications': async () => import('ASSETS/icons/uiIcons/applications.svg'),

  'ui-arrowDown': async () => import('ASSETS/icons/uiIcons/arrowDown.svg'),

  'ui-arrowLeft': async () => import('ASSETS/icons/uiIcons/arrowLeft.svg'),

  'ui-arrowRight': async () => import('ASSETS/icons/uiIcons/arrowRight.svg'),

  'ui-arrowUp': async () => import('ASSETS/icons/uiIcons/arrowUp.svg'),

  'ui-attachment': async () => import('ASSETS/icons/uiIcons/attachment.svg'),

  'ui-audio': async () => import('ASSETS/icons/uiIcons/audio.svg'),

  'ui-backpack': async () => import('ASSETS/icons/uiIcons/backpack.svg'),

  'ui-block': async () => import('ASSETS/icons/uiIcons/block.svg'),

  'ui-bold': async () => import('ASSETS/icons/uiIcons/bold.svg'),

  'ui-book': async () => import('ASSETS/icons/uiIcons/book.svg'),

  'ui-bookmark': async () => import('ASSETS/icons/uiIcons/bookmark.svg'),

  'ui-burgerMenu': async () => import('ASSETS/icons/uiIcons/burgerMenu.svg'),

  'ui-calendar': async () => import('ASSETS/icons/uiIcons/calendar.svg'),

  'ui-calendarLight': async () => import('ASSETS/icons/uiIcons/calendarLight.svg'),

  'ui-camera': async () => import('ASSETS/icons/uiIcons/camera.svg'),

  'ui-check': async () => import('ASSETS/icons/uiIcons/check.svg'),

  'ui-checkbox-check': async () => import('ASSETS/icons/uiIcons/checkboxCheck.svg'),

  'ui-checkbox-mixed': async () => import('ASSETS/icons/uiIcons/checkbox-mixed.svg'),

  'ui-checkbox-off': async () => import('ASSETS/icons/uiIcons/checkbox-off.svg'),

  'ui-checkbox-on': async () => import('ASSETS/icons/uiIcons/checkbox-on.svg'),

  'ui-checkbox-partial': async () => import('ASSETS/icons/uiIcons/checkboxPartial.svg'),

  'ui-checklist': async () => import('ASSETS/icons/uiIcons/checklist.svg'),

  'ui-christmas': async () => import('ASSETS/icons/uiIcons/christmas.svg'),

  'ui-class': async () => import('ASSETS/icons/uiIcons/class.svg'),

  'ui-clock': async () => import('ASSETS/icons/uiIcons/clock.svg'),

  'ui-clock-alert': async () => import('ASSETS/icons/uiIcons/clock-alert.svg'),

  'ui-close': async () => import('ASSETS/icons/uiIcons/close.svg'),

  'ui-closeFullScreen': async () => import('ASSETS/icons/uiIcons/closeFullScreen.svg'),

  'ui-copy': async () => import('ASSETS/icons/uiIcons/copy.svg'),

  'ui-cottage': async () => import('ASSETS/icons/uiIcons/cottage.svg'),

  'ui-cut': async () => import('ASSETS/icons/uiIcons/cut.svg'),

  'ui-delete': async () => import('ASSETS/icons/uiIcons/delete.svg'),

  'ui-depositeInbox': async () => import('ASSETS/icons/uiIcons/depositeInbox.svg'),

  'ui-download': async () => import('ASSETS/icons/uiIcons/download.svg'),

  'ui-drag': async () => import('ASSETS/icons/uiIcons/drag.svg'),

  'ui-edifice': async () => import('ASSETS/icons/uiIcons/edifice.svg'),

  'ui-edit': async () => import('ASSETS/icons/uiIcons/edit.svg'),

  'ui-environment': async () => import('ASSETS/icons/uiIcons/environment.svg'),

  'ui-error': async () => import('ASSETS/icons/uiIcons/error.svg'),

  'ui-error-past': async () => import('ASSETS/icons/uiIcons/error-past.svg'),

  'ui-external-link': async () => import('ASSETS/icons/uiIcons/external-link.svg'),

  'ui-externalLink': async () => import('ASSETS/icons/uiIcons/externalLink.svg'),

  'ui-eye': async () => import('ASSETS/icons/uiIcons/eye.svg'),

  'ui-eyeSlash': async () => import('ASSETS/icons/uiIcons/eyeSlash.svg'),

  'ui-filter': async () => import('ASSETS/icons/uiIcons/filter.svg'),

  'ui-flag': async () => import('ASSETS/icons/uiIcons/flag.svg'),

  'ui-folder': async () => import('ASSETS/icons/uiIcons/folder.svg'),

  'ui-folderMove': async () => import('ASSETS/icons/uiIcons/folderMove.svg'),

  'ui-forgoing': async () => import('ASSETS/icons/uiIcons/forgoing.svg'),

  'ui-forgoing-check': async () => import('ASSETS/icons/uiIcons/forgoing-check.svg'),

  'ui-forgoing-error': async () => import('ASSETS/icons/uiIcons/forgoing-error.svg'),

  'ui-fullScreen': async () => import('ASSETS/icons/uiIcons/fullScreen.svg'),

  'ui-globe': async () => import('ASSETS/icons/uiIcons/globe.svg'),

  'ui-hide': async () => import('ASSETS/icons/uiIcons/hide.svg'),

  'ui-home': async () => import('ASSETS/icons/uiIcons/home.svg'),

  'ui-hourglass': async () => import('ASSETS/icons/uiIcons/hourglass.svg'),

  'ui-image': async () => import('ASSETS/icons/uiIcons/image.svg'),

  'ui-image-preview': async () => import('ASSETS/icons/uiIcons/image-preview.svg'),

  'ui-inbox': async () => import('ASSETS/icons/uiIcons/inbox.svg'),

  'ui-infoCircle': async () => import('ASSETS/icons/uiIcons/infoCircle.svg'),

  'ui-internet': async () => import('ASSETS/icons/uiIcons/internet.svg'),

  'ui-italic': async () => import('ASSETS/icons/uiIcons/italic.svg'),

  'ui-keyboardHide': async () => import('ASSETS/icons/uiIcons/keyboardHide.svg'),

  'ui-laptop': async () => import('ASSETS/icons/uiIcons/laptop.svg'),

  'ui-leave': async () => import('ASSETS/icons/uiIcons/leave.svg'),

  'ui-listOrder': async () => import('ASSETS/icons/uiIcons/listOrder.svg'),

  'ui-loader': async () => import('ASSETS/icons/uiIcons/loader.svg'),

  'ui-lock': async () => import('ASSETS/icons/uiIcons/lock.svg'),

  'ui-lock-alternate': async () => import('ASSETS/icons/uiIcons/lock-alternate.svg'),

  'ui-logout': async () => import('ASSETS/icons/uiIcons/logout.svg'),

  'ui-mail': async () => import('ASSETS/icons/uiIcons/mail.svg'),

  'ui-mailRead': async () => import('ASSETS/icons/uiIcons/mailRead.svg'),

  'ui-mailUnread': async () => import('ASSETS/icons/uiIcons/mailUnread.svg'),

  'ui-megaphone': async () => import('ASSETS/icons/uiIcons/megaphone.svg'),

  'ui-messageInfo': async () => import('ASSETS/icons/uiIcons/messageInfo.svg'),

  'ui-mic': async () => import('ASSETS/icons/uiIcons/mic.svg'),

  'ui-mic-preview': async () => import('ASSETS/icons/uiIcons/mic-preview.svg'),

  'ui-minus': async () => import('ASSETS/icons/uiIcons/minus.svg'),
  'ui-move': async () => import('ASSETS/icons/uiIcons/move.svg'),
  'ui-notif': async () => import('ASSETS/icons/uiIcons/notif.svg'),
  'ui-options': async () => import('ASSETS/icons/uiIcons/options.svg'),
  'ui-orderedList': async () => import('ASSETS/icons/uiIcons/orderedList.svg'),
  'ui-pause': async () => import('ASSETS/icons/uiIcons/pause.svg'),
  'ui-personBook': async () => import('ASSETS/icons/uiIcons/person_book.svg'),
  'ui-phone': async () => import('ASSETS/icons/uiIcons/phone.svg'),
  'ui-play': async () => import('ASSETS/icons/uiIcons/play.svg'),
  'ui-play-filled': async () => import('ASSETS/icons/uiIcons/play-filled.svg'),
  'ui-plus': async () => import('ASSETS/icons/uiIcons/plus.svg'),
  'ui-print': async () => import('ASSETS/icons/uiIcons/print.svg'),
  'ui-question': async () => import('ASSETS/icons/uiIcons/question.svg'),
  'ui-radio-checked': async () => import('ASSETS/icons/uiIcons/radio-checked.svg'),
  'ui-radio-unchecked': async () => import('ASSETS/icons/uiIcons/radio-unchecked.svg'),
  'ui-rafterDown': async () => import('ASSETS/icons/uiIcons/rafterDown.svg'),
  'ui-rafterLeft': async () => import('ASSETS/icons/uiIcons/rafterLeft.svg'),
  'ui-rafterRight': async () => import('ASSETS/icons/uiIcons/rafterRight.svg'),
  'ui-rafterUp': async () => import('ASSETS/icons/uiIcons/rafterUp.svg'),
  'ui-reaction': async () => import('ASSETS/icons/uiIcons/reaction.svg'),
  'ui-recordVideo': async () => import('ASSETS/icons/uiIcons/recordVideo.svg'),
  'ui-recordVideo-preview': async () => import('ASSETS/icons/uiIcons/recordVideo-preview.svg'),
  'ui-recordVoice': async () => import('ASSETS/icons/uiIcons/recordVoice.svg'),
  'ui-redo': async () => import('ASSETS/icons/uiIcons/redo.svg'),
  'ui-refresh': async () => import('ASSETS/icons/uiIcons/refresh.svg'),
  'ui-restore': async () => import('ASSETS/icons/uiIcons/restore.svg'),
  'ui-save': async () => import('ASSETS/icons/uiIcons/save.svg'),
  'ui-school': async () => import('ASSETS/icons/uiIcons/school.svg'),
  'ui-search': async () => import('ASSETS/icons/uiIcons/search.svg'),
  'ui-see': async () => import('ASSETS/icons/uiIcons/see.svg'),
  'ui-send': async () => import('ASSETS/icons/uiIcons/send.svg'),
  'ui-settings': async () => import('ASSETS/icons/uiIcons/settings.svg'),
  'ui-share': Platform.select({
    android: async () => import('ASSETS/icons/uiIcons/shareAOS.svg'),
    ios: async () => import('ASSETS/icons/uiIcons/shareIOS.svg'),
  }),
  'ui-skills': async () => import('ASSETS/icons/uiIcons/skills.svg'),
  'ui-smartphone': async () => import('ASSETS/icons/uiIcons/smartphone.svg'),
  'ui-sparkle': async () => import('ASSETS/icons/uiIcons/sparkle.svg'),
  'ui-star-filled': async () => import('ASSETS/icons/uiIcons/star-filled.svg'),
  'ui-subscript': async () => import('ASSETS/icons/uiIcons/subscript.svg'),
  'ui-success': async () => import('ASSETS/icons/uiIcons/success.svg'),
  'ui-success_fill': async () => import('ASSETS/icons/uiIcons/success_fill.svg'),
  'ui-success_outline': async () => import('ASSETS/icons/uiIcons/success_outline.svg'),
  'ui-superscript': async () => import('ASSETS/icons/uiIcons/superscript.svg'),
  'ui-teacher': async () => import('ASSETS/icons/uiIcons/teacher.svg'),
  'ui-text-options': async () => import('ASSETS/icons/uiIcons/textOptions.svg'),
  'ui-text-size': async () => import('ASSETS/icons/uiIcons/text-size.svg'),
  'ui-text-typo': async () => import('ASSETS/icons/uiIcons/text-typo.svg'),
  'ui-textPage': async () => import('ASSETS/icons/uiIcons/textPage.svg'),
  'ui-toga': async () => import('ASSETS/icons/uiIcons/toga.svg'),
  'ui-tool': async () => import('ASSETS/icons/uiIcons/tool.svg'),
  'ui-trash': async () => import('ASSETS/icons/uiIcons/trash.svg'),
  'ui-trending-up': async () => import('ASSETS/icons/uiIcons/trending-up.svg'),
  'ui-unarchive': async () => import('ASSETS/icons/uiIcons/unarchive.svg'),
  'ui-underline': async () => import('ASSETS/icons/uiIcons/underline.svg'),
  'ui-undo': async () => import('ASSETS/icons/uiIcons/undo.svg'),
  'ui-unorderedList': async () => import('ASSETS/icons/uiIcons/unorderedList.svg'),
  'ui-upcoming': async () => import('ASSETS/icons/uiIcons/upcoming.svg'),
  'ui-upload': async () => import('ASSETS/icons/uiIcons/upload.svg'),
  'ui-user': async () => import('ASSETS/icons/uiIcons/user.svg'),
  'ui-users': async () => import('ASSETS/icons/uiIcons/users.svg'),
  'ui-userSearch': async () => import('ASSETS/icons/uiIcons/userSearch.svg'),
  'ui-userSearchColor': async () => import('ASSETS/icons/uiIcons/userSearchColorized.svg'),
  'ui-video': async () => import('ASSETS/icons/uiIcons/video.svg'),
  'ui-walk': async () => import('ASSETS/icons/uiIcons/walk.svg'),
  'ui-warning': async () => import('ASSETS/icons/uiIcons/warning.svg'),
  'ui-wavering': async () => import('ASSETS/icons/uiIcons/wavering.svg'),
  'ui-write': async () => import('ASSETS/icons/uiIcons/write.svg'),
  user: async () => import('ASSETS/icons/moduleIcons/user.svg'),
  'user-email': async () => import('ASSETS/images/user/email.svg'),
  'user-smartphone': async () => import('ASSETS/images/user/smartphone.svg'),
  'userpage-header': async () => import('ASSETS/images/userpage-header.svg'),
  wekan: async () => import('ASSETS/icons/moduleIcons/wekan.svg'),
  wiki: async () => import('ASSETS/icons/moduleIcons/wiki.svg'),
  xmas: async () => import('ASSETS/images/xmas.svg'),
};

let importsCache = {};

export const addToCache = async (name: string) => {
  if (!importsCache[name]) {
    let svg = null;
    try {
      svg = (await imports[name]()).default;
    } finally {
      if (svg) importsCache[name] = svg;
    }
  }
};

export const clearCache = () => {
  importsCache = {};
};

export const removeFromCache = (name: string) => {
  delete importsCache[name];
};

export interface SvgProps extends RNSvgProps {
  name: string;
  cached?: boolean;
}

export const Svg = ({ cached, name, ...rest }: SvgProps): React.JSX.Element | null => {
  const ImportedSVGRef = useRef<any>(importsCache[name]);
  const [loading, setLoading] = React.useState(false);
  useEffect((): void => {
    if (!importsCache[name]) {
      // We use the cached item even if props.cached === false, if it has already been cached in another context.
      setLoading(true);
      const importSVG = async (): Promise<void> => {
        try {
          ImportedSVGRef.current = (await imports[name]()).default;
          if (cached) {
            importsCache[name] = ImportedSVGRef.current;
          }
        } finally {
          setLoading(false);
        }
      };
      importSVG();
    }
  }, [cached, name]);
  if (!loading && ImportedSVGRef.current) {
    const { current: ImportedSVG } = ImportedSVGRef;
    return <ImportedSVG {...rest} />;
  }
  return null;
};

export default Svg;
