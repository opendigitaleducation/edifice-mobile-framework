import I18n from "i18n-js";
import React from "react";
import { ScrollView, View, StyleSheet, TextInput, ViewStyle, SafeAreaView, KeyboardAvoidingView, Platform, KeyboardAvoidingViewProps } from "react-native";
import { IDistantFileWithId } from "../../../framework/util/fileHandler";

import Notifier from "../../../infra/notifier/container";
import { CommonStyles } from "../../../styles/common/styles";
import { Icon, Loading } from "../../../ui";
import ConnectionTrackingBar from "../../../ui/ConnectionTrackingBar";
import { PageContainer } from "../../../ui/ContainerContent";
import TouchableOpacity from "../../../ui/CustomTouchableOpacity";
import { HtmlContentView } from "../../../ui/HtmlContentView";
import { Text } from "../../../ui/Typography";
import { ISearchUsers } from "../service/newMail";
import Attachment from "./Attachment";
import SearchUserMail from "./SearchUserMail";
import HtmlToText from "../../../infra/htmlConverter/text";
import { hasNotch } from "react-native-device-info";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HeadersProps = { to: ISearchUsers; cc: ISearchUsers; cci: ISearchUsers; subject: string };

type IAttachment = {
  id?: string;
  filename: string;
  contentType: string;
  size?: number;
};

interface NewMailComponentProps {
  isFetching: boolean;
  headers: HeadersProps;
  onDraftSave: () => void;
  onHeaderChange: (header: Headers) => void;
  body: string;
  onBodyChange: (body: string) => void;
  attachments: IDistantFileWithId[];
  onAttachmentChange: (attachments: IAttachment[]) => void;
  onAttachmentDelete: (attachmentId: string) => void;
  prevBody: any;
  isReplyDraft: boolean;
}

const styles = StyleSheet.create({
  mailPart: {
    padding: 5,
    backgroundColor: "white",
  }
});

export default ({
  isFetching,
  headers,
  onDraftSave,
  onHeaderChange,
  body,
  onBodyChange,
  attachments,
  onAttachmentChange,
  onAttachmentDelete,
  prevBody,
  isReplyDraft
}: NewMailComponentProps) => {
  const keyboardAvoidingViewBehavior = Platform.select({ ios: 'padding', android: undefined }) as KeyboardAvoidingViewProps['behavior'];
  // const insets = useSafeAreaInsets();                            // Note : this commented code is the theory
  // const keyboardAvoidingViewVerticalOffset = insets.top + 56;    // But Practice >> Theory. Here, magic values ont the next ligne give better results.
  const keyboardAvoidingViewVerticalOffset = hasNotch() ? 100 : 76; // Those are "magic" values found by try&error. Seems to be fine on every phone.
  return (
    <PageContainer>
      <ConnectionTrackingBar />
      <Notifier id="conversation" />
      {isFetching ? (
        <Loading />
      ) : (
        <View style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior={keyboardAvoidingViewBehavior} keyboardVerticalOffset={keyboardAvoidingViewVerticalOffset} style={{ height: '100%' }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} alwaysBounceVertical={false} keyboardShouldPersistTaps="never">
              <SafeAreaView style={{ flexGrow: 1 }}>

                <Headers style={{ zIndex: 3 }} headers={headers} onChange={onHeaderChange} autofocus={!isReplyDraft} />
                <Attachments
                  style={{ zIndex: 2 }}
                  attachments={attachments}
                  onChange={onAttachmentChange}
                  onDelete={onAttachmentDelete}
                  onSave={onDraftSave}
                />
                <Body style={{ zIndex: 1 }} value={body} onChange={onBodyChange} autofocus={isReplyDraft} />
                {!!prevBody && <PrevBody prevBody={prevBody} />}

              </SafeAreaView>
            </ScrollView>
          </KeyboardAvoidingView>
        </View >
      )}
    </PageContainer >
  );
};

const HeaderUsers = ({
  style,
  title,
  onChange,
  value,
  children,
  autoFocus
}: React.PropsWithChildren<{ autoFocus?: boolean, style?: ViewStyle; title: string; onChange; forUsers?: boolean; value: any }>) => {
  const headerStyle = {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderBottomColor: "#EEEEEE",
    borderBottomWidth: 2,
  } as ViewStyle;

  return (
    <View style={[headerStyle, style]}>
      <Text style={{ color: CommonStyles.lightTextColor }}>{title} : </Text>
      <SearchUserMail selectedUsersOrGroups={value} onChange={val => onChange(val)} autoFocus={autoFocus} />
      {children}
    </View>
  );
};

