import * as React from 'react';
import { ImageSourcePropType, TouchableOpacity, View, ViewStyle } from 'react-native';

import { I18n } from '~/app/i18n';
import { Image } from '~/framework/util/media';
import { Storage } from '~/framework/util/storage';
import type { StorageKey } from '~/framework/util/storage/types';
import { IconButton } from '~/ui/IconButton';

import PrimaryButton from './buttons/primary';
import { Card, InfoCard } from './card/base';
import { UI_SIZES } from './constants';
import { CaptionText, SmallBoldText, SmallText } from './text';
import { Toggle } from './toggle';

export interface IInfoBubbleProps {
  infoText: string;
  infoBubbleType: 'floating' | 'regular';
  storageKey: StorageKey;
  infoTitle?: string;
  infoImage?: ImageSourcePropType;
  style?: ViewStyle;
}

export interface IInfoBubbleState {
  isAcknowledged: boolean; // determines whether the InfoBubble is displayed
  acknowledgeToggle: boolean; // determines whether the Toggle is ON/OFF (regular type)
  displayToggle: boolean; // determines whether the content is displayed (floating type)
}

export class InfoBubble extends React.PureComponent<IInfoBubbleProps, IInfoBubbleState> {
  // DECLARATIONS =================================================================================

  state: IInfoBubbleState = {
    isAcknowledged: true,
    acknowledgeToggle: false,
    displayToggle: false,
  };

  // RENDER =======================================================================================

  public render() {
    const { infoBubbleType } = this.props;
    const { isAcknowledged } = this.state;
    const isRegular = infoBubbleType === 'regular';
    const isFloating = infoBubbleType === 'floating';
    return isAcknowledged ? null : isRegular ? this.renderRegularInfoBubble() : isFloating ? this.renderFloatingInfoBubble() : null;
  }

  renderFloatingInfoBubble() {
    const { infoText, infoTitle, infoImage, style } = this.props;
    const { displayToggle } = this.state;
    const textContainerWidth = UI_SIZES.screen.width * 0.9;
    const infoBubbleRightMargin = UI_SIZES.screen.width * 0.05;
    const infoBubbleDiameter = 38;
    const infoBubbleRadius = infoBubbleDiameter / 2;
    const iconSize = infoBubbleDiameter * 0.7;
    return (
      <Card
        style={[
          {
            width: displayToggle ? textContainerWidth : undefined,
            borderRadius: infoBubbleRadius,
            position: 'absolute',
            right: infoBubbleRightMargin,
            bottom: 0,
            paddingHorizontal: undefined,
            paddingVertical: undefined,
          },
          style,
        ]}>
        {displayToggle ? (
          <View
            style={{
              flex: 1,
              padding: UI_SIZES.spacing.medium,
              alignItems: 'center',
            }}>
            {infoTitle ? (
              <SmallBoldText style={{ textAlign: 'left', marginBottom: UI_SIZES.spacing.medium }}>{infoTitle}</SmallBoldText>
            ) : null}
            {infoImage ? (
              <Image
                source={infoImage}
                resizeMode="contain"
                style={{ height: 120, width: 120, marginBottom: UI_SIZES.spacing.medium }}
              />
            ) : null}
            <SmallText style={{ textAlign: 'left', marginBottom: UI_SIZES.spacing.medium }}>{infoText}</SmallText>
            <PrimaryButton text={I18n.get('myapp-infobubble-understood')} action={() => this.doAcknowledge(true)} />
          </View>
        ) : null}
        <TouchableOpacity
          onPress={() => this.setState({ displayToggle: !displayToggle })}
          style={displayToggle ? { position: 'absolute', bottom: 0, right: 0 } : undefined}>
          <IconButton
            iconName="interrogation-mark"
            iconSize={iconSize}
            buttonStyle={{
              height: infoBubbleDiameter,
              width: infoBubbleDiameter,
              borderRadius: infoBubbleRadius,
            }}
          />
        </TouchableOpacity>
      </Card>
    );
  }

  renderRegularInfoBubble() {
    const { infoText, style } = this.props;
    const { acknowledgeToggle } = this.state;
    return (
      <InfoCard style={style}>
        <SmallText style={{ textAlign: 'left', marginBottom: UI_SIZES.spacing.medium }}>{infoText}</SmallText>
        <View style={{ flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center' }}>
          <CaptionText style={{ marginRight: UI_SIZES.spacing.small }}>{I18n.get('myapp-infobubble-donotshow')}</CaptionText>
          <Toggle checked={acknowledgeToggle} onCheckChange={() => this.doAcknowledge(!acknowledgeToggle)} />
        </View>
      </InfoCard>
    );
  }

  // LIFECYCLE ====================================================================================

  componentDidMount(): void {
    this.doVerifyIfAcknowledged();
  }

  // METHODS ======================================================================================

  async doVerifyIfAcknowledged() {
    const { storageKey } = this.props;
    try {
      const isAcknowledged = !!Storage.global.getBoolean(storageKey);
      this.setState({ isAcknowledged });
    } catch {
      // ToDo: Error handling
    }
  }

  async doAcknowledge(acknowledge: boolean) {
    const { infoBubbleType, storageKey } = this.props;
    const isRegular = infoBubbleType === 'regular';
    const isFloating = infoBubbleType === 'floating';
    try {
      if (acknowledge) Storage.global.set(storageKey, true);
      else Storage.global.delete(storageKey);
      if (isFloating) this.setState({ isAcknowledged: true });
      else if (isRegular) this.setState({ acknowledgeToggle: acknowledge });
    } catch {
      // ToDo: Error handling
    }
  }
}
