import { useScrollToTop } from '@react-navigation/native';
import * as React from 'react';
import { FlatList as RNFlatList, ScrollView as RNScrollView, ScrollViewProps as RNScrollViewProps } from 'react-native';

import { useSyncRef } from '~/framework/hooks/ref';

import { UI_SIZES } from './constants';

export interface ScrollViewProps extends RNScrollViewProps {
  bottomInset?: boolean;
}

type ScrollContextType = React.MutableRefObject<RNScrollView | RNFlatList<any> | null> | null;

export const ScrollContext = React.createContext<ScrollContextType>(null);

function ScrollView(props: ScrollViewProps, ref) {
  const { bottomInset = true, contentContainerStyle, scrollIndicatorInsets, ...otherProps } = props;
  const realContentContainerStyle = React.useMemo(() => {
    return bottomInset ? [{ paddingBottom: UI_SIZES.screen.bottomInset }, contentContainerStyle] : contentContainerStyle;
  }, [bottomInset, contentContainerStyle]);

  const scrollViewRef: { current: any } = React.useRef();
  const syncRef = useSyncRef(ref, scrollViewRef);
  const scrollToEnd = () => scrollViewRef?.current?.scrollToEnd();
  React.useImperativeHandle(ref, () => ({ scrollToEnd }));

  useScrollToTop(scrollViewRef);

  return (
    <ScrollContext.Provider value={scrollViewRef}>
      <RNScrollView
        ref={syncRef}
        {...otherProps}
        contentContainerStyle={realContentContainerStyle}
        scrollIndicatorInsets={scrollIndicatorInsets || ScrollView.scrollIndicatorInsets} // 🍎 Hack to guarantee the scrollbar sticks to the right edge of the screen.
      />
    </ScrollContext.Provider>
  );
}
ScrollView.scrollIndicatorInsets = { right: 0.001 };
export default React.forwardRef(ScrollView);

export function ScrollToTopHandler({ scrollRef }: { scrollRef: React.RefObject<RNScrollView> }) {
  useScrollToTop(scrollRef);
  return null;
}
