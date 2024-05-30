import * as React from 'react';

import CarouselScreen from '~/framework/components/carousel';
import { computeNavBar as CarouselNavBar } from '~/framework/components/carousel/screen';
import MediaPlayer from '~/framework/components/media/player';
import { computeNavBar as PDFNavBar, PDFReader } from '~/framework/components/pdf/pdf-reader';
import AudienceReactionsScreen, {
  computeNavBar as audienceReactionsNavBar,
} from '~/framework/modules/core/audience/screens/reactions';
import AudienceViewsScreen, { computeNavBar as audienceViewsNavBar } from '~/framework/modules/core/audience/screens/views';
import { setModalModeForRoutes } from '~/framework/navigation/hideTabBarAndroid';
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
    </RootStack.Group>
  </>
);

setModalModeForRoutes([
  ModalsRouteNames.Pdf,
  ModalsRouteNames.Carousel,
  ModalsRouteNames.MediaPlayer,
  ModalsRouteNames.RichTextEditor,
]);
