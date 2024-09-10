/**
 * Redux store builder
 *
 * Allow modules to register storage namespace in the Redux store.
 *
 * Usage :
 *
 * import { Reducers } from '~/app/store';
 * // Put this line in the entry point of your module.
 * // With this, reducer will be registered automatically if the module is imported somewhere.
 * Reducers.register('REDUCER_NAME', reducer);
 */
import * as React from 'react';
import { connect } from 'react-redux';
import { Reducer, Store, applyMiddleware, combineReducers, compose, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';

// eslint-disable-next-line no-var
declare var window: any;

/** === Store reducers map === */

export class Reducers {
  static $items: { [key: string]: Reducer } = {};

  static register(name: string, item: Reducer) {
    this.$items[name] = item;
    return item; // Allow chaining
  }

  static get(name: string) {
    if (Object.prototype.hasOwnProperty.call(this.$items.hasOwnProperty, name)) {
      return this.$items[name];
    } else {
      throw new Error(`[Reducers] No reducer of name ${name} has been registred.`);
    }
  }

  static get all() {
    return this.$items as Readonly<typeof this.$items>;
  }

  static clear() {
    this.$items = {};
  }
}

/** === Store generation === */

export function createMainStore() {
  const rootReducer = combineReducers({
    ...Reducers.all,
  });

  const middlewares = [thunkMiddleware];

  const enhancer = applyMiddleware(...middlewares);

  const store = window.__REDUX_DEVTOOLS_EXTENSION__
    ? createStore(rootReducer, compose(enhancer, window.__REDUX_DEVTOOLS_EXTENSION__()))
    : createStore(rootReducer, enhancer);

  return store;
}

export type IGlobalState = any; // Todo: Make any TS logic that can get composed state from module definitions IF POSSIBLE

/** === Store getter === */

const theStore: { current?: Store } = { current: undefined };

// IMPORTANT ! Do not call this function outside a component rendering.
// This would cause it to be called before all reducers are registered.
export const getStore = () => {
  if (theStore.current === undefined) theStore.current = createMainStore();
  return theStore.current;
};

/** === Store connecting to component === */

export interface IStoreProp {
  store: Store;
}

const mapStateToProps = () => ({
  store: getStore(),
});

/**
 * Forward the store object to the `store` prop of the given component.
 * @param WrappedComponent the component
 * @param args args being forwarded after the mapStateToProps
 * @returns the connected component
 */
export function connectWithStore(WrappedComponent: React.FunctionComponent<IStoreProp>, ...args: [any?, any?, any?]) {
  const ConnectedWrappedComponent = connect(mapStateToProps, ...args)(WrappedComponent);
  return (props: any) => {
    return <ConnectedWrappedComponent {...props} store={getStore()} />;
  };
}
