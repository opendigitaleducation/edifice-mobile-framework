import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
    paddingVertical: UI_SIZES.spacing.minor,
  },
  reactions: {
    borderColor: theme.palette.grey.cloudy,
    borderWidth: UI_SIZES.border.thin,
    borderRadius: UI_SIZES.radius.medium,
    padding: UI_SIZES.spacing.minor,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    columnGap: UI_SIZES.spacing.minor,
    position: 'absolute',
    top: 0,
    backgroundColor: theme.palette.grey.white,
    pointerEvents: 'none',
  },
  stats: {
    flexDirection: 'row',
    columnGap: UI_SIZES.spacing.small,
    alignItems: 'center',
    marginBottom: UI_SIZES.spacing.small,
  },
  statsItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsItemText: {
    color: theme.palette.grey.graphite,
    marginRight: UI_SIZES.spacing.minor,
  },
  statsReactions: {
    flexDirection: 'row',
    columnGap: -UI_SIZES.spacing.minor,
  },
});

export default styles;
