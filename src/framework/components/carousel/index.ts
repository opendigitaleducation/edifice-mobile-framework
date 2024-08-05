/**
 * Carousel
 *
 * The carousel was reimplemented in June 2024 to allow other media types to be displayed in addition to images.
 * This iteration is built with react-native-reanimated-carousel (https://github.com/dohooo/react-native-reanimated-carousel)
 *
 * USAGE :
 * Carousel is included as a fullscreen modal screen included in main navigation.
 * You don't have to instanciate it yourself, just call the provided `navigateCarousel()` function.
 */

export { navigateCarousel } from './navigation';

export { CarouselScreen } from './screen';

export type { CarouselScreenProps } from './types';
