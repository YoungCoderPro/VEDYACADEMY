// Calendar — month view with a day agenda underneath. Supports one-off and
// weekly recurring lessons; individual occurrences can be rescheduled,
// cancelled, or marked completed without touching the rest of the series.

import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen, PageHeader, Card, Button, IconBtn, Sheet, Field, ChipSelect, Chip,
  Avatar, StatusPill, T, EmptyState, Divider,
} from '../../components/ui';
import { useData, lessonsOnDate } from '../../lib/store';
import { colors, fonts } from '../../lib/theme';
import {
  monthGrid, todayKey, fromKey, MONTHS, WEEKDAYS, formatTime, formatLong,
  isValidTime, toKey,
} from '../../lib/dates';

const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DURATIONS = ['45', '60', '90', '120'];

export default function Calendar() {
  const data = useData();
  const t = todayKey();
  const now = fromKey(t);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(t);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null); // occurrence being edited

  const cells = useMemo(() => monthGrid(year, month), [year, month]);
  const lessonsByDay = useMemo(() => {
    const map = {};
    for (const c of cells) map[c.key] = lessonsOnDate(data, c.key);
    return map;
  }, [cells, data]);

  const dayLessons = lessonsByDay[selected] || lessonsOnDate(data, selected);
  const byId = Object.fromEntries(data.students.map((s) => [s.id, s]));

  const move = (dir) => {
    let m = month + dir;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  };

  return (
    <Screen>
      <PageHeader
        icon="calendar"
        eyebrow="Schedule"
        title="Calendar"
        right={<Button title="Add lesson" icon="add" onPress={() => setAddOpen(true)} />}
      />

      <Card style={{ padding: 12 }}>
        {/* month header */}
        <View style={styles.monthHeader}>
          <IconBtn icon="chevron-back" onPress={() => move(-1)} color={colors.pine} />
          <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
          <IconBtn icon="chevron-forward" onPress={() => move(1)} color={colors.pine} />
        </View>

        {/* weekday labels */}
        <View style={styles.weekRow}>
          {WD.map((d) => (
            <Text key={d} style={styles.weekday}>{d}</Text>
          ))}
        </View>

        {/* grid */}
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <View key={row} style={styles.weekRow}>
            {cells.slice(row * 7, row * 7 + 7).map((c) => {
              const lessons = (lessonsByDay[c.key] || []).filter((l) => l.status !== 'cancelled');
              const isSel = c.key === selected;
              const isToday = c.key === t;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => {
                    setSelected(c.key);
                    if (!c.inMonth) {
                      const d = fromKey(c.key);
                      setYear(d.getFullYear());
                      setMonth(d.getMonth());
                    }
                  }}
                  style={[styles.dayCell, isSel && styles.daySelected]}
                >
                  <View style={[styles.dayNumWrap, isToday && styles.todayRing]}>
                    <Text style={[
                      styles.dayNum,
                      !c.inMonth && { color: colors.faint },
                      isSel && { color: '#FFFFFF', fontFamily: fonts.bodyBold },
                    ]}>
                      {c.day}
                    </Text>
                  </View>
                  <View style={styles.dotRow}>
                    {lessons.slice(0, 3).map((l) => (
                      <View
                        key={l.id}
                        style={[
                          styles.dot,
                          { backgroundColor: isSel ? '#FFFFFF' : byId[l.studentId]?.color || colors.pine },
                        ]}
                      />
                    ))}
                    {lessons.length > 3 && <Text style={[styles.moreDots, isSel && { color: '#fff' }]}>+</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </Card>

      {/* day agenda */}
      <Text style={styles.agendaTitle}>{formatLong(selected)}</Text>
      {dayLessons.length === 0 ? (
        <Card>
          <EmptyState
            icon="calendar-outline"
            title="Nothing scheduled"
            body="Tap “Add lesson” to schedule a one-off or weekly lesson on this day."
          />
        </Card>
      ) : (
        dayLessons.map((l) => {
          const s = byId[l.studentId];
          if (!s) return null;
          return (
            <Card key={l.id} style={{ marginBottom: 10 }} accent={s.color} onPress={() => setEditing(l)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Avatar name={s.name} color={s.color} size={38} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <T.semi>{s.name}</T.semi>
                  <T.muted>
                    {formatTime(l.time)} · {l.duration} min
                    {l.kind === 'recurring' ? ' · repeats weekly' : ''}
                  </T.muted>
                  {!!l.note && <T.small style={{ marginTop: 2 }}>{l.note}</T.small>}
                </View>
                <StatusPill status={l.status} />
              </View>
            </Card>
          );
        })
      )}

      <AddLessonSheet visible={addOpen} onClose={() => setAddOpen(false)} defaultDate={selected} />
      <EditLessonSheet occurrence={editing} onClose={() => setEditing(null)} />
    </Screen>
  );
}

// ---------------- add lesson ----------------
function AddLessonSheet({ visible, onClose, defaultDate }) {
  const data = useData();
  const [studentId, setStudentId] = useState(null);
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('17:00');
  const [duration, setDuration] = useState('60');
  const [repeat, setRepeat] = useState(false);
  const [note, setNote] = useState('');

  React.useEffect(() => {
    if (visible) {
      setDate(defaultDate);
      setStudentId(null);
      setRepeat(false);
      setNote('');
    }
  }, [visible]);

  const active = data.students.filter((s) => !s.archived);
  const valid = studentId && isValidTime(time) && /^\d{4}-\d{2}-\d{2}$/.test(date);

  // default the duration to the student's usual lesson length
  const pickStudent = (id) => {
    setStudentId(id);
    const st = data.students.find((x) => x.id === id);
    if (st?.lessonLength) setDuration(String(st.lessonLength));
  };

  const save = () => {
    if (!valid) return;
    if (repeat) {
      data.addRecurring({
        studentId,
        weekday: fromKey(date).getDay(),
        time,
        duration: parseInt(duration, 10),
        startDate: date,
      });
    } else {
      data.addLesson({ studentId, date, time, duration: parseInt(duration, 10), note });
    }
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Add lesson">
      <Text style={styles.fieldLabel}>Student</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {active.map((s) => (
          <Chip key={s.id} label={s.name} active={studentId === s.id} onPress={() => pickStudent(s.id)} />
        ))}
        {active.length === 0 && <T.muted>Add a student first from the Students tab.</T.muted>}
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-07-15" style={{ flex: 1 }} />
        <Field label="Time (24h HH:MM)" value={time} onChangeText={setTime} placeholder="17:00" style={{ flex: 1 }} />
      </View>
      <ChipSelect label="Duration (minutes)" options={DURATIONS} value={duration} onChange={setDuration} />
      <Pressable onPress={() => setRepeat(!repeat)} style={styles.toggleRow}>
        <Ionicons
          name={repeat ? 'checkbox' : 'square-outline'}
          size={20}
          color={repeat ? colors.pine : colors.faint}
        />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <T.semi>Repeat weekly</T.semi>
          <T.small>
            Every {WEEKDAYS[fromKey(/^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayKey()).getDay()]} at the same time, starting {date}
          </T.small>
        </View>
      </Pressable>
      {!repeat && <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Topic, homework to check, ..." />}
      <Button title={repeat ? 'Add weekly lesson' : 'Add lesson'} onPress={save} disabled={!valid} />
    </Sheet>
  );
}

// ---------------- edit occurrence ----------------
function EditLessonSheet({ occurrence: l, onClose }) {
  const data = useData();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  React.useEffect(() => {
    if (l) { setTime(l.time); setDate(l.date); setNote(l.note || ''); }
  }, [l]);

  const saveNote = () => {
    if (!l) return;
    if (l.kind === 'recurring') data.overrideOccurrence(l.ruleId, l.date, { note });
    else data.updateLesson(l.id, { note });
    onClose();
  };

  if (!l) return null;
  const student = data.students.find((s) => s.id === l.studentId);
  const isRecurring = l.kind === 'recurring';

  const applyTimeChange = () => {
    if (!isValidTime(time)) return;
    if (isRecurring) {
      if (date !== l.date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        // move this occurrence: cancel it here, create a one-off on the new date
        data.overrideOccurrence(l.ruleId, l.date, { status: 'cancelled' });
        data.addLesson({ studentId: l.studentId, date, time, duration: l.duration, note: 'Rescheduled lesson' });
      } else {
        data.overrideOccurrence(l.ruleId, l.date, { time });
      }
    } else {
      data.updateLesson(l.id, { time, date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : l.date });
    }
    onClose();
  };

  const setStatus = (status) => {
    if (isRecurring) data.overrideOccurrence(l.ruleId, l.date, { status });
    else data.updateLesson(l.id, { status });
    onClose();
  };

  return (
    <Sheet visible={!!l} onClose={onClose} title={student?.name || 'Lesson'}>
      <T.muted style={{ marginBottom: 14 }}>
        {formatLong(l.date)} · {formatTime(l.time)} · {l.duration} min
        {isRecurring ? ' · part of a weekly series' : ''}
      </T.muted>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 6 }}>
        {l.status !== 'completed' && (
          <Button title="Mark completed" icon="checkmark" kind="quiet" small onPress={() => setStatus('completed')} />
        )}
        {l.status !== 'cancelled' && (
          <Button title={isRecurring ? 'Cancel this week' : 'Cancel lesson'} icon="close" kind="danger" small onPress={() => setStatus('cancelled')} />
        )}
        {l.status !== 'scheduled' && (
          <Button title="Back to scheduled" kind="ghost" small onPress={() => setStatus('scheduled')} />
        )}
      </View>

      <Divider />
      <T.semi style={{ marginBottom: 10 }}>Reschedule</T.semi>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field label="Date" value={date} onChangeText={setDate} style={{ flex: 1 }} />
        <Field label="Time" value={time} onChangeText={setTime} style={{ flex: 1 }} />
      </View>
      <Button title="Save new date / time" kind="primary" onPress={applyTimeChange} disabled={!isValidTime(time)} />

      <Divider />
      <T.semi style={{ marginBottom: 10 }}>Lesson notes</T.semi>
      <Field
        value={note} onChangeText={setNote} multiline
        placeholder="What was covered, what to prepare for next time..."
      />
      <Button title="Save notes" kind="quiet" onPress={saveNote} />

      <Divider />
      {isRecurring ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            title="End series after this date" kind="ghost" small
            onPress={() => { data.endRecurring(l.ruleId, l.date); onClose(); }}
          />
          <Button
            title="Delete entire series" kind="danger" small
            onPress={() => { data.deleteRecurring(l.ruleId); onClose(); }}
          />
        </View>
      ) : (
        <Button title="Delete lesson" kind="danger" small onPress={() => { data.deleteLesson(l.id); onClose(); }} />
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  monthTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.ink },
  weekRow: { flexDirection: 'row' },
  weekday: {
    flex: 1, textAlign: 'center', fontFamily: fonts.bodySemi, fontSize: 11.5,
    color: colors.faint, paddingVertical: 6,
  },
  dayCell: {
    flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 10, margin: 1,
  },
  daySelected: {
    backgroundColor: colors.pine,
    shadowColor: colors.pineDark, shadowOpacity: 0.25, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  dayNumWrap: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  todayRing: { borderWidth: 1.5, borderColor: colors.marigold },
  dayNum: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.ink },
  dotRow: { flexDirection: 'row', alignItems: 'center', height: 8, marginTop: 3, gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: '#FFFFFF' },
  moreDots: { fontSize: 9, color: colors.faint, marginLeft: 1 },
  agendaTitle: {
    fontFamily: fonts.display, fontSize: 19, color: colors.ink, marginTop: 22, marginBottom: 10,
  },
  fieldLabel: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.muted, marginBottom: 6 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, marginBottom: 14,
  },
});
