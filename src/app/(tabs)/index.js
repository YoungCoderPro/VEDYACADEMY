// Today — the home screen. What matters right now: today's lessons, homework
// coming due, and anything that needs attention (unpaid balances).

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import {
  Avatar,
  Button,
  Card,
  Divider,
  EmptyState,
  ExamTag,
  Hero,
  IconBtn,
  Screen,
  SectionTitle,
  Sheet,
  StatusPill,
  T
} from '../../components/ui';
import { addDays, formatLong, formatShort, formatTime, todayKey } from '../../lib/dates';
import { balanceFor, exportSnapshot, lessonsInRange, lessonsOnDate, monthlyIncome, useData } from '../../lib/store';
import { colors, examMeta, fonts } from '../../lib/theme';

export default function Today() {
  const data = useData();
  const router = useRouter();
  const t = todayKey();
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const todays = useMemo(() => lessonsOnDate(data, t), [data]);
  const week = useMemo(() => lessonsInRange(data, addDays(t, 1), 6), [data]);
  const active = data.students.filter((s) => !s.archived);

  const byId = Object.fromEntries(data.students.map((s) => [s.id, s]));

  const dueHomework = active.flatMap((s) =>
    (s.homework || [])
      .filter((h) => !h.done && h.due && h.due <= addDays(t, 3))
      .map((h) => ({ ...h, student: s })),
  ).sort((a, b) => a.due.localeCompare(b.due));

  const balances = active
    .map((s) => ({ student: s, ...balanceFor(data, s) }))
    .filter((b) => b.balance > 0)
    .sort((a, b) => b.balance - a.balance);

  const weekHours = [...todays, ...week]
    .filter((l) => l.status !== 'cancelled')
    .reduce((a, l) => a + (l.duration || 60) / 60, 0);

  const income = monthlyIncome(data);

  return (
    <Screen>
      <Hero>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroEyebrow}>VEDYACADEMY</Text>
            <Text style={styles.hello}>{greeting}, Vedya</Text>
            <Text style={styles.date}>{formatLong(t)}</Text>
          </View>
          <IconBtn icon="settings-outline" color="#F4F6F2" onPress={() => setSettingsOpen(true)} />
        </View>
        <View style={styles.statRow}>
          <Stat icon="book" label="Lessons today" value={todays.filter((l) => l.status !== 'cancelled').length} />
          <Stat icon="time" label="Hours this week" value={Math.round(weekHours * 10) / 10} />
          <Stat icon="people" label="Active students" value={active.length} />
          <Stat icon="wallet" label="Earned this month" value={income.earned.toLocaleString()} />
        </View>
      </Hero>

      <SectionTitle icon="sunny">Today’s lessons</SectionTitle>
      {todays.length === 0 ? (
        <Card>
          <EmptyState
            icon="cafe-outline"
            title="No lessons today"
            body="Enjoy the quiet — or use the calendar to schedule one."
            action={<Button title="Open calendar" kind="quiet" small onPress={() => router.push('/calendar')} />}
          />
        </Card>
      ) : (
        todays.map((l) => {
          const s = byId[l.studentId];
          if (!s) return null;
          return (
            <Card
              key={l.id}
              style={{ marginBottom: 10 }}
              accent={examMeta[s.targetExam]?.color}
              onPress={() => router.push(`/student/${s.id}`)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Avatar name={s.name} color={s.color} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <T.semi>{s.name}</T.semi>
                  <T.muted>
                    {formatTime(l.time)} · {l.duration} min{l.kind === 'recurring' ? ' · weekly' : ''}
                  </T.muted>
                </View>
                <StatusPill status={l.status} />
              </View>
            </Card>
          );
        })
      )}

      {dueHomework.length > 0 && (
        <>
          <SectionTitle icon="clipboard">Homework due soon</SectionTitle>
          <Card>
            {dueHomework.map((h, i) => (
              <View key={h.id} style={[styles.hwRow, i > 0 && styles.hwBorder]}>
                <Ionicons
                  name={h.due < t ? 'alert-circle' : 'ellipse-outline'}
                  size={18}
                  color={h.due < t ? colors.danger : colors.faint}
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <T.body>{h.title}</T.body>
                  <T.small>
                    {h.student.name} · due {formatShort(h.due)}{h.due < t ? ' · overdue' : ''}
                  </T.small>
                </View>
              </View>
            ))}
          </Card>
        </>
      )}

      {balances.length > 0 && (
        <>
          <SectionTitle icon="cash">Payments to collect</SectionTitle>
          <Card>
            {balances.map((b, i) => (
              <View key={b.student.id} style={[styles.hwRow, i > 0 && styles.hwBorder]}>
                <Avatar name={b.student.name} color={b.student.color} size={32} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <T.semi>{b.student.name}</T.semi>
                  <T.small>{b.hours} hrs taught · {b.paid.toLocaleString()} paid</T.small>
                </View>
                <T.semi style={{ color: colors.danger }}>{b.balance.toLocaleString()}</T.semi>
              </View>
            ))}
          </Card>
        </>
      )}

      <SectionTitle icon="calendar">Coming up this week</SectionTitle>
      {week.filter((l) => l.status !== 'cancelled').length === 0 ? (
        <Card><T.muted>Nothing scheduled for the rest of the week.</T.muted></Card>
      ) : (
        <Card>
          {week
            .filter((l) => l.status !== 'cancelled')
            .map((l, i) => {
              const s = byId[l.studentId];
              if (!s) return null;
              return (
                <View key={l.id} style={[styles.hwRow, i > 0 && styles.hwBorder]}>
                  <View style={{ width: 74 }}>
                    <T.small style={{ fontFamily: fonts.bodySemi, color: colors.ink }}>{formatShort(l.date).replace(/, \d{4}$/, '')}</T.small>
                    <T.small>{formatTime(l.time)}</T.small>
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <T.body>{s.name}</T.body>
                  </View>
                  <ExamTag exam={s.targetExam} />
                </View>
              );
            })}
        </Card>
      )}
      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Screen>
  );
}

