import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Icon } from '~/framework/components/picture/Icon';
import { Text } from '~/framework/components/text';
import { layoutSize } from '~/styles/common/layoutSize';
import { EVENT_TYPE, IEventProps } from '~/types';
import { CenterPanel, LeftIconPanel } from '~/ui/ContainerContent';
import { IMenuItem } from '~/ui/types';

const style = StyleSheet.create({
  centerPanel: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    flexGrow: 3,
    justifyContent: 'flex-start',
    margin: 2,
    marginLeft: -20,
  },
  fileName: {
    color: '#000000',
    fontSize: layoutSize.LAYOUT_14,
  },
  leftPanel: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: layoutSize.LAYOUT_58,
    flexGrow: 0,
    margin: 2,
    padding: 2,
  },
  touchPanel: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    flex: 1,
    paddingLeft: 5,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
});

const Item = ({ onEvent, item, eventHandleData }: IEventProps & any) => {
  const { icon, text } = item as IMenuItem;

  const view = (
    <View style={style.touchPanel}>
      <LeftIconPanel style={style.leftPanel}>
        <Icon color="#000000" size={layoutSize.LAYOUT_28} name={icon} />
      </LeftIconPanel>
      <CenterPanel style={style.centerPanel}>
        <Text numberOfLines={1} style={style.fileName}>
          {text}
        </Text>
      </CenterPanel>
    </View>
  );

  if (item.wrapper) {
    const ItemWrapper = item.wrapper;
    return <ItemWrapper {...eventHandleData}>{view}</ItemWrapper>;
  } else {
    return <TouchableOpacity onPress={() => onEvent({ type: EVENT_TYPE.MENU_SELECT, id: item.id, item })}>{view}</TouchableOpacity>;
  }
};

export default Item;
