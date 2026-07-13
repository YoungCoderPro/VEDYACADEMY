// Roadmap generator: turns (exam, current score, goal score, deadline, hours/week)
// into a phased study roadmap, milestones, and a weekly plan template.

import { weeksBetween, todayKey, formatShort, addDays } from './dates';
import { examMeta } from './theme';

const FOCUS = {
  SAT: {
    foundation: ['Grammar rules: punctuation, agreement, verb tense', 'Core vocabulary in context', 'Sentence structure & transitions', 'Diagnostic test to map weak areas'],
    building: ['Reading: main idea, inference & evidence questions', 'Writing & Language passage drills', 'Command of evidence question pairs', 'Timed section practice (32 / 35 min)'],
    practice: ['Full timed practice tests every week', 'Error log review after each test', 'Pacing strategy: hard-question triage', 'Vocabulary-in-context speed drills'],
    review: ['Retake the 2 weakest question categories', 'Light full test 5–7 days before exam', 'Review error log, no new material', 'Sleep schedule & test-day routine'],
  },
  TOEFL: {
    foundation: ['Academic vocabulary building (AWL lists)', 'Note-taking system for lectures', 'Paraphrasing & summarizing practice', 'Diagnostic test to map weak areas'],
    building: ['Reading: skimming & detail questions', 'Listening: lectures + conversations daily', 'Speaking templates for all 4 tasks', 'Integrated & independent writing drills'],
    practice: ['Full timed practice tests every week', 'Record & review speaking responses', 'Timed essays with rubric self-scoring', 'Error log review after each test'],
    review: ['Polish speaking & writing templates', 'Light full test 5–7 days before exam', 'Review error log, no new material', 'Test-day logistics & routine'],
  },
  IELTS: {
    foundation: ['Band descriptors: know how you are scored', 'Academic vocabulary & collocations', 'Task 1 chart/letter language', 'Diagnostic test to map weak areas'],
    building: ['Reading: True/False/Not Given strategy', 'Listening: map & form completion drills', 'Task 2 essay structures & cohesion', 'Speaking Part 2 long-turn practice'],
    practice: ['Full timed practice tests every week', 'Timed Task 1 + Task 2 in 60 minutes', 'Mock speaking interviews', 'Error log review after each test'],
    review: ['Polish essay & speaking frameworks', 'Light full test 5–7 days before exam', 'Review error log, no new material', 'Test-day logistics & routine'],
  },
  General: {
    foundation: ['Grammar fundamentals review', 'Core vocabulary building', 'Reading short graded texts', 'Baseline assessment'],
    building: ['Longer reading with comprehension work', 'Structured writing paragraphs', 'Listening with podcasts/videos', 'Conversation practice topics'],
    practice: ['Essay writing with feedback', 'Free conversation & fluency work', 'Vocabulary in real contexts', 'Graded quizzes'],
    review: ['Consolidate weak areas', 'Portfolio review of writing', 'Fluency check-in', 'Set next-term goals'],
  },
};

const WEEKLY = {
  SAT: (h) => [
    { day: 'Monday', activity: 'Grammar & Writing drills', mins: 45 },
    { day: 'Tuesday', activity: 'Reading passage set (timed)', mins: 45 },
    { day: 'Wednesday', activity: 'Vocabulary in context + error log', mins: 30 },
    { day: 'Thursday', activity: 'Lesson with Vedya + homework review', mins: 60 },
    { day: 'Saturday', activity: h >= 6 ? 'Full/half practice test' : 'Timed section practice', mins: h >= 6 ? 90 : 60 },
    { day: 'Sunday', activity: 'Review mistakes, update error log', mins: 30 },
  ],
  TOEFL: (h) => [
    { day: 'Monday', activity: 'Reading practice (timed)', mins: 45 },
    { day: 'Tuesday', activity: 'Listening + note-taking drills', mins: 45 },
    { day: 'Wednesday', activity: 'Speaking tasks (record yourself)', mins: 30 },
    { day: 'Thursday', activity: 'Lesson with Vedya + homework review', mins: 60 },
    { day: 'Saturday', activity: h >= 6 ? 'Full practice test' : 'Writing task practice', mins: h >= 6 ? 120 : 60 },
    { day: 'Sunday', activity: 'Review mistakes, vocabulary revision', mins: 30 },
  ],
  IELTS: (h) => [
    { day: 'Monday', activity: 'Reading passage set (timed)', mins: 45 },
    { day: 'Tuesday', activity: 'Listening practice test section', mins: 40 },
    { day: 'Wednesday', activity: 'Writing Task 1 or Task 2 (timed)', mins: 40 },
    { day: 'Thursday', activity: 'Lesson with Vedya + homework review', mins: 60 },
    { day: 'Saturday', activity: h >= 6 ? 'Full practice test' : 'Speaking practice (Parts 1–3)', mins: h >= 6 ? 165 : 45 },
    { day: 'Sunday', activity: 'Review mistakes, vocabulary revision', mins: 30 },
  ],
  General: () => [
    { day: 'Monday', activity: 'Grammar exercises', mins: 30 },
    { day: 'Tuesday', activity: 'Reading + new vocabulary', mins: 30 },
    { day: 'Wednesday', activity: 'Writing practice', mins: 30 },
    { day: 'Thursday', activity: 'Lesson with Vedya + homework review', mins: 60 },
    { day: 'Saturday', activity: 'Listening (podcast/video) + notes', mins: 40 },
    { day: 'Sunday', activity: 'Weekly review & flashcards', mins: 25 },
  ],
};

