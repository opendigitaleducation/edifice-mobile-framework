import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Icon } from '~/framework/components/icon';
import { Text, TextBold, TextSizeStyle } from '~/framework/components/text';
import { getDayOfTheWeek } from '~/framework/util/date';
import HtmlToText from '~/infra/htmlConverter/text';
import today from '~/utils/today';
import HomeworkTimeline from './HomeworkTimeline';

export interface IHomeworkCardProps {
  title: string;
  content: string;
  date: moment.Moment;
  onPress: () => void;
}

const HomeworkCard = ({ title, content, onPress, date }: IHomeworkCardProps) => {
  const isPastHomework = date.isBefore(today(), 'day');
  const dayOfTheWeek = getDayOfTheWeek(date);
  const dayColor = theme.days[dayOfTheWeek];
  const timelineColor = isPastHomework ? theme.greyPalette.cloudy : dayColor;
  const arrowColor = isPastHomework ? theme.greyPalette.stone : dayColor;
  const formattedContent = content && HtmlToText(content, false).render;

  return (
    <>
      <HomeworkTimeline leftPosition={UI_SIZES.spacing.smallPlus} topPosition={-UI_SIZES.spacing.small} color={timelineColor} />
      <TouchableOpacity
        onPress={onPress}
        style={{
          flexDirection: 'row',
          borderRadius: UI_SIZES.radius.small,
          marginTop: UI_SIZES.spacing.medium,
          padding: UI_SIZES.spacing.large,
          marginLeft: UI_SIZES.spacing.largePlus,
          backgroundColor: theme.color.background.card,
          elevation: 1,
          shadowColor: '#6B7C93',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
        }}>
        <View style={{ flex: 1 }}>
          {title ? (
            <TextBold style={{ ...TextSizeStyle.SlightBig, color: theme.color.text.regular }} numberOfLines={1}>
              {title}
            </TextBold>
          ) : null}
          {formattedContent ? (
            <Text style={{ color: theme.color.text.regular, marginTop: UI_SIZES.spacing.extraSmall }} numberOfLines={2}>
              {formattedContent}
            </Text>
          ) : null}
        </View>
        <View style={{ justifyContent: 'center', marginLeft: UI_SIZES.spacing.medium }}>
          <Icon
            name="arrow_right"
            color={arrowColor}
            size={TextSizeStyle.SlightBig.fontSize}
            style={{ left: UI_SIZES.spacing.tiny }}
          />
        </View>
      </TouchableOpacity>
    </>
  );
};

export default HomeworkCard;
