import * as React from 'react';
import {
  ColorValue,
  ImageSourcePropType,
  ImageStyle,
  StyleSheet,
  TextProps,
  TouchableOpacityProps,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

import styled from '@emotion/native';
import { Moment } from 'moment';

import {
  cardPadding,
  cardPaddingEqual,
  cardPaddingMerging,
  cardPaddingSmall,
  CardWithoutPadding,
  TouchCardWithoutPadding,
} from './base';
import { OverviewCardProps } from './pictureCard';

import theme from '~/app/theme';
import { Badge } from '~/framework/components/badge';
import { UI_SIZES, UI_STYLES } from '~/framework/components/constants';
import { Icon, Picture, PictureProps, Svg } from '~/framework/components/picture';

import { BodyText, CaptionItalicText, SmallText, TextFontStyle, TextSizeStyle } from '~/framework/components/text';
import { displayPastDate } from '~/framework/util/date';
import { Image } from '~/framework/util/media';
import { GridAvatars } from '~/ui/avatars/GridAvatars';
import HtmlContentView from '~/ui/HtmlContentView';

export interface IContentCardProps extends ViewProps {
  header?: React.ReactElement;
  footer?: React.ReactElement;
}
export interface ITouchableContentCardProps extends IContentCardProps, TouchableOpacityProps {
  headerIndicator?: React.ReactElement;
  customHeaderIndicatorStyle?: ViewStyle;
}
interface IContentCardPropsBase extends IContentCardProps, ITouchableContentCardProps {
  cardComponent?: React.ComponentType;
  withoutPadding?: boolean;
  customHeaderStyle?: ViewStyle;
  customHeaderIndicatorStyle?: ViewStyle;
}

const FooterSeparator = styled.View({
  backgroundColor: theme.palette.grey.pearl,
  height: 1,
  width: '100%',
});
const HeaderFlexView = styled.View({
  flexDirection: 'row',
  // ...cardPadding,
});
const ContentFlexView = styled.View({
  // ...cardPaddingMerging,
});
const FooterFlexView = styled.View({
  // ...cardPaddingSmall,
});
const ContentCardBase = (props: IContentCardPropsBase) => {
  const CC = props.cardComponent ?? CardWithoutPadding;
  const {
    cardComponent,
    children,
    customHeaderIndicatorStyle,
    customHeaderStyle,
    footer,
    header,
    headerIndicator,
    withoutPadding,
    ...viewProps
  } = props;
  const HeaderFlexViewWithPadding = styled(HeaderFlexView)(
    cardPadding,
    withoutPadding && { paddingHorizontal: 0 },
    customHeaderStyle,
  );
  const ContentFlexViewWithPadding = styled(ContentFlexView)(cardPaddingMerging, withoutPadding && { paddingHorizontal: 0 });
  const FooterFlexViewWithPadding = styled(FooterFlexView)(cardPaddingSmall, withoutPadding && { paddingHorizontal: 0 });
  return (
    <CC {...viewProps}>
      {header ? (
        <HeaderFlexViewWithPadding>
          <View style={UI_STYLES.flex1}>{props.header ?? null}</View>
          <View style={[UI_STYLES.flex0, props.customHeaderIndicatorStyle]}>{props.headerIndicator ?? null}</View>
        </HeaderFlexViewWithPadding>
      ) : null}
      {props.children ? <ContentFlexViewWithPadding>{props.children}</ContentFlexViewWithPadding> : null}
      {props.footer ? (
        <>
          <FooterSeparator />
          <FooterFlexViewWithPadding>{props.footer}</FooterFlexViewWithPadding>
        </>
      ) : null}
    </CC>
  );
};

/** Card for displaying some fancy content */
export const ContentCard = (props: IContentCardProps) => {
  return <ContentCardBase {...props} />;
};
export const TouchableContentCard = (props: ITouchableContentCardProps) => {
  const { headerIndicator, ...otherProps } = props;
  const realHeaderIndicator = headerIndicator ?? (
    <Icon
      name="arrow_right"
      color={theme.palette.primary.regular}
      style={{
        paddingLeft: UI_SIZES.spacing.minor,
        paddingVertical: UI_SIZES.spacing.minor,
      }}
    />
  );
  return <ContentCardBase {...otherProps} headerIndicator={realHeaderIndicator} cardComponent={TouchCardWithoutPadding} />;
};
export const ContentView = (props: IContentCardProps) => {
  return <ContentCardBase {...props} cardComponent={View} />;
};

/** Pre-configured title for ContentCard */
export const ContentCardTitle = (props: TextProps) => {
  const { style, ...otherProps } = props;
  const Comp = styled(BodyText)({ color: theme.palette.primary.regular });
  return <Comp numberOfLines={2} ellipsizeMode="tail" {...otherProps} style={style} />;
};

export interface IContentCardHeaderProps {
  icon?: React.ReactElement;
  text?: string | React.ReactElement;
  date?: string | Moment;
}
export interface IContentCardIconProps {
  userIds?: string | ImageSourcePropType | (string | ImageSourcePropType)[];
  source?: ImageSourcePropType;
  badge?: { icon: string | PictureProps; color: ColorValue; style?: ViewStyle };
}
/** A Header layout for ContentCard */
export const ContentCardHeader = (props: IContentCardHeaderProps) => {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row' }}>
      {props.icon ? <View style={[UI_STYLES.flex0, { marginRight: UI_SIZES.spacing.small }]}>{props.icon}</View> : null}
      <View style={UI_STYLES.flex1}>
        {props.text ? typeof props.text === 'string' ? <SmallText>{props.text}</SmallText> : props.text : null}
        {props.date ? (
          <CaptionItalicText style={{ color: theme.palette.grey.graphite }}>
            {typeof props.date === 'string' ? props.date : displayPastDate(props.date)}
          </CaptionItalicText>
        ) : null}
      </View>
    </View>
  );
};
/** Icon builder for ContentCard and other things */
export const ContentCardIcon = (props: IContentCardIconProps) => {
  const ids = props.userIds ? (Array.isArray(props.userIds) ? props.userIds : [props.userIds]) : undefined;
  const img = ids ? <GridAvatars users={ids} /> : props.source ? <Image source={props.source} /> : null;
  return (
    <View>
      {img}
      {props.badge ? (
        <View style={[{ bottom: 0, position: 'absolute', right: 0 }, props.badge.style]}>
          <Badge content={props.badge.icon} color={props.badge.color} />
        </View>
      ) : null}
    </View>
  );
};