function SettingsSheet({ visible, onClose }) {
  const data = useData();

  const doExport = () => {
    const json = exportSnapshot(data);
    if (Platform.OS === 'web') {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vedyacademy-backup-${todayKey()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
  };

  const doImport = () => {
    if (Platform.OS !== 'web') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        data.importSnapshot(text);
        // eslint-disable-next-line no-alert
        window.alert('Backup restored. Note: PDF files themselves aren\u2019t inside the backup \u2014 re-upload any missing ones in the Library.');
        onClose();
      } catch (e) {
        // eslint-disable-next-line no-alert
        window.alert(`Couldn\u2019t restore: ${e.message}`);
      }
    };
    input.click();
  };

  const doReset = () => {
    const go = () => { data.clearAll(); onClose(); };
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm('Erase ALL students, lessons and documents? Export a backup first if unsure.')) go();
    } else {
      Alert.alert('Erase everything?', 'Export a backup first if unsure.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Erase all', style: 'destructive', onPress: go },
      ]);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Settings & backup">
      <T.semi style={{ marginBottom: 4 }}>Back up your data</T.semi>
      <T.muted style={{ marginBottom: 10 }}>
        Everything lives in this browser. Download a backup file regularly and keep it somewhere safe
        (Google Drive, a USB stick). PDF files are not included — keep your originals.
      </T.muted>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
        <Button title="Download backup" icon="download-outline" onPress={doExport} style={{ flex: 1 }} />
        <Button title="Restore backup" icon="folder-open-outline" kind="ghost" onPress={doImport} style={{ flex: 1 }} />
      </View>
      <Divider />
      <T.semi style={{ marginBottom: 4 }}>Danger zone</T.semi>
      <T.muted style={{ marginBottom: 10 }}>Start from a clean slate. This cannot be undone.</T.muted>
      <Button title="Erase all data" icon="trash-outline" kind="danger" onPress={doReset} />
    </Sheet>
  );
}

function Stat({ icon, label, value }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={16} color={colors.marigold} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroEyebrow: {
    fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 2.2,
    color: colors.marigold, marginBottom: 6,
  },
  hello: { fontFamily: fonts.displayBold, fontSize: 32, color: '#F4F6F2' },
  date: { fontFamily: fonts.body, fontSize: 14, color: '#C9D6CF', marginTop: 4, marginBottom: 18 },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    flexGrow: 1, flexBasis: 130, backgroundColor: '#FFFFFF14',
    borderWidth: 1, borderColor: '#FFFFFF22', borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  statValue: { fontFamily: fonts.display, fontSize: 25, color: '#FFFFFF', marginTop: 6, marginBottom: 1 },
  statLabel: { fontFamily: fonts.body, fontSize: 12, color: '#C9D6CF' },
  hwRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  hwBorder: { borderTopWidth: 1, borderTopColor: colors.line },
});