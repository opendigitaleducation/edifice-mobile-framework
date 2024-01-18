import { useScrollToTop } from '@react-navigation/native';
import * as React from 'react';
import { FlatList as RNFlatList, FlatListProps as RNFlatListProps, View } from 'react-native';

import { UI_SIZES } from '~/framework/components/constants';
import { useSyncRef } from '~/framework/hooks/ref';

export interface FlatListProps<ItemT> extends RNFlatListProps<ItemT> {
  bottomInset?: boolean;
}

const SCROLL_INDICATOR_INSETS = { right: 0.001 };

export default React.forwardRef<RNFlatList, FlatListProps<any>>((props, ref) => {
  const { bottomInset = true, ListFooterComponent, scrollIndicatorInsets, ...otherProps } = props;

  const realListFooterComponent = React.useMemo(() => {
    return bottomInset ? (
      <View style={{ paddingBottom: UI_SIZES.screen.bottomInset }}>{ListFooterComponent}</View>
    ) : (
      ListFooterComponent
    );
  }, [bottomInset, ListFooterComponent]);

  const listRef = React.useRef(null);
  const syncRef = useSyncRef(ref, listRef);
  useScrollToTop(listRef);

  return (
    <RNFlatList
      {...otherProps}
      ref={syncRef}
      ListFooterComponent={realListFooterComponent}
      scrollIndicatorInsets={scrollIndicatorInsets || SCROLL_INDICATOR_INSETS} // 🍎 Hack to guarantee the scrollbar sticks to the right edge of the screen.
      onScrollToIndexFailed={() => {}} // 🍎 Hack to avoid crash (scrollToIndex should be used in conjunction with getItemLayout or onScrollToIndexFailed).
    />
  );
});

export function ScrollToTopHandler({ listRef }: { listRef: React.RefObject<RNFlatList<any>> }) {
  useScrollToTop(listRef);
  return null;
}
