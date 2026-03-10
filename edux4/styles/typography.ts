// styles/typography.ts
import { TextStyle } from 'react-native';

export const FONTS = {
  primary: 'inter',
  secondary: 'System',
};

export const FONT_SIZES = {
  xs: 10,
  small: 12,
  medium: 14,
  regular: 16,
  large: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  title: 32,
};

export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.8,
};

export const FONT_WEIGHTS = {
  normal: 'normal' as const,
  medium: '500' as const,
  bold: 'bold' as const,
};

export const LETTER_SPACING = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
};

export const createTypography = () => {
  return {
    h1: { fontFamily: FONTS.primary, fontSize: FONT_SIZES.title, fontWeight: FONT_WEIGHTS.bold, lineHeight: FONT_SIZES.title * LINE_HEIGHTS.tight } as TextStyle,
    h2: { fontFamily: FONTS.primary, fontSize: FONT_SIZES.xxxl, fontWeight: FONT_WEIGHTS.bold, lineHeight: FONT_SIZES.xxxl * LINE_HEIGHTS.tight } as TextStyle,
    h3: { fontFamily: FONTS.primary, fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, lineHeight: FONT_SIZES.xxl * LINE_HEIGHTS.tight } as TextStyle,
    h4: { fontFamily: FONTS.primary, fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, lineHeight: FONT_SIZES.xl * LINE_HEIGHTS.normal } as TextStyle,
    h5: { fontFamily: FONTS.primary, fontSize: FONT_SIZES.large, fontWeight: FONT_WEIGHTS.bold, lineHeight: FONT_SIZES.large * LINE_HEIGHTS.normal } as TextStyle,
    h6: { fontFamily: FONTS.primary, fontSize: FONT_SIZES.regular, fontWeight: FONT_WEIGHTS.bold, lineHeight: FONT_SIZES.regular * LINE_HEIGHTS.normal } as TextStyle,
    body1: { fontFamily: FONTS.primary, fontSize: FONT_SIZES.regular, lineHeight: FONT_SIZES.regular * LINE_HEIGHTS.normal } as TextStyle,
    body2: { fontFamily: FONTS.primary, fontSize: FONT_SIZES.medium, lineHeight: FONT_SIZES.medium * LINE_HEIGHTS.normal } as TextStyle,
    subtitle1: { fontFamily: FONTS.primary, fontSize: FONT_SIZES.medium, fontWeight: FONT_WEIGHTS.medium, lineHeight: FONT_SIZES.medium * LINE_HEIGHTS.normal } as TextStyle,
    subtitle2: { fontFamily: FONTS.primary, fontSize: FONT_SIZES.small, fontWeight: FONT_WEIGHTS.medium, lineHeight: FONT_SIZES.small * LINE_HEIGHTS.normal } as TextStyle,
    caption: { fontFamily: FONTS.primary, fontSize: FONT_SIZES.small, lineHeight: FONT_SIZES.small * LINE_HEIGHTS.normal } as TextStyle,
    button: { fontFamily: FONTS.primary, fontSize: FONT_SIZES.regular, fontWeight: FONT_WEIGHTS.bold } as TextStyle,
    label: { fontFamily: FONTS.primary, fontSize: FONT_SIZES.medium, fontWeight: FONT_WEIGHTS.medium } as TextStyle,
  };
};
