/**
 * CalmHands design tokens — deep ink shell, refined teal accent, SOS reserved rose.
 * Surfaces read soft and layered; one accent used sparingly.
 */
export const theme = {
  colors: {
    background: '#0B0F10',
    backgroundMid: '#101617',
    backgroundTop: '#14201F',
    card: '#151B1D',
    cardBorder: 'rgba(255,255,255,0.07)',
    cardMuted: '#101516',
    cardHighlight: 'rgba(255,255,255,0.04)',
    text: '#F2F5F4',
    textMuted: '#8B9694',
    textDim: '#5C6664',
    primary: '#2EC4B6',
    primaryDark: '#1FA89C',
    primaryMuted: 'rgba(46,196,182,0.14)',
    primarySoft: 'rgba(46,196,182,0.22)',
    onPrimary: '#06201D',
    success: '#4ADE80',
    successDark: '#22C55E',
    danger: '#DC2626',
    sos: '#E11D48',
    sosDark: '#BE123C',
    warning: '#FBBF24',
    accent: '#7DD3C8',
    mood: {
      1: '#F87171',
      2: '#FB923C',
      3: '#94A3B8',
      4: '#6EE7B7',
      5: '#4ADE80',
    } as Record<1 | 2 | 3 | 4 | 5, string>,
    overlay: 'rgba(0,0,0,0.62)',
    input: '#12181A',
  },
  radius: {
    card: 22,
    cardSmall: 16,
    button: 16,
    buttonSmall: 12,
    pill: 999,
  },
  padding: {
    card: 18,
    cardTight: 14,
    button: 16,
    buttonSmall: 11,
    screen: 20,
    tabBarClearance: 32,
    sectionGap: 16,
  },
  typography: {
    fontRegular: 'DMSans_400Regular',
    fontSemiBold: 'DMSans_600SemiBold',
    fontBold: 'DMSans_700Bold',
    hero: { fontSize: 28, fontWeight: '600' as const, lineHeight: 34, fontFamily: 'DMSans_600SemiBold', letterSpacing: -0.4 },
    title: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28, fontFamily: 'DMSans_600SemiBold', letterSpacing: -0.3 },
    sectionTitle: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22, fontFamily: 'DMSans_600SemiBold', letterSpacing: -0.2 },
    body: { fontSize: 16, lineHeight: 24, fontFamily: 'DMSans_400Regular' },
    bodySmall: { fontSize: 14, lineHeight: 20, fontFamily: 'DMSans_400Regular' },
    caption: { fontSize: 12, lineHeight: 16, fontFamily: 'DMSans_400Regular' },
    captionSmall: { fontSize: 11, lineHeight: 14, fontFamily: 'DMSans_400Regular' },
  },
  shadow: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 16,
      elevation: 6,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
      elevation: 3,
    },
    fab: {
      shadowColor: '#E11D48',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  activeOpacity: 0.78,
  tabBar: {
    /** Icon + label area (safe-area padding added at runtime). */
    contentHeight: 56,
    height: 56,
  },
} as const;

export type Theme = typeof theme;
