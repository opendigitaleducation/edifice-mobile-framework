import styled from '@emotion/native';
import * as React from 'react';
import { ImageProps, ImageURISource, View } from 'react-native';
import { Grayscale } from 'react-native-color-matrix-image-filters';
import { connect } from 'react-redux';

import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { AuthLoggedAccount } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import { FastImage } from '~/framework/util/media';
import { Connection } from '~/infra/Connection';

const getSelfAvatarUniqueKey = () => Date.now();
let selfAvatarUniqueKey = getSelfAvatarUniqueKey();
export const refreshSelfAvatarUniqueKey = () => {
  selfAvatarUniqueKey = getSelfAvatarUniqueKey();
};

export enum Size {
  aligned,
  large,
  small,
  verylarge,
  xxl,
}

export enum Status {
  selected,
  disabled,
}

const SelectedView = styled(View)({
  position: 'absolute',
  borderColor: theme.palette.primary.regular,
  borderWidth: 4,
  // increase width & height 2px to center border (2px outside & inside)
  top: -2,
  left: -2,
  borderRadius: 26,
  height: 52,
  width: 52,
});

const largeImageStyle = {
  borderRadius: 24,
  height: 48,
  width: 48,
};

const LargeImageBase = styled(FastImage)(largeImageStyle);

const LargeImage = props => {
  const isSelected = props.status === Status.selected;
  const isDisabled = props.status === Status.disabled;
  if (isSelected) {
    return (
      <View>
        <LargeImageBase {...props} />
        <SelectedView />
      </View>
    );
  } else if (isDisabled) {
    return (
      <Grayscale>
        <LargeImageBase {...props} />
      </Grayscale>
    );
  } else return <LargeImageBase {...props} />;
};

const AlignedContainer = styled.View(
  {
    borderRadius: 16,
    height: 29,
    marginRight: -UI_SIZES.spacing.tiny,
    marginLeft: -UI_SIZES.spacing.tiny,
    width: 29,
    backgroundColor: theme.palette.grey.pearl,
  },
  ({ index }) => ({
    zIndex: 100 - index,
  }),
);

const VLContainer = styled.View({
  alignSelf: 'center',
  borderRadius: 35,
  height: 71,
  width: 71,
  margin: 0,
  backgroundColor: theme.palette.grey.pearl,
});

const LargeContainer = styled.View({
  borderRadius: 24,
  height: 45,
  width: 45,
  backgroundColor: theme.palette.grey.pearl,
});

const alignedImageStyle = {
  borderRadius: 16,
  height: 29,
  width: 29,
};

const AlignedImageBase = styled(FastImage)(alignedImageStyle);

const AlignedImage = props => {
  const isSelected = props.status === Status.selected;
  const isDisabled = props.status === Status.disabled;
  if (isSelected) {
    return (
      <View>
        <AlignedImageBase {...props} />
        <SelectedView style={alignedImageStyle} />
      </View>
    );
  } else if (isDisabled) {
    return (
      <Grayscale>
        <AlignedImageBase {...props} />
      </Grayscale>
    );
  } else return <AlignedImageBase {...props} />;
};

const veryLargeImageStyle = {
  alignSelf: 'center',
  borderRadius: 35,
  height: 71,
  width: 71,
  margin: 0,
};

const VeryLargeImageBase = styled(FastImage)(veryLargeImageStyle);

const VeryLargeImage = props => {
  const isSelected = props.status === Status.selected;
  const isDisabled = props.status === Status.disabled;
  if (isSelected) {
    return (
      <View>
        <VeryLargeImageBase {...props} />
        <SelectedView style={veryLargeImageStyle} />
      </View>
    );
  } else if (isDisabled) {
    return (
      <Grayscale>
        <VeryLargeImageBase {...props} />
      </Grayscale>
    );
  } else return <VeryLargeImageBase {...props} />;
};

const xxlImageStyle = {
  alignSelf: 'center',
  borderRadius: UI_SIZES.elements.avatar.xxl / 2,
  width: UI_SIZES.elements.avatar.xxl,
  aspectRatio: UI_SIZES.aspectRatios.square,
  margin: 0,
};

const XxlImageBase = styled(FastImage)(xxlImageStyle);

const XXLContainer = styled.View({
  alignSelf: 'center',
  borderRadius: UI_SIZES.elements.avatar.xxl / 2,
  width: UI_SIZES.elements.avatar.xxl,
  aspectRatio: UI_SIZES.aspectRatios.square,
  margin: 0,
  backgroundColor: theme.palette.grey.pearl,
});

