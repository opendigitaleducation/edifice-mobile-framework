import CookieManager from '@react-native-cookies/cookies';

import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { getSession } from '~/framework/modules/auth/reducer';
import { AnyNavigableModuleConfig, IAnyModuleConfig } from '~/framework/util/moduleTool';
import { urlSigner } from '~/infra/oauth';

export type TrackEventArgs = [string, string, string?, number?];
export type TrackEventOfModuleArgs = [Pick<IAnyModuleConfig, 'trackingName'>, string, string?, number?];
export type DoTrackArgLegacy = undefined | TrackEventOfModuleArgs;

export abstract class AbstractTracker<OptionsType> {
  debugName: string;

  opts: OptionsType;

  protected _isReady: boolean;

  constructor(debugName: string, opts: OptionsType) {
    this.debugName = debugName;
    this.opts = opts;
    this._isReady = false;
  }

  get isReady() {
    return this._isReady;
  }

  // Debug  procedure. Override _isDeug() function when needed
  protected _isDebugTracker(): boolean {
    return false;
  }

  get isDebugTracker() {
    return this._isDebugTracker();
  }

  // Init procedure. Override _init() function to create custom trackers.
  protected async _init() {}

  async init() {
    try {
      await this._init();
      this._isReady = true;
    } catch {
      this._isReady = false;
    }
  }

  // UserID procedure. Override _setUserId() function to create custom trackers.
  protected async _setUserId(id: string): Promise<boolean> {
    return false;
  }

  async setUserId(id: string) {
    try {
      if (this.isReady) {
        await this._setUserId(id);
      }
    } catch (err) {
      console.error('setUserId failed: ', (err as Error).message);
    }
  }

  // Custom dimension procedure. Override _setCustomDimension() function to create custom trackers.
  protected async _setCustomDimension(id: number, name: string, value: string): Promise<boolean> {
    return false;
  }

  async setCustomDimension(id: number, name: string, value: string) {
    try {
      if (this.isReady) {
        await this._setCustomDimension(id, name, value);
      }
    } catch (err) {
      console.error('setCustomDimension failed: ', (err as Error).message);
    }
  }

  // Track event procedure. Override _trackEvent() function to create custom trackers.
  protected async _trackEvent(category: string, action: string, name?: string, value?: number): Promise<boolean> {
    return false;
  }

  async trackEvent(category: string, action: string, name?: string, value?: number) {
    try {
      if (this.isReady) {
        await this._trackEvent(category, action, name, value);
      }
    } catch (err) {
      console.error('trackEvent failed: ', (err as Error).message);
    }
  }

  async trackEventOfModule(
    moduleConfig: Pick<AnyNavigableModuleConfig, 'trackingName'>,
    action: string,
    name?: string,
    value?: number,
  ) {
    await this.trackEvent(moduleConfig.trackingName, action, name, value);
  }

  // Track debug event procedure. Override _trackEvent() function to create custom trackers.
  protected async _trackDebugEvent(category: string, action: string, name?: string, value?: number): Promise<boolean> {
    return false;
  }

  async trackDebugEvent(category: string, action: string, name?: string, value?: number) {
    try {
      if (this.isReady && this.isDebugTracker) {
        await this._trackDebugEvent(category, action, name, value);
      }
    } catch (err) {
      console.error('trackDebugEvent failed: ', (err as Error).message);
    }
  }

  async trackDebugEventOfModule(
    moduleConfig: Pick<AnyNavigableModuleConfig, 'trackingName'>,
    action: string,
    name?: string,
    value?: number,
  ) {
    await this.trackDebugEvent(moduleConfig.trackingName, action, name, value);
  }

  // Track view procedure. Override _trackView() function to create custom trackers.
  protected async _trackView(path: string[]): Promise<boolean> {
    return false;
  }

  async trackView(path: string[]) {
    try {
      if (this.isReady) {
        await this._trackView(path);
      }
    } catch (err) {
      console.error('trackView failed: ', (err as Error).message);
    }
  }

  async trackViewOfModule(moduleConfig: Pick<AnyNavigableModuleConfig, 'routeName'>, path: string[]) {
    await this._trackView([moduleConfig.routeName, ...path]);
  }

  protected async _setCrashAttribute(attributeName: string, attribute: string): Promise<boolean> {
    return false;
  }