const HeaderSubject = ({
  style,
  title,
  onChange,
  value,
}: React.PropsWithChildren<{ style?: ViewStyle; title: string; onChange; forUsers?: boolean; value: any }>) => {
  const headerStyle = {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderBottomColor: "#EEEEEE",
    borderBottomWidth: 2,
  } as ViewStyle;

  const inputStyle = {
    flex: 1,
    height: 40,
    color: CommonStyles.textColor,
  } as ViewStyle;

  const textUpdateTimeout = React.useRef();
  const [currentValue, updateCurrentValue] = React.useState(value);

  React.useEffect(() => {
    window.clearTimeout(textUpdateTimeout.current);
    textUpdateTimeout.current = window.setTimeout(() => onChange(currentValue), 500);

    return () => {
      window.clearTimeout(textUpdateTimeout.current);
    };
  }, [currentValue]);

  return (
    <View style={[headerStyle, style]}>
      <Text style={{ color: CommonStyles.lightTextColor }}>{title} : </Text>
      <TextInput
        style={inputStyle}
        defaultValue={value}
        numberOfLines={1}
        onChangeText={text => updateCurrentValue(text)}
      />
    </View>
  );
};

const Headers = ({ style, headers, onChange, autofocus }) => {
  const [showExtraFields, toggleExtraFields] = React.useState(false);
  const { to, cc, cci, subject } = headers;

  return (
    <View style={[styles.mailPart, style]}>
      <HeaderUsers
        autoFocus={autofocus}
        style={{ zIndex: 4 }}
        value={to}
        onChange={to => onChange({ ...headers, to })}
        title={I18n.t("conversation.to")}>
        <TouchableOpacity onPress={() => toggleExtraFields(!showExtraFields)}>
          <Icon name={showExtraFields ? "keyboard_arrow_up" : "keyboard_arrow_down"} size={28} />
        </TouchableOpacity>
      </HeaderUsers>
      {showExtraFields && (
        <>
          <HeaderUsers
            style={{ zIndex: 3 }}
            title={I18n.t("conversation.cc")}
            value={cc}
            onChange={cc => onChange({ ...headers, cc })}
          />
          <HeaderUsers
            style={{ zIndex: 2 }}
            title={I18n.t("conversation.bcc")}
            value={cci}
            onChange={cci => onChange({ ...headers, cci })}
          />
        </>
      )}
      <HeaderSubject
        title={I18n.t("conversation.subject")}
        value={subject}
        onChange={subject => onChange({ ...headers, subject })}
      />
    </View>
  );
};

const Attachments = ({ style, attachments, onChange, onDelete, onSave }: { style, attachments: IDistantFileWithId[], onChange, onDelete, onSave }) => {
  const removeAttachment = id => {
    const newAttachments = attachments.filter(item => item.id !== id);
    onDelete(id);
    onChange(newAttachments);
  };

  return attachments.length === 0 ? (
    <View />
  ) : (
    <View style={[styles.mailPart, style, { padding: 0 }]}>
      {attachments.map((att) => (
        <Attachment
          id={att.id || att.filename}
          uploadSuccess={!!att.id && onSave()}
          fileType={att.filetype}
          fileName={att.filename}
          onRemove={() => removeAttachment(att.id)}
        />
      ))}
    </View>
  );
};

const Body = ({ style, value, onChange, autofocus }) => {
  const textUpdateTimeout = React.useRef();
  // const removeWrapper = (text: string) => {
  //   return text.replace(/^<div class="ng-scope mobile-application-wrapper">(.*)/, '$1').replace(/(.*)<\/div>$/, '$1');
  // }
  const br2nl = (text: string) => {
    return text?.replace(/<br\/?>/gm, "\n")
      .replace(/<div>\s*?<\/div>/gm, "\n");
  }
  const nl2br = (text: string) => {
    return text?.replace(/\n/gm, "<br>");
  }
  // console.log("value", nl2br(value));
  const valueFormated = HtmlToText(nl2br(value), false).render;
  const [currentValue, updateCurrentValue] = React.useState(valueFormated);

  React.useEffect(() => {
    window.clearTimeout(textUpdateTimeout.current);
    textUpdateTimeout.current = window.setTimeout(() => onChange(currentValue), 500);

    return () => {
      window.clearTimeout(textUpdateTimeout.current);
    };
  }, [currentValue]);

  return (
    <View style={[styles.mailPart, style, { flexGrow: 1 }]}>
      <TextInput
        autoFocus={autofocus}
        placeholder={I18n.t("conversation.typeMessage")}
        textAlignVertical="top"
        multiline
        scrollEnabled={false}
        style={{ flexGrow: 1 }}
        defaultValue={value}
        value={br2nl(currentValue)}
        onChangeText={text => updateCurrentValue(nl2br(text))}
      />
    </View>
  );
};

const PrevBody = ({ prevBody }) => {
  return (
    <View style={[styles.mailPart, { flexGrow: 1 }]}>
      <HtmlContentView html={prevBody} />
    </View>
  );
};
