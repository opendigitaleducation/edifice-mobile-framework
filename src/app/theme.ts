/**
 * Theme declaration and overloading system
 */
import deepmerge from 'deepmerge';
import { Appearance, ColorValue, useColorScheme } from 'react-native';
import { connect } from 'react-redux';

import { ThunkDispatch } from 'redux-thunk';
import customTheme from '~/app/override/theme';
import { IGlobalState, getStore } from '~/app/store';
import { actionTypes } from '~/framework/modules/user/reducer';
import { getItemJson, setItemJson } from '~/framework/util/storage';

//  8888888          888                      .d888
//    888            888                     d88P"
//    888            888                     888
//    888   88888b.  888888  .d88b.  888d888 888888  8888b.   .d8888b  .d88b.
//    888   888 "88b 888    d8P  Y8b 888P"   888        "88b d88P"    d8P  Y8b
//    888   888  888 888    88888888 888     888    .d888888 888      88888888
//    888   888  888 Y88b.  Y8b.     888     888    888  888 Y88b.    Y8b.
//  8888888 888  888  "Y888  "Y8888  888     888    "Y888888  "Y8888P  "Y8888

export interface IShades {
  evil: ColorValue;
  dark: ColorValue;
  regular: ColorValue;
  light: ColorValue;
  pale: ColorValue;
}

export interface ITheme {
  // Color palette used globally
  light: {
    palette: {
      primary: IShades;
      secondary: IShades;
      complementary: {
        red: IShades;
        orange: IShades;
        yellow: IShades;
        green: IShades;
        blue: IShades;
        indigo: IShades;
        purple: IShades;
        pink: IShades;
      };
      grey: {
        darkness: ColorValue;
        black: ColorValue;
        graphite: ColorValue;
        stone: ColorValue;
        grey: ColorValue;
        cloudy: ColorValue;
        pearl: ColorValue;
        fog: ColorValue;
        white: ColorValue;
      };
      status: {
        info: IShades;
        success: IShades;
        failure: IShades;
        warning: IShades;
      };
      flashMessages: {
        'grey-dark': ColorValue;
        red: ColorValue;
        orange: ColorValue;
        green: ColorValue;
        blue: ColorValue;
      };
    };
  };

  dark: {
    palette: {
      primary: IShades;
      secondary: IShades;
      complementary: {
        red: IShades;
        orange: IShades;
        yellow: IShades;
        green: IShades;
        blue: IShades;
        indigo: IShades;
        purple: IShades;
        pink: IShades;
      };
      grey: {
        darkness: ColorValue;
        black: ColorValue;
        graphite: ColorValue;
        stone: ColorValue;
        grey: ColorValue;
        cloudy: ColorValue;
        pearl: ColorValue;
        fog: ColorValue;
        white: ColorValue;
      };
      status: {
        info: IShades;
        success: IShades;
        failure: IShades;
        warning: IShades;
      };
      flashMessages: {
        'grey-dark': ColorValue;
        red: ColorValue;
        orange: ColorValue;
        green: ColorValue;
        blue: ColorValue;
      };
    };
  };

  // UI usage of the color palette
  ui: {
    notificationBadge: ColorValue;
    shadowColor: ColorValue;
    shadowColorTransparent: ColorValue;
    background: {
      card: ColorValue;
      empty: ColorValue;
      page: ColorValue;
    };
    border: {
      listItem: ColorValue;
      input: ColorValue;
    };
    text: {
      regular: ColorValue;
      light: ColorValue;
      inverse: ColorValue;
    };
  };

  // Semantic usage of the color palette
  color: {
    homework: {
      days: {
        monday: { accent: ColorValue; light: ColorValue; background: ColorValue };
        tuesday: { accent: ColorValue; light: ColorValue; background: ColorValue };
        wednesday: { accent: ColorValue; light: ColorValue; background: ColorValue };
        thursday: { accent: ColorValue; light: ColorValue; background: ColorValue };
        friday: { accent: ColorValue; light: ColorValue; background: ColorValue };
        saturday: { accent: ColorValue; light: ColorValue; background: ColorValue };
      };
    };
    schoolbook: {
      acknowledge: ColorValue;
      acknowledged: ColorValue;
      categories: {
        canteen: ColorValue;
        event: ColorValue;
        'last-minute': ColorValue;
        leisure: ColorValue;
        outing: ColorValue;
        various: ColorValue;
      };
    };
    profileTypes: {
      Student: ColorValue;
      Relative: ColorValue;
      Personnel: ColorValue;
      Teacher: ColorValue;
      Guest: ColorValue;
    };
  };
}

