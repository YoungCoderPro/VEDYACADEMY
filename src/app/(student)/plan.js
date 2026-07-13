// Student portal — My plan: roadmap, curriculum progress, and score history.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, PageHeader, Card, SectionTitle, T, EmptyState, Divider } from '../../components/ui';
import { useData } from '../../lib/store';
import { colors, fonts, examMeta } from '../../lib/theme';
import { formatShort } from '../../lib/dates';

export default function StudentPlan() {
  const data = useData();
  const me = data.students[0];
  if (!me) return null;
  const r = me.roadmap;
  const cur = me.curriculum;
  const m = examMeta[me.targetExam] || examMeta.General;
  const history = (me.scoreHistory || []).slice().sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Screen>
      <PageHeader icon="map" eyebrow="My plan" title={m.label} />

      {r ? (
        <Card>
          <T.semi style={{ fontSize: 15.5 }}>{r.summary}</T.semi>
          <T.muted style={{ marginTop: 4 }}>{r.pace.text}</T.muted>
          <Divider />
          {r.phases.map((p, i) => (
            <View key={p.name} style={{ flexDirection: 'row', marginBottom: i < r.phases.length - 1 ? 16 : 0 }}>
              <View style={{ alignItems: 'center', width: 26 }}>
                <View style={[styles.dot, { backgroundColor: m.color }]} />
                {i < r.phases.length - 1 && <View style={styles.line} />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <T.semi style={{ fontSize: 15 }}>{p.name}</T.semi>
                  <T.small style={{ marginLeft: 8 }}>{p.weeks} wk</T.small>
                </View>
                {p.focus.map((f) => (
                  <View key={f} style={{ flexDirection: 'row', marginTop: 4 }}>
                    <Text style={{ color: m.color, marginRight: 6 }}>—</Text>
                    <T.body style={{ flex: 1, fontSize: 13.5 }}>{f}</T.body>
                  </View>
                ))}
              </View>
            </View>
          ))}
          <Divider />
          <T.semi style={{ marginBottom: 8 }}>Weekly plan</T.semi>
          {r.weekly.map((w, i) => (
            <View key={w.day} style={[styles.row, i > 0 && styles.rowBorder, { paddingVertical: 7 }]}>
              <T.small style={{ width: 88, fontFamily: fonts.bodySemi, color: colors.ink }}>{w.day}</T.small>
              <T.body style={{ flex: 1, fontSize: 13.5 }}>{w.activity}</T.body>
              <T.small>{w.mins} min</T.small>
            </View>
          ))}
        </Card>
      ) : (
        <Card>
          <EmptyState icon="map-outline" title="No roadmap yet" body="Vedya will generate your study roadmap soon." />
        </Card>
      )}

      {cur && (
        <>
          <SectionTitle icon="construct">Curriculum</SectionTitle>
          <Card>
            {(() => {
              const done = cur.units.filter((u) => u.status === 'done').length;
              return (
                <>
                  <T.semi style={{ marginBottom: 6 }}>{done}/{cur.units.length} units completed</T.semi>
                  <View style={{ height: 7, borderRadius: 4, backgroundColor: m.soft, marginBottom: 10 }}>
                    <View style={{ width: `${cur.units.length ? (done / cur.units.length) * 100 : 0}%`, height: 7, borderRadius: 4, backgroundColor: m.color }} />
                  </View>
                </>
              );
            })()}
            {cur.units.map((u, i) => (
              <View key={u.id} style={[styles.row, i > 0 && styles.rowBorder]}>
                <View style={[styles.num, u.status === 'done' && { backgroundColor: m.color }]}>
                  <Text style={[styles.numText, u.status === 'done' && { color: '#fff' }]}>{u.order}</Text>
                </View>
                <T.body style={[{ flex: 1, marginLeft: 10 }, u.status === 'done' && { color: colors.faint }]}>
                  {u.title}
                </T.body>
                <T.small style={{ color: u.status === 'in-progress' ? colors.marigold : colors.faint, fontFamily: fonts.bodySemi }}>
                  {u.status === 'in-progress' ? 'In progress' : u.status === 'done' ? 'Done' : ''}
                </T.small>
              </View>
            ))}
          </Card>
        </>
      )}

      {history.length > 0 && (
        <>
          <SectionTitle icon="trending-up">Score history</SectionTitle>
          <Card>
            {history.map((h, i) => (
              <View key={h.id} style={[styles.row, i > 0 && styles.rowBorder]}>
                <T.small style={{ width: 110 }}>{formatShort(h.date)}</T.small>
                <T.semi>{h.score} {m.unit}</T.semi>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  dot: { width: 11, height: 11, borderRadius: 6, marginTop: 5 },
  line: { flex: 1, width: 2, backgroundColor: colors.line, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  num: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.pineSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.pineDark },
});
