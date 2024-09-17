import React, { ReactChild, ReactElement, forwardRef } from 'react';
import { Alert, Keyboard, Platform, SafeAreaView, StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import { KeyboardAvoidingScrollView } from 'react-native-keyboard-avoiding-scroll-view';
import { connect } from 'react-redux';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Icon } from '~/framework/components/picture/Icon';
import { HeadingSText, SmallText } from '~/framework/components/text';
import { ISearchUsers } from '~/framework/modules/conversation/service/newMail';
import {
  IVisible,
  IVisibles,
  IVisiblesState,
  VisibleRecipientType,
  VisibleType,
  filterVisibles,
  getVisiblesState,
} from '~/framework/modules/conversation/state/visibles';
import { IDistantFileWithId } from '~/framework/util/fileHandler';
import { isEmpty } from '~/framework/util/object';
import HtmlToText from '~/infra/htmlConverter/text';
import TouchableOpacity from '~/ui/CustomTouchableOpacity';
import HtmlContentView from '~/ui/HtmlContentView';
import { Loading } from '~/ui/Loading';

import Attachment from './Attachment';
import { FoundList, Input, SelectedList } from './SearchUserMail';
import FoundListPlaceholder from './placeholder/foundlist';

type HeadersProps = { to: ISearchUsers; cc: ISearchUsers; cci: ISearchUsers; subject: string };

type IAttachment = {
  id?: string;
  filename: string;
  contentType: string;
  size?: number;
};
interface ConversationNewMailComponentEventProps {
  onDraftSave: () => void;
  onHeaderChange: (header: HeadersProps) => void;
  onBodyChange: (body: string) => void;
  onAttachmentChange: (attachments: IAttachment[]) => void;
  onAttachmentDelete: (attachmentId: string) => void;
}
interface ConversationNewMailComponentDataProps {
  isFetching: boolean;
  headers: HeadersProps;
  body: string;
  attachments: IDistantFileWithId[];
  prevBody: any;
  isReplyDraft: boolean;
}
export type ConversationNewMailComponentProps = ConversationNewMailComponentEventProps & ConversationNewMailComponentDataProps;

//FIXME: create/move to styles.ts
const styles = StyleSheet.create({
  attachments: { zIndex: 2 },
  attachmentsAdditionalStyle: { padding: 0 },
  body: { zIndex: 1, flex: 1 },
  bodyAdditionalStyle: { flexGrow: 1 },
  bodyInput: { flexGrow: 1 },
  commonFieldsContainer: { flex: 1, backgroundColor: theme.ui.background.card },
  foundListContainer: { flexGrow: 1 },
  mailContactFieldContainer: { flexGrow: 1 },
  mailContactFieldInputContainer: { overflow: 'visible', marginHorizontal: UI_SIZES.spacing.tiny, flex: 1 },
  mailContactFieldInputSubWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: UI_SIZES.spacing.medium,
    paddingVertical: UI_SIZES.spacing.minor,
    borderBottomColor: theme.palette.grey.cloudy,
    borderBottomWidth: 2,
    backgroundColor: theme.ui.background.card,
    flex: 0,
  },
  mailContactFieldInputWrapper: { flex: 0, alignItems: 'stretch' },
  mailContactFieldTitle: { color: theme.ui.text.light, paddingVertical: UI_SIZES.spacing.tiny },
  mailPart: {
    padding: UI_SIZES.spacing.small,
    backgroundColor: theme.ui.background.card,
  },
  newMailContentStyle: { flexGrow: 1 },
  newMailContentContainerStyle: { flexGrow: 1 },
  newMailStyle: {
    flexGrow: 1,
  },
  prevBodyAddtionalStyle: { flexGrow: 1 },
  noResult: {
    paddingTop: UI_SIZES.spacing.large,
    paddingHorizontal: UI_SIZES.spacing.medium,
    rowGap: UI_SIZES.spacing.small,
  },
  noResultText: {
    textAlign: 'center',
  },
});

