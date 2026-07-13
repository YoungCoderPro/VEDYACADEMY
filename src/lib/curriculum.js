// Curriculum engine.
// Builds an ordered, unit-by-unit curriculum for a student from their purpose
// (why they take lessons), and auto-attaches matching documents from the
// library by category. Units are editable after generation: reorder isn't
// needed for v1 but attach/detach docs, mark complete, and add custom units are.

import { uid, todayKey } from './dates';

// Each unit: { title, objectives: [...], docCategories: [...] }
// docCategories are matched against library document categories to auto-attach.
const TEMPLATES = {
  School: [
    { title: 'Where the student stands', objectives: ['Review current school syllabus & grades', 'Short diagnostic: reading + writing sample', 'Agree on term goals with student (and parent)'], docCategories: ['School English', 'Practice tests'] },
    { title: 'Grammar gaps from class', objectives: ['Target the exact structures being graded at school', 'Error-log recurring mistakes from schoolwork', 'Weekly mini-quizzes'], docCategories: ['Grammar'] },
    { title: 'Vocabulary for the term', objectives: ['Word lists tied to current school units', 'Spaced-repetition flashcards routine', 'Use new words in sentences weekly'], docCategories: ['Vocabulary'] },
    { title: 'Reading like the exam asks', objectives: ['Comprehension question types from school exams', 'Summarizing paragraphs in own words', 'Reading aloud for fluency (younger students)'], docCategories: ['Reading'] },
    { title: 'Writing that scores', objectives: ['Paragraph structure: topic sentence → support → close', 'The essay/letter formats their school grades', 'Redrafting one piece of real schoolwork together'], docCategories: ['Writing'] },
    { title: 'Speaking & class participation', objectives: ['Answering in full sentences', 'Presentation practice if school requires it', 'Confidence drills before oral exams'], docCategories: ['Speaking'] },
    { title: 'Exam rehearsal', objectives: ['Practice with past school exam formats', 'Time management in written exams', 'Checklist for reviewing answers'], docCategories: ['Practice tests', 'School English'] },
    { title: 'Term review & next goals', objectives: ['Compare grades before/after', 'Update parents with a progress report', 'Set goals for next term'], docCategories: [] },
  ],
  Essays: [
    { title: 'Story mining', objectives: ['Brainstorm life experiences, values, turning points', 'Identify 3–4 candidate essay topics', 'Read 2–3 excellent example essays and discuss why they work'], docCategories: ['University essays', 'Writing'] },
    { title: 'Understanding the prompts', objectives: ['Break down each target prompt (Common App / school-specific)', 'Map topics to prompts', 'What admissions readers actually look for'], docCategories: ['University essays'] },
    { title: 'Voice before polish', objectives: ['Free-writing exercises to find natural voice', 'Show-don\u2019t-tell drills', 'Avoiding thesaurus-syndrome and clich\u00e9s'], docCategories: ['Writing', 'University essays'] },
    { title: 'First drafts', objectives: ['Full draft of main essay — imperfect on purpose', 'Structure check: hook, arc, reflection', 'Word-count discipline'], docCategories: ['University essays'] },
    { title: 'The revision loop', objectives: ['Big-picture feedback round (story, stakes, reflection)', 'Line-level round (rhythm, precision, grammar)', 'Read-aloud test'], docCategories: ['Writing', 'Grammar'] },
    { title: 'Supplemental essays', objectives: ['\u201cWhy this school\u201d research method', 'Reusing material across prompts honestly', 'Short-answer punchiness'], docCategories: ['University essays'] },
    { title: 'Final polish & submission', objectives: ['Proofreading checklist', 'Formatting and word limits', 'Submission timeline with buffer days'], docCategories: [] },
  ],
  IELTS: [
    { title: 'Know the test', objectives: ['Format of all 4 papers', 'Band descriptors: how examiners score', 'Full diagnostic test'], docCategories: ['IELTS', 'Practice tests'] },
    { title: 'Listening foundations', objectives: ['Prediction and keyword techniques', 'Form/map/table completion drills', 'Spelling and number accuracy'], docCategories: ['IELTS', 'Listening'] },
    { title: 'Reading strategies', objectives: ['Skimming vs scanning', 'True/False/Not Given method', 'Matching headings under time'], docCategories: ['IELTS', 'Reading'] },
    { title: 'Writing Task 1', objectives: ['Describing charts, graphs, processes', 'Overview sentences and data selection', 'Academic vocabulary for trends'], docCategories: ['IELTS', 'Writing'] },
    { title: 'Writing Task 2', objectives: ['Essay types and structures', 'Cohesion: linking without formula-stuffing', 'Timed 40-minute essays with rubric scoring'], docCategories: ['IELTS', 'Writing'] },
    { title: 'Speaking parts 1–3', objectives: ['Part 2 long-turn planning method', 'Extending answers naturally', 'Recorded mock interviews'], docCategories: ['IELTS', 'Speaking'] },
    { title: 'Full test rehearsal', objectives: ['Weekly full timed tests', 'Error-log review after each', 'Weakest-paper targeted drills'], docCategories: ['Practice tests', 'IELTS'] },
    { title: 'Final week', objectives: ['Light review only, no new material', 'Test-day logistics', 'Confidence and pacing plan'], docCategories: [] },
  ],
  KET: [
    { title: 'Meet the exam', objectives: ['A2 Key format: Reading & Writing, Listening, Speaking', 'Scoring and what a pass looks like', 'Fun diagnostic to find the starting point'], docCategories: ['KET', 'Practice tests'] },
    { title: 'Core vocabulary', objectives: ['A2 word list by topic (family, school, hobbies...)', 'Picture-based vocabulary games', 'Spelling practice'], docCategories: ['KET', 'Vocabulary'] },
    { title: 'Everyday grammar', objectives: ['Present/past tenses in context', 'Question forms', 'Short sentence building'], docCategories: ['Grammar', 'KET'] },
    { title: 'Reading & Writing paper', objectives: ['Matching and gap-fill tasks', 'Writing a short message/note (25+ words)', 'Common trap answers'], docCategories: ['KET', 'Reading', 'Writing'] },
    { title: 'Listening paper', objectives: ['Listening for key information', 'Numbers, prices, times, spellings', 'Practice with different accents'], docCategories: ['KET', 'Listening'] },
    { title: 'Speaking paper', objectives: ['Answering personal questions confidently', 'Two-way conversation task practice', 'Mock speaking with examiner-style prompts'], docCategories: ['KET', 'Speaking'] },
    { title: 'Practice tests & rehearsal', objectives: ['Full timed practice tests', 'Review mistakes together', 'Celebrate progress — keep it fun'], docCategories: ['Practice tests', 'KET'] },
  ],
  PET: [
    { title: 'Meet the exam', objectives: ['B1 Preliminary format across all papers', 'Scoring bands', 'Full diagnostic test'], docCategories: ['PET', 'Practice tests'] },
    { title: 'B1 vocabulary building', objectives: ['Topic-based word lists', 'Phrasal verbs and collocations', 'Flashcard routine'], docCategories: ['PET', 'Vocabulary'] },
    { title: 'Grammar in use', objectives: ['All main tenses contrasted', 'Conditionals and comparatives', 'Sentence transformations'], docCategories: ['Grammar', 'PET'] },
    { title: 'Reading paper', objectives: ['Multiple choice and gapped text strategy', 'Reading for gist vs detail', 'Time management'], docCategories: ['PET', 'Reading'] },
    { title: 'Writing paper', objectives: ['Email/message writing', 'Article and story writing', 'Checking work systematically'], docCategories: ['PET', 'Writing'] },
    { title: 'Listening paper', objectives: ['Prediction before listening', 'Multiple choice and gap-fill drills', 'Note-taking basics'], docCategories: ['PET', 'Listening'] },
    { title: 'Speaking paper', objectives: ['Describing photos', 'Discussion task strategies', 'Mock speaking interviews'], docCategories: ['PET', 'Speaking'] },
    { title: 'Practice tests & rehearsal', objectives: ['Full timed tests weekly', 'Error log review', 'Final-week light revision plan'], docCategories: ['Practice tests', 'PET'] },
  ],
  TOEFL: [
    { title: 'Know the test', objectives: ['TOEFL iBT format and scoring', 'Full diagnostic test', 'Set section score targets'], docCategories: ['TOEFL', 'Practice tests'] },
    { title: 'Academic vocabulary', objectives: ['AWL word lists', 'Words in academic contexts', 'Paraphrasing practice'], docCategories: ['TOEFL', 'Vocabulary'] },
    { title: 'Reading section', objectives: ['Passage mapping', 'Inference and vocabulary questions', 'Timed passage sets'], docCategories: ['TOEFL', 'Reading'] },
    { title: 'Listening section', objectives: ['Note-taking system for lectures', 'Conversation question types', 'Daily listening habit'], docCategories: ['TOEFL', 'Listening'] },
    { title: 'Speaking section', objectives: ['Templates for all 4 tasks', 'Recording and self-review', '15-second prep discipline'], docCategories: ['TOEFL', 'Speaking'] },
    { title: 'Writing section', objectives: ['Integrated writing structure', 'Academic discussion task', 'Timed essays with scoring'], docCategories: ['TOEFL', 'Writing'] },
    { title: 'Full test rehearsal', objectives: ['Weekly full timed tests', 'Error-log review', 'Weakest-section drills'], docCategories: ['Practice tests', 'TOEFL'] },
    { title: 'Final week', objectives: ['Light review, templates fresh', 'Test-day logistics', 'Sleep and pacing plan'], docCategories: [] },
  ],
  SAT: [
    { title: 'Know the test', objectives: ['Digital SAT format: Reading & Writing modules', 'Adaptive scoring explained', 'Full diagnostic test'], docCategories: ['SAT English', 'Practice tests'] },
    { title: 'Grammar rules that repeat', objectives: ['Punctuation: commas, semicolons, dashes', 'Subject-verb agreement & verb tense', 'Transitions between ideas'], docCategories: ['SAT English', 'Grammar'] },
    { title: 'Vocabulary in context', objectives: ['Words-in-context question method', 'High-frequency academic words', 'Precision over memorization'], docCategories: ['SAT English', 'Vocabulary'] },
    { title: 'Reading: craft & structure', objectives: ['Main idea and function questions', 'Paired passages and quotations', 'Poetry and older texts exposure'], docCategories: ['SAT English', 'Reading'] },
    { title: 'Command of evidence', objectives: ['Evidence-pair question strategy', 'Data and graph questions', 'Eliminating trap answers'], docCategories: ['SAT English'] },
    { title: 'Timed module practice', objectives: ['Module pacing: ~1.2 min per question', 'Hard-question triage', 'Score tracking per category'], docCategories: ['SAT English', 'Practice tests'] },
    { title: 'Full test rehearsal', objectives: ['Weekly full adaptive practice tests', 'Error-log review after each', 'Weakest-category drills'], docCategories: ['Practice tests'] },
    { title: 'Final week', objectives: ['Light test 5–7 days out', 'Review error log only', 'Test-day routine'], docCategories: [] },
  ],
  ACT: [
    { title: 'Know the test', objectives: ['ACT English & Reading format', 'Pacing reality: 45 min / 75 questions', 'Full diagnostic test'], docCategories: ['ACT English', 'Practice tests'] },
    { title: 'English: usage & mechanics', objectives: ['Punctuation and sentence structure', 'Agreement and verb forms', 'Concision: shorter is usually right'], docCategories: ['ACT English', 'Grammar'] },
    { title: 'English: rhetorical skills', objectives: ['Adding/deleting sentences', 'Transitions and organization', 'Writer\u2019s goal questions'], docCategories: ['ACT English'] },
    { title: 'Reading section', objectives: ['4 passages in 35 min: pacing plan', 'Question types by passage genre', 'Line-reference speed drills'], docCategories: ['ACT English', 'Reading'] },
    { title: 'Timed section practice', objectives: ['Full sections under real time', 'Guess-and-move strategy', 'Score tracking'], docCategories: ['Practice tests', 'ACT English'] },
    { title: 'Full test rehearsal', objectives: ['Weekly full timed tests', 'Error-log review', 'Weakest-area drills'], docCategories: ['Practice tests'] },
    { title: 'Final week', objectives: ['Light review only', 'Test-day routine', 'Pacing plan on a card'], docCategories: [] },
  ],
  General: [
    { title: 'Starting point', objectives: ['Level assessment (CEFR estimate)', 'Interests inventory — teach through what they love', 'Set 3 concrete goals'], docCategories: ['Practice tests'] },
    { title: 'Grammar foundations', objectives: ['Core tense system', 'Sentence building blocks', 'Little-and-often drills'], docCategories: ['Grammar'] },
    { title: 'Vocabulary that sticks', objectives: ['Topic-based word banks', 'Spaced repetition routine', 'Using new words in conversation'], docCategories: ['Vocabulary'] },
    { title: 'Reading for pleasure & progress', objectives: ['Graded readers at the right level', 'Comprehension conversations', 'Reading journal'], docCategories: ['Reading'] },
    { title: 'Confident speaking', objectives: ['Conversation topics ladder', 'Pronunciation focus points', 'Fluency over perfection'], docCategories: ['Speaking'] },
    { title: 'Writing with purpose', objectives: ['Messages, emails, short essays', 'Feedback and redrafting loop', 'Personal writing projects'], docCategories: ['Writing'] },
    { title: 'Listening immersion', objectives: ['Podcasts/series at level +1', 'Active listening tasks', 'Weekly listening habit'], docCategories: ['Listening'] },
    { title: 'Review & level-up', objectives: ['Re-assess level vs start', 'Celebrate wins', 'Set next-stage goals'], docCategories: [] },
  ],
};

// Attach up to 3 matching library documents per unit, spreading docs across
// units so the same PDF isn't attached everywhere.
export function generateCurriculum({ purpose, documents = [] }) {
  const template = TEMPLATES[purpose] || TEMPLATES.General;
  const used = new Set();

  const units = template.map((u, i) => {
    const matches = documents
      .filter((d) => u.docCategories.includes(d.category))
      .sort((a, b) => (used.has(a.id) ? 1 : 0) - (used.has(b.id) ? 1 : 0))
      .slice(0, 3);
    matches.forEach((d) => used.add(d.id));
    return {
      id: uid(),
      order: i + 1,
      title: u.title,
      objectives: u.objectives,
      docIds: matches.map((d) => d.id),
      status: 'planned', // planned | in-progress | done
      notes: '',
    };
  });

  return { purpose, generatedAt: todayKey(), units };
}

export const UNIT_STATUS = {
  planned: { label: 'Planned', next: 'in-progress' },
  'in-progress': { label: 'In progress', next: 'done' },
  done: { label: 'Done', next: 'planned' },
};