type ThemeInitializer = Pick<ITheme, 'light' | 'dark'> & {
  init(): ITheme;
};

export const defaultTheme: ThemeInitializer = {
  //  888     888          888
  //  888     888          888
  //  888     888          888
  //  Y88b   d88P  8888b.  888 888  888  .d88b.  .d8888b
  //   Y88b d88P      "88b 888 888  888 d8P  Y8b 88K
  //    Y88o88P   .d888888 888 888  888 88888888 "Y8888b.
  //     Y888P    888  888 888 Y88b 888 Y8b.          X88
  //      Y8P     "Y888888 888  "Y88888  "Y8888   88888P'

  // Magenta color indicated non-defined values

  light: {
    palette: {
      primary: {
        evil: 'magenta',
        dark: '#1B84AC',
        regular: '#2A9CC8',
        light: '#AADAED',
        pale: '#E4F4FF',
      },
      secondary: {
        evil: 'magenta',
        dark: '#F17A17',
        regular: '#FF8D2E',
        light: '#FFC696',
        pale: '#FFEFE3',
      },
      complementary: {
        red: {
          evil: 'magenta',
          dark: '#C82222',
          regular: '#E13A3A',
          light: '#F48A8A',
          pale: '#FFD9D9',
        },
        orange: {
          evil: 'magenta',
          dark: '#F17A17',
          regular: '#FF8D2E',
          light: '#FFC696',
          pale: '#FFEFE3',
        },
        yellow: {
          evil: 'magenta',
          dark: '#DAA910',
          regular: '#ECBE30',
          light: '#F6DE94',
          pale: '#FFF4D1',
        },
        green: {
          evil: 'magenta',
          dark: '#33A797',
          regular: '#46BFAF',
          light: '#A2E0D8',
          pale: '#E7F5F4',
        },
        blue: {
          evil: 'magenta',
          dark: '#1B84AC',
          regular: '#2A9CC8',
          light: '#AADAED',
          pale: '#E4F4FF',
        },
        indigo: {
          evil: 'magenta',
          dark: '#121982',
          regular: '#1A22A2',
          light: '#9297E5',
          pale: '#DDE8FD',
        },
        purple: {
          evil: 'magenta',
          dark: '#5D1D79',
          regular: '#763294',
          light: '#B68ACA',
          pale: '#F4EAF9',
        },
        pink: {
          evil: 'magenta',
          dark: '#9C2288',
          regular: '#B930A2',
          light: '#E39CD7',
          pale: '#FFE5FB',
        },
      },
      grey: {
        darkness: '#000000',
        black: '#4a4a4a',
        graphite: '#909090',
        stone: '#B0B0B0',
        grey: '#C7C7C7',
        cloudy: '#e4e4e4',
        pearl: '#f2f2f2',
        fog: '#fafafa',
        white: '#ffffff',
      },
      status: {
        info: { evil: 'magenta', dark: '#3499BF', regular: '#4bafd5', light: '#ACD6E6', pale: '#D7E8EE' },
        success: { evil: 'magenta', dark: '#70A977', regular: '#7dbf85', light: '#BBE1BF', pale: '#DAF1DD' },
        failure: { evil: 'magenta', dark: '#D12A2A', regular: '#e13a3a', light: '#F3A6A6', pale: '#FFE9E9' },
        warning: { evil: 'magenta', dark: '#E58D00', regular: '#f59700', light: '#F2C987', pale: '#FDECD2' },
      },
      flashMessages: {
        'grey-dark': '#5b6472',
        red: '#c74848',
        orange: '#ff9057',
        green: '#3cb371',
        blue: '#2a9cc8',
      },
    },
  },

  dark: {
    palette: {
      primary: {
        evil: 'magenta',
        dark: '#1B84AC',
        regular: '#2A9CC8',
        light: '#AADAED',
        pale: '#E4F4FF',
      },
      secondary: {
        evil: 'magenta',
        dark: '#F17A17',
        regular: '#FF8D2E',
        light: '#FFC696',
        pale: '#FFEFE3',
      },
      complementary: {
        red: {
          evil: 'magenta',
          dark: '#C82222',
          regular: '#E13A3A',
          light: '#F48A8A',
          pale: '#FFD9D9',
        },
        orange: {
          evil: 'magenta',
          dark: '#F17A17',
          regular: '#FF8D2E',
          light: '#FFC696',
          pale: '#FFEFE3',
        },
        yellow: {
          evil: 'magenta',
          dark: '#DAA910',
          regular: '#ECBE30',
          light: '#F6DE94',
          pale: '#FFF4D1',
        },
        green: {
          evil: 'magenta',
          dark: '#33A797',
          regular: '#46BFAF',
          light: '#A2E0D8',
          pale: '#E7F5F4',
        },
        blue: {
          evil: 'magenta',
          dark: '#1B84AC',
          regular: '#2A9CC8',
          light: '#AADAED',
          pale: '#E4F4FF',
        },
        indigo: {
          evil: 'magenta',
          dark: '#121982',
          regular: '#1A22A2',
          light: '#9297E5',
          pale: '#DDE8FD',
        },
        purple: {
          evil: 'magenta',
          dark: '#5D1D79',
          regular: '#763294',
          light: '#B68ACA',
          pale: '#F4EAF9',
        },
        pink: {
          evil: 'magenta',
          dark: '#9C2288',
          regular: '#B930A2',
          light: '#E39CD7',
          pale: '#FFE5FB',
        },
      },
      grey: {
        darkness: '#000000',
        black: '#4a4a4a',
        graphite: '#909090',
        stone: '#B0B0B0',
        grey: '#C7C7C7',
        cloudy: '#e4e4e4',
        pearl: '#f2f2f2',
        fog: '#fafafa',
        white: '#ffffff',
      },
      status: {
        info: { evil: 'magenta', dark: '#3499BF', regular: '#4bafd5', light: '#ACD6E6', pale: '#D7E8EE' },
        success: { evil: 'magenta', dark: '#70A977', regular: '#7dbf85', light: '#BBE1BF', pale: '#DAF1DD' },
        failure: { evil: 'magenta', dark: '#D12A2A', regular: '#e13a3a', light: '#F3A6A6', pale: '#FFE9E9' },
        warning: { evil: 'magenta', dark: '#E58D00', regular: '#f59700', light: '#F2C987', pale: '#FDECD2' },
      },
      flashMessages: {
        'grey-dark': '#5b6472',
        red: '#c74848',
        orange: '#ff9057',
        green: '#3cb371',
        blue: '#2a9cc8',
      },
    },
  },

  //  888     888
  //  888     888
  //  888     888
  //  888     888 .d8888b   8888b.   .d88b.   .d88b.  .d8888b
  //  888     888 88K          "88b d88P"88b d8P  Y8b 88K
  //  888     888 "Y8888b. .d888888 888  888 88888888 "Y8888b.
  //  Y88b. .d88P      X88 888  888 Y88b 888 Y8b.          X88
  //   "Y88888P"   88888P' "Y888888  "Y88888  "Y8888   88888P'
  //                                     888
  //                                Y8b d88P
  //                                 "Y88P"

  init() {
    (this as Partial<ITheme>).ui = {
      notificationBadge: this.palette.complementary.red.regular,
      shadowColor: '#000',
      shadowColorTransparent: '#000000af',
      background: {
        card: this.palette.grey.white,
        empty: this.palette.grey.fog,
        page: this.palette.grey.fog,
      },
      border: {
        input: this.palette.grey.cloudy,
        listItem: this.palette.grey.cloudy,
      },
      text: {
        regular: this.palette.grey.black,
        light: this.palette.grey.graphite,
        inverse: this.palette.grey.white,
      },
    };

    (this as Partial<ITheme>).color = {
      homework: {
        days: {
          monday: {
            accent: this.palette.complementary.green.regular,
            light: this.palette.complementary.green.light,
            background: this.palette.complementary.green.pale,
          },
          tuesday: {
            accent: this.palette.complementary.purple.regular,
            light: this.palette.complementary.purple.light,
            background: this.palette.complementary.purple.pale,
          },
          wednesday: {
            accent: this.palette.complementary.blue.regular,
            light: this.palette.complementary.blue.light,
            background: this.palette.complementary.blue.pale,
          },
          thursday: {
            accent: this.palette.complementary.red.regular,
            light: this.palette.complementary.red.light,
            background: this.palette.complementary.red.pale,
          },
          friday: {
            accent: this.palette.complementary.orange.regular,
            light: this.palette.complementary.orange.light,
            background: this.palette.complementary.orange.pale,
          },
          saturday: {
            accent: this.palette.complementary.yellow.regular,
            light: this.palette.complementary.yellow.light,
            background: this.palette.complementary.yellow.pale,
          },
        },
      },
      schoolbook: {
        acknowledge: this.palette.status.warning.regular,
        acknowledged: this.palette.status.success.regular,
        categories: {
          canteen: this.palette.complementary.blue.regular,
          event: this.palette.complementary.purple.regular,
          'last-minute': this.palette.complementary.red.regular,
          leisure: this.palette.complementary.yellow.regular,
          outing: this.palette.complementary.green.regular,
          various: this.palette.complementary.indigo.regular,
        },
      },
      profileTypes: {
        Student: this.palette.complementary.orange.regular,
        Relative: this.palette.complementary.blue.regular,
        Personnel: this.palette.complementary.purple.regular,
        Teacher: this.palette.complementary.green.regular,
        Guest: this.palette.complementary.pink.regular,
      },
    };

    return this as unknown as ITheme;
  },
};

