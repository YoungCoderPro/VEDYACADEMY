// Student portal — Home. What the student sees: their upcoming lessons,
// homework (which they can check off), and their score journey.

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen, Card, SectionTitle, T, Hero, ScoreJourney, EmptyState, Button, StatusPill,
} from '../../components/ui';
import { useData, lessonsInRange } from '../../lib/store';
import { colors, fonts, examMeta } from '../../lib/theme';
import { todayKey, formatLong, formatShort, formatTime } from '../../lib/dates';

export default function StudentHome() {
  const data = useData();
  const me = data.students[0];
  const t = todayKey();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const upcoming = useMemo(
    () => lessonsInRange(data, t, 14).filter((l) => l.status !== 'cancelled').slice(0, 5),
    [data],
  );

  if (!me) return null;
  const scores = me.exams?.[me.targetExam];
  const meta = examMeta[me.targetExam] || examMeta.General;
  const openHw = (me.homework || []).filter((h) => !h.done).sort((a, b) => a.due.localeCompare(b.due));
  const doneHw = (me.homework || []).filter((h) => h.done);

  return (
    <Screen>
      <Hero>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroEyebrow}>VEDYACADEMY · STUDENT</Text>
            <Text style={styles.hello}>{greeting}, {me.name.split(' ')[0]}</Text>
            <Text style={styles.date}>{formatLong(t)}</Text>
          </View>
          <Pressable onPress={() => data.signOut()} hitSlop={8} style={{ padding: 6 }}>
            <Ionicons name="log-out-outline" size={20} color="#F4F7FB" />
          </Pressable>
        </View>
        {scores && meta.scored !== false && (
          <View style={styles.heroScore}>
            <T.small style={{ color: '#C9D6E8' }}>
              {meta.label}: {scores.current} now → goal {scores.goal} {meta.unit}
            </T.small>
            <ScoreJourney exam={me.targetExam} current={scores.current} goal={scores.goal} compact />
          </View>
        )}
      </Hero>

      <SectionTitle icon="calendar">Upcoming lessons</SectionTitle>
      {upcoming.length === 0 ? (
        <Card><T.muted>No lessons scheduled in the next two weeks.</T.muted></Card>
      ) : (
        <Card>
          {upcoming.map((l, i) => (
            <View key={l.id} style={[styles.row, i > 0 && styles.rowBorder]}>
              <View style={{ width: 84 }}>
                <T.small style={{ fontFamily: fonts.bodySemi, color: colors.ink }}>
                  {l.date === t ? 'Today' : formatShort(l.date).replace(/, \d{4}$/, '')}
                </T.small>
                <T.small>{formatTime(l.time)}</T.small>
              </View>
              <T.body style={{ flex: 1 }}>{l.duration} min lesson with Vedya</T.body>
              <StatusPill status={l.status} />
            </View>
          ))}
        </Card>
      )}

      <SectionTitle icon="clipboard">My homework</SectionTitle>
      {openHw.length === 0 && doneHw.length === 0 ? (
        <Card>
          <EmptyState icon="sparkles-outline" title="No homework yet" body="Assignments from Vedya will appear here." />
        </Card>
      ) : (
        <Card>
          {[...openHw, ...doneHw].map((h, i) => (
            <Pressable
              key={h.id}
              onPress={() => data.toggleMyHomework(h.id)}
              style={[styles.row, i > 0 && styles.rowBorder]}
            >
              <Ionicons
                name={h.done ? 'checkbox' : 'square-outline'}
                size={20}
                color={h.done ? colors.pine : colors.faint}
                style={{ marginRight: 10 }}
              />
              <View style={{ flex: 1 }}>
                <T.body style={h.done && { textDecorationLine: 'line-through', color: colors.faint }}>
                  {h.title}
                </T.body>
                <T.small style={!h.done && h.due < t && { color: colors.danger }}>
                  due {formatShort(h.due)}{!h.done && h.due < t ? ' · overdue' : ''}
                </T.small>
              </View>
            </Pressable>
          ))}
          <T.small style={{ marginTop: 8 }}>Tap an assignment to mark it done.</T.small>
        </Card>
      )}

      <View style={{ marginTop: 18, alignItems: 'center' }}>
        <Button title="Refresh" icon="refresh" kind="quiet" small onPress={() => data.refresh()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroEyebrow: {
    fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 2.2,
    color: colors.marigold, marginBottom: 6,
  },
  hello: { fontFamily: fonts.displayBold, fontSize: 30, color: '#F4F7FB' },
  date: { fontFamily: fonts.body, fontSize: 14, color: '#C9D6E8', marginTop: 4 },
  heroScore: {
    marginTop: 16, backgroundColor: '#FFFFFF14', borderWidth: 1, borderColor: '#FFFFFF22',
    borderRadius: 16, padding: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
});