const XxlImage = props => {
  const isSelected = props.status === Status.selected;
  const isDisabled = props.status === Status.disabled;
  if (isSelected) {
    return (
      <View>
        <XxlImageBase {...props} />
        <SelectedView style={xxlImageStyle} />
      </View>
    );
  } else if (isDisabled) {
    return (
      <Grayscale>
        <XxlImageBase {...props} />
      </Grayscale>
    );
  } else return <XxlImageBase {...props} />;
};

const smallImageStyle = {
  borderColor: theme.palette.grey.white,
  borderWidth: 1,
};

const SmallImageBase = styled(FastImage)(smallImageStyle, ({ count }) => ({
  borderRadius: count === 1 ? 22 : count === 2 ? 15 : 10,
  height: count === 1 ? 45 : count === 2 ? 31 : 22,
  width: count === 1 ? 45 : count === 2 ? 31 : 22,
}));

const SmallImage = props => {
  const isSelected = props.status === Status.selected;
  const isDisabled = props.status === Status.disabled;
  if (isSelected) {
    return (
      <View>
        <SmallImageBase {...props} />
        <SelectedView style={smallImageStyle} />
      </View>
    );
  } else if (isDisabled) {
    return (
      <Grayscale>
        <SmallImageBase {...props} />
      </Grayscale>
    );
  } else return <SmallImageBase {...props} />;
};

const SmallContainer = styled.View<{ count: number; index: number }>(
  {
    position: 'absolute',
    backgroundColor: theme.palette.grey.pearl,
  },
  ({ count, index }) => ({
    borderRadius: count === 1 ? 22 : count === 2 ? 15 : 10,
    height: count === 1 ? 45 : count === 2 ? 31 : 22,
    left: count === 2 ? (index === 0 ? 0 : 15) : index === 0 || (index === 2 && count === 4) ? 0 : index === 2 ? 14 : 25,
    top: count === 2 ? (index === 0 ? 0 : 15) : index < 2 ? 0 : 25,
    width: count === 1 ? 45 : count === 2 ? 31 : 22,
  }),
);

export interface IAvatarProps {
  count?: number;
  status?: Status;
  id:
    | string
    | {
        id: string;
        isGroup: boolean;
      };
  sourceOrId?:
    | ImageURISource
    | string
    | {
        id: string;
        isGroup: boolean;
      };
  index?: number;
  large?: boolean;
  size: Size;
  width?: number;
  fallback?: ImageURISource;
  session?: AuthLoggedAccount;
  testID?: string;
}

class Avatar extends React.PureComponent<IAvatarProps, { status: 'initial' | 'loading' | 'success' | 'failed' }> {
  count: number;

  constructor(props) {
    super(props);
    this.state = { status: 'initial' };
  }

  get userId() {
    const idProp = this.props.sourceOrId || this.props.id;
    return idProp
      ? typeof idProp === 'string'
        ? idProp
        : (idProp as { id: string; isGroup: boolean }).id
          ? (idProp as { id: string; isGroup: boolean })
          : undefined
      : undefined;
  }

  get isMissingSourceAndId() {
    return !this.props.sourceOrId && !this.props.id;
  }

  get isGroup() {
    const id = this.userId;
    if (!id) return false;
    return typeof id === 'string' ? id.length < 36 : id.isGroup ? id.isGroup : id.id.length < 36;
  }

  renderNoAvatar(width) {
    const noAvatarImage = this.props.fallback || require('ASSETS/images/no-avatar.png');
    if (this.props.size === Size.large || this.count === 1) {
      return (
        <LargeContainer style={{ width, height: width }}>
          <LargeImage status={this.props.status} style={{ width, height: width }} source={noAvatarImage} />
        </LargeContainer>
      );
    } else if (this.props.size === Size.aligned) {
      return (
        <AlignedContainer index={this.props.index}>
          <AlignedImage status={this.props.status} source={noAvatarImage} />
        </AlignedContainer>
      );
    } else if (this.props.size === Size.verylarge) {
      return (
        <VLContainer>
          <VeryLargeImage status={this.props.status} source={noAvatarImage} />
        </VLContainer>
      );
    } else if (this.props.size === Size.xxl) {
      return (
        <XXLContainer>
          <XxlImage status={this.props.status} source={noAvatarImage} />
        </XXLContainer>
      );
    } else {
      return (
        <SmallContainer count={this.props.count || 1} index={this.props.index}>
          <SmallImage status={this.props.status} count={this.props.count || 1} source={noAvatarImage} />
        </SmallContainer>
      );
    }
  }

