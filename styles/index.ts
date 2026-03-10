// styles/index.ts
import { commonStyles } from './commonStyles';
import { createThemedStyles, ThemeColors } from './themedStyles';
import {
  shadowMixins,
  radiusMixins,
  spacingMixins,
  layoutMixins,
  typographyMixins,
  createThemeMixins,
  animationMixins
} from './mixins';
import {
  FONTS,
  FONT_SIZES,
  FONT_WEIGHTS,
  LINE_HEIGHTS,
  LETTER_SPACING,
  createTypography
} from './typography';
import {
  createHeaderOptions,
  createTransparentHeaderOptions,
  createBackOnlyHeaderOptions
} from './headerStyles';
import { useTheme } from '../context/ThemeContext';

export const styles = {
  common: commonStyles,
  createThemedStyles,
};

export const useStyles = () => {
  const { colors } = useTheme();
  const themed = createThemedStyles(colors);
  const themeMixins = createThemeMixins(colors);
  const typography = createTypography();
  const headerOptions = createHeaderOptions(colors);

  return {
    common: commonStyles,
    themed,
    typography,
    fonts: FONTS,
    fontSizes: FONT_SIZES,
    headerOptions,
    mixins: {
      shadow: shadowMixins,
      radius: radiusMixins,
      spacing: spacingMixins,
      layout: layoutMixins,
      typography: typographyMixins,
      animation: animationMixins,
      theme: themeMixins,
    },
  };
};

export {
  commonStyles,
  createThemedStyles,
  shadowMixins,
  radiusMixins,
  spacingMixins,
  layoutMixins,
  typographyMixins,
  animationMixins,
  createThemeMixins,
  FONTS,
  FONT_SIZES,
  FONT_WEIGHTS,
  LINE_HEIGHTS,
  LETTER_SPACING,
  createTypography,
  createHeaderOptions,
  createTransparentHeaderOptions,
  createBackOnlyHeaderOptions,
};
