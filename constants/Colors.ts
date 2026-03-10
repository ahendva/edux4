// constants/Colors.ts
// Education-themed color palette (blues & greens)

const basicColors = {
  light: {
    primaryheader: '#E3F2FD',
    primary:       '#1565C0',
    primaryLight:  '#42A5F5',
    onPrimary:     '#ffffff',

    accent:        '#2E7D32',
    onAccent:      '#ffffff',

    success:       '#388e3c',
    onSuccess:     '#ffffff',
    warning:       '#f57c00',
    onWarning:     '#ffffff',
    danger:        '#d32f2f',
    onDanger:      '#ffffff',
    error:         '#d32f2f',

    text:          '#212121',
    textSubtle:    '#546E7A',
    placeholder:   '#90A4AE',

    background:    '#F5F7FA',
    surface:       '#ffffff',
    surfaceSubtle: '#E3F2FD',
    onSurface:     '#212121',
    card:          '#ffffff',

    border:        '#B0BEC5',
    gray:          '#78909C',
    lightGray:     '#ECEFF1',
    darkGray:      '#37474F',
    infoBackground:'#E8F5E9',

    tint:           '#1565C0',
    tabIconDefault: '#78909C',
    tabIconSelected:'#1565C0',
  },

  dark: {
    primaryheader: '#0D1B2A',
    primary:       '#42A5F5',
    primaryLight:  '#90CAF9',
    onPrimary:     '#0D1B2A',

    accent:        '#66BB6A',
    onAccent:      '#1B3A1B',

    success:       '#2e7d32',
    onSuccess:     '#ffffff',
    warning:       '#ef6c00',
    onWarning:     '#ffffff',
    danger:        '#c62828',
    onDanger:      '#ffffff',
    error:         '#c62828',

    text:          '#E0E0E0',
    textSubtle:    '#90A4AE',
    placeholder:   '#607D8B',

    background:    '#0D1B2A',
    surface:       '#1B2838',
    surfaceSubtle: '#263238',
    onSurface:     '#E0E0E0',
    card:          '#1B2838',

    border:        '#37474F',
    gray:          '#78909C',
    lightGray:     '#37474F',
    darkGray:      '#B0BEC5',
    infoBackground:'#1B2838',

    tint:           '#42A5F5',
    tabIconDefault: '#607D8B',
    tabIconSelected:'#42A5F5',
  },
};

const proColors = {
  light: {
    primaryheader: '#E8F5E9',
    primary:       '#2E7D32',
    primaryLight:  '#66BB6A',
    onPrimary:     '#ffffff',

    accent:        '#1565C0',
    onAccent:      '#ffffff',

    success:       '#00c853',
    onSuccess:     '#ffffff',
    warning:       '#ff9100',
    onWarning:     '#ffffff',
    danger:        '#ff1744',
    onDanger:      '#ffffff',
    error:         '#ff1744',

    text:          '#212121',
    textSubtle:    '#455a64',
    placeholder:   '#90a4ae',

    background:    '#F1F8E9',
    surface:       '#ffffff',
    surfaceSubtle: '#E8F5E9',
    onSurface:     '#212121',
    card:          '#ffffff',

    border:        '#C8E6C9',
    gray:          '#78909C',
    lightGray:     '#F1F8E9',
    darkGray:      '#37474F',
    infoBackground:'#E8F5E9',

    tint:           '#2E7D32',
    tabIconDefault: '#78909C',
    tabIconSelected:'#2E7D32',
  },

  dark: {
    primaryheader: '#1B3A1B',
    primary:       '#66BB6A',
    primaryLight:  '#A5D6A7',
    onPrimary:     '#1B3A1B',

    accent:        '#42A5F5',
    onAccent:      '#0D1B2A',

    success:       '#00b248',
    onSuccess:     '#ffffff',
    warning:       '#ff6d00',
    onWarning:     '#ffffff',
    danger:        '#f50057',
    onDanger:      '#ffffff',
    error:         '#f50057',

    text:          '#e0e0e0',
    textSubtle:    '#90a4ae',
    placeholder:   '#78909c',

    background:    '#1B3A1B',
    surface:       '#2E4A2E',
    surfaceSubtle: '#2E7D32',
    onSurface:     '#e0e0e0',
    card:          '#2E4A2E',

    border:        '#4A6F4A',
    gray:          '#78909c',
    lightGray:     '#4A6F4A',
    darkGray:      '#b0bec5',
    infoBackground:'#2E4A2E',

    tint:           '#66BB6A',
    tabIconDefault: '#78909c',
    tabIconSelected:'#66BB6A',
  },
};

export default {
  basic: basicColors,
  pro:   proColors,
};

export interface ThemeOption {
  key: string;
  name: string;
  description: string;
  lightPrimary: string;
  lightAccent: string;
  darkPrimary: string;
  darkAccent: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    key: 'basic',
    name: 'Ocean',
    description: 'Calm blue learning',
    lightPrimary: '#1565C0',
    lightAccent:  '#2E7D32',
    darkPrimary:  '#42A5F5',
    darkAccent:   '#66BB6A',
  },
  {
    key: 'pro',
    name: 'Forest',
    description: 'Natural green growth',
    lightPrimary: '#2E7D32',
    lightAccent:  '#1565C0',
    darkPrimary:  '#66BB6A',
    darkAccent:   '#42A5F5',
  },
];
