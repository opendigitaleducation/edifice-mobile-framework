import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { RecipientField } from './RecipientField';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { Svg } from '~/framework/components/picture';
import { SmallText } from '~/framework/components/text';
import { IDraft } from '~/framework/modules/zimbra/model';

const styles = StyleSheet.create({
  expandActionContainer: {
    marginLeft: UI_SIZES.spacing.minor,
    padding: UI_SIZES.spacing.minor,
  },
  headerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: UI_SIZES.spacing.small,
  },
  subjectInput: {
    borderBottomColor: theme.palette.grey.pearl,
    borderBottomWidth: 2,
    color: theme.ui.text.regular,
    flex: 1,
    height: 40,
    marginLeft: UI_SIZES.spacing.minor,
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
        <SmallText>{I18n.get('zimbra-composer-headers-to')}</SmallText>
        <RecipientField
          hasZimbraSendExternalRight={hasZimbraSendExternalRight}
          selectedRecipients={headers.to}
          onChange={to => onChange({ ...headers, to })}
        />
        <TouchableOpacity onPress={expand} style={styles.expandActionContainer}>
          <Svg name={isExpanded ? 'ui-rafterUp' : 'ui-rafterDown'} width={20} height={20} fill={theme.ui.text.regular} />
        </TouchableOpacity>
      </View>
      {isExpanded ? (
        <>
          <View style={styles.headerContainer}>
            <SmallText>{I18n.get('zimbra-composer-headers-cc')}</SmallText>
            <RecipientField
              hasZimbraSendExternalRight={hasZimbraSendExternalRight}
              selectedRecipients={headers.cc}
              onChange={cc => onChange({ ...headers, cc })}
            />
          </View>
          <View style={styles.headerContainer}>
            <SmallText>{I18n.get('zimbra-composer-headers-bcc')}</SmallText>
            <RecipientField
              hasZimbraSendExternalRight={hasZimbraSendExternalRight}
              selectedRecipients={headers.bcc}
              onChange={bcc => onChange({ ...headers, bcc })}
            />
          </View>
        </>
      ) : null}
      <View style={styles.headerContainer}>
        <SmallText>{I18n.get('zimbra-composer-headers-subject')}</SmallText>
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
