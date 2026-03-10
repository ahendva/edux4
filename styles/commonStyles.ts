// styles/commonStyles.ts
import { StyleSheet, TextStyle, ViewStyle, ImageStyle } from 'react-native';
import { FONTS, FONT_SIZES, FONT_WEIGHTS, LINE_HEIGHTS } from './typography';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export const commonStyles = StyleSheet.create<NamedStyles<any>>({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  spaceBetween: { justifyContent: 'space-between' },
  center: { justifyContent: 'center', alignItems: 'center' },
  alignCenter: { alignItems: 'center' },
  justifyCenter: { justifyContent: 'center' },

  header: { paddingTop: 10, paddingBottom: 10, paddingHorizontal: 20 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 16, fontSize: FONT_SIZES.medium, fontFamily: FONTS.primary, textAlign: 'center' },

  title: { fontSize: FONT_SIZES.xxxl, fontWeight: FONT_WEIGHTS.bold, fontFamily: FONTS.primary },
  sectionTitle: { fontSize: FONT_SIZES.large, fontWeight: FONT_WEIGHTS.bold, marginBottom: 10, fontFamily: FONTS.primary },
  bodyText: { fontSize: FONT_SIZES.regular, fontFamily: FONTS.primary, lineHeight: FONT_SIZES.regular * LINE_HEIGHTS.normal },
  smallText: { fontSize: FONT_SIZES.medium, fontFamily: FONTS.primary },
  caption: { fontSize: FONT_SIZES.small, fontFamily: FONTS.primary },

  card: { borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  section: { marginBottom: 24 },
  divider: { height: 1, width: '100%' },

  input: { height: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: FONT_SIZES.regular, fontFamily: FONTS.primary },
  label: { fontSize: FONT_SIZES.regular, marginBottom: 8, fontFamily: FONTS.primary },

  button: { borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: FONT_SIZES.regular, fontWeight: FONT_WEIGHTS.bold, fontFamily: FONTS.primary },
  buttonIcon: { marginRight: 8 },

  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyStateText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, fontFamily: FONTS.primary },
  emptyStateSubtext: { fontSize: 14, textAlign: 'center', marginBottom: 24, fontFamily: FONTS.primary },

  p4: { padding: 16 },
  m3: { margin: 12 },
  mr2: { marginRight: 8 },
  mb3: { marginBottom: 12 },
  mt3: { marginTop: 12 },
});