export interface IResourceCardProps extends ViewProps, Omit<Partial<IContentCardProps & IContentCardPropsBase>, 'header'> {
  icon?: IContentCardIconProps;
  header?: string | React.ReactElement;
  headerHtml?: string;
  date?: IContentCardHeaderProps['date'];
  title?: string | React.ReactElement;
  footer?: IContentCardProps['footer'];
  children?: React.ReactNode;
}
export interface IResourceCardProps_base extends IResourceCardProps {
  CC: React.ComponentType<IContentCardProps>;
  withoutPadding?: boolean;
}
const ResourceCard_base = (props: IResourceCardProps_base) => {
  const { CC, children, date, footer, header, headerHtml, icon, title, ...otherProps } = props;
  const metaDataComponent =
    typeof header === 'string' ? (
      <ContentCardHeader
        icon={<ContentCardIcon {...icon} />}
        date={date}
        text={
          header ??
          (headerHtml ? (
            <HtmlContentView
              html={headerHtml}
              opts={{
                audio: false,
                globalTextStyle: {
                  ...TextFontStyle.Regular,
                  ...TextSizeStyle.Small,
                },
                hyperlinks: false,
                iframes: false,
                ignoreLineBreaks: true,
                images: false,
                linkTextStyle: {
                  ...TextFontStyle.Bold,
                },
                textColor: false,
                textFormatting: false,
                video: false,
              }}
            />
          ) : undefined)
        }
      />
    ) : (
      header
    );
  const realHeader = title ? typeof title === 'string' ? <ContentCardTitle>{title}</ContentCardTitle> : title : metaDataComponent;
  const content =
    title || children
      ? [
          title ? (
            <>
              {metaDataComponent}
              <View style={{ height: 12 }} />
            </>
          ) : null,
          children,
        ]
      : null;
  return (
    <CC header={realHeader} footer={footer} {...otherProps}>
      {content}
    </CC>
  );
};
export const ResourceCard = (props: IResourceCardProps) => {
  return <ResourceCard_base {...props} CC={ContentCard} />;
};
export const TouchableResourceCard = (
  props: IResourceCardProps & TouchableOpacityProps & Omit<ITouchableContentCardProps, 'header'>,
) => {
  return <ResourceCard_base {...props} CC={TouchableContentCard} />;
};

export const ResourceView = (props: IResourceCardProps) => {
  return <ResourceCard_base {...props} CC={ContentView} />;
};

function OverviewCardBase(props: OverviewCardProps & { cardComponent?: React.ComponentType<IContentCardProps> }) {
  const { cardComponent, children, picture, pictureStyle, pictureWrapperStyle, style, title, ...rest } = props;
  if (picture) {
    if (picture.type === 'Image') picture.resizeMode = 'contain';
    if (picture.type === 'Svg') {
      picture.fill = theme.ui.text.inverse;
      picture.width = OverviewCardBase.styles.picture.width;
      picture.height = OverviewCardBase.styles.picture.height;
    }
  }
  const CC = cardComponent ?? ContentCard;
  return (
    <CC
      {...rest}
      style={[OverviewCardBase.styles.card, style]}
      header={
        <View style={OverviewCardBase.styles.header}>
          {picture ? (
            <View style={[OverviewCardBase.styles.pictureWrapper, pictureWrapperStyle]}>
              <Picture style={[OverviewCardBase.styles.picture, pictureStyle] as ImageStyle} {...picture} />
            </View>
          ) : null}
          {title ? typeof title === 'string' ? <ContentCardTitle>{title}</ContentCardTitle> : title : null}
        </View>
      }>
      {children}
    </CC>
  );
}
OverviewCardBase.styles = StyleSheet.create({
  card: {
    alignItems: 'stretch',
    ...cardPaddingEqual,
  },
  header: {
    flexDirection: 'row',
  },
  picture: {
    height: 16,
    width: 16,
  },
  pictureWrapper: {
    backgroundColor: theme.palette.primary.regular,
    borderRadius: 12,
    height: 24,
    marginRight: UI_SIZES.spacing.minor,
    overflow: 'hidden',
    padding: UI_SIZES.spacing.tiny,
    width: 24,
  },
});
export function OverviewCard(props: OverviewCardProps) {
  return <OverviewCardBase {...props} />;
}
export function TouchableOverviewCard(props: OverviewCardProps & TouchableOpacityProps) {
  return (
    <OverviewCardBase
      cardComponent={TouchableContentCard}
      headerIndicator={
        <Svg
          key="chevron"
          width={UI_SIZES.dimensions.width.larger}
          height={UI_SIZES.dimensions.width.larger} // width again to ensure it's a square !
          name="ui-rafterRight"
          fill={theme.palette.primary.regular}
          cached
        />
      }
      {...props}
    />
  );
}
