import React, { useCallback } from 'react';
import { View } from 'react-native';

import { Fade, Placeholder } from 'rn-placeholder';

import styles from './styles';
import { ImageFallbackType, ImageLoadingState, ModuleImageProps } from './types';

import theme from '~/app/theme';
import { Picture, PictureProps } from '~/framework/components/picture';
import { Image } from '~/framework/util/media';

const ImageFallbackWithModuleConfig: React.FC<ImageFallbackType> = ({ moduleConfig }) => {
  const { displayColor, displayPicture } = moduleConfig;
  const imageType = displayPicture?.type;
  const imageName = displayPicture?.name;

  const renderPicture = useCallback(() => {
    switch (imageType) {
      case 'Svg':
        return <Picture type="Svg" name={imageName} fill={displayColor?.regular} />;
      case 'Icon':
        return <Picture type="Icon" name={imageName} color={displayColor?.regular} />;
      case 'Image':
        return <Picture type="Image" src={''} resizeMode="contain" />;
      default:
        return null;
    }
  }, [imageType, imageName, displayColor]);

  return <View style={[styles.moduleImage, { backgroundColor: displayColor?.pale }]}>{renderPicture()}</View>;
};

/** @vmou
 * La grosse difficulté du composant ci-dessus va être d'appliquer le bon style selon le type de Picture.
 * Ça va vraiment pas être une mince affaire, et dans un premier temps je te conseille de te focus sur le cas Svg qui est celui qui va nous servir.
 */

const ImageFallbackWithoutModuleConfig: React.FC<Partial<PictureProps>> = () => {
  return (
    <View style={[styles.moduleImage, { backgroundColor: theme.palette.grey.pearl }]}>
      <Picture type="Svg" name="image-not-found" fill={theme.palette.grey.white} />
    </View>
  );
};

/** @vmou
 * Ici tu n'as pas besoin d'avoit deux composants pour le FallbackImage. Un seul suffit,
 * tu peux juste prévoir une valeur par défaut à moduleConfig dans le cas où il n'est pas disponible (ce qui n'arrivera jamais normalement à part en développement)
 */

const ImageLoader: React.FC = () => (
  <View style={[styles.moduleImage, styles.imageLoader]}>
    <Placeholder Animation={Fade} />
  </View>
);

const ModuleImage: React.FC<ModuleImageProps> = ({ moduleConfig, source, ...props }) => {
  const [imageLoadingState, setImageLoadingState] = React.useState<ImageLoadingState>(ImageLoadingState.LOADING);
  const onImageLoadStart = () => setImageLoadingState(ImageLoadingState.LOADING);
  const onImageLoadSuccess = () => setImageLoadingState(ImageLoadingState.SUCCESS);
  const onImageLoadError = () => setImageLoadingState(ImageLoadingState.ERROR);

  const renderFallbackImage = useCallback(() => {
    if (imageLoadingState !== ImageLoadingState.ERROR) return null;
    else return moduleConfig ? <ImageFallbackWithModuleConfig moduleConfig={moduleConfig} /> : <ImageFallbackWithoutModuleConfig />;
  }, [imageLoadingState, moduleConfig]);

  return (
    <View style={styles.moduleImageContainer}>
      {imageLoadingState === ImageLoadingState.LOADING && <ImageLoader />}
      {renderFallbackImage()}
      <Image source={source} {...props} onLoad={onImageLoadSuccess} onLoadStart={onImageLoadStart} onError={onImageLoadError} />
    </View>
  );
};

/** @vmou
 * <ModuleImage/> est en effet un composant qui va contenir une condition en fonction de son état afin d'affichier un sous-composant ou un autre.
 * Il y a 3 cas possibles :
 * - chargement
 * - image affichée
 * - image non fournie ou échec de chargement
 *
 * Tu peux utiliser un simple if/else-if/else pour gérer ces trois cas selon le state. A priori, pas besoin d'avoir plus que ça (donc pas de renderFunction par exmeple).
 * Attention toutefois )à cette logique car il y a quelque chose qui cloche :
 * -> C'est le onLoad du composant <Image> qui va permettre de détecter que le chargement a réussi, donc <ImageLoader/> ne te donnera aucun information.
 * -> Sinon tu seras d'abord obligée de fetch l'image, la stocker, puis la placer dans un composant <Image/> ce qui est contre-productif.
 * -> Il y a la prop `loadingIndicatorSource` pour afficher quelque chose pendant le chargement.
 * -> Mais tu peux aussi afficher les deux éléments (<Image> et Placeholder) l'un par-dessus l'autre pendant le chargement pour contourner les limites de `loadingIndicatorSource`.
 */

export default ModuleImage;
