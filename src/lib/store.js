// Central data store. Everything lives in one context, persisted to
// AsyncStorage (localStorage on web). The shape is deliberately simple so a
// future Supabase layer can replace `persist`/`hydrate` without UI changes.

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uid, todayKey, addDays, fromKey, toKey } from './dates';

const KEY = 'vedyacademy-data-v1';
const Ctx = createContext(null);

// ---------------- seed data ----------------
function seed() {
  const t = todayKey();
  const students = [
    {
      id: 's-demo-1', name: 'Deniz Kaya', grade: '11th grade', school: 'Robert College',
      city: 'Istanbul', phone: '+90 532 000 0000', parent: 'Aylin Kaya · +90 533 000 0000',
      email: 'deniz@example.com', targetExam: 'SAT', hourlyRate: 900, lessonCost: 1350,
      schoolLevel: 'High school', mode: 'In person', lessonLength: 90,
      exams: { SAT: { current: 600, goal: 750 } },
      notes: 'Strong reader, rushes grammar questions. Loves sci-fi — use it for reading practice.',
      color: '#4C6FA5', archived: false, createdAt: t,
      scoreHistory: [
        { id: uid(), exam: 'SAT', score: 560, date: addDays(t, -120) },
        { id: uid(), exam: 'SAT', score: 600, date: addDays(t, -30) },
      ],
      homework: [
        { id: uid(), title: 'Reading passages 3 & 4 + error log', due: addDays(t, 2), done: false },
        { id: uid(), title: 'Punctuation worksheet', due: addDays(t, -3), done: true },
      ],
      payments: [{ id: uid(), amount: 7200, date: addDays(t, -20), note: '8-lesson package' }],
      sharedDocs: [], roadmap: null,
    },
    {
      id: 's-demo-2', name: 'Lara Öztürk', grade: '12th grade', school: 'Üsküdar American Academy',
      city: 'Istanbul', phone: '+90 532 111 1111', parent: 'Murat Öztürk · +90 533 111 1111',
      email: 'lara@example.com', targetExam: 'IELTS', hourlyRate: 850, lessonCost: 850,
      schoolLevel: 'High school', mode: 'In person', lessonLength: 60,
      exams: { IELTS: { current: 6.5, goal: 7.5 } },
      notes: 'Applying to UK universities. Writing Task 2 is the weak spot.',
      color: '#3A8E8C', archived: false, createdAt: t,
      scoreHistory: [{ id: uid(), exam: 'IELTS', score: 6.5, date: addDays(t, -45) }],
      homework: [{ id: uid(), title: 'Task 2 essay: technology in education', due: addDays(t, 1), done: false }],
      payments: [],
      sharedDocs: [], roadmap: null,
    },
    {
      id: 's-demo-3', name: 'Emir Demir', grade: '9th grade', school: 'TED Ankara',
      city: 'Ankara (online)', phone: '+90 532 222 2222', parent: 'Selin Demir · +90 533 222 2222',
      email: 'emir@example.com', targetExam: 'General', hourlyRate: 700, lessonCost: 700,
      schoolLevel: 'Middle school', mode: 'Remote', lessonLength: 60,
      exams: { General: { current: 60, goal: 85 } },
      notes: 'Building general fluency before starting TOEFL prep next year.',
      color: '#7A6FA5', archived: false, createdAt: t,
      scoreHistory: [], homework: [], payments: [],
      sharedDocs: [], roadmap: null,
    },
  ];

  // recurring weekly lessons
  const recurring = [
    { id: uid(), studentId: 's-demo-1', weekday: 4, time: '17:00', duration: 90, startDate: addDays(t, -60), endDate: null, overrides: {} },
    { id: uid(), studentId: 's-demo-2', weekday: 2, time: '18:30', duration: 60, startDate: addDays(t, -45), endDate: null, overrides: {} },
    { id: uid(), studentId: 's-demo-3', weekday: 6, time: '11:00', duration: 60, startDate: addDays(t, -30), endDate: null, overrides: {} },
  ];

  return { students, lessons: [], recurring, documents: [], seeded: true };
}

