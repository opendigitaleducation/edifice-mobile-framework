/**
 * Renders a FlatList with swipeable elements.
 * Gestures are recognized to automatically unswipe the selected elements whe other touches are involved.
 * Based on npm mobile `react-native-swipe-list-view`
 *
 * Usage :
 * - Same props as FlatList
 * - Same props as SwipeListView
 * - swipeActionWidth in px is mandatory
 * - additional `itemSwipeActionProps`, works like `renderItem` prop and returns specific Swipeable props for of each list item.
 * - custom styles (see example below)
 *
 * CAUTION ! your data must include a `key` property for each item !
 *
 * Example :
 * const listRef = React.createRef<SwipeableListHandle<IItemType>>();
 * <SwipeableList
 *     data={data}
 *     swipeActionWidth={140} // Width of one action button in px
 *     // every props exposed from react-native-swipe-list-view
 *     itemSwipeActionProps={({ item }) => ({
 *       left: [],
 *       right : [{
 *         action: async row => {
 *           Alert.alert(item.text);
 *           row[item.key]?.closeRow(); // recenter after action tapped
 *         },
 *         actionColor: theme.palette.status.warning.regular,
 *         actionText: I18n.get('timeline-reportaction-button'),
 *         actionIcon: 'ui-answer',
 *       }],
 *     })}
 *     hiddenRowStyle={{margin: 10}} // Optional. styles for the row wrapper
 *     hiddenItemStyle={UI_STYLES.justifyEnd} // Optional. style for every action
 * />
 */
import * as React from 'react';
import {
  Animated,
  ColorValue,
  FlatListProps,
  GestureResponderEvent,
  ListRenderItemInfo,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';

import { useScrollToTop } from '@react-navigation/native';
import { IPropsSwipeListView, RowMap, SwipeListView, SwipeRow } from 'react-native-swipe-list-view';

import { UI_SIZES, UI_STYLES } from './constants';
import { Svg } from './picture';
import { SmallText } from './text';

import theme from '~/app/theme';

// Redecalare forwardRef @see https://fettblog.eu/typescript-react-generic-forward-refs/#option-3%3A-augment-forwardref
declare module 'react' {
  function forwardRef<T, P = object>(
    render: (props: P, ref: React.Ref<T>) => React.ReactElement | null,
  ): (props: P & React.RefAttributes<T>) => React.ReactElement | null;
}

export interface ISwipeAction<ItemT extends { key: string }> {
  action: (row: RowMap<ItemT>, e: GestureResponderEvent) => void;
  actionIcon?: string;
  actionIconSize?: number;
  actionColor?: ColorValue;
  actionText?: string;
  backgroundColor?: ColorValue;
  isFirstAction?: boolean;
  style?: ViewStyle;
}

export interface ISwipeActionProps<ItemT extends { key: string }> {
  left?: ISwipeAction<ItemT>[];
  right?: ISwipeAction<ItemT>[];
}

const styles = StyleSheet.create({
  swipeAction: {
    alignItems: 'center',
    flex: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: UI_SIZES.spacing.medium,
  },
  swipeActionWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    height: '100%',
    justifyContent: 'center',
  },
});

const defaultSwipeActionWidth = 100;

let isScrollingWhileTouchSwipeAction = false;

