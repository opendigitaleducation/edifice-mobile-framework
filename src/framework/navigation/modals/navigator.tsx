import * as React from 'react';

import CarouselScreen from '~/framework/components/carousel';
import { computeNavBar as CarouselNavBar } from '~/framework/components/carousel/screen';
import FileImportScreen, { computeNavBar as FileAddNavBar } from '~/framework/components/inputs/rich-text/file-import';
import MediaPlayer from '~/framework/components/media/player';
import { computeNavBar as PDFNavBar, PDFReader } from '~/framework/components/pdf/pdf-reader';
import AudienceReactionsScreen, { computeNavBar as audienceReactionsNavBar } from '~/framework/modules/audience/screens/reactions';
import AudienceViewsScreen, { computeNavBar as audienceViewsNavBar } from '~/framework/modules/audience/screens/views';
import SplashadsScreen, { computeNavBar as SplashadsNavBar } from '~/framework/modules/splashads/screen';
import { setCrossIconBlackForRoutes, setModalModeForRoutes } from '~/framework/navigation/hideTabBarAndroid';
import { getTypedRootStack } from '~/framework/navigation/navigators';

import { IModalsNavigationParams, ModalsRouteNames } from '.';

const RootStack = getTypedRootStack<IModalsNavigationParams>();
export default (
  <>
    <RootStack.Group
      screenOptions={{
        presentation: 'modal',
      }}>
      <RootStack.Screen name={ModalsRouteNames.Pdf} options={PDFNavBar} component={PDFReader} initialParams={{ title: '' }} />
      <RootStack.Screen
        name={ModalsRouteNames.AudienceReactions}
        options={audienceReactionsNavBar}
        component={AudienceReactionsScreen}
      />
      <RootStack.Screen name={ModalsRouteNames.AudienceViews} options={audienceViewsNavBar} component={AudienceViewsScreen} />
    </RootStack.Group>
    <RootStack.Group
      screenOptions={{
        presentation: 'fullScreenModal',
      }}>
      <RootStack.Screen name={ModalsRouteNames.Carousel} options={CarouselNavBar} component={CarouselScreen} />
      <RootStack.Screen name={ModalsRouteNames.MediaPlayer} options={{ headerShown: false }} component={MediaPlayer} />
      <RootStack.Screen
        name={ModalsRouteNames.FileImport}
        options={FileAddNavBar}
        component={FileImportScreen}
        initialParams={{}}
      />
      <RootStack.Screen
        name={ModalsRouteNames.SplashAds}
        options={SplashadsNavBar}
        component={SplashadsScreen}
        initialParams={{}}
      />
    </RootStack.Group>
  </>
);

setModalModeForRoutes([
  ModalsRouteNames.Pdf,
  ModalsRouteNames.Carousel,
  ModalsRouteNames.MediaPlayer,
  ModalsRouteNames.RichTextEditor,
  ModalsRouteNames.FileImport,
  ModalsRouteNames.AudienceReactions,
  ModalsRouteNames.AudienceViews,
  ModalsRouteNames.SplashAds,
]);

setCrossIconBlackForRoutes([ModalsRouteNames.FileImport, ModalsRouteNames.SplashAds]);
