import { StyleSheet } from 'react-native';

import theme from '~/app/theme';
import { UI_SIZES } from '~/framework/components/constants';

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
    paddingVertical: UI_SIZES.spacing.minor,
  },
  //PLACEHOLDER
  h24: {
    height: 24,
  },

  h30: {
    height: 30,
  },

  mb0: {
    marginBottom: 0,
  },

  placeholderRow: {
    columnGap: UI_SIZES.spacing.small,
    flexDirection: 'row',
  },

  reactions: {
    alignSelf: 'flex-start',
    backgroundColor: theme.palette.grey.white,
    borderColor: theme.palette.grey.cloudy,
    borderRadius: UI_SIZES.radius.medium,
    borderWidth: UI_SIZES.border.thin,
    columnGap: UI_SIZES.spacing.minor,
    flexDirection: 'row',
    padding: UI_SIZES.spacing.minor,
    position: 'absolute',
    top: 0,
  },

  stats: {
    alignItems: 'center',
    columnGap: UI_SIZES.spacing.small,
    flexDirection: 'row',
    marginBottom: UI_SIZES.spacing.minor,
  },
  statsItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statsItemText: {
    color: theme.palette.grey.graphite,
    marginRight: UI_SIZES.spacing.minor,
  },
  statsReactions: {
    marginRight: UI_SIZES.spacing.minor,
    flexDirection: 'row',
  },
  statsReactionsItem: {
    marginRight: -UI_SIZES.spacing.minor,
  },
});

export default styles;