const MailContactField = connect((state: IGlobalState) => ({
  visibles: getVisiblesState(state),
}))(({
  style,
  title,
  value,
  onChange,
  children,
  rightComponent,
  onOpenSearch,
  visibles,
  key,
  recipientType,
}: {
  style?: ViewStyle;
  title: string;
  value?: IVisibles;
  onChange?: (value: IVisibles) => void;
  children?: ReactChild;
  rightComponent?: ReactElement;
  onOpenSearch?: (searchIsOpen: boolean) => void;
  visibles: IVisiblesState;
  key: React.Key;
  recipientType: VisibleRecipientType;
}) => {
  const selectedUsersOrGroups = value || [];
  const [search, updateSearch] = React.useState('');
  const [isFocus, setIsFocus] = React.useState(false);
  const [isLoadingResult, setIsLoadingResult] = React.useState(false);
  const previousVisibles = React.useRef<IVisiblesState>();
  const [foundUsersOrGroups, updateFoundUsersOrGroups] = React.useState<IVisibles>([]);
  const searchTimeout = React.useRef<NodeJS.Timeout>();
  const inputRef: { current: TextInput | undefined } = { current: undefined };
  const bookmarkVisibles = visibles.data.filter(user => user.type === VisibleType.SHAREBOOKMARK);

  const onUserType = (s: string) => {
    updateSearch(s);
    setIsLoadingResult(true);
    if (s.length >= 1) {
      updateFoundUsersOrGroups([]);
      onOpenSearch?.(true);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        const searchResults = visibles.lastSuccess ? filterVisibles(visibles.data, s) : [];
        updateFoundUsersOrGroups(searchResults);
        setIsLoadingResult(false);
      }, 500);
    } else {
      updateFoundUsersOrGroups([]);
      onOpenSearch?.(false);
      clearTimeout(searchTimeout.current);
      setIsLoadingResult(false);
    }
  };

  // Update search results whenever visibles are loaded
  React.useEffect(() => {
    previousVisibles.current = visibles;
    if (
      previousVisibles.current.lastSuccess &&
      visibles.lastSuccess &&
      !previousVisibles.current.lastSuccess.isSame(visibles.lastSuccess)
    ) {
      onUserType(search);
    }
  });

  const removeUser = (id: string) => onChange?.(selectedUsersOrGroups.filter(user => user.id !== id));
  const addUser = userOrGroup => {
    onChange?.([
      ...selectedUsersOrGroups,
      { displayName: userOrGroup.name || userOrGroup.displayName, id: userOrGroup.id } as IVisible,
    ]);
    onUserType('');
    inputRef.current?.focus();
  };

  const noUserFound = text => {
    if (text) {
      Alert.alert(
        I18n.get('conversation-newmail-erroruser-title', { user: text }),
        I18n.get('conversation-newmail-erroruser-text'),
      );
    }
    onUserType('');
    inputRef.current?.focus();
  };

  const renderFoundList = () => {
    if (isLoadingResult) return <FoundListPlaceholder />;
    if (foundUsersOrGroups.length)
      return <FoundList foundUserOrGroup={foundUsersOrGroups} addUser={addUser} recipientType={recipientType} />;
    if (search.length > 0)
      return (
        <View style={styles.noResult}>
          <HeadingSText style={styles.noResultText}>{I18n.get('conversation-newmail-noresulttitle', { search })}</HeadingSText>
          <SmallText style={styles.noResultText}>{I18n.get('conversation-newmail-noresulttext')}</SmallText>
        </View>
      );
    if (isFocus && !isEmpty(bookmarkVisibles))
      return <FoundList foundUserOrGroup={bookmarkVisibles} addUser={addUser} recipientType={recipientType} isBookmarks />;
    return children;
  };

  return (
    <View style={styles.mailContactFieldContainer}>
      <View style={styles.mailContactFieldInputWrapper}>
        <View style={[styles.mailContactFieldInputSubWrapper, style]}>
          <SmallText style={styles.mailContactFieldTitle}>{title} : </SmallText>
          <View style={styles.mailContactFieldInputContainer}>
            <SelectedList selectedUsersOrGroups={selectedUsersOrGroups} onItemClick={removeUser} />
            <Input
              inputRef={inputRef}
              autoFocus={false}
              value={search}
              onChangeText={onUserType}
              onSubmit={() => {
                noUserFound(search);
                setIsFocus(false);
              }}
              onEndEditing={() => {
                clearTimeout(searchTimeout.current);
                if (foundUsersOrGroups.length === 0) {
                  onOpenSearch?.(false);
                  updateFoundUsersOrGroups([]);
                  updateSearch('');
                }
              }}
              onFocus={() => setIsFocus(true)}
              key={key}
            />
          </View>
          {rightComponent}
        </View>
      </View>
      <View style={styles.foundListContainer}>{renderFoundList()}</View>
    </View>
  );
});

