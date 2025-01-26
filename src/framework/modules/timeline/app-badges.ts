import deepmerge from 'deepmerge';

import theme from '~/app/theme';
import appConf from '~/framework/util/appConf';
import { IAppBadgeInfo, IAppBadgesInfoDeclaration } from '~/framework/util/moduleTool';

// all badges have default values that can be overrided with their moduleConfig.

const variableColor = appConf.is1d ? theme.palette.primary.regular : theme.palette.complementary.green.regular;

export let APPBADGES: {
  [key: string]: IAppBadgeInfo;
} = {
  ARCHIVE: { color: theme.palette.complementary.yellow.regular, icon: { name: 'archives', type: 'Svg' } },
  BLOG: { color: theme.palette.complementary.indigo.regular, icon: { name: 'blog', type: 'Svg' } },
  CALENDAR: { color: theme.palette.complementary.yellow.regular, icon: { name: 'calendar', type: 'Svg' } },
  COLLABORATIVEEDITOR: { color: theme.palette.complementary.blue.regular, icon: { name: 'pad', type: 'Svg' } },
  COLLABORATIVEWALL: { color: theme.palette.complementary.green.regular, icon: { name: 'collaborativeWall', type: 'Svg' } },
  COMMUNITY: { color: theme.palette.complementary.purple.regular, icon: { name: 'community', type: 'Svg' } },
  EXERCIZER: { color: theme.palette.complementary.purple.regular, icon: { name: 'exercices', type: 'Svg' } },
  FORMULAIRE: { color: theme.palette.complementary.purple.regular, icon: { name: 'form', type: 'Svg' } },
  FORUM: { color: theme.palette.complementary.blue.regular, icon: { name: 'forum', type: 'Svg' } },
  HOMEWORKS: { color: theme.palette.complementary.green.regular, icon: { name: 'homework1D', type: 'Svg' } },
  MESSAGERIE: { color: theme.palette.complementary.yellow.regular, icon: { name: 'messages', type: 'Svg' } },
  MINDMAP: { color: theme.palette.complementary.blue.regular, icon: { name: 'siteMap', type: 'Svg' } },
  NEWS: { color: theme.palette.complementary.blue.regular, icon: { name: 'newsFeed', type: 'Svg' } },
  PAGES: { color: theme.palette.complementary.red.regular, icon: { name: 'pages', type: 'Svg' } },
  POLL: { color: theme.palette.complementary.blue.regular, icon: { name: 'poll', type: 'Svg' } },
  PRESENCES: { color: theme.palette.complementary.yellow.regular, icon: { name: 'presences', type: 'Svg' } },
  RACK: { color: theme.palette.complementary.red.regular, icon: { name: 'rack', type: 'Svg' } },
  RBS: { color: theme.palette.complementary.pink.regular, icon: { name: 'rbs', type: 'Svg' } },
  SCHOOLBOOK: { color: theme.palette.complementary.green.regular, icon: { name: 'homeLiaisonDiary', type: 'Svg' } },
  SCRAPBOOK: { color: theme.palette.complementary.green.regular, icon: { name: 'scrapbook', type: 'Svg' } },
  SHAREBIGFILES: { color: theme.palette.complementary.purple.regular, icon: { name: 'shareBigFiles', type: 'Svg' } },
  SUPPORT: { color: theme.palette.complementary.green.regular, icon: { name: 'support', type: 'Svg' } },
  TIMELINE: { color: theme.palette.complementary.indigo.regular, icon: { name: 'report', type: 'Svg' } },
  TIMELINEGENERATOR: { color: theme.palette.complementary.yellow.regular, icon: { name: 'timeLineGenerator', type: 'Svg' } },
  USERBOOK: { color: variableColor, icon: { name: 'adressBook', type: 'Svg' } },
  USERBOOK_MOOD: { color: variableColor, icon: { name: 'adressBook', type: 'Svg' } },
  USERBOOK_MOTTO: { color: variableColor, icon: { name: 'adressBook', type: 'Svg' } },
  WIKI: { color: theme.palette.complementary.purple.regular, icon: { name: 'wiki', type: 'Svg' } },
  WORKSPACE: { color: theme.palette.complementary.red.regular, icon: { name: 'files', type: 'Svg' } },
};

export const updateAppBadges = (badges: IAppBadgesInfoDeclaration) => {
  APPBADGES = deepmerge(APPBADGES, badges, {}) as typeof APPBADGES;
};
