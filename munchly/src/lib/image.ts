import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export interface PreparedImage {
  uri: string;
  base64: string;
  mediaType: 'image/jpeg';
}

/** Longest side sent to the AI. Plenty for food, and keeps uploads small and cheap. */
const MAX_SIDE = 1024;

export async function pickFoodImage(source: 'camera' | 'library'): Promise<PreparedImage | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      throw new Error('Munchly needs camera access to snap your food. You can turn it on in Settings.');
    }
  }

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];

  const ctx = ImageManipulator.manipulate(asset.uri);
  const longest = Math.max(asset.width, asset.height);
  if (longest > MAX_SIDE) {
    ctx.resize(asset.width >= asset.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const rendered = await ctx.renderAsync();
  const saved = await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  if (!saved.base64) throw new Error('Couldn’t read that photo. Try another one.');

  return { uri: saved.uri, base64: saved.base64, mediaType: 'image/jpeg' };
}