//  88888888888 888
//      888     888
//      888     888
//      888     88888b.   .d88b.  88888b.d88b.   .d88b.
//      888     888 "88b d8P  Y8b 888 "888 "88b d8P  Y8b
//      888     888  888 88888888 888  888  888 88888888
//      888     888  888 Y8b.     888  888  888 Y8b.
//      888     888  888  "Y8888  888  888  888  "Y8888
//
//
//

export enum Mode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

const MODE_STORAGE_KEY = 'mode';
export const isOverrideMultiThemed = 'light' in customTheme && 'dark' in customTheme;

let displayedTheme = {};
export default displayedTheme;

export namespace Theme {
  export const withAppearanceMode = Component => {
    return connect((state: any) => ({
      mode: state.user.mode,
    }))(Component);
  };

  const getOverridenTheme = (mode: Mode) => {
    const { light, dark, ...defaultThemeRest } = defaultTheme;
    const { init, ...customThemeRest } = customTheme as Partial<ThemeInitializer>;
    const overridenTheme: ITheme = isOverrideMultiThemed
      ? {
          ...defaultThemeRest,
          palette: deepmerge(defaultTheme[mode].palette, defaultTheme[mode].palette || {}),
        }.init()
      : {
          ...defaultThemeRest,
          palette: deepmerge(defaultTheme[mode].palette, customThemeRest.palette || {}),
        }.init();
    if (init) init.call(overridenTheme);
    return overridenTheme;
  };