// Difficulty note based on how ambitious the goal is for the time available.
function paceAssessment(exam, gap, weeks, hoursPerWeek) {
  const meta = examMeta[exam];
  const range = meta.max - meta.min;
  const gapPct = gap / range;
  const effort = weeks * hoursPerWeek;
  const needed = gapPct * (exam === 'IELTS' ? 250 : 220); // rough hours heuristic
  if (gap <= 0) return { level: 'maintain', text: 'The goal is already met — this plan focuses on keeping the score sharp and pushing higher.' };
  if (effort >= needed * 1.3) return { level: 'comfortable', text: 'Comfortable pace. There is more than enough time if the weekly plan is followed consistently.' };
  if (effort >= needed * 0.8) return { level: 'steady', text: 'Realistic but steady pace. Consistency each week matters more than long cram sessions.' };
  return { level: 'ambitious', text: 'Ambitious timeline. Consider adding study hours per week or an extra weekly lesson to stay on track.' };
}

export function generateRoadmap({ exam, current, goal, targetDate, hoursPerWeek = 5 }) {
  const start = todayKey();
  const weeks = weeksBetween(start, targetDate);
  const gap = goal - current;
  const focus = FOCUS[exam] || FOCUS.General;

  // Phase length allocation (weights shift with total length)
  const weights = weeks <= 6
    ? [0.2, 0.35, 0.3, 0.15]
    : weeks <= 16
      ? [0.25, 0.35, 0.25, 0.15]
      : [0.3, 0.35, 0.22, 0.13];
  let alloc = weights.map((w) => Math.max(1, Math.round(w * weeks)));
  // fix rounding drift
  let diff = weeks - alloc.reduce((a, b) => a + b, 0);
  alloc[1] += diff;
  if (alloc[1] < 1) { alloc[0] += alloc[1] - 1; alloc[1] = 1; }

  const names = ['Foundation', 'Skill building', 'Test practice', 'Final review'];
  const keys = ['foundation', 'building', 'practice', 'review'];
  let cursor = start;
  const phases = names.map((name, i) => {
    const from = cursor;
    const to = addDays(cursor, alloc[i] * 7 - 1);
    cursor = addDays(to, 1);
    return { name, weeks: alloc[i], from, to, focus: focus[keys[i]] };
  });

  // Milestones: intermediate score targets at each phase boundary
  const step = examMeta[exam]?.step || (exam === 'SAT' ? 10 : 1);
  const roundTo = (v) => Math.round(v / step) * step;
  const milestones = phases.map((p, i) => ({
    label: `End of ${p.name.toLowerCase()}`,
    date: p.to,
    target: gap > 0 ? roundTo(current + (gap * (i + 1)) / phases.length) : goal,
  }));

  return {
    exam, current, goal, targetDate, hoursPerWeek,
    generatedAt: start,
    weeks,
    gap,
    pace: paceAssessment(exam, gap, weeks, hoursPerWeek),
    phases,
    milestones,
    weekly: (WEEKLY[exam] || WEEKLY.General)(hoursPerWeek),
    summary: gap > 0
      ? `${gap} ${examMeta[exam]?.unit || 'pts'} to gain in ${weeks} weeks (target: ${formatShort(targetDate)}).`
      : `Goal already reached — ${weeks} weeks to consolidate before ${formatShort(targetDate)}.`,
  };
}