const HeaderSubject = ({
  style,
  title,
  onChange,
  value,
  onEndEditing,
}: React.PropsWithChildren<{
  style?: ViewStyle;
  title: string;
  onChange;
  forUsers?: boolean;
  value: any;
  onEndEditing?: () => void;
}>) => {
  const headerStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UI_SIZES.spacing.small,
    borderBottomColor: theme.palette.grey.cloudy,
    borderBottomWidth: 2,
    backgroundColor: theme.ui.background.card,
  } as ViewStyle;

  const inputStyle = {
    flex: 1,
    height: 40,
    color: theme.ui.text.regular,
  } as ViewStyle;

  const [currentValue, updateCurrentValue] = React.useState(value);

  return (
    <View style={[headerStyle, style]}>
      <SmallText style={{ color: theme.ui.text.light }}>{title} : </SmallText>
      <TextInput
        style={inputStyle}
        defaultValue={value}
        numberOfLines={1}
        onChangeText={text => {
          onChange(text);
          updateCurrentValue(text);
        }}
        onEndEditing={onEndEditing}
        returnKeyType="next"
      />
    </View>
  );
};

const Attachments = ({
  style,
  attachments,
  onChange,
  onDelete,
  onSave,
}: {
  style;
  attachments: IDistantFileWithId[];
  onChange;
  onDelete;
  onSave;
}) => {
  const removeAttachment = id => {
    const newAttachments = attachments.filter(item => item.id !== id);
    onDelete(id);
    onChange(newAttachments);
  };

  return attachments.length === 0 ? (
    <View />
  ) : (
    <View style={[styles.mailPart, styles.attachmentsAdditionalStyle, style]}>
      {attachments.map(att => (
        <Attachment
          uploadSuccess={att.id}
          uploadProgress={att.id ? 100 : 10}
          fileType={att.filetype}
          fileName={att.filename}
          onRemove={() => removeAttachment(att.id)}
        />
      ))}
    </View>
  );
};

