import * as React from 'react';
import { EmitterSubscription, Keyboard, Platform, TouchableOpacity, View } from 'react-native';
import { KeyboardAvoidingFlatList } from 'react-native-keyboard-avoiding-scroll-view';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { BottomButtonSheet } from '~/framework/components/BottomButtonSheet';
import BottomEditorSheet from '~/framework/components/BottomEditorSheet';
import ModalBox from '~/framework/components/ModalBox';
import UserList from '~/framework/components/UserList';
import { ContentCardHeader, ResourceView } from '~/framework/components/card';
import CommentField, { InfoCommentField } from '~/framework/components/commentField';
import { UI_SIZES } from '~/framework/components/constants';
import FlatList from '~/framework/components/list/flat-list';
import { Picture } from '~/framework/components/picture';
import { CaptionBoldText, CaptionText, HeadingSText, SmallBoldText, SmallText, TextSizeStyle } from '~/framework/components/text';
import usePreventBack from '~/framework/hooks/prevent-back';
import { AccountType } from '~/framework/modules/auth/model';
import {
  IConcernedStudent,
  IWordReport,
  getHasSingleRecipientForTeacher,
  getIsWordAcknowledgedForParent,
  getIsWordAcknowledgedForStudent,
  getIsWordAcknowledgedForTeacher,
  getIsWordRepliedToForParent,
  getReportByStudentForParent,
  getStudentsForTeacher,
} from '~/framework/modules/schoolbook/reducer';
import HtmlContentView from '~/ui/HtmlContentView';
import { SingleAvatar } from '~/ui/avatars/SingleAvatar';

import CardTopContentCategory from './cardtopcontent-category';

const acknowledgementsString = (ackNumber: number, total: number) =>
  `${ackNumber}/${total} ${I18n.get(ackNumber === 1 ? 'schoolbook-worddetails-acknowledgement' : 'schoolbook-worddetails-acknowledgements').toLowerCase()}`;
const unacknowledgedString = (userType: AccountType) =>
  I18n.get(`schoolbook-worddetails-acknowledgementneeded-${userType.toLowerCase()}`);
const recipientsString = (report: IConcernedStudent[]) =>
  getHasSingleRecipientForTeacher(report)
    ? report[0].ownerName
    : `${report.length} ${I18n.get('schoolbook-worddetails-students').toLowerCase()}`;
const responsesString = (responses: number) =>
  responses === 1
    ? `1 ${I18n.get('schoolbook-worddetails-response').toLowerCase()}`
    : `${responses} ${I18n.get('schoolbook-worddetails-responses').toLowerCase()}`;

export interface ISchoolBookWordDetailsCardProps {
  action: () => void;
  onPublishReply: (comment: string, commentId?: string) => any;
  onEditComment: (data) => any;
  isPublishingReply: boolean;
  isAcknowledgingWord: boolean;
  userType: AccountType | undefined;
  userId: string | undefined;
  studentId: string;
  schoolbookWord: IWordReport;
}

//FIXME: create/move to styles.ts
const styles = {
  acknowledgementsContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  from: { flex: 1, marginLeft: UI_SIZES.spacing.minor },
  fromContainer: { marginTop: UI_SIZES.spacing.medium, flexDirection: 'row', alignItems: 'center' },
  headerIndicatorStyle: { justifyContent: 'center' },
  headerStyle: {
    backgroundColor: theme.palette.grey.fog,
    paddingVertical: UI_SIZES.spacing.minor,
    borderBottomColor: theme.palette.grey.pearl,
    borderBottomWidth: UI_SIZES.dimensions.width.tiny,
  },
  modalBoxContainer: {
    flexGrow: 1,
    flexShrink: 1,
    paddingBottom: UI_SIZES.screen.bottomInset + UI_SIZES.elements.tabbarHeight + Platform.select({ ios: 8, default: 48 }), // Still magic numbers here
  },
  responsesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI_SIZES.spacing.minor,
    marginVertical: -UI_SIZES.spacing.minor,
  },
  unacknowledged: { marginTop: UI_SIZES.spacing.small, alignSelf: 'center', color: theme.palette.status.warning.regular },
  userListContentContainer: { flexGrow: 1 },
};

