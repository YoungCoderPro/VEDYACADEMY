// Central data store — Supabase edition.
// One context serves both roles:
//   staff (teacher/admin): full data, every mutation writes through to Postgres
//   student: a sanitized portal payload fetched via RPC (see supabase/schema.sql)
// Row Level Security in the database is the real gatekeeper; this file is just
// the courier.

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { uid, todayKey, addDays, fromKey } from './dates';

const Ctx = createContext(null);

const rowsToList = (rows) => (rows || []).map((r) => r.data);

// ---------------- demo data ----------------
// Used by "Demo mode" on the sign-in page: explore the app with sample data,
// nothing is written to the cloud.
function demoSeed() {
  const t = todayKey();
  const students = [
    {
      id: 'demo-1', name: 'Deniz Kaya', grade: '11th grade', school: 'Robert College',
      city: 'Istanbul', phone: '+90 532 000 0000', parent: 'Aylin Kaya · +90 533 000 0000',
      email: 'deniz@example.com', targetExam: 'SAT', hourlyRate: 900, lessonCost: 1350,
      schoolLevel: 'High school', mode: 'In person', lessonLength: 90,
      exams: { SAT: { current: 600, goal: 750 } },
      notes: 'Strong reader, rushes grammar questions. Loves sci-fi — use it for reading practice.',
      color: '#4C6FA5', archived: false, createdAt: t, curriculum: null,
      scoreHistory: [
        { id: 'demo-sh1', exam: 'SAT', score: 560, date: addDays(t, -120) },
        { id: 'demo-sh2', exam: 'SAT', score: 600, date: addDays(t, -30) },
      ],
      homework: [
        { id: 'demo-hw1', title: 'Reading passages 3 & 4 + error log', due: addDays(t, 2), done: false },
        { id: 'demo-hw2', title: 'Punctuation worksheet', due: addDays(t, -3), done: true },
      ],
      payments: [{ id: 'demo-p1', amount: 7200, date: addDays(t, -20), note: '8-lesson package' }],
      sharedDocs: [], roadmap: null,
    },
    {
      id: 'demo-2', name: 'Lara Öztürk', grade: '12th grade', school: 'Üsküdar American Academy',
      city: 'Istanbul', phone: '+90 532 111 1111', parent: 'Murat Öztürk · +90 533 111 1111',
      email: 'lara@example.com', targetExam: 'IELTS', hourlyRate: 850, lessonCost: 850,
      schoolLevel: 'High school', mode: 'In person', lessonLength: 60,
      exams: { IELTS: { current: 6.5, goal: 7.5 } },
      notes: 'Applying to UK universities. Writing Task 2 is the weak spot.',
      color: '#3A8E8C', archived: false, createdAt: t, curriculum: null,
      scoreHistory: [{ id: 'demo-sh3', exam: 'IELTS', score: 6.5, date: addDays(t, -45) }],
      homework: [{ id: 'demo-hw3', title: 'Task 2 essay: technology in education', due: addDays(t, 1), done: false }],
      payments: [], sharedDocs: [], roadmap: null,
    },
    {
      id: 'demo-3', name: 'Emir Demir', grade: '9th grade', school: 'TED Ankara',
      city: 'Ankara (online)', phone: '+90 532 222 2222', parent: 'Selin Demir · +90 533 222 2222',
      email: 'emir@example.com', targetExam: 'General', hourlyRate: 700, lessonCost: 700,
      schoolLevel: 'Middle school', mode: 'Remote', lessonLength: 60,
      exams: { General: { current: 60, goal: 85 } },
      notes: 'Building general fluency before starting TOEFL prep next year.',
      color: '#7A6FA5', archived: false, createdAt: t, curriculum: null,
      scoreHistory: [], homework: [], payments: [], sharedDocs: [], roadmap: null,
    },
  ];
  const recurring = [
    { id: 'demo-r1', studentId: 'demo-1', weekday: 4, time: '17:00', duration: 90, startDate: addDays(t, -60), endDate: null, overrides: {} },
    { id: 'demo-r2', studentId: 'demo-2', weekday: 2, time: '18:30', duration: 60, startDate: addDays(t, -45), endDate: null, overrides: {} },
    { id: 'demo-r3', studentId: 'demo-3', weekday: 6, time: '11:00', duration: 60, startDate: addDays(t, -30), endDate: null, overrides: {} },
  ];
  return { students, lessons: [], recurring, documents: [] };
}

