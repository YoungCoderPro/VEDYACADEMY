// Student portal — Documents shared with this student.

import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, PageHeader, Card, T, EmptyState, IconBtn } from '../../components/ui';
import { useData } from '../../lib/store';
import { openFile } from '../../lib/files';
import { colors, categoryMeta } from '../../lib/theme';
import { formatShort } from '../../lib/dates';

export default function StudentDocs() {
  const data = useData();
  const docs = data.documents || [];

  return (
    <Screen>
      <PageHeader icon="library" eyebrow="Shared with me" title="Documents" />
      {docs.length === 0 ? (
        <EmptyState
          icon="library-outline"
          title="Nothing shared yet"
          body="Study documents Vedya shares with you will appear here."
        />
      ) : (
        docs.map((d) => {
          const meta = categoryMeta[d.category] || categoryMeta.Other;
          return (
            <Card key={d.id} style={{ marginBottom: 10 }} onPress={() => openFile(d.fileKey, `${d.title}.pdf`)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 10, backgroundColor: meta.soft,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name={meta.icon} size={20} color={meta.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <T.semi>{d.title}</T.semi>
                  <T.small>{d.category} · {formatShort(d.addedAt)}</T.small>
                </View>
                <IconBtn icon="open-outline" color={colors.pine} onPress={() => openFile(d.fileKey, `${d.title}.pdf`)} />
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
