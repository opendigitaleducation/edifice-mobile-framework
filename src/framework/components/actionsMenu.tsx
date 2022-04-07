import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { TouchableOpacity, FlatList, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UI_SIZES } from '~/framework/components/constants';
import { TextColorStyle } from '~/framework/components/text';
import { CommonStyles } from '~/styles/common/styles';
import { Icon } from '~/ui/icons/Icon';
import { Text } from '~/ui/Typography';

type ActionsMenuProps = {
  data: {
    text: string;
    icon: string;
    onPress: () => any;
  }[];
  onClickOutside: () => any;
  show: boolean;
};
export default class ActionsMenu extends React.PureComponent<ActionsMenuProps> {
  public render() {
    const { onClickOutside, show, data } = this.props;
    const RenderComp = () => {
      const insets = useSafeAreaInsets();
      return (
        <View style={[style.overlayActions, { top: UI_SIZES.elements.navbarHeight + insets.top }]}>
          <TouchableWithoutFeedback style={{ width: '100%', height: '100%' }} onPress={onClickOutside}>
            <FlatList
              style={style.actions}
              data={data}
              renderItem={({ item }) => {
                const itemColorStyle = item.icon === 'delete' ? TextColorStyle.Error : {};
                return (
                  <TouchableOpacity onPress={item.onPress}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 }}>
                      <Text style={{ ...itemColorStyle }}>{item.text}</Text>
                      <Icon name={item.icon} size={22} style={{ marginLeft: 10, ...itemColorStyle }} />
                    </View>
                  </TouchableOpacity>
                );
              }}
              refreshing={false}
              ItemSeparatorComponent={() => <View style={style.separator} />}
            />
          </TouchableWithoutFeedback>
        </View>
      );
    };
    if (!show) return <></>;
    return <RenderComp />;
  }
}

const style = StyleSheet.create({
  actions: {
    backgroundColor: '#ffffff',
    position: 'absolute',
    right: 4,
    top: 0,
    zIndex: 10,
    borderRadius: 15,
    borderWidth: 0.2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
  },
  overlayActions: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  separator: {
    borderBottomColor: CommonStyles.borderColorVeryLighter,
    borderBottomWidth: 1,
    width: '100%',
  },
});