const Body = forwardRef<TextInput>(({ style, value, onChange, autofocus }, ref) => {
  const br2nl = (text: string) => {
    return text?.replace(/<br\/?>/gm, '\n').replace(/<div>\s*?<\/div>/gm, '\n');
  };
  const nl2br = (text: string) => {
    return text?.replace(/\n/gm, '<br>');
  };
  const valueFormated = HtmlToText(nl2br(value), false).render;
  const [currentValue, updateCurrentValue] = React.useState(valueFormated);

  const textInputRef = ref ?? React.createRef<TextInput>();
  React.useEffect(() => {
    if (autofocus) textInputRef.current?.focus();
    // We want to call this only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.mailPart, styles.bodyAdditionalStyle, style]}>
      <TextInput
        ref={textInputRef}
        placeholder={I18n.get('conversation-newmail-typemessage')}
        textAlignVertical="top"
        multiline
        scrollEnabled={false}
        style={styles.bodyInput}
        defaultValue={value}
        value={br2nl(currentValue)}
        onChangeText={text => {
          const newText = nl2br(text);
          onChange(newText);
          updateCurrentValue(newText);
        }}
      />
    </View>
  );
});

const PrevBody = ({ prevBody }) => {
  return (
    <View style={[styles.mailPart, styles.prevBodyAddtionalStyle]}>
      <HtmlContentView html={prevBody} />
    </View>
  );
};

const Fields = ({
  headers,
  onHeaderChange,
  showExtraFields,
  toggleExtraFields,
  setIsSearchingUsers,
  isSearchingUsersFinal,
  attachments,
  onAttachmentChange,
  onAttachmentDelete,
  onDraftSave,
  prevBody,
  isReplyDraft,
  body,
  onBodyChange,
}: {
  headers: HeadersProps;
  onHeaderChange: (header: HeadersProps) => void;
  showExtraFields: boolean;
  toggleExtraFields: (val: boolean) => void;
  setIsSearchingUsers: (val: { [i in 'to' | 'cc' | 'cci']?: boolean }) => void;
  isSearchingUsersFinal: boolean;
  attachments: IDistantFileWithId[];
  onAttachmentChange: (attachments: IAttachment[]) => void;
  onAttachmentDelete: (attachmentId: string) => void;
  onDraftSave: () => void;
  prevBody: any;
  isReplyDraft: boolean;
  body: string;
  onBodyChange: (body: string) => void;
}) => {
  const bodyFielRef: { current: any } = React.useRef<TextInput>();

  const commonFields = (
    <SafeAreaView style={styles.commonFieldsContainer}>
      <HeaderSubject
        title={I18n.get('conversation-newmail-subject')}
        value={headers.subject}
        onChange={subject => onHeaderChange({ ...headers, subject })}
        key="subject"
        onEndEditing={() => bodyFielRef.current.focus()}
      />
      <Attachments
        style={styles.attachments}
        attachments={attachments}
        onChange={onAttachmentChange}
        onDelete={onAttachmentDelete}
        onSave={onDraftSave}
        key="attachments"
      />
      <Body style={styles.body} value={body} onChange={onBodyChange} autofocus={isReplyDraft} key="body" ref={bodyFielRef} />
      {!!prevBody && <PrevBody prevBody={prevBody} key="prevBody" />}
    </SafeAreaView>
  );

  return (
    <MailContactField
      value={headers.to}
      onChange={to => onHeaderChange({ ...headers, to })}
      rightComponent={
        isSearchingUsersFinal ? undefined : (
          <TouchableOpacity onPress={() => toggleExtraFields(!showExtraFields)}>
            <Icon name={showExtraFields ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} size={28} />
          </TouchableOpacity>
        )
      }
      title={I18n.get('conversation-newmail-to')}
      key="to"
      recipientType={VisibleRecipientType.TO}
      onOpenSearch={v => setIsSearchingUsers({ to: v })}>
      {showExtraFields ? (
        <MailContactField
          title={I18n.get('conversation-newmail-cc')}
          value={headers.cc}
          onChange={cc => onHeaderChange({ ...headers, cc })}
          key="cc"
          recipientType={VisibleRecipientType.CC}
          onOpenSearch={v => setIsSearchingUsers({ cc: v })}>
          <MailContactField
            title={I18n.get('conversation-newmail-bcc')}
            value={headers.cci}
            onChange={cci => onHeaderChange({ ...headers, cci })}
            key="cci"
            recipientType={VisibleRecipientType.CCI}
            onOpenSearch={v => setIsSearchingUsers({ cci: v })}>
            {commonFields}
          </MailContactField>
        </MailContactField>
      ) : (
        commonFields
      )}
    </MailContactField>
  );
};

export default (props: ConversationNewMailComponentProps) => {
  const [isSearchingUsers, toggleIsSearchingUsers] = React.useState({ to: false, cc: false, cci: false });
  const [keyboardHeight, setkeyboardHeight] = React.useState(0);
  const [showExtraFields, toggleExtraFields] = React.useState(false);

  const isSearchingUsersFinal = React.useMemo(() => Object.values(isSearchingUsers).includes(true), [isSearchingUsers]);

  const setIsSearchingUsers = (val: { [i in 'to' | 'cc' | 'cci']?: boolean }) => {
    toggleIsSearchingUsers({ ...isSearchingUsers, ...val });
  };

  React.useEffect(() => {
    const hideKeyboardListener = Keyboard.addListener('keyboardWillHide', () => {
      setkeyboardHeight(0);
    });
    const showKeyboardListener = Keyboard.addListener('keyboardDidShow', event => {
      setkeyboardHeight(event.endCoordinates.height);
    });
    return () => {
      hideKeyboardListener.remove();
      showKeyboardListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingScrollView
      alwaysBounceVertical={false}
      overScrollMode="never"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={styles.newMailContentContainerStyle}
      style={[
        styles.newMailStyle,
        { marginBottom: Platform.select({ ios: keyboardHeight - UI_SIZES.screen.bottomInset, default: 0 }) },
      ]}>
      <View style={styles.newMailContentStyle}>
        {props.isFetching ? (
          <Loading />
        ) : (
          <Fields
            {...props}
            showExtraFields={showExtraFields}
            toggleExtraFields={toggleExtraFields}
            setIsSearchingUsers={setIsSearchingUsers}
            isSearchingUsersFinal={isSearchingUsersFinal}
          />
        )}
      </View>
    </KeyboardAvoidingScrollView>
  );
};
