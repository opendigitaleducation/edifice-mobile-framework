import moment from 'moment';
import * as React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Picture } from '~/framework/components/picture';
import { BodyBoldText, SmallBoldText, SmallText } from '~/framework/components/text';
import { Homework } from '~/framework/modules/viescolaire/common/utils/diary';
import { LeftColoredItem } from '~/framework/modules/viescolaire/dashboard/components/Item';
import { PageContainer } from '~/ui/ContainerContent';
import HtmlContentView from '~/ui/HtmlContentView';

const styles = StyleSheet.create({
  mainView: {
    flex: 1,
  },
  homeworksInfoBar: {
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  LeftColoredItemInfoBar: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  homeworkPart: {
    flex: 1,
    paddingVertical: UI_SIZES.spacing.minor,
    paddingHorizontal: UI_SIZES.spacing.medium,
  },
  homeworksView: {
    marginBottom: UI_SIZES.spacing.large,
  },
  homeworkType: {
    marginTop: UI_SIZES.spacing.medium,
  },
  subtitle: {
    color: theme.palette.grey.stone,
    marginBottom: UI_SIZES.spacing.medium,
  },
  course: {
    textTransform: 'uppercase',
    marginLeft: UI_SIZES.spacing.minor,
  },
});

type IDisplayListHomeworkProps = {
  subject: string;
  homeworkList: Homework[];
};

export default class DisplayListHomework extends React.PureComponent<IDisplayListHomeworkProps> {
  public render() {
    const { subject, homeworkList } = this.props;
    const htmlOpts = {
      selectable: true,
    };

    return (
      <PageContainer>
        <View style={styles.mainView}>
          <View style={styles.homeworksInfoBar}>
            <LeftColoredItem shadow style={styles.LeftColoredItemInfoBar} color={theme.palette.complementary.orange.regular}>
              {homeworkList && homeworkList[0]?.due_date ? (
                <>
                  <Picture
                    type="NamedSvg"
                    name="ui-calendarLight"
                    width={20}
                    height={20}
                    fill={theme.palette.complementary.orange.regular}
                  />
                  <SmallText>&ensp;{moment(homeworkList[0].due_date).format('DD/MM/YY')}</SmallText>
                </>
              ) : null}
              {subject ? <SmallBoldText style={styles.course}>{subject}</SmallBoldText> : null}
            </LeftColoredItem>
          </View>

          <View style={styles.homeworkPart}>
            <BodyBoldText>{I18n.get('diary-homework-homework')}</BodyBoldText>
            <FlatList
              data={homeworkList}
              renderItem={({ item }) => (
                <View style={styles.homeworksView}>
                  {item?.type && <BodyBoldText style={styles.homeworkType}>{item?.type}</BodyBoldText>}
                  {item && item?.subject && (
                    <SmallText style={styles.subtitle}>
                      {item.subject.charAt(0).toLocaleUpperCase() + item.subject.substring(1).toLocaleLowerCase()} -{' '}
                      {item?.audience}
                    </SmallText>
                  )}
                  {this.props.homeworkList && item?.description && <HtmlContentView html={item.description} opts={htmlOpts} />}
                </View>
              )}
            />
          </View>
        </View>
      </PageContainer>
    );
  }
}
