// Students — the dashboard. Search, filter by exam, add new students, and
// open a student's full profile.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import {
  Avatar,
  Button,
  Card,
  Chip,
  ChipSelect,
  EmptyState,
  ExamTag,
  Field,
  PageHeader,
  ScoreJourney,
  Screen,
  Sheet,
  T,
} from '../../components/ui';
import { formatShort, formatTime } from '../../lib/dates';
import { nextLessonFor, useData } from '../../lib/store';
import { colors, examMeta, fonts, LESSON_MODES, PURPOSES, SCHOOL_LEVELS } from '../../lib/theme';

const GRADES = ['1st–4th grade', '5th grade', '6th grade', '7th grade', '8th grade', '9th grade', '10th grade', '11th grade', '12th grade', 'University', 'Adult'];
const STUDENT_COLORS = ['#2F6B54', '#4C6FA5', '#C96F4A', '#3A8E8C', '#7A6FA5', '#B0713F', '#5E7D3E', '#A5537A'];

export default function Students() {
  const data = useData();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [examFilter, setExamFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');
  const [showArchived, setShowArchived] = useState(false);
  const [adding, setAdding] = useState(false);

  const students = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.students
      .filter((s) => (showArchived ? s.archived : !s.archived))
      .filter((s) => examFilter === 'All' || s.targetExam === examFilter)
      .filter((s) => levelFilter === 'All' || s.schoolLevel === levelFilter)
      .filter((s) => modeFilter === 'All' || s.mode === modeFilter)
      .filter((s) => !q || s.name.toLowerCase().includes(q) || (s.school || '').toLowerCase().includes(q) || (s.city || '').toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.students, query, examFilter, levelFilter, modeFilter, showArchived]);

  return (
    <Screen>
      <PageHeader
        icon="people"
        eyebrow="VedyAcademy"
        title="Students"
        right={<Button title="Add student" icon="add" onPress={() => setAdding(true)} />}
      />

      {/* search + filters */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={17} color={colors.faint} style={{ marginRight: 8 }} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, school, or city"
          placeholderTextColor={colors.faint}
          style={styles.searchInput}
        />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {['All', ...PURPOSES].map((e) => (
          <Chip key={e} label={e} active={examFilter === e} onPress={() => setExamFilter(e)} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18, alignItems: 'center' }}>
        {SCHOOL_LEVELS.map((l) => (
          <Chip
            key={l} label={l} active={levelFilter === l}
            onPress={() => setLevelFilter(levelFilter === l ? 'All' : l)}
            color={colors.sat} soft={colors.satSoft}
          />
        ))}
        {LESSON_MODES.map((mo) => (
          <Chip
            key={mo} label={mo} active={modeFilter === mo}
            onPress={() => setModeFilter(modeFilter === mo ? 'All' : mo)}
            color={colors.toefl} soft={colors.toeflSoft}
          />
        ))}
        <Chip
          label={showArchived ? 'Showing archived' : 'Archived'}
          active={showArchived}
          onPress={() => setShowArchived(!showArchived)}
          color={colors.muted}
          soft="#EDEFEC"
        />
      </View>

      {students.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title={showArchived ? 'No archived students' : 'No students found'}
          body={showArchived ? 'Archived students will appear here.' : 'Add your first student to build the dashboard.'}
          action={!showArchived && <Button title="Add student" icon="add" onPress={() => setAdding(true)} />}
        />
      ) : (
        <View style={styles.grid}>
          {students.map((s) => (
            <StudentCard key={s.id} student={s} data={data} onPress={() => router.push(`/student/${s.id}`)} />
          ))}
        </View>
      )}

      <AddStudentSheet visible={adding} onClose={() => setAdding(false)} />
    </Screen>
  );
}

function StudentCard({ student: s, data, onPress }) {
  const scores = s.exams?.[s.targetExam];
  const next = nextLessonFor(data, s.id);
  return (
    <Card onPress={onPress} style={styles.card} accent={examMeta[s.targetExam]?.color}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar name={s.name} color={s.color} size={46} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <T.semi style={{ fontSize: 16 }}>{s.name}</T.semi>
          <T.small>{[s.grade, s.school].filter(Boolean).join(' · ')}</T.small>
        </View>
        <ExamTag exam={s.targetExam} />
      </View>
      {scores && typeof scores.current === 'number' && typeof scores.goal === 'number' ? (
        <ScoreJourney exam={s.targetExam} current={scores.current} goal={scores.goal} />
      ) : (
        <T.small style={{ marginTop: 10 }}>No scores yet — open profile to add.</T.small>
      )}
      <View style={styles.cardFooter}>
        <Ionicons name="calendar-clear-outline" size={13} color={colors.faint} style={{ marginRight: 5 }} />
        <T.small style={{ flex: 1 }}>
          {next ? `Next lesson ${formatShort(next.date)} · ${formatTime(next.time)}` : 'No upcoming lesson'}
        </T.small>
        <T.small>
          {[s.mode, s.lessonLength ? `${s.lessonLength} min` : null, s.lessonCost ? `${Number(s.lessonCost).toLocaleString()}/lesson` : null]
            .filter(Boolean).join(' · ')}
        </T.small>
      </View>
    </Card>
  );
}

export function AddStudentSheet({ visible, onClose, editing }) {
  const data = useData();
  const router = useRouter();
  const isEdit = !!editing;
  const [form, setForm] = useState(null);

  React.useEffect(() => {
    if (visible) {
      setForm(
        isEdit
          ? {
              ...editing,
              lessonLength: String(editing.lessonLength ?? 60),
              lessonCost: editing.lessonCost ? String(editing.lessonCost) : '',
              hourlyRate: editing.hourlyRate ? String(editing.hourlyRate) : '',
              schoolLevel: editing.schoolLevel || 'High school',
              mode: editing.mode || 'In person',
              current: editing.exams?.[editing.targetExam]?.current ?? '',
              goal: editing.exams?.[editing.targetExam]?.goal ?? '',
            }
          : {
              name: '', grade: '9th grade', school: '', city: '', phone: '', parent: '', email: '',
              targetExam: 'SAT', hourlyRate: '', lessonCost: '', lessonLength: '60',
              schoolLevel: 'High school', mode: 'In person',
              notes: '', current: '', goal: '',
              color: STUDENT_COLORS[Math.floor(Math.random() * STUDENT_COLORS.length)],
            },
      );
    }
  }, [visible]);

  if (!form) return null;
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name.trim()) return;
    const exams = { ...(form.exams || {}) };
    const cur = parseFloat(form.current);
    const goal = parseFloat(form.goal);
    if (examMeta[form.targetExam]?.scored !== false && (!Number.isNaN(cur) || !Number.isNaN(goal))) {
      exams[form.targetExam] = {
        current: Number.isNaN(cur) ? examMeta[form.targetExam].min : cur,
        goal: Number.isNaN(goal) ? examMeta[form.targetExam].max : goal,
      };
    }
    const payload = {
      name: form.name.trim(), grade: form.grade, school: form.school, city: form.city,
      phone: form.phone, parent: form.parent, email: form.email, targetExam: form.targetExam,
      hourlyRate: parseFloat(form.hourlyRate) || 0,
      lessonCost: parseFloat(form.lessonCost) || 0,
      lessonLength: parseInt(form.lessonLength, 10) || 60,
      schoolLevel: form.schoolLevel, mode: form.mode,
      notes: form.notes, color: form.color, exams,
    };
    if (isEdit) {
      data.updateStudent(editing.id, payload);
    } else {
      const id = data.addStudent(payload);
      router.push(`/student/${id}`);
    }
    onClose();
  };

  const m = examMeta[form.targetExam];
  return (
    <Sheet visible={visible} onClose={onClose} title={isEdit ? 'Edit student' : 'New student'}>
      <Field label="Full name" value={form.name} onChangeText={set('name')} placeholder="e.g. Deniz Kaya" />
      <ChipSelect label="Grade" options={GRADES} value={form.grade} onChange={set('grade')} />
      <View style={styles.twoCol}>
        <Field label="School" value={form.school} onChangeText={set('school')} placeholder="School name" style={{ flex: 1 }} />
        <Field label="City / location" value={form.city} onChangeText={set('city')} placeholder="e.g. Istanbul, online" style={{ flex: 1 }} />
      </View>
      <ChipSelect label="School level" options={SCHOOL_LEVELS} value={form.schoolLevel} onChange={set('schoolLevel')} />
      <ChipSelect label="Lesson mode" options={LESSON_MODES} value={form.mode} onChange={set('mode')} />
      <ChipSelect label="Purpose of lessons" options={PURPOSES} value={form.targetExam} onChange={set('targetExam')} />
      {m.scored !== false && (
        <View style={styles.twoCol}>
          <Field
            label={`Current score (${m.min}–${m.max})`}
            value={form.current} onChangeText={set('current')} keyboardType="numeric" placeholder="e.g. 600" style={{ flex: 1 }}
          />
          <Field
            label="Goal score"
            value={form.goal} onChangeText={set('goal')} keyboardType="numeric" placeholder="e.g. 750" style={{ flex: 1 }}
          />
        </View>
      )}
      <View style={styles.twoCol}>
        <Field label="Lesson length (min)" value={form.lessonLength} onChangeText={set('lessonLength')} keyboardType="numeric" placeholder="60" style={{ flex: 1 }} />
        <Field label="Cost per lesson" value={form.lessonCost} onChangeText={set('lessonCost')} keyboardType="numeric" placeholder="e.g. 1200" style={{ flex: 1 }} />
      </View>
      <View style={styles.twoCol}>
        <Field label="Student phone" value={form.phone} onChangeText={set('phone')} placeholder="+90 ..." style={{ flex: 1 }} />
        <Field label="Hourly rate (optional)" value={form.hourlyRate} onChangeText={set('hourlyRate')} keyboardType="numeric" placeholder="used if no lesson cost" style={{ flex: 1 }} />
      </View>
      <Field label="Parent contact" value={form.parent} onChangeText={set('parent')} placeholder="Name · phone" />
      <Field label="Email" value={form.email} onChangeText={set('email')} placeholder="student@example.com" />
      <Field label="Notes" value={form.notes} onChangeText={set('notes')} multiline placeholder="Strengths, weaknesses, interests, anything worth remembering" />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <Button title={isEdit ? 'Save changes' : 'Add student'} onPress={save} style={{ flex: 1 }} disabled={!form.name.trim()} />
        <Button title="Cancel" kind="ghost" onPress={onClose} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1, paddingVertical: 11, fontFamily: fonts.body, fontSize: 14.5, color: colors.ink,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  card: {
    flexGrow: 1, flexBasis: 300, maxWidth: Platform.OS === 'web' ? 508 : '100%',
  },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: colors.line,
  },
  twoCol: { flexDirection: 'row', gap: 10 },
});