  async setCrashAttribute(attributeName: string, attribute: string) {
    try {
      if (this.isReady) {
        await this._setCrashAttribute(attributeName, attribute);
      }
    } catch (err) {
      console.error('setCrashAttribute failed: ', (err as Error).message);
    }
  }

  protected async _setCrashAttributes(attributes: Record<string, string>): Promise<boolean> {
    return false;
  }

  async setCrashAttributes(attributes: Record<string, string>) {
    try {
      if (this.isReady) {
        await this._setCrashAttributes(attributes);
      }
    } catch (err) {
      console.error('setCrashAttributes failed: ', (err as Error).message);
    }
  }

  protected async _recordCrashError(error: Error, errorName?: string): Promise<boolean> {
    return false;
  }

  async recordCrashError(error: Error, errorName?: string) {
    try {
      if (this.isReady && this.isDebugTracker) {
        await this._recordCrashError(error, errorName);
      }
    } catch (err) {
      console.error('recordCrashError failed: ', (err as Error).message);
    }
  }
}

export class ConcreteEntcoreTracker extends AbstractTracker<undefined> {
  errorCount: number = 0;
  lastModulename: string | undefined = undefined;
  reportQueue: Request[] = [];
  sending: boolean = false;

  async sendReportQueue() {
    if (this.sending) return; // Once at a time
    this.sending = true;
    while (this.sending && this.reportQueue.length) {
      try {
        const req = this.reportQueue[0].clone();
        const res = await fetch(urlSigner.signRequest(this.reportQueue[0]));
        if (res.ok) {
          this.reportQueue.shift();
          this.errorCount = 0;
        } else {
          throw new Error('    [EntcoreTracker] Report failed. ' + (await req?.text()));
        }
      } catch {
        if (++this.errorCount >= 3) this.sending = false;
      } finally {
        CookieManager.clearAll();
      }
    }
    this.sending = false;
  }

  async _trackView(path: string[]) {
    const platform = getSession()?.platform;
    const moduleName = (
      path[0] === 'timeline' ? (['blog', 'news', 'schoolbook'].includes(path[2]?.toLowerCase()) ? path[2] : 'timeline') : path[0]
    ).toLowerCase();
    const moduleAccessMap = {
      blog: 'Blog',
      competences: 'Competences',
      conversation: 'Conversation',
      diary: 'Diary',
      edt: 'Edt',
      form: 'Formulaire',
      homework: 'Homeworks',
      homeworkAssistance: 'HomeworkAssistance',
      mediacentre: 'Mediacentre',
      messagerie: 'Conversation', // duplicates conversation because of a tracking keyword issue
      news: 'Actualites',
      presences: 'Presences',
      schoolbook: 'SchoolBook',
      scrapbook: 'Scrapbook',
      support: 'Support',
      user: 'MyAccount',
      // viesco: 'Presences', // not used anymore
      workspace: 'Workspace',
      zimbra: 'Zimbra',
    };
    let willLog = false;
    if (platform && this.lastModulename !== moduleName && Object.prototype.hasOwnProperty.call(moduleAccessMap, moduleName)) {
      this.reportQueue.push(
        new Request(`${platform!.url}/infra/event/mobile/store`, {
          body: JSON.stringify({ module: moduleAccessMap[moduleName] }),
          method: 'POST',
        }),
      );
      this.lastModulename = moduleName;
      willLog = moduleAccessMap[moduleName];
    }
    this.sendReportQueue();
    return willLog;
  }
}

export class ConcreteAnalyticsTracker extends AbstractTracker<undefined> {
  protected _properties = {};

  async _setUserId(id: string) {
    await analytics().setUserId(id);
    return true;
  }

  async _setCustomDimension(id: number, name: string, value: string) {
    this._properties[name] = value;
    return true;
  }

  async _trackView(path: string[]) {
    const viewPath = path.join('/');
    await analytics().logScreenView({
      screen_class: viewPath,
      screen_name: viewPath,
    });
    return true;
  }
}

export class ConcreteCrashsTracker extends AbstractTracker<undefined> {
  protected _properties = {};

  protected _isDebugTracker(): boolean {
    return true;
  }

  async _setUserId(id: string) {
    await crashlytics().setUserId(id);
    return true;
  }