export function DataProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [profile, setProfile] = useState(null);
  const [state, setState] = useState({ students: [], lessons: [], recurring: [], documents: [] });
  const [portalStatus, setPortalStatus] = useState('loading');
  const [profilesList, setProfilesList] = useState([]);
  const [demoRole, setDemoRole] = useState(null); // null | 'teacher' | 'student'

  // ---- auth session tracking ----
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? null);
      // After OAuth redirects back with tokens in the URL fragment, tidy the
      // address bar once the session is captured.
      if (Platform.OS === 'web' && s && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ---- load profile when signed in ----
  const loadProfile = useCallback(async () => {
    if (!session?.user) { setProfile(null); return null; }
    const { data } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
    setProfile(data ?? null);
    return data ?? null;
  }, [session?.user?.id]);

  // ---- staff data load ----
  const loadStaffData = useCallback(async () => {
    const [st, le, re, docs, profs] = await Promise.all([
      supabase.from('students').select('id,data'),
      supabase.from('lessons').select('id,data'),
      supabase.from('recurring').select('id,data'),
      supabase.from('documents').select('id,data'),
      supabase.from('profiles').select('*').order('created_at'),
    ]);
    setState({
      students: rowsToList(st.data),
      lessons: rowsToList(le.data),
      recurring: rowsToList(re.data),
      documents: rowsToList(docs.data),
    });
    setProfilesList(profs.data || []);
    setPortalStatus('ready');
  }, []);

  // ---- student portal load ----
  const loadPortal = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_student_portal');
    if (error || !data || data.status !== 'ready') { setPortalStatus('pending'); return; }
    setState({
      students: [data.student],
      lessons: data.lessons || [],
      recurring: data.recurring || [],
      documents: data.documents || [],
    });
    setPortalStatus('ready');
  }, []);

  useEffect(() => {
    (async () => {
      if (session === undefined) return;
      if (!session) { setPortalStatus('signedOut'); setProfile(null); return; }
      setPortalStatus('loading');
      const prof = await loadProfile();
      if (!prof) { setPortalStatus('pending'); return; }
      if (prof.approved && (prof.role === 'teacher' || prof.role === 'admin')) {
        await loadStaffData();
      } else if (prof.approved && prof.role === 'student' && prof.student_id) {
        await loadPortal();
      } else {
        setPortalStatus('pending');
      }
    })();
  }, [session, loadProfile, loadStaffData, loadPortal]);

  const realStaff = profile?.approved && (profile?.role === 'teacher' || profile?.role === 'admin');
  const isStaff = demoRole ? demoRole === 'teacher' : realStaff;

  // ---- write-through helpers (staff only; no-ops in demo mode) ----
  const upsert = (table, id, data, extra = {}) => {
    if (demoRole) return Promise.resolve();
    return supabase.from(table).upsert({ id, data, updated_at: new Date().toISOString(), ...extra }).then(({ error }) => {
      if (error) console.error(`${table} save failed:`, error.message);
    });
  };
  const remove = (table, id) => {
    if (demoRole) return Promise.resolve();
    return supabase.from(table).delete().eq('id', id).then(({ error }) => {
      if (error) console.error(`${table} delete failed:`, error.message);
    });
  };

  const api = useMemo(() => {
    const setLocal = (fn) => setState((s) => fn(s));
    const getStudent = (id) => state.students.find((x) => x.id === id);

    // Demo-student view only sees the first demo student's slice of the data.
    let viewState = state;
    if (demoRole === 'student' && state.students.length) {
      const me = state.students[0];
      viewState = {
        students: [me],
        lessons: state.lessons.filter((l) => l.studentId === me.id),
        recurring: state.recurring.filter((r) => r.studentId === me.id),
        documents: state.documents.filter((d) => (me.sharedDocs || []).includes(d.id)),
      };
    }

    const saveStudent = (obj) => {
      setLocal((s) => ({ ...s, students: s.students.map((st) => (st.id === obj.id ? obj : st)) }));
      upsert('students', obj.id, obj);
    };

    return {
      ...viewState,

      // ---- auth surface ----
      status: demoRole ? 'ready' : portalStatus, // 'loading' | 'signedOut' | 'pending' | 'ready'
      session,
      profile: demoRole
        ? { email: 'demo@vedyacademy.org', role: demoRole, display_name: 'Demo' }
        : profile,
      isStaff,
      profilesList: demoRole ? [] : profilesList,

      // ---- demo mode ----
      demoRole,
      enterDemo: (role) => { setState(demoSeed()); setDemoRole(role); },
      switchDemoRole: () => setDemoRole((r) => (r === 'teacher' ? 'student' : 'teacher')),
      exitDemo: () => {
        setDemoRole(null);
        setState({ students: [], lessons: [], recurring: [], documents: [] });
        setPortalStatus('signedOut');
      },
      signInEmail: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signUpEmail: (email, password, name) =>
        supabase.auth.signUp({ email, password, options: { data: { full_name: name } } }),
      signInGoogle: () =>
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: Platform.OS === 'web' ? { redirectTo: window.location.origin + '/signin' } : {},
        }),
      signOut: () => {
        if (demoRole) {
          setDemoRole(null);
          setState({ students: [], lessons: [], recurring: [], documents: [] });
          setPortalStatus('signedOut');
          return Promise.resolve();
        }
        return supabase.auth.signOut();
      },
      refresh: () => (isStaff ? loadStaffData() : loadPortal()),

      // ---- account linking (staff) ----
      linkStudentAccount: async (userId, studentId) => {
        await supabase.from('profiles').update({ student_id: studentId, approved: true, role: 'student' }).eq('user_id', userId);
        await loadStaffData();
      },
      unlinkAccount: async (userId) => {
        await supabase.from('profiles').update({ student_id: null, approved: false }).eq('user_id', userId);
        await loadStaffData();
      },

      // ---- student self-service ----
      toggleMyHomework: async (hwId) => {
        if (demoRole) {
          const me = state.students[0];
          if (!me) return;
          setLocal((s) => ({
            ...s,
            students: s.students.map((st) =>
              st.id === me.id
                ? { ...st, homework: st.homework.map((h) => (h.id === hwId ? { ...h, done: !h.done } : h)) }
                : st),
          }));
          return;
        }
        await supabase.rpc('toggle_my_homework', { hw_id: hwId });
        await loadPortal();
      },

      // ---- students ----
      addStudent: (data) => {
        const student = {
          id: uid(), name: '', grade: '', school: '', city: '', phone: '', parent: '',
          email: '', targetExam: 'SAT', hourlyRate: 0, lessonCost: 0,
          schoolLevel: 'High school', mode: 'In person', lessonLength: 60,
          exams: {}, notes: '', curriculum: null,
          color: '#003C7C', archived: false, createdAt: todayKey(),
          scoreHistory: [], homework: [], payments: [], sharedDocs: [], roadmap: null,
          ...data,
        };
        setLocal((s) => ({ ...s, students: [...s.students, student] }));
        upsert('students', student.id, student);
        return student.id;
      },
      updateStudent: (id, patch) => {
        const cur = getStudent(id);
        if (!cur) return;
        saveStudent({ ...cur, ...patch });
      },
      deleteStudent: (id) => {
        setLocal((s) => ({
          ...s,
          students: s.students.filter((st) => st.id !== id),
          lessons: s.lessons.filter((l) => l.studentId !== id),
          recurring: s.recurring.filter((r) => r.studentId !== id),
        }));
        remove('students', id);
        supabase.from('lessons').delete().eq('student_id', id).then(() => {});
        supabase.from('recurring').delete().eq('student_id', id).then(() => {});
      },
      pushToStudent: (id, field, item) => {
        const cur = getStudent(id);
        if (!cur) return;
        saveStudent({ ...cur, [field]: [...(cur[field] || []), item] });
      },
      removeFromStudent: (id, field, itemId) => {
        const cur = getStudent(id);
        if (!cur) return;
        saveStudent({ ...cur, [field]: (cur[field] || []).filter((x) => x.id !== itemId) });
      },
      toggleHomework: (id, hwId) => {
        const cur = getStudent(id);
        if (!cur) return;
        saveStudent({
          ...cur,
          homework: cur.homework.map((h) => (h.id === hwId ? { ...h, done: !h.done } : h)),
        });
      },

      // ---- one-off lessons ----
      addLesson: (data) => {
        const lesson = { id: uid(), status: 'scheduled', note: '', duration: 60, ...data };
        setLocal((s) => ({ ...s, lessons: [...s.lessons, lesson] }));
        upsert('lessons', lesson.id, lesson, { student_id: lesson.studentId });
        return lesson.id;
      },
      updateLesson: (id, patch) => {
        const cur = state.lessons.find((l) => l.id === id);
        if (!cur) return;
        const next = { ...cur, ...patch };
        setLocal((s) => ({ ...s, lessons: s.lessons.map((l) => (l.id === id ? next : l)) }));
        upsert('lessons', id, next, { student_id: next.studentId });
      },
      deleteLesson: (id) => {
        setLocal((s) => ({ ...s, lessons: s.lessons.filter((l) => l.id !== id) }));
        remove('lessons', id);
      },

      // ---- recurring lessons ----
      addRecurring: (data) => {
        const rule = { id: uid(), overrides: {}, endDate: null, duration: 60, ...data };
        setLocal((s) => ({ ...s, recurring: [...s.recurring, rule] }));
        upsert('recurring', rule.id, rule, { student_id: rule.studentId });
        return rule.id;
      },
      updateRecurring: (id, patch) => {
        const cur = state.recurring.find((r) => r.id === id);
        if (!cur) return;
        const next = { ...cur, ...patch };
        setLocal((s) => ({ ...s, recurring: s.recurring.map((r) => (r.id === id ? next : r)) }));
        upsert('recurring', id, next, { student_id: next.studentId });
      },
      overrideOccurrence: (ruleId, dateKey, patch) => {
        const cur = state.recurring.find((r) => r.id === ruleId);
        if (!cur) return;
        const next = { ...cur, overrides: { ...cur.overrides, [dateKey]: { ...(cur.overrides[dateKey] || {}), ...patch } } };
        setLocal((s) => ({ ...s, recurring: s.recurring.map((r) => (r.id === ruleId ? next : r)) }));
        upsert('recurring', ruleId, next, { student_id: next.studentId });
      },
      endRecurring: (ruleId, dateKey) => {
        const cur = state.recurring.find((r) => r.id === ruleId);
        if (!cur) return;
        const next = { ...cur, endDate: dateKey };
        setLocal((s) => ({ ...s, recurring: s.recurring.map((r) => (r.id === ruleId ? next : r)) }));
        upsert('recurring', ruleId, next, { student_id: next.studentId });
      },
      deleteRecurring: (ruleId) => {
        setLocal((s) => ({ ...s, recurring: s.recurring.filter((r) => r.id !== ruleId) }));
        remove('recurring', ruleId);
      },

      // ---- documents ----
      addDocument: (doc) => {
        const d = { id: uid(), addedAt: todayKey(), ...doc };
        setLocal((s) => ({ ...s, documents: [...s.documents, d] }));
        upsert('documents', d.id, d);
        return d.id;
      },
      updateDocument: (id, patch) => {
        const cur = state.documents.find((d) => d.id === id);
        if (!cur) return;
        const next = { ...cur, ...patch };
        setLocal((s) => ({ ...s, documents: s.documents.map((d) => (d.id === id ? next : d)) }));
        upsert('documents', id, next);
      },
      deleteDocument: (id) => {
        setLocal((s) => ({
          ...s,
          documents: s.documents.filter((d) => d.id !== id),
          students: s.students.map((st) => ({ ...st, sharedDocs: (st.sharedDocs || []).filter((x) => x !== id) })),
        }));
        remove('documents', id);
        state.students
          .filter((st) => (st.sharedDocs || []).includes(id))
          .forEach((st) => upsert('students', st.id, { ...st, sharedDocs: st.sharedDocs.filter((x) => x !== id) }));
      },
      shareDocuments: (studentId, docIds) => {
        const cur = getStudent(studentId);
        if (!cur) return;
        saveStudent({ ...cur, sharedDocs: Array.from(new Set([...(cur.sharedDocs || []), ...docIds])) });
      },
      unshareDocument: (studentId, docId) => {
        const cur = getStudent(studentId);
        if (!cur) return;
        saveStudent({ ...cur, sharedDocs: (cur.sharedDocs || []).filter((x) => x !== docId) });
      },

      // ---- backup / restore ----
      importSnapshot: async (json) => {
        const parsed = JSON.parse(json);
        if (parsed?.app !== 'vedyacademy' || !Array.isArray(parsed.students)) {
          throw new Error('This file is not a VedyAcademy backup.');
        }
        const now = new Date().toISOString();
        await supabase.from('students').upsert(parsed.students.map((d) => ({ id: d.id, data: d, updated_at: now })));
        await supabase.from('lessons').upsert((parsed.lessons || []).map((d) => ({ id: d.id, student_id: d.studentId, data: d, updated_at: now })));
        await supabase.from('recurring').upsert((parsed.recurring || []).map((d) => ({ id: d.id, student_id: d.studentId, data: d, updated_at: now })));
        await supabase.from('documents').upsert((parsed.documents || []).map((d) => ({ id: d.id, data: d, updated_at: now })));
        await loadStaffData();
      },
      clearAll: async () => {
        await Promise.all([
          supabase.from('students').delete().neq('id', ''),
          supabase.from('lessons').delete().neq('id', ''),
          supabase.from('recurring').delete().neq('id', ''),
          supabase.from('documents').delete().neq('id', ''),
        ]);
        await loadStaffData();
      },
      resetAll: () => {}, // no cloud seeding
    };
  }, [state, portalStatus, session, profile, profilesList, isStaff, demoRole, loadStaffData, loadPortal]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export const useData = () => useContext(Ctx);

// ---------------- pure derived helpers (unchanged) ----------------

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

export function balanceFor(data, student) {
  const t = todayKey();
  let hours = 0;
  let count = 0;
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
  const earned = student.lessonCost
    ? count * student.lessonCost
    : hours * (student.hourlyRate || 0);
  const paid = (student.payments || []).reduce((a, p) => a + Number(p.amount || 0), 0);
  return { hours: Math.round(hours * 10) / 10, lessons: count, earned, paid, balance: earned - paid };
}

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

export function nextLessonFor(data, studentId) {
  const t = todayKey();
  for (let i = 0; i < 60; i++) {
    const k = addDays(t, i);
    const found = lessonsOnDate(data, k).find(
      (l) => l.studentId === studentId && l.status === 'scheduled',
    );
    if (found) return found;
  }
  return null;
}

export function exportSnapshot(data) {
  return JSON.stringify({
    app: 'vedyacademy', version: 1, exportedAt: new Date().toISOString(),
    students: data.students, lessons: data.lessons,
    recurring: data.recurring, documents: data.documents,
  }, null, 2);
}
