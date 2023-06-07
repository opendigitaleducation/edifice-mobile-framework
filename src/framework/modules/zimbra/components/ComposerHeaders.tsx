import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Picture } from '~/framework/components/picture';
import { SmallText } from '~/framework/components/text';
import { IDraft } from '~/framework/modules/zimbra/model';

import { RecipientField } from './RecipientField';

const styles = StyleSheet.create({
  expandActionContainer: {
    padding: UI_SIZES.spacing.minor,
    marginLeft: UI_SIZES.spacing.minor,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI_SIZES.spacing.small,
  },
  subjectInput: {
    flex: 1,
    height: 40,
    marginLeft: UI_SIZES.spacing.minor,
    color: theme.ui.text.regular,
    borderBottomColor: theme.palette.grey.pearl,
    borderBottomWidth: 2,
  },
});

type IDraftHeaders = Pick<IDraft, 'to' | 'cc' | 'bcc' | 'subject'>;

interface ComposerHeadersProps {
  hasZimbraSendExternalRight: boolean;
  headers: IDraftHeaders;
  onChange: (headers: IDraftHeaders) => void;
  onSave: () => void;
}

export const ComposerHeaders = ({ hasZimbraSendExternalRight, headers, onChange, onSave }: ComposerHeadersProps) => {
  const [isExpanded, setExpanded] = React.useState<boolean>(false);

  const expand = () => setExpanded(!isExpanded);

  return (
    <>
      <View style={styles.headerContainer}>
        <SmallText>{I18n.get('zimbra-composerscreen-headers-to')}</SmallText>
        <RecipientField
          hasZimbraSendExternalRight={hasZimbraSendExternalRight}
          selectedRecipients={headers.to}
          onChange={to => onChange({ ...headers, to })}
        />
        <TouchableOpacity onPress={expand} style={styles.expandActionContainer}>
          <Picture
            type="NamedSvg"
            name={isExpanded ? 'ui-rafterUp' : 'ui-rafterDown'}
            width={20}
            height={20}
            fill={theme.ui.text.regular}
          />
        </TouchableOpacity>
      </View>
      {isExpanded ? (
        <>
          <View style={styles.headerContainer}>
            <SmallText>{I18n.get('zimbra-composerscreen-headers-cc')}</SmallText>
            <RecipientField
              hasZimbraSendExternalRight={hasZimbraSendExternalRight}
              selectedRecipients={headers.cc}
              onChange={cc => onChange({ ...headers, cc })}
            />
          </View>
          <View style={styles.headerContainer}>
            <SmallText>{I18n.get('zimbra-composerscreen-headers-bcc')}</SmallText>
            <RecipientField
              hasZimbraSendExternalRight={hasZimbraSendExternalRight}
              selectedRecipients={headers.bcc}
              onChange={bcc => onChange({ ...headers, bcc })}
            />
          </View>
        </>
      ) : null}
      <View style={styles.headerContainer}>
        <SmallText>{I18n.get('zimbra-composerscreen-headers-subject')}</SmallText>
        <TextInput
          defaultValue={headers.subject}
          onChangeText={text => onChange({ ...headers, subject: text })}
          onEndEditing={onSave}
          style={styles.subjectInput}
        />
      </View>
    </>
  );
};
