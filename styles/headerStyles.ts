// styles/headerStyles.ts
import { FONTS, FONT_SIZES, FONT_WEIGHTS } from './typography';
import { Platform } from 'react-native';

export const createHeaderOptions = (colors: any) => ({
  headerShown: true,
  headerStyle: {
    backgroundColor: colors.primaryheader,
    height: Platform.OS === 'ios' ? 110 : 70,
  },
  headerTintColor: colors.text,
  headerTitleStyle: {
    fontFamily: FONTS.primary,
    fontSize: FONT_SIZES.large,
    fontWeight: FONT_WEIGHTS.bold,
  },
  headerShadowVisible: true,
  headerStatusBarHeight: Platform.OS === 'ios' ? 50 : 0,
});

export const createTransparentHeaderOptions = (colors: any) => ({
  headerShown: true,
  headerStyle: { backgroundColor: 'transparent' },
  headerTransparent: true,
  headerTintColor: colors.text,
  headerTitleStyle: {
    fontFamily: FONTS.primary,
    fontSize: FONT_SIZES.large,
    fontWeight: FONT_WEIGHTS.bold,
  },
  headerShadowVisible: false,
});

export const createBackOnlyHeaderOptions = (colors: any) => ({
  headerShown: true,
  headerStyle: {
    backgroundColor: colors.primary,
    height: Platform.OS === 'ios' ? 110 : 70,
  },
  headerTintColor: '#fff',
  headerTitle: '',
  headerShadowVisible: true,
  headerStatusBarHeight: Platform.OS === 'ios' ? 50 : 0,
});