  async _setCustomDimension(id: number, name: string, value: string) {
    this._properties[name] = value;
    return true;
  }

  async _trackDebugEvent(category: string, action: string, name?: string, value?: number) {
    crashlytics().log(`${category} ${action} ${name} ${value}`);
    return true;
  }

  async _trackView(path: string[]) {
    const viewPath = path.join('/');
    crashlytics().log(`VIEW: ${viewPath}`);
    return true;
  }

  async _setCrashAttribute(attributeName: string, attribute: string) {
    await crashlytics().setAttribute(attributeName, attribute);
    return true;
  }

  async _setCrashAttributes(attributes: Record<string, string>) {
    await crashlytics().setAttributes(attributes);
    return true;
  }

  async _recordCrashError(error: Error, errorName?: string) {
    await crashlytics().recordError(error, errorName);
    return true;
  }
}

export class ConcreteTrackerSet {
  private _trackers: AbstractTracker<any>[] = [];

  constructor(...trackers: AbstractTracker<any>[]) {
    this._trackers = trackers;
  }

  addTracker(t: AbstractTracker<any>) {
    this._trackers.push(t);
  }

  async init() {
    await Promise.all(this._trackers.map(t => t.init()));
  }

  async setCrashAttribute(attributeName: string, attribute: string) {
    await Promise.all(this._trackers.map(t => t.setCrashAttribute(attributeName, attribute)));
  }

  async setCrashAttributes(attributes: Record<string, string>) {
    await Promise.all(this._trackers.map(t => t.setCrashAttributes(attributes)));
  }

  async recordCrashError(error: Error, errorName?: string) {
    await Promise.all(this._trackers.map(t => t.recordCrashError(error, errorName)));
  }

  async setCustomDimension(id: number, name: string, value: string) {
    console.debug('[Tracking] Set Dimension :', id, '|', name, '|', value);
    await Promise.all(this._trackers.map(t => t.setCustomDimension(id, name, value)));
  }

  async setUserId(id: string) {
    console.debug('[Tracking] Set ID :', id);
    await Promise.all(this._trackers.map(t => t.setUserId(id)));
  }

  async trackEvent(category: string, action: string, name?: string, value?: number) {
    console.debug('[Tracking] Event :', [category, action, name, value].join(' | '));
    await Promise.all(this._trackers.map(t => t.trackEvent(category, action, name, value)));
  }

  async trackEventOfModule(moduleConfig: Pick<IAnyModuleConfig, 'trackingName'>, action: string, name?: string, value?: number) {
    await this.trackEvent(moduleConfig.trackingName, action, name, value);
  }

  async trackDebugEvent(category: string, action: string, name?: string, value?: number) {
    await Promise.all(this._trackers.map(t => t.trackDebugEvent(category, action, name, value)));
  }

  async trackDebugEventOfModule(
    moduleConfig: Pick<AnyNavigableModuleConfig, 'trackingName'>,
    action: string,
    name?: string,
    value?: number,
  ) {
    await Promise.all(this._trackers.map(t => t.trackDebugEventOfModule(moduleConfig, action, name, value)));
  }

  async trackView(path: string[]) {
    console.debug('[Tracking] View :', path.join('/'));
    await Promise.all(this._trackers.map(t => t.trackView(path)));
  }

  async trackViewOfModule(moduleConfig: Pick<AnyNavigableModuleConfig, 'routeName'>, path: string[]) {
    await this.trackView([moduleConfig.routeName, ...path]);
  }

  get isReady() {
    return this._trackers.every(t => t.isReady);
  }
}

export const Trackers = new ConcreteTrackerSet(
  new ConcreteEntcoreTracker('Entcore', undefined),
  new ConcreteAnalyticsTracker('Analytics', undefined),
  new ConcreteCrashsTracker('Crashs', undefined),
);

export const TRACKING_ACTION_SUFFIX_SUCCESS = 'Succès';
export const TRACKING_ACTION_SUFFIX_FAILURE = 'Échec';
export const trackingActionAddSuffix = (str: string, suffix: false | true | string) =>
  str + ' – ' + (suffix === true ? TRACKING_ACTION_SUFFIX_SUCCESS : suffix === false ? TRACKING_ACTION_SUFFIX_FAILURE : suffix);
