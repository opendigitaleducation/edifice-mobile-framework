import type { AuthLoggedAccount } from '~/framework/modules/auth/model';

import type { IStorageBackend, IStorageHandler, IStorageSlice, StorageTypeMap } from './types';

export class StorageHandler<Storage extends IStorageBackend | IStorageSlice<StorageTypeMap>> implements IStorageHandler<Storage> {
  constructor(
    protected storage: Storage,
    protected storageName?: string,
  ) {}

  private static storageListWithAppInit: StorageHandler<IStorageBackend | IStorageSlice<StorageTypeMap>>[] = [];

  private static storageListWithSessionInit: StorageHandler<IStorageBackend | IStorageSlice<StorageTypeMap>>[] = [];

  private static initPhaseDone: boolean = false;

  private isInitialized: boolean = false;

  private init?: () => void;

  /**
   * Execute this function when the app startup. Use the `function` keyword instead of `() => {}` to use `this` keyword inside the function.
   * @param initFn
   * @returns
   */
  setAppInit(initFn: (this: this) => void) {
    if (this.isInitialized) {
      console.warn('[Storage] Do not use `withInit()` twice.');
      return this;
    }

    this.init = async () => {
      console.debug(`[Storage] init storage '${this.storageName ?? this.constructor.name}'`);
      initFn.call(this);
      this.isInitialized = true;
    };

    StorageHandler.storageListWithAppInit.push(this);
    if (StorageHandler.initPhaseDone) {
      this.init();
    }

    return this;
  }

  private sessionInit?: (session: AuthLoggedAccount) => void;

  /**
   * Execute this function whenever a user logs in. Use the `function` keyword instead of `() => {}` to use `this` keyword inside the function.
   * @param initFn
   */
  setSessionInit(initFn: (this: this, session: AuthLoggedAccount) => void) {
    this.sessionInit = async (session: AuthLoggedAccount) => {
      console.debug(`[Storage] session init storage '${this.storageName ?? this.constructor.name}'`);
      initFn.call(this, session);
    };

    StorageHandler.storageListWithSessionInit.push(this);

    return this;
  }

  static async initAllStorages() {
    for (const storage of StorageHandler.storageListWithAppInit) {
      try {
        if (!storage.isInitialized) {
          storage.init?.();
        }
      } catch (e) {
        console.warn(`[Storage] storage '${storage.storageName ?? storage.constructor.name}' failed to init`, e);
      }
    }
    StorageHandler.initPhaseDone = true;
  }

  static async sessionInitAllStorages(session: AuthLoggedAccount) {
    for (const storage of StorageHandler.storageListWithSessionInit) {
      try {
        storage.sessionInit?.(session);
      } catch (e) {
        console.warn(`[Storage] storage '${storage.storageName ?? storage.constructor.name}' failed to session init`, e);
      }
    }
  }
}