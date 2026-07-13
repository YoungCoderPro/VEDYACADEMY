// Library — the study document database. Upload PDFs, tag them by category,
// search, open/download, and share sets of documents with a student.

import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  Button,
  Card,
  Chip,
  ChipSelect,
  Divider,
  EmptyState,
  Field,
  IconBtn,
  PageHeader,
  Screen,
  Sheet,
  T,
} from '../../components/ui';
import { formatShort, uid } from '../../lib/dates';
import { deleteFile, openFile, saveFile } from '../../lib/files';
import { useData } from '../../lib/store';
import { DOC_CATEGORIES, categoryMeta, colors, fonts } from '../../lib/theme';

const fmtSize = (b) => {
  if (!b) return '';
  if (b > 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(b / 1024)} KB`;
};

export default function Library() {
  const data = useData();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');
  const [pendingUpload, setPendingUpload] = useState(null); // asset awaiting title/category
  const [sharing, setSharing] = useState(null); // doc ids being shared
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const docs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.documents
      .filter((d) => cat === 'All' || d.category === cat)
      .filter((d) => !q || d.title.toLowerCase().includes(q) || (d.category || '').toLowerCase().includes(q))
      .sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''));
  }, [data.documents, query, cat]);

  const usedCategories = ['All', ...DOC_CATEGORIES.filter((c) => data.documents.some((d) => d.category === c))];

  const pickPdf = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.length) return;
    const asset = res.assets[0];
    setPendingUpload({
      asset,
      title: (asset.name || 'Document').replace(/\.pdf$/i, ''),
      category: cat !== 'All' ? cat : 'Other',
    });
  };

  const confirmUpload = async () => {
    const { asset, title, category } = pendingUpload;
    try {
      const fileKey = `${uid()}.pdf`;
      await saveFile(fileKey, asset);
      data.addDocument({ title: title.trim() || asset.name, category, fileKey, size: asset.size, fileName: asset.name });
      setPendingUpload(null);
    } catch (e) {
      Alert.alert('Upload failed', String(e?.message || e));
    }
  };

  const toggleSelect = (id) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const removeDoc = (doc) => {
    const go = () => { deleteFile(doc.fileKey); data.deleteDocument(doc.id); };
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`Delete “${doc.title}”? This also removes it from student profiles.`)) go();
    } else {
      Alert.alert('Delete document', `Delete “${doc.title}”?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: go },
      ]);
    }
  };

  return (
    <Screen>
      <PageHeader
        icon="library"
        eyebrow="Study documents"
        title="Library"
        right={<Button title="Upload PDF" icon="cloud-upload-outline" onPress={pickPdf} />}
      />

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={17} color={colors.faint} style={{ marginRight: 8 }} />
        <TextInput
          value={query} onChangeText={setQuery}
          placeholder="Search documents"
          placeholderTextColor={colors.faint}
          style={styles.searchInput}
        />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {usedCategories.map((c) => (
          <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />
        ))}
      </View>

      {data.documents.length > 0 && (
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <Button
            title={selectMode ? `Share selected (${selectedIds.length})` : 'Share with a student'}
            icon="paper-plane-outline"
            kind={selectMode ? 'accent' : 'quiet'}
            small
            onPress={() => {
              if (!selectMode) { setSelectMode(true); return; }
              if (selectedIds.length) setSharing(selectedIds);
            }}
          />
          {selectMode && (
            <Button title="Done" kind="ghost" small onPress={() => { setSelectMode(false); setSelectedIds([]); }} />
          )}
        </View>
      )}

      {docs.length === 0 ? (
        <EmptyState
          icon="library-outline"
          title={data.documents.length === 0 ? 'Your library is empty' : 'No matching documents'}
          body={data.documents.length === 0
            ? 'Upload PDFs — worksheets, practice tests, reading sets — and tag them so the right one is always a search away.'
            : 'Try a different search or category.'}
          action={data.documents.length === 0 && <Button title="Upload your first PDF" icon="cloud-upload-outline" onPress={pickPdf} />}
        />
      ) : (
        docs.map((d) => (
          <Card
            key={d.id}
            style={{ marginBottom: 10 }}
            onPress={selectMode ? () => toggleSelect(d.id) : () => openFile(d.fileKey, `${d.title}.pdf`)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {selectMode ? (
                <Ionicons
                  name={selectedIds.includes(d.id) ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={selectedIds.includes(d.id) ? colors.pine : colors.faint}
                  style={{ marginRight: 12 }}
                />
              ) : (
                <View style={[styles.pdfIcon, { backgroundColor: (categoryMeta[d.category] || categoryMeta.Other).soft }]}>
                  <Ionicons
                    name={(categoryMeta[d.category] || categoryMeta.Other).icon}
                    size={20}
                    color={(categoryMeta[d.category] || categoryMeta.Other).color}
                  />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: selectMode ? 0 : 12 }}>
                <T.semi>{d.title}</T.semi>
                <T.small>
                  {d.category} · added {formatShort(d.addedAt)}{d.size ? ` · ${fmtSize(d.size)}` : ''}
                </T.small>
              </View>
              {!selectMode && (
                <>
                  <IconBtn icon="open-outline" color={colors.pine} onPress={() => openFile(d.fileKey, `${d.title}.pdf`)} />
                  <IconBtn icon="trash-outline" color={colors.danger} onPress={() => removeDoc(d)} />
                </>
              )}
            </View>
          </Card>
        ))
      )}

      {/* upload details sheet */}
      <Sheet visible={!!pendingUpload} onClose={() => setPendingUpload(null)} title="Add to library">
        {pendingUpload && (
          <>
            <Field
              label="Title"
              value={pendingUpload.title}
              onChangeText={(v) => setPendingUpload((p) => ({ ...p, title: v }))}
            />
            <ChipSelect
              label="Category"
              options={DOC_CATEGORIES}
              value={pendingUpload.category}
              onChange={(v) => setPendingUpload((p) => ({ ...p, category: v }))}
            />
            <Button title="Save to library" onPress={confirmUpload} />
          </>
        )}
      </Sheet>

      {/* share sheet */}
      <ShareSheet
        docIds={sharing}
        onClose={(shared) => {
          setSharing(null);
          if (shared) { setSelectMode(false); setSelectedIds([]); }
        }}
      />
    </Screen>
  );
}

export function ShareSheet({ docIds, onClose, presetStudentId, pickDocs }) {
  const data = useData();
  const [studentId, setStudentId] = useState(presetStudentId || null);
  const [chosen, setChosen] = useState([]);

  React.useEffect(() => {
    setStudentId(presetStudentId || null);
    setChosen(pickDocs ? [] : docIds || []);
  }, [docIds]);
  if (!docIds) return null;

  const docs = data.documents.filter((d) => (pickDocs ? docIds : chosen.length ? chosen : docIds).includes(d.id));
  const finalIds = pickDocs ? chosen : docIds;
  const active = data.students.filter((s) => !s.archived);

  const doShare = async () => {
    if (!studentId || finalIds.length === 0) return;
    data.shareDocuments(studentId, finalIds);
    const student = data.students.find((s) => s.id === studentId);
    const sharedDocs = data.documents.filter((d) => finalIds.includes(d.id));
    const message =
      `Hi ${student.name.split(' ')[0]}! Here are your study materials from VedyAcademy:\n` +
      sharedDocs.map((d) => `• ${d.title} (${d.category})`).join('\n') +
      `\nI'll bring/send the files — see you at our next lesson. — Vedya`;
    if (Platform.OS === 'web') {
      try { await navigator.clipboard.writeText(message); } catch (e) {}
      // eslint-disable-next-line no-alert
      window.alert('Documents attached to the student profile. A ready-to-send message was copied to your clipboard.');
    } else {
      try { await Share.share({ message }); } catch (e) {}
    }
    onClose(true);
  };

  return (
    <Sheet visible={!!docIds} onClose={() => onClose(false)} title="Share documents">
      <T.muted style={{ marginBottom: 10 }}>
        {pickDocs
          ? 'Choose documents to share. They will appear in the student\u2019s profile, and a message listing them will be prepared for you to send.'
          : `${finalIds.length} document${finalIds.length === 1 ? '' : 's'} selected. They will appear in the student\u2019s profile, and a message listing them will be prepared for you to send.`}
      </T.muted>
      {(pickDocs ? data.documents : docs).map((d) => (
        <Pressable
          key={d.id}
          disabled={!pickDocs}
          onPress={() => setChosen((ids) => (ids.includes(d.id) ? ids.filter((x) => x !== d.id) : [...ids, d.id]))}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
        >
          <Ionicons
            name={pickDocs ? (chosen.includes(d.id) ? 'checkbox' : 'square-outline') : 'document-text-outline'}
            size={pickDocs ? 19 : 15}
            color={pickDocs && !chosen.includes(d.id) ? colors.faint : colors.pine}
            style={{ marginRight: 7 }}
          />
          <View style={{ flex: 1 }}>
            <T.body>{d.title}</T.body>
            {pickDocs && <T.small>{d.category}</T.small>}
          </View>
        </Pressable>
      ))}
      <Divider />
      <Text style={styles.fieldLabel}>Share with</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {active.map((s) => (
          <Chip key={s.id} label={s.name} active={studentId === s.id} onPress={() => setStudentId(s.id)} />
        ))}
      </View>
      <Button title="Share" icon="paper-plane-outline" onPress={doShare} disabled={!studentId || finalIds.length === 0} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12,
  },
  searchInput: {
    flex: 1, paddingVertical: 11, fontFamily: fonts.body, fontSize: 14.5, color: colors.ink,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  pdfIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: colors.pineSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  fieldLabel: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.muted, marginBottom: 8 },
});