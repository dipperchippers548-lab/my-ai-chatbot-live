import type { Analysis } from './types';

/**
 * Sample result used when there's no AI behind the app yet: the server returns it when no
 * ANTHROPIC_API_KEY is set, and preview builds (EXPO_PUBLIC_PREVIEW_MODE=1) use it without a server.
 */
export function demoAnalysis(fromDescription: boolean): Analysis {
  return {
    demo: true,
    isFood: true,
    mealName: fromDescription ? 'Your meal (demo)' : 'Chicken rice bowl',
    confidence: 'medium',
    note: 'Demo result: real scans need an AI key on the server.',
    items: [
      { name: 'Grilled chicken', portion: '1 breast (150 g)', calories: 248, proteinG: 46.5, carbsG: 0, fatG: 5.4 },
      { name: 'White rice', portion: '1 cup (160 g)', calories: 206, proteinG: 4.3, carbsG: 44.5, fatG: 0.4 },
      { name: 'Avocado', portion: '½ fruit (70 g)', calories: 112, proteinG: 1.4, carbsG: 6, fatG: 10.3 },
      { name: 'Sesame dressing', portion: '1 tbsp (15 ml)', calories: 70, proteinG: 0.3, carbsG: 2.5, fatG: 6.8 },
    ],
  };
}
