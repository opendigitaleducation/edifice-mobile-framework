import * as React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

import { Moment } from 'moment';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Icon } from '~/framework/components/icon';
import { NamedSVG } from '~/framework/components/picture';
import { BodyBoldText, SmallText, TextSizeStyle } from '~/framework/components/text';
import { getDayOfTheWeek, today } from '~/framework/util/date';
import HtmlToText from '~/infra/htmlConverter/text';

export interface IHomeworkCardProps {
  title: string;
  content: string;
  date: Moment;
  finished: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: theme.ui.background.card,
    borderRadius: UI_SIZES.radius.card,
    elevation: 7,
    flexDirection: 'row',
    marginLeft: UI_SIZES.spacing.big,
    marginTop: UI_SIZES.spacing.small,
    padding: UI_SIZES.spacing.medium,
    shadowColor: theme.ui.shadowColor,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  status: {
    marginLeft: UI_SIZES.spacing.minor,
  },
  viewArrow: {
    justifyContent: 'center',
    marginLeft: UI_SIZES.spacing.small,
  },
  viewTexts: {
    flex: 1,
  },
  viewTitle: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});

const HomeworkCard = ({ content, date, finished, onPress, style, title }: IHomeworkCardProps) => {
  const isPastDate = date.isBefore(today(), 'day');
  const dayOfTheWeek = getDayOfTheWeek(date);
  const dayColor = theme.color.homework.days[dayOfTheWeek]?.accent ?? theme.palette.grey.stone;
  const arrowColor = isPastDate ? theme.palette.grey.stone : dayColor;
  const formattedContent = content && HtmlToText(content, false).render;

  return (
    <TouchableOpacity onPress={onPress} style={[styles.item, style]}>
      <View style={styles.viewTexts}>
        <View style={styles.viewTitle}>
          {title ? <BodyBoldText numberOfLines={1}>{title}</BodyBoldText> : null}
          {finished === undefined ? null : (
            <NamedSVG
              fill={finished ? theme.palette.status.success.regular : theme.palette.grey.stone}
              name={`ui-${finished ? 'check' : 'clock'}`}
              style={styles.status}
              width={UI_SIZES.elements.icon.xsmall}
              height={UI_SIZES.elements.icon.xsmall}
            />
          )}
        </View>
        {formattedContent ? (
          <SmallText style={{ marginTop: UI_SIZES.spacing.tiny }} numberOfLines={2}>
            {formattedContent}
          </SmallText>
        ) : null}
      </View>
      <View style={styles.viewArrow}>
        <Icon name="arrow_right" color={arrowColor} size={TextSizeStyle.Medium.fontSize} style={{ left: UI_SIZES.spacing.tiny }} />
      </View>
    </TouchableOpacity>
  );
};

export default HomeworkCard;