const SchoolbookWordDetailsCard = (
  {
    action,
    onPublishReply,
    onEditComment,
    isPublishingReply,
    isAcknowledgingWord,
    userType,
    userId,
    studentId,
    schoolbookWord,
  }: ISchoolBookWordDetailsCardProps,
  ref,
) => {
  const flatListRef = React.useRef<typeof FlatList>();
  const flatListModalRef = React.useRef<typeof FlatList>();
  const modalBoxRef: { current: any } = React.createRef();
  const commentFieldRefs = React.useRef([]);
  const bottomEditorSheetRef: { current: any } = React.useRef();

  const [editedCommentId, setEditedCommentId] = React.useState<string>('');
  const [contentHeight, setContentHeight] = React.useState(0);
  const [viewHeight, setViewHeight] = React.useState(0);

  const usersTextMaxLines = 1;
  const { word, report } = schoolbookWord;
  const schoolbookWordOwnerId = word?.ownerId;
  const schoolbookWordResponsesNumber = word?.respNumber;
  const isUserSchoolbookWordOwner = userId === schoolbookWordOwnerId;
  const isParent = userType === AccountType.Relative;
  const isTeacher = userType === AccountType.Teacher || userType === AccountType.Personnel;
  const isStudent = userType === AccountType.Student;
  const isAuthorOtherTeacher = isTeacher && !isUserSchoolbookWordOwner;
  const hasSingleRecipientForTeacher = getHasSingleRecipientForTeacher(report);
  const studentsForTeacher = getStudentsForTeacher(report)?.map(student => ({ id: student.owner, name: student.ownerName }));
  const reportByStudentForParent = getReportByStudentForParent(studentId, report);
  const isWordAcknowledgedForParent =
    userId && reportByStudentForParent && getIsWordAcknowledgedForParent(userId, reportByStudentForParent?.acknowledgments);
  const isWordRepliedToForParent =
    userId && reportByStudentForParent && getIsWordRepliedToForParent(userId, reportByStudentForParent?.responses);
  const isWordAcknowledgedForTeacher = getIsWordAcknowledgedForTeacher(word?.ackNumber, word?.total);
  const isWordAcknowledgedForStudent = getIsWordAcknowledgedForStudent(report[0]?.acknowledgments);
  const isWordAcknowledged =
    (isTeacher && isWordAcknowledgedForTeacher) ||
    (isStudent && isWordAcknowledgedForStudent) ||
    (isParent && isWordAcknowledgedForParent);
  const responses = isStudent ? report[0]?.responses : isParent ? reportByStudentForParent?.responses : undefined;
  const isBottomSheetVisible = isParent && (!isWordAcknowledged || (word?.reply && !isWordRepliedToForParent));
  const doesContentExceedView = contentHeight && viewHeight ? contentHeight > viewHeight : undefined;

  const editorOffsetRef = React.useRef<number>(0);

  usePreventBack({
    title: I18n.get('schoolbook-worddetails-alertAcknowledge-title'),
    text: I18n.get('schoolbook-worddetails-alertAcknowledge-text'),
    showAlert: isParent && !isWordAcknowledgedForParent,
  });

  const scrollToEnd = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: contentHeight,
      });
    }, 50);
  };
  const cardBottomEditorSheetRef = () => bottomEditorSheetRef?.current;
  const cardSelectedCommentFieldRef = () => commentFieldRefs[editedCommentId];
  React.useImperativeHandle(ref, () => ({
    scrollToEnd,
    cardBottomEditorSheetRef,
    cardSelectedCommentFieldRef,
  }));

  const showSubscriptionRef = React.useRef<EmitterSubscription>();
  React.useEffect(() => {
    showSubscriptionRef.current = Keyboard.addListener('keyboardDidShow', event => {
      setTimeout(() => {
        const commentIndex = responses?.findIndex(r => r.id?.toString() === editedCommentId);
        if (commentIndex !== undefined && commentIndex > -1) {
          if (Platform.OS === 'ios') {
            flatListRef?.current?.scrollToIndex({
              index: commentIndex,
              viewPosition: 1,
              viewOffset: -UI_SIZES.spacing.medium,
            });
          } else {
            flatListRef.current?.scrollToIndex({
              index: commentIndex,
              viewPosition: 0,
              viewOffset:
                UI_SIZES.screen.height -
                UI_SIZES.elements.navbarHeight -
                event.endCoordinates.height -
                (editorOffsetRef.current ?? 0) -
                UI_SIZES.spacing.medium,
            });
          }
        }
      }, 50);
    });
    return () => {
      showSubscriptionRef.current?.remove();
    };
  });

  const resourceView = React.useMemo(
    () => (
      <ResourceView
        style={{
          backgroundColor: theme.ui.background.card,
          borderBottomWidth: UI_SIZES.dimensions.width.tiny,
          borderBottomColor: theme.palette.grey.pearl,
          paddingBottom:
            UI_SIZES.spacing.tiny + (doesContentExceedView && isBottomSheetVisible ? UI_SIZES.radius.mediumPlus * 2 : 0),
        }}
        customHeaderStyle={styles.headerStyle}
        customHeaderIndicatorStyle={styles.headerIndicatorStyle}
        headerIndicator={
          isTeacher ? (
            <TouchableOpacity style={styles.acknowledgementsContainer} onPress={action}>
              <SmallBoldText style={{ color: theme.palette.primary.regular }}>
                {acknowledgementsString(word?.ackNumber, word?.total)}
              </SmallBoldText>
              <Picture
                cached
                type="NamedSvg"
                name="pictos-arrow-right"
                width={UI_SIZES.dimensions.width.large}
                height={UI_SIZES.dimensions.height.large}
                fill={theme.palette.primary.regular}
                style={{ marginLeft: UI_SIZES.spacing.minor }}
              />
            </TouchableOpacity>
          ) : null
        }
        header={
          <TouchableOpacity
            disabled={!isTeacher || hasSingleRecipientForTeacher}
            onPress={() => {
              modalBoxRef?.current?.doShowModal();
              setTimeout(() => {
                flatListModalRef?.current?.flashScrollIndicators();
              });
            }}>
            <ContentCardHeader
              icon={
                <SingleAvatar
                  status={undefined}
                  size={36}
                  userId={
                    isTeacher
                      ? hasSingleRecipientForTeacher
                        ? report[0]?.owner
                        : require('ASSETS/images/group-avatar.png')
                      : word?.ownerId
                  }
                />
              }
              text={
                <CaptionText numberOfLines={usersTextMaxLines}>
                  {`${I18n.get(isTeacher ? 'schoolbook-worddetails-for' : 'schoolbook-worddetails-from')} `}
                  <CaptionBoldText
                    style={{
                      color: !isTeacher || hasSingleRecipientForTeacher ? theme.ui.text.regular : theme.palette.primary.regular,
                    }}>
                    {isTeacher ? recipientsString(report) : word?.ownerName}
                  </CaptionBoldText>
                </CaptionText>
              }
              date={word?.sendingDate}
            />
          </TouchableOpacity>
        }
        footer={
          isTeacher && schoolbookWordResponsesNumber ? (
            <TouchableOpacity style={styles.responsesContainer} onPress={action}>
              <Picture
                cached
                type="NamedSvg"
                name="pictos-answer"
                width={UI_SIZES.dimensions.width.large}
                height={UI_SIZES.dimensions.height.large}
                fill={theme.palette.primary.regular}
                style={{ marginRight: UI_SIZES.spacing.minor }}
              />
              <SmallBoldText style={{ color: theme.palette.primary.regular }}>
                {responsesString(schoolbookWordResponsesNumber)}
              </SmallBoldText>
            </TouchableOpacity>
          ) : undefined
        }>
        {isAuthorOtherTeacher ? (
          <View style={styles.fromContainer}>
            <SingleAvatar status={undefined} size={36} userId={word?.ownerId} />
            <SmallText style={styles.from} numberOfLines={usersTextMaxLines}>
              {`${I18n.get('schoolbook-worddetails-from')} `}
              <SmallBoldText>{word?.ownerName}</SmallBoldText>
            </SmallText>
          </View>
        ) : !isTeacher && !isWordAcknowledged && userType ? (
          <SmallBoldText style={styles.unacknowledged}>{unacknowledgedString(userType)}</SmallBoldText>
        ) : null}
        {word?.category ? (
          <CardTopContentCategory
            style={{ marginTop: isAuthorOtherTeacher ? UI_SIZES.spacing.medium : UI_SIZES.spacing.large }}
            category={word?.category}
          />
        ) : null}
        {word?.title ? <HeadingSText style={{ marginTop: UI_SIZES.spacing.small }}>{word?.title}</HeadingSText> : null}
        {word?.text ? (
          <View style={{ marginTop: UI_SIZES.spacing.minor, marginBottom: UI_SIZES.spacing.small }}>
            <HtmlContentView html={word?.text} opts={{ globalTextStyle: { ...TextSizeStyle.Medium } }} />
          </View>
        ) : null}
      </ResourceView>
    ),
    [
      action,
      doesContentExceedView,
      hasSingleRecipientForTeacher,
      isAuthorOtherTeacher,
      isBottomSheetVisible,
      isTeacher,
      isWordAcknowledged,
      modalBoxRef,
      report,
      schoolbookWordResponsesNumber,
      userType,
      word?.ackNumber,
      word?.category,
      word?.ownerId,
      word?.ownerName,
      word?.sendingDate,
      word?.text,
      word?.title,
      word?.total,
    ],
  );

  const ListComponent = Platform.select<typeof FlatList | typeof KeyboardAvoidingFlatList>({
    ios: FlatList,
    android: KeyboardAvoidingFlatList,
  })!;

  const refSetup = React.useCallback(listComponentRef => {
    flatListRef.current = listComponentRef;
  }, []);

  const onContentSizeChange = React.useCallback((width, height) => {
    setContentHeight(height);
  }, []);

  const renderItem = React.useCallback(
    ({ item, index }) => {
      const isFirstItem = index === 0;
      return (
        <View style={{ marginTop: isFirstItem ? UI_SIZES.spacing.medium : undefined }}>
          <CommentField
            ref={element => (commentFieldRefs[item.id] = element)}
            index={index}
            isPublishingComment={isPublishingReply}
            onPublishComment={(comment, commentId) => {
              onPublishReply(comment, commentId);
            }}
            onChangeText={data => onEditComment(data)}
            editCommentCallback={() => {
              const otherSchoolbookWordResponses = responses?.filter(response => response.id !== item.id);
              setEditedCommentId(item.id?.toString());
              otherSchoolbookWordResponses?.forEach(otherSchoolbookWordResponse => {
                commentFieldRefs[otherSchoolbookWordResponse.id]?.setIsEditingFalse();
              });
            }}
            comment={item.comment}
            commentId={item.id}
            commentAuthorId={item.owner}
            commentAuthor={item.parentName}
            commentDate={item.modified}
            isResponse
            onEditableLayoutHeight={val => {
              editorOffsetRef.current = val;
            }}
          />
        </View>
      );
    },
    [isPublishingReply, onEditComment, onPublishReply, responses],
  );

  const keyExtractor = React.useCallback(item => item.id?.toString(), []);

  const onLayout = React.useCallback(({ nativeEvent }) => setViewHeight(nativeEvent?.layout?.height), []);

  const style = React.useMemo(
    () => ({
      marginBottom: doesContentExceedView && isBottomSheetVisible ? -UI_SIZES.radius.mediumPlus : undefined,
    }),
    [doesContentExceedView, isBottomSheetVisible],
  );

  const scrollIndicatorInsets = React.useMemo(
    () => ({
      right: 0.001,
      bottom: doesContentExceedView && isBottomSheetVisible ? UI_SIZES.radius.mediumPlus : undefined,
    }),
    [doesContentExceedView, isBottomSheetVisible],
  );

  const onPublishComment = React.useCallback((comment: string) => onPublishReply(comment), [onPublishReply]);

  const onChangeText = React.useCallback((data: InfoCommentField) => onEditComment(data), [onEditComment]);

  return (
    <>
      <ListComponent
        ref={refSetup}
        onContentSizeChange={onContentSizeChange}
        removeClippedSubviews={false}
        data={word?.reply && responses ? responses : []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={resourceView}
        onLayout={onLayout}
        keyboardShouldPersistTaps="handled"
        bottomInset={!isBottomSheetVisible}
        style={style}
        scrollIndicatorInsets={scrollIndicatorInsets}
      />
      {isParent ? (
        !isWordAcknowledged ? (
          <BottomButtonSheet
            displayShadow={doesContentExceedView}
            text={I18n.get('schoolbook-worddetails-acknowledge')}
            action={action}
            loading={isAcknowledgingWord}
          />
        ) : word.reply && !isWordRepliedToForParent ? (
          <BottomEditorSheet
            ref={bottomEditorSheetRef}
            displayShadow={doesContentExceedView}
            isPublishingComment={isPublishingReply}
            onPublishComment={onPublishComment}
            onChangeText={onChangeText}
            isResponse
          />
        ) : null
      ) : null}
      <ModalBox
        ref={modalBoxRef}
        content={
          <View style={styles.modalBoxContainer}>
            <HeadingSText style={{ marginBottom: UI_SIZES.spacing.tiny }}>
              {I18n.get('schoolbook-worddetails-recipientsmodal-title')}
            </HeadingSText>
            <SmallText style={{ marginBottom: UI_SIZES.spacing.medium, color: theme.palette.grey.graphite }}>
              {I18n.get('schoolbook-worddetails-recipientsmodal-text')}
            </SmallText>
            <UserList
              ref={flatListModalRef}
              data={studentsForTeacher}
              avatarSize={24}
              contentContainerStyle={styles.userListContentContainer}
              initialNumToRender={15}
              viewabilityConfig={{
                waitForInteraction: false,
                viewAreaCoveragePercentThreshold: 0,
                minimumViewTime: -1,
              }}
              alwaysBounceVertical={false}
              persistentScrollbar
              showsVerticalScrollIndicator
            />
          </View>
        }
      />
    </>
  );
};

export default React.forwardRef(SchoolbookWordDetailsCard);
