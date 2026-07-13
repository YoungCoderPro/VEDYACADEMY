// VedyAcademy design tokens
// Palette: "academy ledger" — crisp white paper, deep navy ink (matched to
// the app icon), and a brass accent for highlights, evoking gilt lettering
// on a book spine or a pencil's brass ferrule. Exam identities keep their
// own hues so purposes stay recognizable at a glance against the blue/white shell.

export const colors = {
  paper: '#F4F7FB',      // app background (crisp white with a cool blue cast)
  surface: '#FFFFFF',    // cards
  ink: '#132540',        // primary text (deep navy-black)
  muted: '#5B6B85',      // secondary text (blue-gray)
  faint: '#94A2B8',      // tertiary text
  line: '#E1E7F2',       // hairlines & borders
  pine: '#003C7C',       // primary action — matches the app icon's navy exactly
  pineDark: '#052A56',
  pineSoft: '#E3EDF9',   // primary tint background
  marigold: '#B98B3E',   // brass accent / highlights — pencil-ferrule gold
  marigoldSoft: '#F5EEDD',
  danger: '#B4553E',
  dangerSoft: '#F7E6E1',

  // Exam identities
  sat: '#4C6FA5',
  satSoft: '#E7EDF6',
  toefl: '#C96F4A',
  toeflSoft: '#F8EAE3',
  ielts: '#3A8E8C',
  ieltsSoft: '#E3F1F0',
  general: '#7A6FA5',
  generalSoft: '#EDEAF6',
};

// Every "purpose" a student can study for. Scored purposes have a numeric
// range (score journeys + roadmaps); unscored ones (school, essays) are
// tracked through their curriculum instead.
export const examMeta = {
  SAT: { color: colors.sat, soft: colors.satSoft, min: 200, max: 800, unit: 'pts', label: 'SAT English', scored: true, step: 10 },
  ACT: { color: '#A5537A', soft: '#F5E7EF', min: 1, max: 36, unit: 'pts', label: 'ACT English', scored: true, step: 1 },
  TOEFL: { color: colors.toefl, soft: colors.toeflSoft, min: 0, max: 120, unit: 'pts', label: 'TOEFL', scored: true, step: 1 },
  IELTS: { color: colors.ielts, soft: colors.ieltsSoft, min: 0, max: 9, unit: 'band', label: 'IELTS', scored: true, step: 0.5 },
  KET: { color: '#5E7D3E', soft: '#EBF1E2', min: 100, max: 150, unit: 'pts', label: 'KET (A2 Key)', scored: true, step: 1 },
  PET: { color: '#B0713F', soft: '#F6ECE2', min: 120, max: 170, unit: 'pts', label: 'PET (B1 Preliminary)', scored: true, step: 1 },
  School: { color: colors.pine, soft: colors.pineSoft, min: 0, max: 100, unit: '%', label: 'School English', scored: true, step: 1 },
  Essays: { color: '#8A5F8A', soft: '#F2E9F2', min: 0, max: 0, unit: '', label: 'University essays', scored: false },
  General: { color: colors.general, soft: colors.generalSoft, min: 0, max: 100, unit: '%', label: 'General English', scored: true, step: 1 },
};

export const PURPOSES = Object.keys(examMeta);
export const SCHOOL_LEVELS = ['Elementary', 'Middle school', 'High school', 'College'];
export const LESSON_MODES = ['In person', 'Remote'];

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, xxl: 28, pill: 999 };

// Icon + color identity for every document category, so the library and
// curriculum feel like a real bookshelf instead of a file list.
export const categoryMeta = {
  IELTS: { icon: 'earth', color: colors.ielts, soft: colors.ieltsSoft },
  TOEFL: { icon: 'school', color: colors.toefl, soft: colors.toeflSoft },
  'SAT English': { icon: 'ribbon', color: colors.sat, soft: colors.satSoft },
  'ACT English': { icon: 'ribbon-outline', color: '#A5537A', soft: '#F5E7EF' },
  KET: { icon: 'balloon', color: '#5E7D3E', soft: '#EBF1E2' },
  PET: { icon: 'rocket', color: '#B0713F', soft: '#F6ECE2' },
  'University essays': { icon: 'create', color: '#8A5F8A', soft: '#F2E9F2' },
  'School English': { icon: 'school-outline', color: colors.pine, soft: colors.pineSoft },
  Grammar: { icon: 'construct', color: '#4C6FA5', soft: '#E7EDF6' },
  Vocabulary: { icon: 'book', color: '#B0713F', soft: '#F6ECE2' },
  Reading: { icon: 'glasses', color: '#7A6FA5', soft: '#EDEAF6' },
  Writing: { icon: 'pencil', color: colors.marigold, soft: colors.marigoldSoft },
  Listening: { icon: 'headset', color: '#3A8E8C', soft: '#E3F1F0' },
  Speaking: { icon: 'mic', color: '#C96F4A', soft: '#F8EAE3' },
  Elementary: { icon: 'happy', color: '#5E7D3E', soft: '#EBF1E2' },
  'Middle school': { icon: 'bicycle', color: '#4C6FA5', soft: '#E7EDF6' },
  'High school': { icon: 'library', color: colors.pine, soft: colors.pineSoft },
  Homework: { icon: 'clipboard', color: colors.marigold, soft: colors.marigoldSoft },
  'Practice tests': { icon: 'stopwatch', color: '#B4553E', soft: '#F7E6E1' },
  Other: { icon: 'folder-open', color: colors.muted, soft: '#EDEFEC' },
};

export const shadow = {
  card: {
    shadowColor: '#20302B',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
};

export const DOC_CATEGORIES = [
  'IELTS', 'TOEFL', 'SAT English', 'ACT English', 'KET', 'PET',
  'University essays', 'School English', 'Grammar', 'Vocabulary', 'Reading',
  'Writing', 'Listening', 'Speaking', 'Elementary', 'Middle school',
  'High school', 'Homework', 'Practice tests', 'Other',
];