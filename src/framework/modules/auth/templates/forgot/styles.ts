import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';
import { TextSizeStyle } from '~/framework/components/text';

export default StyleSheet.create({
  alertCard: {
    marginBottom: UI_SIZES.spacing.big,
    marginTop: UI_SIZES.spacing.tiny,
  },
  alertCardSuccess: {
    marginBottom: UI_SIZES.spacing.big,
  },
  buttonWrapper: {
    marginBottom: UI_SIZES.spacing.big,
    zIndex: -1,
  },
  dropDownArrow: {
    height: UI_SIZES.elements.icon.medium,
    marginLeft: UI_SIZES.spacing.small,
    width: UI_SIZES.elements.icon.medium,
  },
  dropDownArrowContainer: {
    alignItems: 'center',
    borderLeftColor: theme.palette.grey.cloudy,
    borderLeftWidth: 1,
    height: '110%',
    justifyContent: 'center',
  },
  dropDownContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dropDownInput: {
    ...TextSizeStyle.Medium,
    backgroundColor: theme.ui.background.card,
    borderColor: theme.palette.grey.cloudy,
    borderRadius: UI_SIZES.radius.input,
    borderWidth: 1,
    color: theme.ui.text.regular,
    paddingHorizontal: UI_SIZES.spacing.medium,
  },
  dropDownItems: {
    borderColor: theme.palette.grey.cloudy,
    borderLeftWidth: 1,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: UI_SIZES.spacing.small,
    paddingVertical: UI_SIZES.spacing.small,
  },
  dropDownLabel: { justifyContent: 'center' },
  dropDownPlaceholder: { color: theme.ui.text.light },
  dropDownText: { color: theme.ui.text.light },
  errorMsg: {
    alignSelf: 'center',
    color: theme.palette.status.failure.regular,
    flexGrow: 0,
    marginVertical: UI_SIZES.spacing.minor,
    padding: UI_SIZES.spacing.tiny,
    textAlign: 'center',
  },
  infos: {
    alignItems: 'center',
  },
  inputContainer: {
    marginTop: UI_SIZES.spacing.big,
  },
  instructions: {
    marginTop: UI_SIZES.spacing.large + UI_SIZES.spacing.tiny,
    textAlign: 'center',
  },
  page: {
    backgroundColor: theme.palette.grey.white,
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: -UI_SIZES.elements.tabbarHeight,
    paddingHorizontal: UI_SIZES.spacing.big,
  },
  platform: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: UI_SIZES.spacing.large + UI_SIZES.spacing.tiny,
    width: '100%',
  },
  platformLogo: {
    height: UI_SIZES.elements.logoSize.height,
  },
  platformName: {
    marginTop: UI_SIZES.spacing.medium,
  },
});
