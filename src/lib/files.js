// PDF file storage — Supabase Storage edition.
// Files live in the private "documents" bucket, named {docId}.pdf.
// Staff can read/write everything; students can only read files whose doc id
// appears in their own sharedDocs list (enforced by storage RLS policies).

import { Platform, Linking } from 'react-native';
import { supabase } from './supabase';

const BUCKET = 'documents';

// asset: result from expo-document-picker ({ uri, name, file (web), mimeType })
export async function saveFile(fileKey, asset) {
  let body;
  if (Platform.OS === 'web' && asset.file) {
    body = asset.file;
  } else {
    const res = await fetch(asset.uri);
    body = await res.blob();
  }
  const { error } = await supabase.storage.from(BUCKET).upload(fileKey, body, {
    contentType: asset.mimeType || 'application/pdf',
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return fileKey;
}

// Opens the file via a short-lived signed URL (RLS decides who may get one).
export async function openFile(fileKey, displayName) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(fileKey, 300, {
    download: displayName || fileKey,
  });
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Could not open file');
  if (Platform.OS === 'web') {
    window.open(data.signedUrl, '_blank');
  } else {
    await Linking.openURL(data.signedUrl);
  }
}

export async function deleteFile(fileKey) {
  try {
    await supabase.storage.from(BUCKET).remove([fileKey]);
  } catch (e) {
    // deleting a missing file is fine
  }
}
