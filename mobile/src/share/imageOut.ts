import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';

export type SaveResult = 'saved' | 'denied' | 'error';

/**
 * 이미지를 사진첩에 저장해요. 허용 창은 폰(OS)이 보여주는 것만 써요 —
 * 아이폰은 "사진 추가만" 허용을 따로 물어보고, 안드로이드는 저장만 할 때 창이 거의 안 떠요.
 */
export async function saveImageToPhotos(uri: string): Promise<SaveResult> {
  try {
    const permission = await MediaLibrary.requestPermissionsAsync(true);
    if (!permission.granted) return 'denied';
    await MediaLibrary.saveToLibraryAsync(uri);
    return 'saved';
  } catch {
    return 'error';
  }
}

/** 폰의 공유창으로 이미지를 보내요 (다른 앱으로 공유). */
export async function shareImageFile(uri: string): Promise<boolean> {
  try {
    if (!(await Sharing.isAvailableAsync())) return false;
    await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
    return true;
  } catch {
    return false;
  }
}
