import NetInfo from '@react-native-community/netinfo';

class ConnectionManager {
  private static BACK_LISTENERS_KEY = 'back';

  private static GONE_LISTENERS_KEY = 'gone';

  private _nextListeners: { [key: string]: (() => void)[] } = {
    [ConnectionManager.BACK_LISTENERS_KEY]: [],
    [ConnectionManager.GONE_LISTENERS_KEY]: [],
  };

  private _eachListeners: { [key: string]: (() => void)[] } = {
    [ConnectionManager.BACK_LISTENERS_KEY]: [],
    [ConnectionManager.GONE_LISTENERS_KEY]: [],
  };

  private _isOnline = false;

  get isOnline() {
    return this._isOnline;
  }

  set isOnline(isOnline: boolean) {
    this._isOnline = isOnline;
    //notify listeners that network state changed
    this._notifyNextListeners(isOnline);
    this._notifyEachListeners(isOnline);
  }

  private _notifyNextListeners(isOnline: boolean) {
    const key = isOnline ? ConnectionManager.BACK_LISTENERS_KEY : ConnectionManager.GONE_LISTENERS_KEY;
    this._nextListeners[key].forEach(listener => listener());
    this._nextListeners[key] = [];
  }

  private _notifyEachListeners(isOnline: boolean) {
    const key = isOnline ? ConnectionManager.BACK_LISTENERS_KEY : ConnectionManager.GONE_LISTENERS_KEY;
    this._eachListeners[key].forEach(listener => listener());
  }

  onNextNetworkBack(listener: () => void) {
    this._nextListeners[ConnectionManager.BACK_LISTENERS_KEY].push(listener);
  }

  onNextNetworkGone(listener: () => void) {
    this._nextListeners[ConnectionManager.GONE_LISTENERS_KEY].push(listener);
  }

  onEachNetworkBack(listener: () => void) {
    this._eachListeners[ConnectionManager.BACK_LISTENERS_KEY].push(listener);
  }

  onEachNetworkGone(listener: () => void) {
    this._eachListeners[ConnectionManager.GONE_LISTENERS_KEY].push(listener);
  }
}
export const Connection = new ConnectionManager();

let notifyTimer: Date | undefined;

const notifyConnectionError = () => {
  if (!notifyTimer || notifyTimer.getHours() !== new Date().getHours()) {
    notifyTimer = new Date();
  }
};

NetInfo.fetch().then(state => {
  Connection.isOnline = state.isConnected ?? false;
  if (!state.isConnected) {
    notifyConnectionError();
  }
});

NetInfo.addEventListener(state => {
  Connection.isOnline = state.isConnected ?? false;
  if (!state.isConnected) {
    notifyConnectionError();
  }
});
