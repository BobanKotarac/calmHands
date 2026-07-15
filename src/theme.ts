/**
 * Jedinstveni vizuelni tokeni za CalmHands.
 * Tamna tema: neutralno siva (bez plavog), jedan akcent, SOS istaknut crveno.
 */
export const theme = {
  colors: {
    background: '#13151A',
    card: '#1A1D24',
    cardBorder: '#2A2E38',
    cardMuted: '#16181F',
    text: '#F4F4F5',
    textMuted: '#A1A1AA',
    textDim: '#71717A',
    primary: '#0EA5E9',
    primaryDark: '#0284C7',
    success: '#22C55E',
    successDark: '#16A34A',
    danger: '#DC2626',
    sos: '#E11D48',
    sosDark: '#BE123C',
    warning: '#F59E0B',
    accent: '#38BDF8',
  },
  radius: {
    card: 18,
    cardSmall: 14,
    button: 14,
    buttonSmall: 10,
    pill: 999,
  },
  padding: {
    card: 16,
    cardTight: 14,
    button: 14,
    buttonSmall: 10,
    screen: 16,
  },
  typography: {
    hero: { fontSize: 26, fontWeight: '600' as const },
    title: { fontSize: 22, fontWeight: '600' as const },
    sectionTitle: { fontSize: 18, fontWeight: '600' as const },
    body: { fontSize: 16 },
    bodySmall: { fontSize: 14 },
    caption: { fontSize: 12 },
    captionSmall: { fontSize: 11 },
  },
  activeOpacity: 0.7,
} as const;

export type Theme = typeof theme;
