/**
 * Wiki notif handler
 * @scaffolder Remove this file if your module handles no notification.
 *
 * The notifHandler registers some behaviours for given notif types and event-types.
 * It applicates to both timelineNotififation and pushNotifications.
 */

import { NotifHandlerThunkAction, registerNotifHandlers } from '~/framework/util/notifications/routing';

const handleSomeNotificationAction: NotifHandlerThunkAction = notification => async (dispatch, getState) => {
  // @scaffolder extract info from notification here

  // @scaffolder navigate somewhere here

  // @scaffolder put `return {managed: 0}` if notification is skipped
  return { managed: 0 };

  // return {
  //   managed: 1,
  //   trackInfo: { action: 'Wiki', name: `${notification.type}.${notification['event-type']}` },
  // };
};

export default () =>
  registerNotifHandlers([
    {
      // Replace this with the backend notification type
      'event-type': 'SOME-EVENT-TYPE',
      // Replace this with the backend notification event-type
      'notifHandlerAction': handleSomeNotificationAction,
      'type': 'SOME-TYPE',
    },
  ]);
