/**
 * Tracking manager, aka "Tracker"
 * Collect data throught Matomo and AppCenter.
 */
import AppCenter from 'appcenter';
import Analytics from 'appcenter-analytics';
import Matomo from 'react-native-matomo';

import { DEPRECATED_getCurrentPlatform } from '~/framework/util/_legacy_appConf';
import appConf from '~/framework/util/appConf';
import { IAnyModuleConfig, IAnyNavigableModuleConfig } from '~/framework/util/moduleTool';
import { signRequest } from '~/infra/oauth';

export type TrackEventArgs = [string, string, string?, number?];
export type TrackEventOfModuleArgs = [IAnyModuleConfig, string, string?, number?];
export type DoTrackArg = undefined | TrackEventOfModuleArgs;

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

  // Init procedure. Override _init() function to create custom trackers.
  protected async _init() {}
  async init() {
    try {
      await this._init();
      this._isReady = true;
    } catch (e) {
      this._isReady = false;
    }
  }

  // Deug  procedure. Override _isDeug() function when needed
  protected _isDebugTracker(): boolean {
    return false;
  }
  isDebugTracker(): boolean {
    return this._isDebugTracker();
  }

  // UserID procedure. Override _setUserId() function to create custom trackers.
  protected async _setUserId(id: string): Promise<boolean> {
    throw new Error('not implemented');
  }
  async setUserId(id: string) {
    try {
      if (!this.isReady) {
        throw new Error('Tracker is not initialized');
      }
      await this._setUserId(id);
    } catch (e) {
      // TODO: Manage error
    }
  }

  // Custom dimension procedure. Override _setCustomDimension() function to create custom trackers.
  protected async _setCustomDimension(id: number, name: string, value: string): Promise<boolean> {
    throw new Error('not implemented');
  }
  async setCustomDimension(id: number, name: string, value: string) {
    try {
      if (!this.isReady) {
        throw new Error('Tracker is not initialized');
      }
      await this._setCustomDimension(id, name, value);
    } catch (e) {
      // TODO: Manage error
    }
  }

  // Track event procedure. Override _trackEvent() function to create custom trackers.
  protected async _trackEvent(category: string, action: string, name?: string, value?: number): Promise<boolean> {
    throw new Error('not implemented');
  }
  async trackEvent(category: string, action: string, name?: string, value?: number) {
    try {
      if (!this.isReady) {
        throw new Error('Tracker is not initialized');
      }
      await this._trackEvent(category, action, name, value);
    } catch (e) {
      // TODO: Manage error
    }
  }
  async trackEventOfModule(moduleConfig: IAnyNavigableModuleConfig, action: string, name?: string, value?: number) {
    await this.trackEvent(moduleConfig.trackingName, action, name, value);
  }

  // Track view procedure. Override _trackView() function to create custom trackers.
  protected async _trackView(path: string[]): Promise<boolean> {
    throw new Error('not implemented');
  }
  async trackView(path: string[]) {
    try {
      if (!this.isReady) {
        throw new Error('Tracker is not initialized');
      }
      await this._trackView(path);
    } catch (e) {
      // TODO: Manage error
    }
  }
  async trackViewOfModule(moduleConfig: IAnyNavigableModuleConfig, path: string[]) {
    await this._trackView([moduleConfig.routeName, ...path]);
  }
}

export interface IMatomoTrackerOptions {
  url: string;
  siteId: number;
}

export class ConcreteMatomoTracker extends AbstractTracker<IMatomoTrackerOptions> {
  async _init() {
    return Matomo.initTracker(this.opts.url, this.opts.siteId);
  }
  async _setUserId(id: string) {
    await Matomo.setUserId(id);
    return true;
  }
  async _setCustomDimension(id: number, name: string, value: string) {
    await Matomo.setCustomDimension(id, value);
    return true;
  }
  async _trackEvent(category: string, action: string, name?: string, value?: number) {
    await Matomo.trackEvent(category, action, name, value);
    return true;
  }
  async _trackView(path: string[]) {
    const viewPath = path.join('/');
    await Matomo.trackScreen(viewPath, null);
    return true;
  }
}

