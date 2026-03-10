// styles/mixins.ts
import { ViewStyle, TextStyle } from 'react-native';
import { ThemeColors } from './themedStyles';
import { FONTS, FONT_WEIGHTS, LINE_HEIGHTS, LETTER_SPACING } from './typography';

export const shadowMixins = {
  subtle: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 } as ViewStyle,
  medium: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 } as ViewStyle,
  strong: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 } as ViewStyle,
};

export const radiusMixins = {
  small: { borderRadius: 4 } as ViewStyle,
  medium: { borderRadius: 8 } as ViewStyle,
  large: { borderRadius: 12 } as ViewStyle,
  pill: { borderRadius: 50 } as ViewStyle,
  circle: (size: number): ViewStyle => ({ width: size, height: size, borderRadius: size / 2 }),
};

export const spacingMixins = {
  paddingH: (value: number): ViewStyle => ({ paddingHorizontal: value }),
  paddingV: (value: number): ViewStyle => ({ paddingVertical: value }),
  padding: (value: number): ViewStyle => ({ padding: value }),
  marginH: (value: number): ViewStyle => ({ marginHorizontal: value }),
  marginV: (value: number): ViewStyle => ({ marginVertical: value }),
  margin: (value: number): ViewStyle => ({ margin: value }),
};

export const layoutMixins = {
  centered: { justifyContent: 'center', alignItems: 'center' } as ViewStyle,
  row: { flexDirection: 'row', alignItems: 'center' } as ViewStyle,
  column: { flexDirection: 'column' } as ViewStyle,
  spaceBetween: { justifyContent: 'space-between' } as ViewStyle,
  flex1: { flex: 1 } as ViewStyle,
};

export const typographyMixins = {
  fontMono: { fontFamily: FONTS.primary } as TextStyle,
  textCenter: { textAlign: 'center' } as TextStyle,
  bold: { fontWeight: FONT_WEIGHTS.bold } as TextStyle,
  medium: { fontWeight: FONT_WEIGHTS.medium } as TextStyle,
};

export const createThemeMixins = (colors: ThemeColors) => ({
  bgPrimary: { backgroundColor: colors.primary } as ViewStyle,
  bgAccent: { backgroundColor: colors.accent } as ViewStyle,
  bgCard: { backgroundColor: colors.card } as ViewStyle,
  textPrimary: { color: colors.primary } as TextStyle,
  textAccent: { color: colors.accent } as TextStyle,
  textLight: { color: '#FFFFFF' } as TextStyle,
  textDark: { color: colors.text } as TextStyle,
  borderPrimary: { borderColor: colors.primary } as ViewStyle,
});

export const animationMixins = {
  fadeTransition: { duration: 300, easing: 'ease-in-out' },
  springTransition: { tension: 50, friction: 7 },
};
