import styled from '@emotion/native';
import * as React from 'react';
import * as ReactIs from 'react-is';
import { ActivityIndicator, TextStyle, View } from 'react-native';

import theme from '~/app/theme';
import styles from '~/framework/components/buttons/line/styles';
import { UI_SIZES, getScaleWidth } from '~/framework/components/constants';
import { NamedSVG } from '~/framework/components/picture';
import { SmallText } from '~/framework/components/text';
import TouchableOpacity from '~/ui/CustomTouchableOpacity';

export const ContainerView = styled.View({
  alignItems: 'center',
  flexDirection: 'row',
  backgroundColor: theme.ui.background.card,
  borderBottomWidth: 1,
  borderColor: theme.palette.grey.cloudy,
  height: 46,
  justifyContent: 'flex-start',
  paddingHorizontal: UI_SIZES.spacing.medium,
});

export const ContainerTextInput = styled.TextInput({
  alignItems: 'center',
  flexDirection: 'row',
  backgroundColor: theme.ui.background.card,
  borderBottomWidth: 1,
  borderColor: theme.palette.grey.cloudy,
  height: 46,
  justifyContent: 'flex-start',
  padding: UI_SIZES.spacing.medium,
});

export const LineButton = ({
  onPress,
  title,
  icon,
  first = false,
  last = false,
  alone = false,
  disabled = false,
  loading = false,
  showArrow = true,
  textStyle,
  testID,
}: {
  title: string;
  icon?: string;
  onPress?: () => any;
  first?: boolean;
  last?: boolean;
  alone?: boolean;
  disabled?: boolean;
  loading?: boolean;
  showArrow?: boolean;
  textStyle?: TextStyle;
  testID?: string;
}) => {
  const Container = onPress ? TouchableOpacity : View;

  const renderIcon = () => {
    if (!icon) return;
    return (
      <NamedSVG
        style={styles.icon}
        name={icon}
        width={getScaleWidth(20)}
        height={getScaleWidth(20)}
        fill={theme.palette.grey.black}
      />
    );
  };

  const renderArrow = () => {
    if (!showArrow || !onPress) return;
    if (loading)
      return (
        <ActivityIndicator color={theme.palette.primary.regular} size={UI_SIZES.dimensions.width.mediumPlus} style={styles.arrow} />
      );
    return (
      <NamedSVG
        name="ui-rafterRight"
        width={UI_SIZES.dimensions.width.mediumPlus}
        height={UI_SIZES.dimensions.width.mediumPlus}
        fill={theme.palette.primary.regular}
        style={styles.arrow}
      />
    );
  };

  return (
    <Container {...(onPress ? { onPress } : {})} disabled={loading || disabled}>
      <View
        style={[
          styles.container,
          first ? styles.containerFirst : last ? styles.containerLast : alone ? styles.containerAlone : null,
        ]}
        testID={testID}>
        <View style={styles.iconText}>
          {renderIcon()}
          <SmallText numberOfLines={1} style={[styles.text, { ...(textStyle ? textStyle : null) }]}>
            {title}
          </SmallText>
        </View>

        {renderArrow()}
      </View>
    </Container>
  );
};

export const ButtonLineGroup = ({
  children,
  allowFirst = true,
  allowLast = true,
  allowAlone = true,
}: React.PropsWithChildren & { allowFirst?: boolean; allowLast?: boolean; allowAlone?: boolean }) => {
  const childrenAsArray = React.Children.toArray(children); // We use `childrenAsArray` instead of `count` to ignore empty/null/undefined nodes.
  const mapFunction = (node: Parameters<Parameters<typeof childrenAsArray.map>[0]>[0], index: number) => {
    if (ReactIs.isFragment(node)) {
      return (
        <ButtonLineGroup
          allowFirst={index === 0}
          allowLast={index === childrenAsArray.length - 1}
          allowAlone={childrenAsArray.length === 1}
          key={(node as React.ReactElement).key}>
          {/* must cast this as ReactElement becasue ReactFragment type doesn't allow props (even though props does exist)*/}
          {(node as React.ReactElement).props.children}
        </ButtonLineGroup>
      );
    } else if (ReactIs.isElement(node)) {
      return (
        <LineButton
          {...((node as React.ReactElement).props ?? {})}
          first={allowFirst && (childrenAsArray.length > 1 || !allowAlone) && index === 0}
          last={allowLast && (childrenAsArray.length > 1 || !allowAlone) && index === childrenAsArray.length - 1}
          alone={allowAlone && childrenAsArray.length === 1}
          key={(node as React.ReactElement).key}
        />
      );
    } else return node;
  };
  return <>{childrenAsArray.map(mapFunction)}</>;
};
