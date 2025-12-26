type ImpactStyle = 'light' | 'medium' | 'heavy';

export async function impact(style: ImpactStyle) {
  try {
    const Haptics = require('expo-haptics') as typeof import('expo-haptics');
    const map: Record<ImpactStyle, any> = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };
    await Haptics.impactAsync(map[style]);
  } catch {}
}


