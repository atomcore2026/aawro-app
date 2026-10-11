import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from './api';

/** Lets the user pick a photo and uploads it. Returns the URL, or null if cancelled. */
export async function pickAndUpload(opts: { aspect?: [number, number] } = {}): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Allow photo access in Settings to add images.');
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: !!opts.aspect,
    aspect: opts.aspect,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  return uploadImage(a.uri, a.fileName ?? 'photo.jpg', a.mimeType ?? 'image/jpeg');
}
