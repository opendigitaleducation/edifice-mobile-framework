// Permission handler
import { Platform } from 'react-native';

import DeviceInfo from 'react-native-device-info';
import { check, checkMultiple, Permission, PERMISSIONS, PermissionStatus, request, RESULTS } from 'react-native-permissions';

const permissionsScenarios = {
  'camera': Platform.select<true | Permission>({
    android: PERMISSIONS.ANDROID.CAMERA,
    ios: PERMISSIONS.IOS.CAMERA,
  })!,
  'documents.read': Platform.select<true | Permission>({
    android: DeviceInfo.getApiLevelSync() >= 29 ? true : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    ios: true,
  })!,
  'documents.write': Platform.select<true | Permission>({
    android: DeviceInfo.getApiLevelSync() >= 29 ? true : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
    ios: true,
  })!,
  'galery.read': Platform.select<true | Permission>({
    android: DeviceInfo.getApiLevelSync() >= 29 ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
  })!,
  'galery.write': Platform.select<true | Permission>({
    android:
      DeviceInfo.getApiLevelSync() >= 33
        ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
        : DeviceInfo.getApiLevelSync() < 29
          ? PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE
          : true, // 30 - 32
    ios: PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY,
  })!,
};

export class PermissionError extends Error {
  value: PermissionStatus;

  permission: Permission;

  constructor(message: string, permission: Permission, value: PermissionStatus) {
    super(message);
    this.name = 'PermissionError';
    this.permission = permission;
    this.value = value;
  }
}

const checkPermission = async (sce: true | Permission | Permission[]): Promise<[Permission, PermissionStatus][]> => {
  if (sce === true) return [];
  else if (Array.isArray(sce)) return checkMultiple(sce).then(r => Object.entries(r) as [Permission, PermissionStatus][]);
  else return check(sce).then(v => [[sce, v]] as [Permission, PermissionStatus][]);
};

const invalidPermissionResults: PermissionStatus[] = [RESULTS.BLOCKED, RESULTS.DENIED, RESULTS.UNAVAILABLE];

/**
 * Asserts the permissions needed for a scenario are granted.
 * Asks the user the permission if needed.
 * Throws an error if permission is not granted or limited.
 * Pass doNotThrow parameter to return the result even if not granted nor limited.
 * @param scenario
 * @returns Result pairs of [Permission, PermissionStatus]. every PermissionStatus is 'granted' or 'limited' when everything is fine.
 */
export const assertPermissions = async (scenario: keyof typeof permissionsScenarios, doNotThrow?: boolean) => {
  const res = await checkPermission(permissionsScenarios[scenario]);

  for (const k in res) {
    if (res[k][1] === RESULTS.DENIED) {
      res[k][1] = await request(res[k][0]);
    }
  }

  const missingPermissions = res.filter(([_k, v]) => invalidPermissionResults.includes(v));

  if (!doNotThrow && missingPermissions.length > 0) {
    throw new PermissionError(
      `Assert permission scenario "${scenario} not granted. Permissions not granted : \n - ${missingPermissions.map(pair => `${pair[0]} -> ${pair[1]}`).join('\n - ')}"`,
      missingPermissions[0][0],
      missingPermissions[0][1]
    );
  }

  return res;
};