  export const setMode = (mode?: Mode) => async (dispatch: ThunkDispatch<any, any, any>) => {
    const selectedMode = (mode === Mode.SYSTEM ? useColorScheme() : mode) || Mode.LIGHT;
    try {
      if (mode) await setItemJson(MODE_STORAGE_KEY, mode);
      displayedTheme = getOverridenTheme(selectedMode);
      Appearance.setColorScheme(selectedMode);
      dispatch({ type: actionTypes.setMode, value: mode });
    } catch {
      // In case of error, we keep the "light" mode
      displayedTheme = getOverridenTheme(Mode.LIGHT);
      Appearance.setColorScheme(Mode.LIGHT);
      dispatch({ type: actionTypes.setMode, value: Mode.LIGHT });
    }
  };

  export const getMode = (state: IGlobalState) => state.user.mode;

  export const init = async () => {
    let modeSetting;
    try {
      modeSetting = (await getItemJson(MODE_STORAGE_KEY)) as Mode | undefined;
    } catch {
      // We leave the catch to avoid a crash in case of error
    } finally {
      setMode(modeSetting);
      if (isOverrideMultiThemed) {
        Appearance.addChangeListener(() => {
          const selectedMode = getStore().getState().mode;
          if (selectedMode === Mode.SYSTEM) setMode(Mode.SYSTEM);
        });
      }
    }
  };
}
