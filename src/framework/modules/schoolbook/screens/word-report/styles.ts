import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';

export default StyleSheet.create({
  acknowledgedBy: { color: theme.palette.grey.graphite },
  acknowledgedStudentContainer: {
    borderBottomColor: theme.palette.grey.cloudy,
    paddingHorizontal: UI_SIZES.spacing.medium,
    paddingVertical: UI_SIZES.spacing.small,
  },
  acknowledgedStudentInfos: { flex: 1, marginLeft: UI_SIZES.spacing.minor },
  acknowledgedStudentSubContainer: { flexDirection: 'row' },
  acknowledgedStudentsContentContainer: { backgroundColor: theme.ui.background.card, borderRadius: UI_SIZES.radius.medium },
  acknowledgementsText: { marginTop: UI_SIZES.spacing.minor },
  acknowledgementsTitle: { marginTop: UI_SIZES.spacing.tiny },
  borderBottomWidthOne: { borderBottomWidth: 1 },
  borderBottomWidthZero: { borderBottomWidth: 0 },
  list: {
    backgroundColor: theme.ui.background.page,
    borderRadius: UI_SIZES.radius.medium,
    elevation: 4,
    marginTop: UI_SIZES.spacing.small,
    overflow: 'visible',
    shadowColor: theme.ui.shadowColor,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  marginBottomTiny: { marginBottom: UI_SIZES.spacing.tiny },
  marginBottomZero: { marginBottom: 0 },
  modalBoxButtons: { alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-end', marginTop: UI_SIZES.spacing.large },
  modalBoxCancel: { color: theme.palette.grey.graphite, marginRight: UI_SIZES.spacing.big },
  modalBoxText: { marginTop: UI_SIZES.spacing.small },
  responseContainer: {
    backgroundColor: theme.palette.grey.fog,
    borderColor: theme.palette.grey.cloudy,
    borderRadius: UI_SIZES.radius.medium,
    borderWidth: 1,
    marginVertical: UI_SIZES.spacing.tiny,
    padding: UI_SIZES.spacing.minor,
  },
  responseDate: { color: theme.palette.grey.graphite, marginLeft: UI_SIZES.spacing.minor },
  responseInfos: { flexDirection: 'row' },
  responseInfosContainer: { flex: 1, marginLeft: UI_SIZES.spacing.minor },
  responseParentName: { flexShrink: 1 },
  responseSubContainer: { flexDirection: 'row' },
  unacknowledgementsHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  unacknowledgementsText: { marginTop: UI_SIZES.spacing.minor },
  userListContainer: { backgroundColor: theme.ui.background.card, borderRadius: UI_SIZES.radius.medium },
  userListItem: { marginBottom: undefined, paddingHorizontal: UI_SIZES.spacing.medium, paddingVertical: UI_SIZES.spacing.small },
});