  renderIsGroup(width) {
    if (this.props.size === Size.large || this.count === 1) {
      return (
        <LargeContainer style={{ width, height: width }}>
          <LargeImage
            status={this.props.status}
            style={{ width, height: width }}
            source={require('ASSETS/images/group-avatar.png')}
          />
        </LargeContainer>
      );
    } else if (this.props.size === Size.aligned) {
      return (
        <AlignedContainer index={this.props.index}>
          <AlignedImage status={this.props.status} source={require('ASSETS/images/group-avatar.png')} />
        </AlignedContainer>
      );
    } else if (this.props.size === Size.verylarge) {
      return (
        <VLContainer>
          <VeryLargeImage status={this.props.status} source={require('ASSETS/images/group-avatar.png')} />
        </VLContainer>
      );
    } else if (this.props.size === Size.xxl) {
      return (
        <XXLContainer>
          <XxlImage status={this.props.status} source={require('ASSETS/images/group-avatar.png')} />
        </XXLContainer>
      );
    } else {
      return (
        <SmallContainer count={this.props.count || 1} index={this.props.index}>
          <SmallImage status={this.props.status} count={this.props.count || 1} source={require('ASSETS/images/group-avatar.png')} />
        </SmallContainer>
      );
    }
  }

  render() {
    const id = this.userId;
    // const userId = typeof id === "string" ? id : id.id
    let width = 45;
    if (this.props.width) {
      width = this.props.width;
    }

    if (this.isMissingSourceAndId) {
      return this.renderNoAvatar(width);
    }

    if (this.isGroup) {
      return this.renderIsGroup(width);
    }

    if (this.state.status == 'failed' || !Connection.isOnline) {
      return this.renderNoAvatar(width);
    }
    // TODO we could use react native fast image if we need to make some cache: https://www.npmjs.com/package/react-native-fast-image
    // but react native image should use header cache control like most of browsers so we may not need it
    // see more at: https://blog.rangle.io/image-caching-in-react-native/
    const sharedProps: Partial<ImageProps> = {
      defaultSource: this.props.fallback || require('ASSETS/images/no-avatar.png'),

      onError: () => {
        this.setState({ status: 'failed' });
      },
      onLoadStart: () => {
        this.setState({ status: 'loading' });
      },
      onLoad: () => {
        this.setState({ status: 'success' });
      },
    };
    let source =
      !this.userId && this.props.sourceOrId
        ? (this.props.sourceOrId as ImageURISource)
        : this.props.session
          ? {
              uri: `${this.props.session.platform.url}/userbook/avatar/${
                typeof this.userId === 'string' ? this.userId : this.userId!.id
              }?thumbnail=${this.props.size === Size.verylarge ? '150x150' : '100x100'}`,
            }
          : undefined;
    const isSelf = this.props.session && source?.uri?.includes(this.props.session.user.id);
    if (isSelf && source) {
      source = {
        ...source,
        uri: source.uri + '&uniqId=' + selfAvatarUniqueKey,
      };
    }
    //in case of success,initial,loading status...
    if (this.props.size === Size.large || this.count === 1) {
      return (
        <LargeContainer style={{ width, height: width }}>
          <LargeImage
            {...sharedProps}
            source={source}
            style={{ width, height: width }}
            status={this.props.status}
            key={isSelf ? selfAvatarUniqueKey : source.uri}
          />
        </LargeContainer>
      );
    } else if (this.props.size === Size.aligned) {
      return (
        <AlignedContainer index={this.props.index}>
          <AlignedImage
            {...sharedProps}
            source={source}
            status={this.props.status}
            key={isSelf ? selfAvatarUniqueKey : source?.uri}
          />
        </AlignedContainer>
      );
    } else if (this.props.size === Size.verylarge) {
      return (
        <VLContainer>
          <VeryLargeImage
            {...sharedProps}
            decorate={this.decorate}
            source={source}
            status={this.props.status}
            key={isSelf ? selfAvatarUniqueKey : source?.uri}
          />
        </VLContainer>
      );
    } else if (this.props.size === Size.xxl) {
      return (
        <XXLContainer>
          <XxlImage {...sharedProps} source={source} status={this.props.status} key={isSelf ? selfAvatarUniqueKey : source?.uri} />
        </XXLContainer>
      );
    } else {
      return (
        <SmallContainer count={this.props.count || 1} index={this.props.index}>
          <SmallImage
            {...sharedProps}
            count={this.props.count || 1}
            source={source}
            status={this.props.status}
            key={isSelf ? selfAvatarUniqueKey : source?.uri}
          />
        </SmallContainer>
      );
    }
  }
}

export default connect((state: IGlobalState) => {
  const session = getSession();
  // if (!session) throw new Error('[Avatar] session must exist');
  return { session };
})(Avatar);