// ---------------- provider ----------------
export function DataProvider({ children }) {
  const [state, setState] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        setState(raw ? JSON.parse(raw) : seed());
      } catch (e) {
        setState(seed());
      }
    })();
  }, []);

  useEffect(() => {
    if (!state) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
    }, 250);
  }, [state]);

  const api = useMemo(() => {
    if (!state) return null;
    const set = (fn) => setState((s) => fn(s));

    return {
      ...state,

      // ----- students -----
      addStudent: (data) => {
        const student = {
          id: uid(), name: '', grade: '', school: '', city: '', phone: '', parent: '',
          email: '', targetExam: 'SAT', hourlyRate: 0, lessonCost: 0,
          schoolLevel: 'High school', mode: 'In person', lessonLength: 60,
          exams: {}, notes: '', curriculum: null,
          color: '#2F6B54', archived: false, createdAt: todayKey(),
          scoreHistory: [], homework: [], payments: [], sharedDocs: [], roadmap: null,
          ...data,
        };
        set((s) => ({ ...s, students: [...s.students, student] }));
        return student.id;
      },
      updateStudent: (id, patch) =>
        set((s) => ({ ...s, students: s.students.map((st) => (st.id === id ? { ...st, ...patch } : st)) })),
      deleteStudent: (id) =>
        set((s) => ({
          ...s,
          students: s.students.filter((st) => st.id !== id),
          lessons: s.lessons.filter((l) => l.studentId !== id),
          recurring: s.recurring.filter((r) => r.studentId !== id),
        })),

      // nested student helpers
      pushToStudent: (id, field, item) =>
        set((s) => ({
          ...s,
          students: s.students.map((st) => (st.id === id ? { ...st, [field]: [...(st[field] || []), item] } : st)),
        })),
      removeFromStudent: (id, field, itemId) =>
        set((s) => ({
          ...s,
          students: s.students.map((st) =>
            st.id === id ? { ...st, [field]: (st[field] || []).filter((x) => x.id !== itemId) } : st),
        })),
      toggleHomework: (id, hwId) =>
        set((s) => ({
          ...s,
          students: s.students.map((st) =>
            st.id === id
              ? { ...st, homework: st.homework.map((h) => (h.id === hwId ? { ...h, done: !h.done } : h)) }
              : st),
        })),

      // ----- one-off lessons -----
      addLesson: (data) => {
        const lesson = { id: uid(), status: 'scheduled', note: '', duration: 60, ...data };
        set((s) => ({ ...s, lessons: [...s.lessons, lesson] }));
        return lesson.id;
      },
      updateLesson: (id, patch) =>
        set((s) => ({ ...s, lessons: s.lessons.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      deleteLesson: (id) => set((s) => ({ ...s, lessons: s.lessons.filter((l) => l.id !== id) })),

      // ----- recurring lessons -----
      addRecurring: (data) => {
        const rule = { id: uid(), overrides: {}, endDate: null, duration: 60, ...data };
        set((s) => ({ ...s, recurring: [...s.recurring, rule] }));
        return rule.id;
      },
      updateRecurring: (id, patch) =>
        set((s) => ({ ...s, recurring: s.recurring.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      // per-date override: {status:'cancelled'} or {time,duration} or {status:'completed'}
      overrideOccurrence: (ruleId, dateKey, patch) =>
        set((s) => ({
          ...s,
          recurring: s.recurring.map((r) =>
            r.id === ruleId
              ? { ...r, overrides: { ...r.overrides, [dateKey]: { ...(r.overrides[dateKey] || {}), ...patch } } }
              : r),
        })),
      endRecurring: (ruleId, dateKey) =>
        set((s) => ({
          ...s,
          recurring: s.recurring.map((r) => (r.id === ruleId ? { ...r, endDate: dateKey } : r)),
        })),
      deleteRecurring: (ruleId) =>
        set((s) => ({ ...s, recurring: s.recurring.filter((r) => r.id !== ruleId) })),

      // ----- documents -----
      addDocument: (doc) => {
        const d = { id: uid(), addedAt: todayKey(), ...doc };
        set((s) => ({ ...s, documents: [...s.documents, d] }));
        return d.id;
      },
      updateDocument: (id, patch) =>
        set((s) => ({ ...s, documents: s.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      deleteDocument: (id) =>
        set((s) => ({
          ...s,
          documents: s.documents.filter((d) => d.id !== id),
          students: s.students.map((st) => ({ ...st, sharedDocs: (st.sharedDocs || []).filter((x) => x !== id) })),
        })),
      shareDocuments: (studentId, docIds) =>
        set((s) => ({
          ...s,
          students: s.students.map((st) =>
            st.id === studentId
              ? { ...st, sharedDocs: Array.from(new Set([...(st.sharedDocs || []), ...docIds])) }
              : st),
        })),
      unshareDocument: (studentId, docId) =>
        set((s) => ({
          ...s,
          students: s.students.map((st) =>
            st.id === studentId ? { ...st, sharedDocs: (st.sharedDocs || []).filter((x) => x !== docId) } : st),
        })),

      importSnapshot: (json) => {
        const parsed = JSON.parse(json);
        if (parsed?.app !== 'vedyacademy' || !Array.isArray(parsed.students)) {
          throw new Error('This file is not a VedyAcademy backup.');
        }
        setState({
          students: parsed.students,
          lessons: parsed.lessons || [],
          recurring: parsed.recurring || [],
          documents: parsed.documents || [],
          seeded: true,
        });
      },
      resetAll: () => setState(seed()),
      clearAll: () => setState({ students: [], lessons: [], recurring: [], documents: [], seeded: true }),
    };
  }, [state]);

  if (!api) return null;
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export const useData = () => useContext(Ctx);

// ---------------- derived helpers ----------------

// All lesson occurrences on a date: one-offs + expanded recurring rules.
export function lessonsOnDate(data, dateKey) {
  const weekday = fromKey(dateKey).getDay();
  const out = data.lessons
    .filter((l) => l.date === dateKey)
    .map((l) => ({ ...l, kind: 'single' }));

  for (const r of data.recurring) {
    if (r.weekday !== weekday) continue;
    if (dateKey < r.startDate) continue;
    if (r.endDate && dateKey > r.endDate) continue;
    const ov = r.overrides?.[dateKey] || {};
    out.push({
      id: `${r.id}@${dateKey}`,
      ruleId: r.id,
      kind: 'recurring',
      studentId: r.studentId,
      date: dateKey,
      time: ov.time || r.time,
      duration: ov.duration || r.duration,
      status: ov.status || 'scheduled',
      note: ov.note || '',
    });
  }
  return out.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
}

export function lessonsInRange(data, startKey, days) {
  const out = [];
  let k = startKey;
  for (let i = 0; i < days; i++) {
    for (const l of lessonsOnDate(data, k)) out.push(l);
    k = addDays(k, 1);
  }
  return out;
}

// Money: hours delivered (past, not cancelled) * rate - payments
export function balanceFor(data, student) {
  const t = todayKey();
  let hours = 0;
  let count = 0;
  // look back up to 365 days
  const start = addDays(t, -365);
  let k = start;
  while (k <= t) {
    for (const l of lessonsOnDate(data, k)) {
      if (l.studentId === student.id && l.status !== 'cancelled') {
        hours += (l.duration || 60) / 60;
        count += 1;
      }
    }
    k = addDays(k, 1);
  }
  // Per-lesson pricing wins if set; otherwise fall back to hourly rate.
  const earned = student.lessonCost
    ? count * student.lessonCost
    : hours * (student.hourlyRate || 0);
  const paid = (student.payments || []).reduce((a, p) => a + Number(p.amount || 0), 0);
  return { hours: Math.round(hours * 10) / 10, lessons: count, earned, paid, balance: earned - paid };
}

// Income summary for the current calendar month: value of delivered lessons
// (earned) and payments received (collected).
export function monthlyIncome(data) {
  const t = todayKey();
  const monthStart = t.slice(0, 8) + '01';
  const byId = Object.fromEntries(data.students.map((s) => [s.id, s]));
  let earned = 0;
  let k = monthStart;
  while (k <= t) {
    for (const l of lessonsOnDate(data, k)) {
      const st = byId[l.studentId];
      if (!st || l.status === 'cancelled') continue;
      earned += st.lessonCost ? st.lessonCost : ((l.duration || 60) / 60) * (st.hourlyRate || 0);
    }
    k = addDays(k, 1);
  }
  let collected = 0;
  for (const st of data.students) {
    for (const p of st.payments || []) {
      if (p.date >= monthStart && p.date <= t) collected += Number(p.amount || 0);
    }
  }
  return { earned: Math.round(earned), collected: Math.round(collected) };
}

// Full snapshot for export / import backups.
export function exportSnapshot(data) {
  return JSON.stringify({
    app: 'vedyacademy', version: 1, exportedAt: new Date().toISOString(),
    students: data.students, lessons: data.lessons,
    recurring: data.recurring, documents: data.documents,
  }, null, 2);
}

export function nextLessonFor(data, studentId) {
  const t = todayKey();
  for (let i = 0; i < 60; i++) {
    const k = addDays(t, i);
    const found = lessonsOnDate(data, k).find(
      (l) => l.studentId === studentId && l.status === 'scheduled' && (i > 0 || true),
    );
    if (found) return found;
  }
  return null;
}
