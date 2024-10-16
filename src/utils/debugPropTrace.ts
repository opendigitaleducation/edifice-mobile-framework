/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useEffect, useRef } from 'react';

// usage : in componentDidUpdate(prevProps, prevState) :
//      traceProps.bind(this)(prevProps, prevState);
export function traceProps(this: any, prevProps: object, prevState: object, print: boolean = false) {
  if (!__DEV__) {
    return;
  }
  Object.entries(this.props).forEach(([key, val]) => {
    prevProps[key] !== val && console.debug(`Prop '${key}' changed`);
    print && prevProps[key] !== val && console.debug(`${prevProps[key]} ===> ${val}`);
  });
  if (this.state) {
    Object.entries(this.state).forEach(([key, val]) => {
      prevState[key] !== val && console.debug(`State '${key}' changed`);
      print && prevState[key] !== val && console.debug(`${prevState[key]} ===> ${val}`);
    });
  }
}

// usage : in function components : useTraceUpdate(props);
export function useTraceUpdate(props: object) {
  if (!__DEV__) {
    return;
  }
  const prev = useRef(props);
  useEffect(() => {
    /*const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
      if (prev.current[k] !== v) {
        ps[k] = [prev.current[k], v];
      }
      return ps;
    }, {});*/
    /*if (Object.keys(changedProps).length > 0) {
      console.debug('Changed props:', changedProps);
    }*/
    prev.current = props;
  });
}
