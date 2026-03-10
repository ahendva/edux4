// styles/themedStyles.ts
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { FONTS, FONT_SIZES, FONT_WEIGHTS } from './typography';

export interface ThemeColors {
  primary: string;
  primaryheader: string;
  primaryLight: string;
  onPrimary: string;
  accent: string;
  onAccent: string;
  success: string;
  onSuccess: string;
  error: string;
  danger: string;
  onDanger: string;
  warning: string;
  onWarning: string;
  gray: string;
  lightGray: string;
  darkGray: string;
  text: string;
  textSubtle: string;
  placeholder: string;
  background: string;
  surface: string;
  surfaceSubtle: string;
  onSurface: string;
  card: string;
  border: string;
  infoBackground: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  [key: string]: string | undefined;
}

export const createThemedStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    textPrimary: { color: colors.primary },
    textAccent: { color: colors.accent },
    textNormal: { color: colors.text },
    textGray: { color: colors.gray },
    textLightGray: { color: colors.lightGray },
    textDarkGray: { color: colors.darkGray },
    textError: { color: colors.error },
    textSuccess: { color: colors.success },
    textWarning: { color: colors.warning },

    bgScreen: { backgroundColor: colors.background },
    bgCard: { backgroundColor: colors.card },
    bgPrimary: { backgroundColor: colors.primary },
    bgPrimaryLight: { backgroundColor: colors.primaryLight },
    bgAccent: { backgroundColor: colors.accent },
    bgSuccess: { backgroundColor: colors.success },
    bgError: { backgroundColor: colors.error },
    bgWarning: { backgroundColor: colors.warning },
    bgGray: { backgroundColor: colors.gray },
    bgLightGray: { backgroundColor: colors.lightGray },

    border: { borderColor: colors.border, borderWidth: 1 },
    borderPrimary: { borderColor: colors.primary, borderWidth: 1 },
    borderAccent: { borderColor: colors.accent, borderWidth: 1 },
    borderSuccess: { borderColor: colors.success, borderWidth: 1 },
    borderError: { borderColor: colors.error, borderWidth: 1 },
    borderWarning: { borderColor: colors.warning, borderWidth: 1 },

    primaryButton: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    primaryButtonText: { color: '#FFFFFF', fontWeight: FONT_WEIGHTS.bold, fontSize: FONT_SIZES.regular, fontFamily: FONTS.primary },
    secondaryButton: { backgroundColor: 'transparent', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    secondaryButtonText: { color: colors.primary, fontWeight: FONT_WEIGHTS.bold, fontSize: FONT_SIZES.regular, fontFamily: FONTS.primary },
    dangerButton: { backgroundColor: colors.error, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    dangerButtonText: { color: '#FFFFFF', fontWeight: FONT_WEIGHTS.bold, fontSize: FONT_SIZES.regular, fontFamily: FONTS.primary },
    disabledButton: { backgroundColor: colors.lightGray, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: 0.7 },
    disabledButtonText: { color: colors.gray, fontWeight: FONT_WEIGHTS.bold, fontSize: FONT_SIZES.regular, fontFamily: FONTS.primary },

    themedCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    activeCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },

    inputBorder: { borderColor: colors.border, borderWidth: 1, borderRadius: 8 },
    inputText: { color: colors.text, fontSize: FONT_SIZES.regular, fontFamily: FONTS.primary },
    inputPlaceholder: { color: colors.gray },
    selectedTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    unselectedTab: { borderBottomWidth: 1, borderBottomColor: 'transparent' },

    divider: { height: 1, backgroundColor: colors.border, width: '100%' } as ViewStyle,
    shadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    overlay: { backgroundColor: `${colors.background}CC`, ...StyleSheet.absoluteFillObject },
  });
};
