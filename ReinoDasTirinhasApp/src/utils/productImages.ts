import { ImageSourcePropType } from 'react-native';

const PRODUCT_IMAGES: Record<string, ImageSourcePropType> = {
  'tirinhas_300.png': require('../../assets/products/tirinhas_300.png'),
  'tirinhas_500.png': require('../../assets/products/tirinhas_500.png'),
  'tirinhas_700.png': require('../../assets/products/tirinhas_700.png'),
  'alho_limao.png': require('../../assets/products/alho_limao.png'),
  'baconese.png': require('../../assets/products/baconese.png'),
  'defumado.png': require('../../assets/products/defumado.png'),
  'ervas_finas.png': require('../../assets/products/ervas_finas.png'),
  'proteico.png': require('../../assets/products/proteico.png'),
};

const FALLBACK_IMAGE: ImageSourcePropType = require('../../assets/logo2.jpg');

export function resolveProductImage(imageName: string | null | undefined): ImageSourcePropType {
  if (!imageName) return FALLBACK_IMAGE;
  return PRODUCT_IMAGES[imageName] ?? FALLBACK_IMAGE;
}
