import { PermissionsAndroid, Platform } from 'react-native';

import messaging from '@react-native-firebase/messaging';

import { AuthActiveAccount, AuthSavedLoggedInAccount } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import http from '~/framework/util/http';
import { Storage } from '~/framework/util/storage';

export interface FirebaseNotificationStorage {
  'last-known-firebase-token': string;
}

/**
 * Service for managing Firebase Cloud Messaging (FCM) tokens.
 * This service handles the registration and unregistration of FCM tokens for user accounts,
 * ensures the app has the necessary permissions to receive notifications, and manages task queues
 * for registering and unregistering tokens.
 */
class FirebaseCloudMessagingService {
  registeringQueue: Parameters<typeof this.enablePushNotificationsForAccount>[] = [];

  unqueueRegisteringTasks = async () => {
    let item: (typeof this.registeringQueue)[0] | undefined;
    while ((item = this.registeringQueue.shift()) !== undefined) {
      await this.enablePushNotificationsForAccount(...item);
    }
  };

  unregisteringQueue: Parameters<typeof this.disablePushNotificationsForAccount>[] = [];

  unqueueUnregisteringTasks = async () => {
    let item: (typeof this.unregisteringQueue)[0] | undefined;
    while ((item = this.unregisteringQueue.shift()) !== undefined) {
      await this.disablePushNotificationsForAccount(...item);
    }
  };

  unqueueAllTasks = async () => {
    await Promise.all([this.unqueueRegisteringTasks(), this.unqueueUnregisteringTasks()]);
  };

  /**
   * Build a storage slice for a specific account.
   *
   * @param account - An object containing the user information of the account.
   * @returns A storage slice for Firebase notifications with the appropriate prefix.
   */
  getStorageSliceForAccount(account: Pick<AuthSavedLoggedInAccount | AuthActiveAccount, 'user'>) {
    return Storage.slice<FirebaseNotificationStorage>().setPrefix(`${Storage.PREFERENCES_PREFIX}${account.user.id}`);
  }

  constructor() {
    // Listen for token change
    messaging().onTokenRefresh(async newToken => {
      console.debug('[FirebaseMessagingService] Token refreshed', newToken);
      const session = getSession();
      if (session) {
        this.enablePushNotificationsForAccount(session);
      }
    });

    // ToDo : when to unqueue tasks ?
    // ToDo : store task queues in storage and unqueue them on app start

    // console.debug('[FirebaseMessagingService] Service auto initialized ?', messaging().isAutoInitEnabled);
  }

  /** Ensure that the app has the necessary permissions to receive notifications. Ask user for permission if needed. */
  public ensureNotificationPermissions = Platform.select({
    android: this.ensureNotificationPermissionsAndroid,
    default: async () => false,
    ios: this.ensureNotificationPermissionsIOS,
  });

  /** Ensure that the app has the necessary permissions to receive notifications on iOS. Ask user for permission if needed. */
  protected async ensureNotificationPermissionsIOS() {
    const authorizationStatus = await messaging().requestPermission();
    if (authorizationStatus !== messaging.AuthorizationStatus.AUTHORIZED) {
      // console.debug('[FirebaseMessagingService] ensureNotificationPermissionsIOS - Device permission to receive notifications is denied');
      return false;
    }
    // console.debug('[FirebaseMessagingService] ensureNotificationPermissionsIOS - Device permission to receive notifications is granted');

    // Not sure the folowing code is needed
    // if (messaging().isDeviceRegisteredForRemoteMessages === false) {
    //   console.warn('[FirebaseMessagingService] ensureNotificationPermissionsIOS - Registering for remote messages');
    //   await messaging().registerDeviceForRemoteMessages();
    //   console.debug('[FirebaseMessagingService] ensureNotificationPermissionsIOS - Remote messages registered successfully');
    // } else {
    //   console.debug('[FirebaseMessagingService] ensureNotificationPermissionsIOS - Remote messages already registered');
    // }
    // console.debug('[FirebaseMessagingService] ensureNotificationPermissionsIOS - APNS token is', await messaging().getAPNSToken());

    return true;
  }

  /** Ensure that the app has the necessary permissions to receive notifications on Android. Ask user for permission if needed. */
  protected async ensureNotificationPermissionsAndroid() {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      // console.debug('[FirebaseMessagingService] ensureNotificationPermissionsAndroid - Device permission to receive notifications is granted');
      return true;
    }
    // console.debug('[FirebaseMessagingService] ensureNotificationPermissionsAndroid - Device permission to receive notifications is denied');
    return false;
  }

  /** Read current FCM token for given device or generate a new one from firebase sdk. */
  public async getFCMToken(checkPermissions = true) {
    try {
      if (checkPermissions && (await this.ensureNotificationPermissions()) === false) {
        return;
      }
      return messaging().getToken();
    } catch (e) {
      throw new global.Error('[FirebaseMessagingService] Error getting FCM token for this device', { cause: e });
    }
  }

  /**
   * Register FCM Token for provided account.
   * If token has changed for this account since last registration, the old one will be unregistered.
   */
  public async enablePushNotificationsForAccount(account: AuthSavedLoggedInAccount | AuthActiveAccount) {
    let token: string | undefined;
    try {
      const storageForAccount = this.getStorageSliceForAccount(account);
      token = await this.getFCMToken();
      if (!token) {
        console.error('[FirebaseMessagingService] putTokenForAccount - No token to put for -', account.user.displayName);
        return;
      }
      const lastKnownToken = storageForAccount.getString('last-known-firebase-token');
      if (lastKnownToken && lastKnownToken !== token) {
        await this.disablePushNotificationsForAccount(account, lastKnownToken);
      }
      await http.fetchForAccount(account, 'PUT', `/timeline/pushNotif/fcmToken?fcmToken=${token}`);

      console.debug('[FirebaseMessagingService] putTokenForAccount - OK -', account.user.displayName, '-', token);
      storageForAccount.set('last-known-firebase-token', token);
    } catch (e) {
      /* When the token cannot be registered, we should not throw an error, as it is not a blocking operation.
       * Instead, we should log the error and try to register the token again later.
       */
      console.error('[FirebaseMessagingService] putTokenForAccount - ERROR -', account.user.displayName, '-', token, '-', e);
      this.registeringQueue.push([account]);
    }
  }

  /** Unregister given FCM Token for provided account */
  public async disablePushNotificationsForAccount(account: AuthSavedLoggedInAccount | AuthActiveAccount, token?: string) {
    try {
      const storageForAccount = this.getStorageSliceForAccount(account);
      // We get the last known token from firebase, or the provided one.
      // If firebase fails (ex: permission denied), we still try to unregister the last known token.
      token =
        token ?? (await this.getFCMToken(false).catch(() => undefined)) ?? storageForAccount.getString('last-known-firebase-token');
      if (!token) {
        console.error('[FirebaseMessagingService] deleteTokenForAccount - No token to delete for -', account.user.displayName);
        return;
      }
      await http.fetchForAccount(account, 'DELETE', `/timeline/pushNotif/fcmToken?fcmToken=${token}`);
      console.debug('[FirebaseMessagingService] deleteTokenForAccount - OK -', account.user.displayName, '-', token);
      storageForAccount.delete('last-known-firebase-token');
    } catch (e) {
      /* When the token cannot be unregistered, we should not throw an error, as it is not a blocking operation.
       * Instead, we should log the error and try to unregister the token again later.
       */
      console.error('[FirebaseMessagingService] deleteTokenForAccount - ERROR -', account.user.displayName, '-', token, '-', e);
      this.unregisteringQueue.push([account, token]);
    }
  }
}

export default new FirebaseCloudMessagingService();
