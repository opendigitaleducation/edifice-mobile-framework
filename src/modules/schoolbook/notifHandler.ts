/**
 * Schoolbook notif handler
 */
import { computeRelativePath } from '~/framework/util/navigation';
import type { IResourceUriNotification, ITimelineNotification } from '~/framework/util/notifications';
import { NotifHandlerThunkAction, registerNotifHandlers } from '~/framework/util/notifications/routing';
import { UserType, getUserSession } from '~/framework/util/session';
import { mainNavNavigate } from '~/navigation/helpers/navHelper';

import moduleConfig from './moduleConfig';

export interface ISchoolbookNotification extends ITimelineNotification, IResourceUriNotification {}

const handleSchoolbookNotificationAction: NotifHandlerThunkAction =
  (notification, trackCategory, navState) => async (dispatch, getState) => {
    const userType = getUserSession().user?.type;
    const isParent = userType === UserType.Relative;
    const route = computeRelativePath(`${moduleConfig.routeName}${isParent ? '' : '/details'}`, navState);
    mainNavNavigate(route, {
      notification,
    });
    return {
      managed: 1,
      trackInfo: { action: 'Schoolbook', name: `${notification.type}.${notification['event-type']}` },
    };
  };

export default () =>
  registerNotifHandlers([
    {
      type: 'SCHOOLBOOK',
      'event-type': ['PUBLISH', 'WORD-SHARED', 'WORD-RESEND', 'ACKNOWLEDGE', 'RESPONSE', 'MODIFYRESPONSE'],
      notifHandlerAction: handleSchoolbookNotificationAction,
    },
  ]);
