import { useColorScheme } from 'react-native';

const palette = {
  light: {
    bg: '#FFF7EF',
    card: '#FFFFFF',
    cardAlt: '#FFEFE2',
    text: '#22180F',
    textMuted: '#7A6A5C',
    border: '#F0E2D4',
    primary: '#FF6A2B',
    primaryPressed: '#E85A1E',
    onPrimary: '#FFFFFF',
    ringTrack: '#FBE3D2',
    danger: '#D93F3F',
    success: '#2E9E5B',
    protein: '#E5484D',
    carbs: '#F2A60C',
    fat: '#3E7BFA',
  },
  dark: {
    bg: '#16110D',
    card: '#221A14',
    cardAlt: '#2D221A',
    text: '#FBF3EA',
    textMuted: '#B3A293',
    border: '#3A2E25',
    primary: '#FF7A3D',
    primaryPressed: '#FF8F5C',
    onPrimary: '#1A0F08',
    ringTrack: '#3A2A1F',
    danger: '#FF6B6B',
    success: '#4CC77F',
    protein: '#FF6B70',
    carbs: '#FFC23D',
    fat: '#6E9BFF',
  },
};

export type Colors = typeof palette.light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? palette.dark : palette.light;
}

export const radius = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
