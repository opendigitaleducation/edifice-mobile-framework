import * as React from 'react';
import { View } from 'react-native';

import { Moment } from 'moment';

import CardTopContentCategory from './cardtopcontent-category';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { ContentCardHeader, ContentCardTitle, TouchableResourceCard } from '~/framework/components/card';
import CardTopContent from '~/framework/components/card/top-content';
import { UI_SIZES } from '~/framework/components/constants';
import { Picture } from '~/framework/components/picture';
import { CaptionBoldText, CaptionItalicText, CaptionText, SmallText } from '~/framework/components/text';
import { AccountType } from '~/framework/modules/auth/model';
import {
  getIsWordAcknowledgedForParent,
  getIsWordAcknowledgedForStudent,
  getIsWordAcknowledgedForTeacher,
  IAcknowledgment,
  IResponse,
} from '~/framework/modules/schoolbook/reducer';
import { displayPastDate } from '~/framework/util/date';
import { SingleAvatar } from '~/ui/avatars/SingleAvatar';
import { ArticleContainer } from '~/ui/ContainerContent';

const acknowledgementsString = (ackNumber: number, total: number) =>
  `${ackNumber}/${total} ${I18n.get(ackNumber === 1 ? 'schoolbook-wordlist-acknowledgement' : 'schoolbook-wordlist-acknowledgements').toLowerCase()}`;
const acknowledgedString = (isWordAcknowledged: boolean) =>
  I18n.get(isWordAcknowledged ? 'schoolbook-wordlist-acknowledged' : 'schoolbook-wordlist-acknowledge');
const responsesString = (responses: number) =>
  responses === 1
    ? `1 ${I18n.get('schoolbook-wordlist-response').toLowerCase()}`
    : `${responses} ${I18n.get('schoolbook-wordlist-responses').toLowerCase()}`;

export interface ISchoolbookWordSummaryCardProps {
  action: () => void;
  userType: AccountType | undefined;
  userId: string | undefined;
  acknowledgments: IAcknowledgment[];
  owner: string;
  ownerName: string;
  responses: IResponse[] | null;
  ackNumber: number;
  category: string;
  respNumber: number;
  sendingDate: Moment;
  title: string;
  total: number;
}

export const SchoolbookWordSummaryCard = ({
  acknowledgments,
  ackNumber,
  action,
  category,
  owner,
  ownerName,
  respNumber,
  responses,
  sendingDate,
  title,
  total,
  userId,
  userType,
}: ISchoolbookWordSummaryCardProps) => {
  const usersTextMaxLines = 1;
  const isParent = userType === AccountType.Relative;
  const isTeacher = userType === AccountType.Teacher || userType === AccountType.Personnel;
  const isStudent = userType === AccountType.Student;
  const isWordAcknowledgedForParent = userId && getIsWordAcknowledgedForParent(userId, acknowledgments);
  const isWordAcknowledgedForTeacher = getIsWordAcknowledgedForTeacher(ackNumber, total);
  const isWordAcknowledgedForStudent = getIsWordAcknowledgedForStudent(acknowledgments);
  const isWordAcknowledged =
    (isTeacher && isWordAcknowledgedForTeacher) ||
    (isStudent && isWordAcknowledgedForStudent) ||
    (isParent && isWordAcknowledgedForParent);
  const responsesNumber = isTeacher ? respNumber : responses?.length;

  //FIXME: create/move to styles.ts
  const styles = {
    headerStyle: {
      backgroundColor: theme.palette.grey.fog,
      borderTopLeftRadius: UI_SIZES.radius.medium,
      borderTopRightRadius: UI_SIZES.radius.medium,
      paddingVertical: isTeacher ? 0 : UI_SIZES.spacing.minor,
    },
    responsesContainer: { alignItems: 'center', flexDirection: 'row' },
    topContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: UI_SIZES.spacing.minor },
  };

  return (
    <ArticleContainer>
      <TouchableResourceCard
        onPress={action}
        customHeaderStyle={styles.headerStyle}
        headerIndicator={<View />}
        header={
          isTeacher ? undefined : (
            <ContentCardHeader
              icon={<SingleAvatar status={undefined} size={36} userId={owner} />}
              text={
                <CaptionText numberOfLines={usersTextMaxLines}>
                  {`${I18n.get('schoolbook-wordlist-from')} `}
                  <CaptionBoldText>{ownerName}</CaptionBoldText>
                </CaptionText>
              }
            />
          )
        }
        footer={
          responsesNumber ? (
            <View style={styles.responsesContainer}>
              <Picture
                cached
                type="Svg"
                name="pictos-answer"
                width={UI_SIZES.dimensions.width.large}
                height={UI_SIZES.dimensions.height.large}
                fill={theme.ui.text.regular}
                style={{ marginRight: UI_SIZES.spacing.minor }}
              />
              <SmallText>{responsesString(responsesNumber)}</SmallText>
            </View>
          ) : undefined
        }>
        {category ? (
          <CardTopContentCategory
            category={category}
            statusColor={isTeacher || isWordAcknowledged ? theme.ui.text.regular : theme.palette.status.warning.regular}
            statusText={isTeacher ? acknowledgementsString(ackNumber, total) : acknowledgedString(isWordAcknowledged)}
          />
        ) : (
          <CardTopContent
            image={<View />}
            text=""
            statusColor={isTeacher || isWordAcknowledged ? theme.ui.text.regular : theme.palette.status.warning.regular}
            statusText={isTeacher ? acknowledgementsString(ackNumber, total) : acknowledgedString(isWordAcknowledged)}
          />
        )}
        {sendingDate ? (
          <CaptionItalicText style={{ color: theme.palette.grey.graphite, marginTop: UI_SIZES.spacing.minor }}>
            {displayPastDate(sendingDate)}
          </CaptionItalicText>
        ) : null}
        {title ? (
          <ContentCardTitle style={{ color: theme.ui.text.regular, marginVertical: UI_SIZES.spacing.tiny }}>
            {title}
          </ContentCardTitle>
        ) : null}
      </TouchableResourceCard>
    </ArticleContainer>
  );
};