export class ConcreteAppCenterTracker extends AbstractTracker<undefined> {
  protected _properties = {};
  async _init() {
    // Nothing to do, configuration comes from native appcenter config files
  }
  protected _isDebugTracker(): boolean {
    return true;
  }
  async _setUserId(id: string) {
    await AppCenter.setUserId(id);
    return true;
  }
  async _setCustomDimension(id: number, name: string, value: string) {
    this._properties[name] = value;
    return true;
  }
  async _trackEvent(category: string, action: string, name?: string, value?: number) {
    await Analytics.trackEvent(`${category} ${action} ${name} ${value}`, {
      category,
      action,
      ...(name ? { name } : {}),
      ...(value ? { value: value.toString() } : {}),
      ...this._properties,
    });
    return true;
  }
  async _trackView(path: string[]) {
    const viewPath = path.join('/');
    await Analytics.trackEvent(`View ${viewPath}`);
    return true;
  }
}

export class ConcreteEntcoreTracker extends AbstractTracker<undefined> {
  reportQueue: Request[] = [];
  sending: boolean = false;
  errorCount: number = 0;
  lastModulename: string | undefined = undefined;

  async sendReportQueue() {
    if (this.sending) return; // Once at a time
    this.sending = true;
    while (this.sending && this.reportQueue.length) {
      try {
        const req = this.reportQueue[0].clone();
        const res = await fetch(signRequest(this.reportQueue[0]));
        if (res.ok) {
          this.reportQueue.shift();
          this.errorCount = 0;
        } else {
          throw new Error('    [EntcoreTracker] Report failed. ' + (await req?.text()));
        }
      } catch (e) {
        if (++this.errorCount >= 3) this.sending = false;
      }
    }
    this.sending = false;
  }

  async _init() {
    // Nothing to do, configuration comes oauth connection
  }
  async _setUserId(id: string) {
    return false; // Nothing here
  }
  async _setCustomDimension(id: number, name: string, value: string) {
    return false; // Nothing here
  }
  async _trackEvent(category: string, action: string, name?: string, value?: number) {
    return false; // Nothing here
  }
  async _trackView(path: string[]) {
    const moduleName = (
      path[0] === 'timeline' ? (['blog', 'news', 'schoolbook'].includes(path[2]?.toLowerCase()) ? path[2] : 'timeline') : path[0]
    ).toLowerCase();
    const moduleAccessMap = {
      blog: 'Blog',
      news: 'Actualites',
      schoolbook: 'SchoolBook',
      homework: 'Homeworks',
      workspace: 'Worksapce',
      conversation: 'Conversation',
      user: 'MyAccount',
      zimbra: 'Zimbra',
      viesco: 'Presences',
    };
    let willLog = false;
    if (this.lastModulename !== moduleName && moduleAccessMap.hasOwnProperty(moduleName)) {
      this.reportQueue.push(
        new Request(`${DEPRECATED_getCurrentPlatform()!.url}/infra/event/mobile/store`, {
          method: 'POST',
          body: JSON.stringify({ module: moduleAccessMap[moduleName] }),
        }),
      );
      this.lastModulename = moduleName;
      willLog = moduleAccessMap[moduleName];
    }
    this.sendReportQueue();
    return willLog;
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
  async trackDebugEvent(category: string, action: string, name?: string, value?: number) {
    await Promise.all(this._trackers.filter(t => t.isDebugTracker()).map(t => t.trackEvent(category, action, name, value)));
  }
  async trackEvent(category: string, action: string, name?: string, value?: number) {
    await Promise.all(this._trackers.map(t => t.trackEvent(category, action, name, value)));
  }
  async trackEventOfModule(moduleConfig: IAnyModuleConfig, action: string, name?: string, value?: number) {
    await this.trackEvent(moduleConfig.trackingName, action, name, value);
  }
  async trackView(path: string[]) {
    await Promise.all(this._trackers.map(t => t.trackView(path)));
  }
  async trackViewOfModule(moduleConfig: IAnyNavigableModuleConfig, path: string[]) {
    await this.trackView([moduleConfig.routeName, ...path]);
  }
  async setUserId(id: string) {
    await Promise.all(this._trackers.map(t => t.setUserId(id)));
  }
  async setCustomDimension(id: number, name: string, value: string) {
    await Promise.all(this._trackers.map(t => t.setCustomDimension(id, name, value)));
  }
  get isReady() {
    return this._trackers.every(t => t.isReady);
  }
}

export const Trackers = new ConcreteTrackerSet(
  new ConcreteMatomoTracker('Matomo', appConf.matomo),
  new ConcreteAppCenterTracker('AppCenter', undefined),
  new ConcreteEntcoreTracker('Entcore', undefined),
);
