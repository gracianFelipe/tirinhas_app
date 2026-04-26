import { ImageSourcePropType } from 'react-native';

const PRODUCT_IMAGES: Record<string, ImageSourcePropType> = {
  // Tirinhas
  'tirinhas_300.png': require('../../assets/products/tirinhas_300.png'),
  'tirinhas_500.png': require('../../assets/products/tirinhas_500.png'),
  'tirinhas_700.png': require('../../assets/products/tirinhas_700.png'),
  // Molhos
  'alho_limao.png': require('../../assets/products/alho_limao.png'),
  'baconese.png': require('../../assets/products/baconese.png'),
  'defumado.png': require('../../assets/products/defumado.png'),
  'ervas_finas.png': require('../../assets/products/ervas_finas.png'),
  'proteico.png': require('../../assets/products/proteico.png'),
  // Acompanhamentos
  'crocantonas.png': require('../../assets/products/crocantonas.png'),
  'fritas_p.png': require('../../assets/products/fritas_p.png'),
  'fritas_m.png': require('../../assets/products/fritas_m.png'),
  'fritas_g.png': require('../../assets/products/fritas_g.png'),
  'supremo_300.png': require('../../assets/products/supremo_300.png'),
  'supremo_500.png': require('../../assets/products/supremo_500.png'),
  'supremo_750.png': require('../../assets/products/supremo_750.png'),
  // Barcas
  'barca_3.png': require('../../assets/products/barca_3.png'),
  'barca_5.png': require('../../assets/products/barca_5.png'),
  'barca_7.png': require('../../assets/products/barca_7.png'),
  // Bebidas — genéricas (fallback)
  'refri_lata.png': require('../../assets/products/refri_lata.png'),
  'garrafa_500.png': require('../../assets/products/garrafa_500.png'),
  'refri_1l.png': require('../../assets/products/refri_1l.png'),
  'refri_2l.png': require('../../assets/products/refri_2l.png'),
  'soda_italiana.png': require('../../assets/products/soda_italiana.png'),
  // Bebidas — Pepsi
  'pepsi_lata.png': require('../../assets/products/pepsi_lata.png'),
  'pepsi_garrafa.png': require('../../assets/products/pepsi_garrafa.png'),
  // Bebidas — Pepsi Black
  'pepsi_black_lata.png': require('../../assets/products/pepsi_black_lata.png'),
  'pepsi_black_garrafa.png': require('../../assets/products/pepsi_black_garrafa.png'),
  // Bebidas — Pepsi Twist
  'pepsi_twist_lata.png': require('../../assets/products/pepsi_twist_lata.png'),
  'pepsi_twist_garrafa.png': require('../../assets/products/pepsi_twist_garrafa.png'),
  // Bebidas — Guaraná
  'guarana_lata.png': require('../../assets/products/guarana_lata.png'),
  'guarana_garrafa.png': require('../../assets/products/guarana_garrafa.png'),
  // Bebidas — Guaraná Zero
  'guarana_zero_lata.png': require('../../assets/products/guarana_zero_lata.png'),
  'guarana_zero_garrafa.png': require('../../assets/products/guarana_zero_garrafa.png'),
  // Bebidas — Tônica
  'tonica_lata.png': require('../../assets/products/tonica_lata.png'),
  'tonica_garrafa.png': require('../../assets/products/tonica_garrafa.png'),
  // Bebidas — Tônica Zero
  'tonica_zero_lata.png': require('../../assets/products/tonica_zero_lata.png'),
  'tonica_zero_garrafa.png': require('../../assets/products/tonica_zero_garrafa.png'),
  // Bebidas — H2O
  'h2o_500.png': require('../../assets/products/h2o_500.png'),
  // Bebidas — Limoneto
  'limoneto.png': require('../../assets/products/limoneto.png'),
  // Sodas Italianas — por sabor
  'soda_morango.png': require('../../assets/products/soda_morango.png'),
  'soda_maracuja.png': require('../../assets/products/soda_maracuja.png'),
  'soda_limao.png': require('../../assets/products/soda_limao.png'),
  'soda_framboesa.png': require('../../assets/products/soda_framboesa.png'),
};

const FALLBACK_IMAGE: ImageSourcePropType = require('../../assets/logo2.jpg');

export function resolveProductImage(imageName: string | null | undefined): ImageSourcePropType {
  if (!imageName) return FALLBACK_IMAGE;
  return PRODUCT_IMAGES[imageName] ?? FALLBACK_IMAGE;
}