const SwipeAction = <ItemT extends { key: string }>(
  props: ISwipeAction<ItemT> & {
    rowMap: RowMap<ItemT>;
    animatedRefs?: { [key: string]: Animated.Value };
    swipeActionWidth: number;
    direction: 'left' | 'right';
  },
) => {
  const wrapperStyle = [styles.swipeActionWrapper];
  const widthStyle = React.useMemo(() => ({ width: props.swipeActionWidth }), [props.swipeActionWidth]);
  const overlapWidth = React.useMemo(() => UI_SIZES.screen.width - props.swipeActionWidth, [props.swipeActionWidth]);
  const overlapElement = React.useMemo(
    () =>
      props.backgroundColor && props.isFirstAction ? (
        <View
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            backgroundColor: props.backgroundColor,
            bottom: 0,
            position: 'absolute',
            top: 0,
            width: overlapWidth,
            ...(props.direction === 'left' ? { left: -overlapWidth } : { right: -overlapWidth }),
          }}
        />
      ) : null,
    [overlapWidth, props.backgroundColor, props.direction, props.isFirstAction],
  );
  return (
    <View style={wrapperStyle}>
      <TouchableOpacity
        onPressIn={() => {
          isScrollingWhileTouchSwipeAction = false;
        }}
        onPressOut={e => {
          setTimeout(() => {
            if (!isScrollingWhileTouchSwipeAction) {
              return props.action(props.rowMap, e);
            }
          }, 25); // 🍔 ! We want to ensure onScrollBeginDrag event will be fired before this !!
        }}>
        <View
          style={[
            styles.swipeAction,
            props.style,
            widthStyle,
            React.useMemo(
              () => (props.backgroundColor ? { backgroundColor: props.backgroundColor, height: '100%' } : {}),
              [props.backgroundColor],
            ),
          ]}>
          {overlapElement}
          {props.actionIcon ? (
            <Svg
              width={props.actionIconSize ?? 16}
              height={props.actionIconSize ?? 16}
              fill={props.actionColor || (props.backgroundColor ? theme.ui.text.inverse : theme.palette.primary.regular)}
              name={props.actionIcon}
            />
          ) : // <SmallText>{props.actionIcon}</SmallText>
          null}
          {props.actionText ? (
            <SmallText
              style={{
                color: props.actionColor || (props.backgroundColor ? theme.ui.text.inverse : theme.palette.primary.regular),
                lineHeight: undefined,
                marginLeft: UI_SIZES.spacing.small,
              }}>
              {props.actionText}
            </SmallText>
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );
};

export interface SwipeableListProps<ItemT extends { key: string }>
  extends Partial<Omit<IPropsSwipeListView<ItemT>, 'renderHiddenItem'>> {
  bottomInset?: boolean;
  hiddenRowStyle?: ViewStyle;
  hiddenItemStyle?: ViewStyle;
  swipeActionWidth?: number;
  itemSwipeActionProps?: (info: ListRenderItemInfo<ItemT>) => ISwipeActionProps<ItemT> | null;
}

export const ScrollToTopHandler = ({ listRef }: { listRef: React.RefObject<SwipeListView<any>> }) => {
  useScrollToTop(
    React.useRef({
      scrollToTop: () => {
        listRef?.current?.scrollToTop();
      },
    }),
  );
  return null;
};

export default React.forwardRef(
  <ItemT extends { key: string }>( // need to write "extends" because we're in a tsx file
    props: SwipeableListProps<ItemT> & FlatListProps<ItemT>,
    ref: React.Ref<SwipeListView<ItemT>>,
  ) => {
    const {
      bottomInset,
      data,
      hiddenItemStyle,
      hiddenRowStyle,
      itemSwipeActionProps,
      ListFooterComponent,
      onScrollBeginDrag,
      renderItem,
      scrollIndicatorInsets,
      swipeActionWidth,
      ...otherListProps
    } = props;
    const animatedRefs = React.useRef<{ [key: string]: Animated.Value }>({});
    const preventTouchRefs = React.useRef<{ [key: string]: boolean }>({});
    const rowMapRef = React.useRef<RowMap<ItemT>>();
    const rowTouchableViewRefs = React.useRef<{ [key: string]: View | null }>({});
    const realListFooterComponent = React.useMemo(() => {
      return bottomInset ? (
        <View style={{ paddingBottom: UI_SIZES.screen.bottomInset }}>{ListFooterComponent}</View>
      ) : (
        ListFooterComponent
      );
    }, [bottomInset, ListFooterComponent]);

    const renderHiddenItem = React.useCallback(
      (info: ListRenderItemInfo<ItemT>, rowmap: RowMap<ItemT>) => {
        const actions = itemSwipeActionProps?.(info);
        if (!actions || (!actions.left && !actions.right)) return null;
        return (
          <View style={[UI_STYLES.rowStretch, hiddenRowStyle]}>
            {actions?.left?.map((p, index) => (
              <SwipeAction
                {...p}
                key={index}
                style={
                  [
                    hiddenItemStyle,
                    p.style,
                    {
                      transform: [{ translateX: -2 * (props.swipeActionWidth ?? 0) }],
                    },
                  ] as ViewStyle
                }
                rowMap={rowmap}
                animatedRefs={animatedRefs.current}
                swipeActionWidth={swipeActionWidth ?? defaultSwipeActionWidth}
                direction="left"
                isFirstAction={!index}
              />
            ))}
            <View style={UI_STYLES.flex1} />
            {actions?.right?.map((p, index) => (
              <SwipeAction
                {...p}
                key={index}
                style={[hiddenItemStyle, p.style] as ViewStyle}
                rowMap={rowmap}
                animatedRefs={animatedRefs.current}
                swipeActionWidth={swipeActionWidth ?? defaultSwipeActionWidth}
                direction="right"
                isFirstAction={!index}
              />
            ))}
          </View>
        );
      },
      [hiddenItemStyle, hiddenRowStyle, itemSwipeActionProps, props.swipeActionWidth, swipeActionWidth],
    );

    const getTouchPreventerStyle = (active: boolean) =>
      ({
        height: '100%',
        left: 0,
        position: 'absolute',
        top: 0,
        width: '100%',
        zIndex: active ? 1 : -1,
      }) as ViewStyle;

    const onRowOpen = (rowKey: string, rowMap: RowMap<ItemT>) => {
      if (preventTouchRefs.current) {
        preventTouchRefs.current[rowKey] = true;
        rowTouchableViewRefs.current[rowKey]?.setNativeProps({ style: getTouchPreventerStyle(true) });
      }
      rowMapRef.current = rowMap;
    };
    const onRowClose = (rowKey: string, rowMap: RowMap<ItemT>) => {
      if (preventTouchRefs.current) {
        preventTouchRefs.current[rowKey] = false;
        rowTouchableViewRefs.current[rowKey]?.setNativeProps({ style: getTouchPreventerStyle(false) });
      }
    };

    const closeCurrentRow = (rowKey: string) => {
      rowMapRef.current?.[rowKey]?.closeRow();
    };

    const setIsScrollingWhileTouchSwipeAction = React.useCallback(
      event => {
        isScrollingWhileTouchSwipeAction = true;
        onScrollBeginDrag?.(event);
      },
      [onScrollBeginDrag],
    );

    const realRenderItem = React.useCallback(
      (info, rowMap) => {
        if (!renderItem) {
          console.error('[swipeableList] renderItem not provided.');
          return null;
        }
        const onSwipeValueChange = (swipeData: { key: string; value: number; direction: 'left' | 'right'; isOpen: boolean }) => {
          animatedRefs.current?.[info.item.key]?.setValue(swipeData.value);
        };
        const actions = itemSwipeActionProps?.(info);
        if (animatedRefs && animatedRefs.current?.[info.item.key] === undefined) {
          animatedRefs.current[info.item.key] = new Animated.Value(0);
          animatedRefs.current[info.item.key].setOffset(props.swipeActionWidth ?? 0);
        }
        const translateStyle = [
          animatedRefs.current?.[info.item.key] ? { transform: [{ translateX: animatedRefs.current?.[info.item.key] }] } : {},
        ];
        const setRowViewRef = (rowref: View) => {
          if (rowTouchableViewRefs.current) rowTouchableViewRefs.current[info.item.key] = rowref;
        };
        const row = (
          <SwipeRow
            key={info.item.key}
            disableRightSwipe={(actions?.left?.length ?? 0) === 0}
            disableLeftSwipe={(actions?.right?.length ?? 0) === 0}
            rightOpenValue={(actions?.right?.length ?? 0) * -(swipeActionWidth ?? 0)}
            leftOpenValue={(actions?.left?.length ?? 0) * (swipeActionWidth ?? 0)}
            onSwipeValueChange={onSwipeValueChange}>
            <Animated.View style={translateStyle}>{renderHiddenItem(info, rowMap)}</Animated.View>
            <View>
              <TouchableWithoutFeedback
                onPress={() => {
                  closeCurrentRow(info.item.key);
                }}>
                <View ref={setRowViewRef} style={getTouchPreventerStyle(preventTouchRefs.current[info.item.key] === true)} />
              </TouchableWithoutFeedback>
              {renderItem(info, rowMap)}
            </View>
          </SwipeRow>
        );
        return row;
      },
      [itemSwipeActionProps, props.swipeActionWidth, renderHiddenItem, renderItem, swipeActionWidth],
    );

    if (!renderItem) {
      console.error('[swipeableList] renderItem not provided.');
      return null;
    }

    return (
      <>
        <SwipeListView
          {...otherListProps}
          data={data}
          ref={ref}
          // onSwipeValueChange={onSwipeValueChange}
          renderItem={realRenderItem}
          onRowOpen={onRowOpen}
          onRowClose={onRowClose}
          ListFooterComponent={realListFooterComponent}
          scrollIndicatorInsets={scrollIndicatorInsets ?? { right: 0.001 }} // 🍎 Hack to guarantee the scrollbar sticks to the right edge of the screen.
          onScrollBeginDrag={setIsScrollingWhileTouchSwipeAction}
        />
        <ScrollToTopHandler listRef={ref as React.RefObject<SwipeListView<any>>} />
      </>
    );
  },
);
