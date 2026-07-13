// Student profile — everything about one student: details, score journey and
// history, the generated roadmap & weekly plan, homework, shared documents,
// and payments.

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { ShareSheet } from '../(tabs)/library';
import { AddStudentSheet } from '../(tabs)/students';
import {
  Avatar,
  Button,
  Card,
  Divider, EmptyState,
  ExamTag,
  Field,
  IconBtn,
  ScoreJourney,
  Screen,
  SectionTitle,
  Sheet,
  T
} from '../../components/ui';
import { generateCurriculum, UNIT_STATUS } from '../../lib/curriculum';
import { addDays, formatLong, formatShort, formatTime, todayKey, uid } from '../../lib/dates';
import { openFile } from '../../lib/files';
import { generateRoadmap } from '../../lib/roadmap';
import { balanceFor, nextLessonFor, useData } from '../../lib/store';
import { colors, examMeta, fonts } from '../../lib/theme';

export default function StudentProfile() {
  const { id } = useLocalSearchParams();
  const data = useData();
  const router = useRouter();
  const student = data.students.find((s) => s.id === id);

  const [editOpen, setEditOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [hwOpen, setHwOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const [shareDocs, setShareDocs] = useState(null);
  const [attachUnit, setAttachUnit] = useState(null); // curriculum unit picking docs

  const money = useMemo(() => (student ? balanceFor(data, student) : null), [data, student?.id, student?.payments, student?.hourlyRate]);
  const next = student ? nextLessonFor(data, student.id) : null;

  if (!student) {
    return (
      <Screen>
        <EmptyState icon="person-outline" title="Student not found" action={<Button title="Back to students" onPress={() => router.back()} />} />
      </Screen>
    );
  }

  const scores = student.exams?.[student.targetExam];
  const shared = (student.sharedDocs || [])
    .map((docId) => data.documents.find((d) => d.id === docId))
    .filter(Boolean);
  const history = (student.scoreHistory || []).slice().sort((a, b) => a.date.localeCompare(b.date));

  const confirmDelete = () => {
    const go = () => { data.deleteStudent(student.id); router.back(); };
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`Remove ${student.name} and all their lessons? This can't be undone.`)) go();
    } else {
      Alert.alert('Remove student', `Remove ${student.name} and all their lessons?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: go },
      ]);
    }
  };

  return (
    <Screen>
      {/* header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <IconBtn icon="arrow-back" color={colors.ink} onPress={() => router.back()} />
        <View style={{ flex: 1 }} />
        <Button title="Progress report" icon="document-text-outline" kind="quiet" small onPress={() => makeProgressReport(student, data)} />
        <View style={{ width: 8 }} />
        <Button title="Edit" icon="pencil" kind="ghost" small onPress={() => setEditOpen(true)} />
        <View style={{ width: 8 }} />
        <Button
          title={student.archived ? 'Unarchive' : 'Archive'}
          kind="ghost" small
          onPress={() => data.updateStudent(student.id, { archived: !student.archived })}
        />
        <View style={{ width: 8 }} />
        <Button title="Remove" kind="danger" small onPress={confirmDelete} />
      </View>

      <View style={[styles.banner, { backgroundColor: (examMeta[student.targetExam] || examMeta.General).soft }]}>
        <View style={[styles.bannerCircle, { width: 150, height: 150, top: -60, right: -40 }]} />
        <View style={[styles.bannerCircle, { width: 70, height: 70, bottom: -25, right: 90 }]} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar name={student.name} color={student.color} size={60} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={styles.name}>{student.name}</Text>
            <T.muted>{[student.grade, student.school, student.city].filter(Boolean).join(' · ')}</T.muted>
          </View>
          <ExamTag exam={student.targetExam} />
        </View>
      </View>

      {/* contact + next lesson */}
      <Card style={{ marginTop: 12 }}>
        <InfoRow icon="call-outline" label="Student" value={student.phone || '—'} />
        <InfoRow icon="people-outline" label="Parent" value={student.parent || '—'} />
        <InfoRow icon="mail-outline" label="Email" value={student.email || '—'} />
        <InfoRow
          icon="calendar-clear-outline" label="Next lesson"
          value={next ? `${formatLong(next.date)} · ${formatTime(next.time)}` : 'Not scheduled'}
        />
        <InfoRow
          icon="school-outline" label="Level"
          value={[student.schoolLevel, student.mode].filter(Boolean).join(' · ') || '—'}
        />
        <InfoRow
          icon="pricetag-outline" label="Lessons"
          value={`${student.lessonLength || 60} min${student.lessonCost ? ` · ${Number(student.lessonCost).toLocaleString()} per lesson` : student.hourlyRate ? ` · ${Number(student.hourlyRate).toLocaleString()}/hr` : ''}`}
        />
        {!!student.notes && (
          <>
            <Divider />
            <T.body style={{ fontStyle: 'italic', color: colors.muted }}>{student.notes}</T.body>
          </>
        )}
      </Card>

      {/* scores (only for scored purposes) */}
      {examMeta[student.targetExam]?.scored !== false && (
      <>
      <SectionTitle icon="trending-up" right={<Button title="Log score" icon="add" kind="quiet" small onPress={() => setScoreOpen(true)} />}>
        Score journey
      </SectionTitle>
      <Card>
        {scores ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 14 }}>
              <View>
                <Text style={styles.bigScore}>{scores.current}</Text>
                <T.small>current</T.small>
              </View>
              <Ionicons name="arrow-forward" size={18} color={colors.faint} />
              <View>
                <Text style={[styles.bigScore, { color: colors.marigold }]}>{scores.goal}</Text>
                <T.small>goal</T.small>
              </View>
              <View style={{ flex: 1 }} />
              <T.small>{examMeta[student.targetExam]?.label}</T.small>
            </View>
            <ScoreJourney exam={student.targetExam} current={scores.current} goal={scores.goal} compact />
          </>
        ) : (
          <T.muted>No current/goal scores yet — tap Edit to add them.</T.muted>
        )}
        {history.length > 0 && (
          <>
            <Divider />
            <T.semi style={{ marginBottom: 10 }}>Progress over time</T.semi>
            <ScoreChart history={history} exam={student.targetExam} goal={scores?.goal} />
          </>
        )}
      </Card>

      </>
      )}

      {/* roadmap (only for scored purposes) */}
      {examMeta[student.targetExam]?.scored !== false && (
      <>
      <SectionTitle
        icon="map"
        right={
          <Button
            title={student.roadmap ? 'Regenerate' : 'Generate'}
            icon="sparkles-outline" kind="accent" small
            onPress={() => setRoadmapOpen(true)}
          />
        }
      >
        Roadmap
      </SectionTitle>
      {student.roadmap ? (
        <RoadmapView roadmap={student.roadmap} />
      ) : (
        <Card>
          <EmptyState
            icon="map-outline"
            title="No roadmap yet"
            body="Generate a phased study plan from the current score, the goal, and the exam date."
            action={<Button title="Generate roadmap" icon="sparkles-outline" kind="accent" small onPress={() => setRoadmapOpen(true)} />}
          />
        </Card>
      )}
      </>
      )}

      {/* curriculum */}
      <SectionTitle
        icon="construct"
        right={
          <Button
            title={student.curriculum ? 'Regenerate' : 'Build curriculum'}
            icon="construct-outline" kind="accent" small
            onPress={() => {
              const build = () => data.updateStudent(student.id, {
                curriculum: generateCurriculum({ purpose: student.targetExam, documents: data.documents }),
              });
              if (student.curriculum) {
                if (Platform.OS === 'web') {
                  // eslint-disable-next-line no-alert
                  if (window.confirm('Rebuild the curriculum? Unit progress and attached documents will reset.')) build();
                } else {
                  Alert.alert('Rebuild curriculum?', 'Unit progress and attached documents will reset.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Rebuild', style: 'destructive', onPress: build },
                  ]);
                }
              } else build();
            }}
          />
        }
      >
        Curriculum
      </SectionTitle>
      {student.curriculum ? (
        <CurriculumView
          student={student}
          data={data}
          onAttach={(unit) => setAttachUnit(unit)}
        />
      ) : (
        <Card>
          <EmptyState
            icon="construct-outline"
            title="No curriculum yet"
            body={`Build a unit-by-unit ${examMeta[student.targetExam]?.label || ''} curriculum. Matching documents from your library are attached to each unit automatically.`}
            action={
              <Button
                title="Build curriculum" icon="construct-outline" kind="accent" small
                onPress={() => data.updateStudent(student.id, {
                  curriculum: generateCurriculum({ purpose: student.targetExam, documents: data.documents }),
                })}
              />
            }
          />
        </Card>
      )}

      {/* homework */}
      <SectionTitle icon="clipboard" right={<Button title="Assign" icon="add" kind="quiet" small onPress={() => setHwOpen(true)} />}>
        Homework
      </SectionTitle>
      <Card>
        {(student.homework || []).length === 0 ? (
          <T.muted>No homework assigned.</T.muted>
        ) : (
          student.homework.slice().sort((a, b) => (a.done - b.done) || a.due.localeCompare(b.due)).map((h, i) => (
            <View key={h.id} style={[styles.row, i > 0 && styles.rowBorder]}>
              <Pressable onPress={() => data.toggleHomework(student.id, h.id)} hitSlop={8}>
                <Ionicons
                  name={h.done ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={h.done ? colors.pine : colors.faint}
                />
              </Pressable>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <T.body style={h.done && { textDecorationLine: 'line-through', color: colors.faint }}>{h.title}</T.body>
                <T.small style={!h.done && h.due < todayKey() && { color: colors.danger }}>
                  due {formatShort(h.due)}{!h.done && h.due < todayKey() ? ' · overdue' : ''}
                </T.small>
              </View>
              <IconBtn icon="trash-outline" size={17} onPress={() => data.removeFromStudent(student.id, 'homework', h.id)} />
            </View>
          ))
        )}
      </Card>

      {/* documents */}
      <SectionTitle
        icon="documents"
        right={
          data.documents.length > 0 && (
            <Button
              title="Share documents" icon="paper-plane-outline" kind="quiet" small
              onPress={() => setShareDocs(true)}
            />
          )
        }
      >
        Shared documents
      </SectionTitle>
      <Card>
        {shared.length === 0 ? (
          <T.muted>
            {data.documents.length === 0
              ? 'Upload PDFs in the Library tab first, then share them here.'
              : 'Nothing shared yet. Share study documents from the library.'}
          </T.muted>
        ) : (
          shared.map((d, i) => (
            <View key={d.id} style={[styles.row, i > 0 && styles.rowBorder]}>
              <Ionicons name="document-text" size={18} color={colors.pine} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <T.body>{d.title}</T.body>
                <T.small>{d.category}</T.small>
              </View>
              <IconBtn icon="open-outline" color={colors.pine} onPress={() => openFile(d.fileKey, `${d.title}.pdf`)} />
              <IconBtn icon="close" size={17} onPress={() => data.unshareDocument(student.id, d.id)} />
            </View>
          ))
        )}
      </Card>

      {/* payments */}
      <SectionTitle icon="cash" right={<Button title="Record payment" icon="add" kind="quiet" small onPress={() => setPayOpen(true)} />}>
        Payments
      </SectionTitle>
      <Card>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <MoneyTile label="Hours taught" value={money.hours} />
          <MoneyTile label="Earned" value={money.earned.toLocaleString()} />
          <MoneyTile label="Paid" value={money.paid.toLocaleString()} />
          <MoneyTile
            label={money.balance > 0 ? 'Owed' : 'Balance'}
            value={money.balance.toLocaleString()}
            color={money.balance > 0 ? colors.danger : colors.pine}
          />
        </View>
        {(student.payments || []).length > 0 && (
          <>
            <Divider />
            {student.payments.slice().sort((a, b) => b.date.localeCompare(a.date)).map((p, i) => (
              <View key={p.id} style={[styles.row, i > 0 && styles.rowBorder]}>
                <Ionicons name="cash-outline" size={17} color={colors.pine} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <T.body>{Number(p.amount).toLocaleString()}</T.body>
                  <T.small>{formatShort(p.date)}{p.note ? ` · ${p.note}` : ''}</T.small>
                </View>
                <IconBtn icon="trash-outline" size={17} onPress={() => data.removeFromStudent(student.id, 'payments', p.id)} />
              </View>
            ))}
          </>
        )}
        <T.small style={{ marginTop: 10 }}>
          Balance = hours taught (last 12 months, cancelled lessons excluded) × hourly rate − payments.
        </T.small>
      </Card>

      {/* sheets */}
      <AddStudentSheet visible={editOpen} onClose={() => setEditOpen(false)} editing={student} />
      <LogScoreSheet visible={scoreOpen} onClose={() => setScoreOpen(false)} student={student} />
      <HomeworkSheet visible={hwOpen} onClose={() => setHwOpen(false)} student={student} />
      <PaymentSheet visible={payOpen} onClose={() => setPayOpen(false)} student={student} />
      <RoadmapSheet visible={roadmapOpen} onClose={() => setRoadmapOpen(false)} student={student} />
      <ShareSheet
        docIds={shareDocs ? data.documents.map((d) => d.id) : null}
        presetStudentId={student.id}
        pickDocs
        onClose={() => setShareDocs(null)}
      />
      <AttachDocsSheet
        unit={attachUnit}
        student={student}
        data={data}
        onClose={() => setAttachUnit(null)}
      />
    </Screen>
  );
}

// ---------- curriculum ----------
function CurriculumView({ student, data, onAttach }) {
  const cur = student.curriculum;
  const done = cur.units.filter((u) => u.status === 'done').length;
  const m = examMeta[cur.purpose] || examMeta.General;

  const updateUnit = (unitId, patch) => {
    data.updateStudent(student.id, {
      curriculum: {
        ...cur,
        units: cur.units.map((u) => (u.id === unitId ? { ...u, ...patch } : u)),
      },
    });
  };

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <T.semi style={{ fontSize: 15.5, flex: 1 }}>
          {m.label} · {done}/{cur.units.length} units done
        </T.semi>
        <T.small>built {formatShort(cur.generatedAt)}</T.small>
      </View>
      <View style={{ height: 7, borderRadius: 4, backgroundColor: m.soft, marginBottom: 6 }}>
        <View style={{
          width: `${cur.units.length ? (done / cur.units.length) * 100 : 0}%`,
          height: 7, borderRadius: 4, backgroundColor: m.color,
        }} />
      </View>

      {cur.units.map((u, i) => {
        const st = UNIT_STATUS[u.status] || UNIT_STATUS.planned;
        const docs = u.docIds.map((id) => data.documents.find((d) => d.id === id)).filter(Boolean);
        return (
          <View key={u.id} style={[{ paddingVertical: 12 }, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[unitStyles.num, u.status === 'done' && { backgroundColor: m.color }]}>
                {u.status === 'done'
                  ? <Ionicons name="checkmark" size={13} color="#fff" />
                  : <Text style={unitStyles.numText}>{u.order}</Text>}
              </View>
              <T.semi style={[{ flex: 1, marginLeft: 10 }, u.status === 'done' && { color: colors.faint }]}>
                {u.title}
              </T.semi>
              <Button
                title={st.label} kind={u.status === 'in-progress' ? 'accent' : 'ghost'} small
                onPress={() => updateUnit(u.id, { status: st.next })}
              />
            </View>
            {u.objectives.map((o) => (
              <View key={o} style={{ flexDirection: 'row', marginTop: 4, marginLeft: 34 }}>
                <Text style={{ color: m.color, marginRight: 6 }}>—</Text>
                <T.body style={{ flex: 1, fontSize: 13.5 }}>{o}</T.body>
              </View>
            ))}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginLeft: 34, marginTop: 6, gap: 6 }}>
              {docs.map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() => openFile(d.fileKey, `${d.title}.pdf`)}
                  style={unitStyles.docChip}
                >
                  <Ionicons name="document-text-outline" size={12} color={colors.pine} style={{ marginRight: 4 }} />
                  <T.small style={{ color: colors.pineDark }}>{d.title}</T.small>
                </Pressable>
              ))}
              <Pressable onPress={() => onAttach(u)} style={[unitStyles.docChip, { backgroundColor: 'transparent', borderStyle: 'dashed' }]}>
                <Ionicons name="add" size={13} color={colors.muted} style={{ marginRight: 3 }} />
                <T.small>attach docs</T.small>
              </Pressable>
            </View>
          </View>
        );
      })}
      <T.small style={{ marginTop: 6 }}>
        Tap a unit’s status to move it Planned → In progress → Done. Tap a document to open it.
      </T.small>
    </Card>
  );
}

function AttachDocsSheet({ unit, student, data, onClose }) {
  const [chosen, setChosen] = useState([]);
  React.useEffect(() => { if (unit) setChosen(unit.docIds || []); }, [unit]);
  if (!unit) return null;

  const save = () => {
    const cur = student.curriculum;
    data.updateStudent(student.id, {
      curriculum: {
        ...cur,
        units: cur.units.map((u) => (u.id === unit.id ? { ...u, docIds: chosen } : u)),
      },
    });
    onClose();
  };

  return (
    <Sheet visible={!!unit} onClose={onClose} title={`Documents for “${unit.title}”`}>
      {data.documents.length === 0 ? (
        <T.muted>No documents in the library yet — upload PDFs from the Library tab first.</T.muted>
      ) : (
        data.documents.map((d) => (
          <Pressable
            key={d.id}
            onPress={() => setChosen((ids) => (ids.includes(d.id) ? ids.filter((x) => x !== d.id) : [...ids, d.id]))}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7 }}
          >
            <Ionicons
              name={chosen.includes(d.id) ? 'checkbox' : 'square-outline'}
              size={19}
              color={chosen.includes(d.id) ? colors.pine : colors.faint}
              style={{ marginRight: 9 }}
            />
            <View style={{ flex: 1 }}>
              <T.body>{d.title}</T.body>
              <T.small>{d.category}</T.small>
            </View>
          </Pressable>
        ))
      )}
      <Button title="Save" onPress={save} style={{ marginTop: 12 }} />
    </Sheet>
  );
}

// ---------- progress report ----------
async function makeProgressReport(student, data) {
  const money = balanceFor(data, student);
  const scores = student.exams?.[student.targetExam];
  const meta = examMeta[student.targetExam] || {};
  const history = (student.scoreHistory || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const hw = student.homework || [];
  const hwDone = hw.filter((h) => h.done).length;
  const cur = student.curriculum;

  const lines = [
    `Progress report — ${student.name}`,
    `Prepared by Vedya · ${formatShort(todayKey())}`,
    '',
    `Focus: ${meta.label || student.targetExam}`,
  ];
  if (meta.scored !== false && scores) {
    lines.push(`Score: ${scores.current} now → goal ${scores.goal} ${meta.unit || ''}`.trim());
    if (history.length >= 2) {
      const first = history[0]; const last = history[history.length - 1];
      const diff = Math.round((last.score - first.score) * 10) / 10;
      lines.push(`Progress: ${first.score} → ${last.score} (${diff >= 0 ? '+' : ''}${diff}) since ${formatShort(first.date)}`);
    }
  }
  if (cur) {
    const done = cur.units.filter((u) => u.status === 'done').length;
    const active = cur.units.find((u) => u.status === 'in-progress');
    lines.push(`Curriculum: ${done}/${cur.units.length} units completed${active ? ` · currently: ${active.title}` : ''}`);
  }
  if (hw.length) lines.push(`Homework: ${hwDone}/${hw.length} completed`);
  lines.push(`Lessons (last 12 months): ${money.lessons} lessons · ${money.hours} hours`);
  if (student.notes) lines.push('', `Teacher notes: ${student.notes}`);
  lines.push('', 'Questions welcome any time — Vedya');

  const text = lines.join('\n');
  if (Platform.OS === 'web') {
    try { await navigator.clipboard.writeText(text); } catch (e) {}
    // eslint-disable-next-line no-alert
    window.alert('Progress report copied to your clipboard — paste it into a message to the parent or student.');
  } else {
    try { await Share.share({ message: text }); } catch (e) {}
  }
}

const unitStyles = StyleSheet.create({
  num: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.pineSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.pineDark },
  docChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.pineSoft,
    borderWidth: 1, borderColor: colors.line, borderRadius: 999,
    paddingHorizontal: 9, paddingVertical: 4,
  },
});

// ---------- small pieces ----------
function InfoRow({ icon, label, value }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }}>
      <Ionicons name={icon} size={15} color={colors.faint} style={{ width: 26 }} />
      <T.small style={{ width: 84 }}>{label}</T.small>
      <T.body style={{ flex: 1 }}>{value}</T.body>
    </View>
  );
}

function MoneyTile({ label, value, color = colors.ink }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 19, color }}>{value}</Text>
      <T.small>{label}</T.small>
    </View>
  );
}

// Simple bar chart of score history, no chart library needed.
function ScoreChart({ history, exam, goal }) {
  const m = examMeta[exam] || examMeta.General;
  const values = history.map((h) => h.score);
  const min = Math.min(...values, goal ?? Infinity);
  const max = Math.max(...values, goal ?? -Infinity);
  const span = Math.max(1, max - min);
  const H = 110;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: H, gap: 10 }}>
        {history.map((h) => {
          const frac = 0.25 + 0.75 * ((h.score - min) / span);
          return (
            <View key={h.id} style={{ flex: 1, alignItems: 'center' }}>
              <T.small style={{ fontFamily: fonts.bodySemi, color: colors.ink, marginBottom: 3 }}>{h.score}</T.small>
              <View style={{
                width: '70%', maxWidth: 44, height: H * frac * 0.72,
                backgroundColor: h.score >= (goal ?? Infinity) ? colors.marigold : m.color,
                borderTopLeftRadius: 6, borderTopRightRadius: 6, opacity: 0.9,
              }} />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        {history.map((h) => (
          <T.small key={h.id} style={{ flex: 1, textAlign: 'center', fontSize: 10.5 }}>
            {formatShort(h.date).replace(/, \d{4}$/, '')}
          </T.small>
        ))}
      </View>
    </View>
  );
}

function RoadmapView({ roadmap: r }) {
  const m = examMeta[r.exam] || examMeta.General;
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <View style={[styles.paceTag, {
          backgroundColor: r.pace.level === 'ambitious' ? colors.marigoldSoft : colors.pineSoft,
        }]}>
          <T.small style={{ fontFamily: fonts.bodySemi, color: r.pace.level === 'ambitious' ? '#8A5F14' : colors.pineDark }}>
            {r.pace.level.toUpperCase()} PACE
          </T.small>
        </View>
        <View style={{ flex: 1 }} />
        <T.small>generated {formatShort(r.generatedAt)}</T.small>
      </View>
      <T.semi style={{ fontSize: 15.5 }}>{r.summary}</T.semi>
      <T.muted style={{ marginTop: 4 }}>{r.pace.text}</T.muted>

      <Divider />
      {r.phases.map((p, i) => (
        <View key={p.name} style={{ flexDirection: 'row', marginBottom: i < r.phases.length - 1 ? 16 : 0 }}>
          {/* timeline spine */}
          <View style={{ alignItems: 'center', width: 26 }}>
            <View style={[styles.phaseDot, { backgroundColor: m.color }]} />
            {i < r.phases.length - 1 && <View style={styles.phaseLine} />}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <T.semi style={{ fontSize: 15 }}>{p.name}</T.semi>
              <T.small style={{ marginLeft: 8 }}>
                {p.weeks} wk · {formatShort(p.from).replace(/, \d{4}$/, '')} – {formatShort(p.to).replace(/, \d{4}$/, '')}
              </T.small>
            </View>
            {p.focus.map((f) => (
              <View key={f} style={{ flexDirection: 'row', marginTop: 4 }}>
                <Text style={{ color: m.color, marginRight: 6 }}>—</Text>
                <T.body style={{ flex: 1, fontSize: 13.5 }}>{f}</T.body>
              </View>
            ))}
            <T.small style={{ marginTop: 5, color: m.color, fontFamily: fonts.bodySemi }}>
              Milestone: reach {r.milestones[i].target} by {formatShort(r.milestones[i].date).replace(/, \d{4}$/, '')}
            </T.small>
          </View>
        </View>
      ))}

      <Divider />
      <T.semi style={{ marginBottom: 8 }}>Weekly plan template</T.semi>
      {r.weekly.map((w, i) => (
        <View key={w.day} style={[styles.row, i > 0 && styles.rowBorder, { paddingVertical: 7 }]}>
          <T.small style={{ width: 88, fontFamily: fonts.bodySemi, color: colors.ink }}>{w.day}</T.small>
          <T.body style={{ flex: 1, fontSize: 13.5 }}>{w.activity}</T.body>
          <T.small>{w.mins} min</T.small>
        </View>
      ))}
    </Card>
  );
}

// ---------- sheets ----------
function LogScoreSheet({ visible, onClose, student }) {
  const data = useData();
  const [score, setScore] = useState('');
  const [date, setDate] = useState(todayKey());
  const [makeCurrent, setMakeCurrent] = useState(true);

  React.useEffect(() => { if (visible) { setScore(''); setDate(todayKey()); setMakeCurrent(true); } }, [visible]);

  const save = () => {
    const v = parseFloat(score);
    if (Number.isNaN(v)) return;
    data.pushToStudent(student.id, 'scoreHistory', { id: uid(), exam: student.targetExam, score: v, date });
    if (makeCurrent) {
      data.updateStudent(student.id, {
        exams: { ...student.exams, [student.targetExam]: { ...(student.exams?.[student.targetExam] || { goal: v }), current: v } },
      });
    }
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={`Log ${student.targetExam} score`}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field label="Score" value={score} onChangeText={setScore} keyboardType="numeric" placeholder="e.g. 650" style={{ flex: 1 }} />
        <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} style={{ flex: 1 }} />
      </View>
      <Pressable onPress={() => setMakeCurrent(!makeCurrent)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Ionicons name={makeCurrent ? 'checkbox' : 'square-outline'} size={20} color={makeCurrent ? colors.pine : colors.faint} />
        <T.body style={{ marginLeft: 8 }}>Set as the current score</T.body>
      </Pressable>
      <Button title="Save score" onPress={save} disabled={Number.isNaN(parseFloat(score))} />
    </Sheet>
  );
}

function HomeworkSheet({ visible, onClose, student }) {
  const data = useData();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState(addDays(todayKey(), 7));

  React.useEffect(() => { if (visible) { setTitle(''); setDue(addDays(todayKey(), 7)); } }, [visible]);

  return (
    <Sheet visible={visible} onClose={onClose} title="Assign homework">
      <Field label="Assignment" value={title} onChangeText={setTitle} placeholder="e.g. Reading passages 3–4 + error log" />
      <Field label="Due date (YYYY-MM-DD)" value={due} onChangeText={setDue} />
      <Button
        title="Assign"
        disabled={!title.trim()}
        onPress={() => {
          data.pushToStudent(student.id, 'homework', { id: uid(), title: title.trim(), due, done: false });
          onClose();
        }}
      />
    </Sheet>
  );
}

function PaymentSheet({ visible, onClose, student }) {
  const data = useData();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayKey());
  const [note, setNote] = useState('');

  React.useEffect(() => { if (visible) { setAmount(''); setDate(todayKey()); setNote(''); } }, [visible]);

  return (
    <Sheet visible={visible} onClose={onClose} title="Record payment">
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="e.g. 3600" style={{ flex: 1 }} />
        <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} style={{ flex: 1 }} />
      </View>
      <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="e.g. 4-lesson package, bank transfer" />
      <Button
        title="Record payment"
        disabled={Number.isNaN(parseFloat(amount))}
        onPress={() => {
          data.pushToStudent(student.id, 'payments', { id: uid(), amount: parseFloat(amount), date, note });
          onClose();
        }}
      />
    </Sheet>
  );
}

function RoadmapSheet({ visible, onClose, student }) {
  const data = useData();
  const scores = student.exams?.[student.targetExam] || {};
  const [current, setCurrent] = useState('');
  const [goal, setGoal] = useState('');
  const [targetDate, setTargetDate] = useState(addDays(todayKey(), 120));
  const [hours, setHours] = useState('5');

  React.useEffect(() => {
    if (visible) {
      setCurrent(String(scores.current ?? ''));
      setGoal(String(scores.goal ?? ''));
      setTargetDate(student.roadmap?.targetDate || addDays(todayKey(), 120));
      setHours(String(student.roadmap?.hoursPerWeek ?? 5));
    }
  }, [visible]);

  const valid = !Number.isNaN(parseFloat(current)) && !Number.isNaN(parseFloat(goal)) && /^\d{4}-\d{2}-\d{2}$/.test(targetDate);

  const generate = () => {
    const roadmap = generateRoadmap({
      exam: student.targetExam,
      current: parseFloat(current),
      goal: parseFloat(goal),
      targetDate,
      hoursPerWeek: parseFloat(hours) || 5,
    });
    data.updateStudent(student.id, {
      roadmap,
      exams: { ...student.exams, [student.targetExam]: { current: parseFloat(current), goal: parseFloat(goal) } },
    });
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={`${student.targetExam} roadmap`}>
      <T.muted style={{ marginBottom: 14 }}>
        The roadmap splits the time until the exam into phases with focus areas,
        milestones, and a weekly plan template you can adapt lesson by lesson.
      </T.muted>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field label="Current score" value={current} onChangeText={setCurrent} keyboardType="numeric" style={{ flex: 1 }} />
        <Field label="Goal score" value={goal} onChangeText={setGoal} keyboardType="numeric" style={{ flex: 1 }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field label="Exam date (YYYY-MM-DD)" value={targetDate} onChangeText={setTargetDate} style={{ flex: 1 }} />
        <Field label="Study hours / week" value={hours} onChangeText={setHours} keyboardType="numeric" style={{ flex: 1 }} />
      </View>
      <Button title="Generate roadmap" icon="sparkles-outline" kind="accent" onPress={generate} disabled={!valid} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink },
  banner: {
    borderRadius: 22, padding: 18, marginBottom: 4, overflow: 'hidden',
  },
  bannerCircle: { position: 'absolute', borderRadius: 999, backgroundColor: '#FFFFFF66' },
  bigScore: { fontFamily: fonts.display, fontSize: 34, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  paceTag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  phaseDot: { width: 11, height: 11, borderRadius: 6, marginTop: 5 },
  phaseLine: { flex: 1, width: 2, backgroundColor: colors.line, marginTop: 4 },
});