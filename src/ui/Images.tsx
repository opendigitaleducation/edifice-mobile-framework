import * as React from 'react';
import { ImageProps, ImageURISource, View, ViewStyle } from 'react-native';

import styled from '@emotion/native';
import RNFastImage from 'react-native-fast-image';

import TouchableOpacity from './CustomTouchableOpacity';
import { Row } from './Grid';
import ImageOptional from './ImageOptional';

import theme from '~/app/theme';
import { openCarousel } from '~/framework/components/carousel/openCarousel';
import { getScaleImageSize, UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { SmallInverseText } from '~/framework/components/text';
import { AudienceParameter } from '~/framework/modules/core/audience/types';
import { IMAGE_MAX_DIMENSION } from '~/framework/util/fileHandler';
import { FastImage } from '~/framework/util/media';
import { urlSigner } from '~/infra/oauth';

const ContainerImage = styled.View({});

const SoloImage = styled(TouchableOpacity)({
  backgroundColor: theme.palette.grey.pearl,
  width: '100%',
});

const QuarterImage = styled(TouchableOpacity)({
  backgroundColor: theme.palette.grey.pearl,
  width: '100%',
});

const Overlay = styled(TouchableOpacity)({
  backgroundColor: theme.palette.grey.black,
  borderRadius: UI_SIZES.radius.small,
  bottom: 0,
  opacity: 0.6,
  position: 'absolute',
  right: 0,
  width: '100%',
});

const Column = styled.View({
  justifyContent: 'space-between',
  width: '50%',
});

const BubbleView = styled.View({
  backgroundColor: theme.palette.grey.black,
  borderRadius: 15,
  height: 30,
  left: '50%',
  marginLeft: -UI_SIZES.spacing.small,
  opacity: 0.8,
  padding: UI_SIZES.spacing.tiny,
  position: 'absolute',
  width: 30,
});

const errorImageWidth = getScaleImageSize(UI_SIZES.dimensions.height.huge);
const errorImageHeight = getScaleImageSize(UI_SIZES.dimensions.height.huge);

const imageHeightRatio = 0.6;
const imageWidth = UI_SIZES.standardScreen.width;
const imageHeight = imageWidth * imageHeightRatio;

const UnavailableImage = (props: { big?: boolean }) => (
  <View
    style={{
      backgroundColor: theme.palette.grey.pearl,
      borderRadius: UI_SIZES.radius.small,
      flex: 1,
      height: '100%',
      justifyContent: 'space-around',
      paddingHorizontal: UI_SIZES.spacing.minor,
      paddingVertical: UI_SIZES.spacing.minor,
      width: '100%',
    }}>
    <Svg
      style={{ alignSelf: 'center', flex: 0, marginVertical: UI_SIZES.spacing.minor }}
      name="image-not-found"
      width={(props.big ? 4 : 2) * errorImageWidth}
      height={(props.big ? 4 : 2) * errorImageHeight}
      fill={theme.palette.grey.stone}
    />
  </View>
);

const StretchImage = (props: ImageProps & { big?: boolean }) => {
  const { big, ...otherProps } = props;
  return (
    <ImageOptional
      {...otherProps}
      imageComponent={FastImage}
      errorComponent={<UnavailableImage big={big} />}
      style={{
        borderRadius: UI_SIZES.radius.small,
        height: '100%',
        width: '100%',
      }}
      resizeMode={RNFastImage.resizeMode.cover}
    />
  );
};

class Images extends React.Component<
  {
    images: { src: ImageURISource; alt?: string; linkTo?: string }[];
    style?: ViewStyle;
    referer: AudienceParameter;
  },
  any
> {
  public openImage(startIndex: any) {
    const { images } = this.props;
    const data = images.map(img => ({
      src: img.src,
      type: 'image' as const,
      ...(img.alt ? { alt: img.alt } : undefined),
      ...(img.linkTo ? { link: img.linkTo } : undefined),
    }));
    openCarousel({ data, referer: this.props.referer, startIndex });
  }

  public images() {
    const { images } = this.props;

    const getImageSource = (imageSrc: ImageURISource, oneRow: boolean) => {
      if (!imageSrc || !imageSrc.uri) return imageSrc;
      const uri = new URL(urlSigner.getAbsoluteUrl(imageSrc.uri)!);
      uri.searchParams.delete('thumbnail');
      uri.searchParams.append('thumbnail', `${IMAGE_MAX_DIMENSION}x0`);
      return { ...imageSrc, uri: uri.toString() };
    };

    if (images.length === 0) return <View />;
    if (images.length === 1) {
      return (
        <SoloImage style={{ height: imageHeight }} onPress={() => this.openImage(0)}>
          <StretchImage source={getImageSource(images[0].src, true)} big />
        </SoloImage>
      );
    }
    if (images.length === 2) {
      return (
        <Row style={{ justifyContent: 'space-between' }}>
          <Column style={{ paddingRight: UI_SIZES.spacing._LEGACY_tiny }}>
            <SoloImage style={{ height: imageHeight }} onPress={() => this.openImage(0)}>
              <StretchImage source={getImageSource(images[0].src, false)} big />
            </SoloImage>
          </Column>
          <Column style={{ paddingLeft: UI_SIZES.spacing._LEGACY_tiny }}>
            <SoloImage style={{ height: imageHeight }} onPress={() => this.openImage(1)}>
              <StretchImage source={getImageSource(images[1].src, false)} big />
            </SoloImage>
          </Column>
        </Row>
      );
    }
    if (images.length === 3) {
      return (
        <Row style={{ justifyContent: 'space-between' }}>
          <Column style={{ paddingRight: UI_SIZES.spacing._LEGACY_tiny }}>
            <SoloImage style={{ height: imageHeight }} onPress={() => this.openImage(0)}>
              <StretchImage source={getImageSource(images[0].src, false)} />
            </SoloImage>
          </Column>
          <Column style={{ paddingLeft: UI_SIZES.spacing._LEGACY_tiny }}>
            <QuarterImage style={{ height: imageHeight / 2 - UI_SIZES.spacing._LEGACY_tiny }} onPress={() => this.openImage(1)}>
              <StretchImage source={getImageSource(images[1].src, false)} />
            </QuarterImage>
            <QuarterImage style={{ height: imageHeight / 2 - UI_SIZES.spacing._LEGACY_tiny }} onPress={() => this.openImage(2)}>
              <StretchImage source={getImageSource(images[2].src, false)} />
            </QuarterImage>
          </Column>
        </Row>
      );
    }
    return (
      <Row style={{ justifyContent: 'space-between' }}>
        <Column style={{ paddingRight: UI_SIZES.spacing._LEGACY_tiny }}>
          <QuarterImage style={{ height: imageHeight / 2 - UI_SIZES.spacing._LEGACY_tiny }} onPress={() => this.openImage(0)}>
            <StretchImage source={getImageSource(images[0].src, false)} />
          </QuarterImage>
          <QuarterImage style={{ height: imageHeight / 2 - UI_SIZES.spacing._LEGACY_tiny }} onPress={() => this.openImage(2)}>
            <StretchImage source={getImageSource(images[2].src, false)} />
          </QuarterImage>
        </Column>
        <Column style={{ paddingLeft: UI_SIZES.spacing._LEGACY_tiny }}>
          <QuarterImage style={{ height: imageHeight / 2 - UI_SIZES.spacing._LEGACY_tiny }} onPress={() => this.openImage(1)}>
            <StretchImage source={getImageSource(images[1].src, false)} />
          </QuarterImage>
          <QuarterImage style={{ height: imageHeight / 2 - UI_SIZES.spacing._LEGACY_tiny }} onPress={() => this.openImage(3)}>
            <StretchImage source={getImageSource(images[3].src, false)} />
            {images.length > 4 && <Overlay style={{ height: imageHeight / 2 - 2 }} onPress={() => this.openImage(3)} />}
            {images.length > 4 && (
              <BubbleView style={{ bottom: imageHeight / 4 - 15, justifyContent: 'center' }}>
                <SmallInverseText
                  style={{ lineHeight: undefined, marginHorizontal: -UI_SIZES.spacing.small, textAlign: 'center' }}
                  onPress={() => this.openImage(3)}>
                  +
                  {
                    images.length - 3
                    /* -3 instead of -4 because of the last one has the dark foreground*/
                  }
                </SmallInverseText>
              </BubbleView>
            )}
          </QuarterImage>
        </Column>
      </Row>
    );
  }

  public render() {
    const { images, style } = this.props;

    if (images.length === 0) return <View />;
    return (
      <View style={style}>
        <ContainerImage style={{ height: imageHeight }}>{this.images()}</ContainerImage>
      </View>
    );
  }
}

// const withWindowDimensions = (Component) => {
//   return (props) => {
//     return <Component {...props} windowDimensions={useWindowDimensions()} />;
//   }
// }

export default /*withWindowDimensions*/ Images;
