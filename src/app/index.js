// Public landing page — vedyacademy.org.
// Design intent: one respected teacher's practice, not a startup. White and
// deep navy, serif authority, real credentials, no decorative noise.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, fonts, shadow } from '../lib/theme';

const web = Platform.OS === 'web';

const NAVY = '#052A56';
const INK = '#132540';
const BRASS = '#B98B3E';

const EXAM_BADGES = ['IELTS', 'TOEFL iBT', 'SAT', 'ACT', 'Cambridge KET & PET', 'IB English'];

const SCHOOLS = [
  { name: 'Özel Üsküdar SEV', detail: 'English Language Teacher — 22 years' },
  { name: 'Irmak Okulları', detail: 'English Language Teacher' },
  { name: 'Istanbul International School', detail: 'English Language Teacher' },
];

const PROGRAMS = [
  { title: 'IELTS', body: 'All four papers, band descriptors, and weekly timed practice — built around the score the student actually needs.' },
  { title: 'TOEFL iBT', body: 'Section-by-section training: note-taking systems, speaking templates, and integrated writing that holds up under time pressure.' },
  { title: 'SAT & ACT English', body: 'The grammar rules that repeat, evidence-based reading, and pacing strategy drawn from full timed practice tests.' },
  { title: 'IB English', body: 'Paper 1 and Paper 2 essay technique, Individual Oral preparation, and coursework feedback against the actual criteria.' },
  { title: 'Cambridge KET & PET', body: 'Confidence-first preparation for younger learners — exams as a milestone, not a source of dread.' },
  { title: 'University application essays', body: 'From finding the story to the final read-aloud: essays that sound like the student, not a template.' },
  { title: 'School English & general fluency', body: 'Support tied to the school syllabus — grammar, writing, and speaking that show up in report cards.' },
];

const STEPS = [
  { n: '01', title: 'Assessment', body: 'A first meeting and level assessment: where the student stands, what the target is, and how much time there is to get there.' },
  { n: '02', title: 'A personal roadmap', body: 'Every student gets a written, phased study plan with milestones — so the path from today\u2019s level to the goal is visible, not vague.' },
  { n: '03', title: 'Weekly lessons & honest reporting', body: 'One-on-one lessons, tracked homework, and progress reports parents can actually read. Improvement is measured, never assumed.' },
];

export default function Landing() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const sections = useRef({});
  const { width } = useWindowDimensions();
  const narrow = width < 780;

  const jump = (key) => {
    const y = sections.current[key];
    if (scrollRef.current && y != null) scrollRef.current.scrollTo({ y: y - 64, animated: true });
  };
  const mark = (key) => (e) => { sections.current[key] = e.nativeEvent.layout.y; };

  return (
    <View style={styles.screen}>
      {/* ---- nav ---- */}
      <View style={styles.nav}>
        <View style={styles.navInner}>
          <Pressable onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../../assets/images/icon.png')} style={styles.navLogo} resizeMode="contain" />
            <Text style={styles.navBrand}>VedyAcademy</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: narrow ? 12 : 26 }}>
            {!narrow && (
              <>
                <NavLink label="About" onPress={() => jump('about')} />
                <NavLink label="Programs" onPress={() => jump('programs')} />
                <NavLink label="How it works" onPress={() => jump('how')} />
                <NavLink label="Contact" onPress={() => jump('contact')} />
              </>
            )}
            <Pressable onPress={() => router.push('/signin')} style={({ hovered }) => [styles.signInBtn, hovered && { backgroundColor: '#EDF2F9' }]}>
              <Text style={styles.signInText}>Student sign in</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }}>
        {/* ---- hero: split, on paper ---- */}
        <View style={[styles.container, { paddingTop: narrow ? 40 : 72, paddingBottom: narrow ? 40 : 64 }]}>
          <View style={{ flexDirection: narrow ? 'column' : 'row', gap: narrow ? 32 : 56, alignItems: narrow ? 'stretch' : 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>PRIVATE ENGLISH TUTORING · ISTANBUL & ONLINE</Text>
              <Text style={[styles.heroTitle, narrow && { fontSize: 34, lineHeight: 42 }]}>
                Two decades of teaching English.{'\n'}One student at a time.
              </Text>
              <Text style={styles.heroSub}>
                Vedya Zalma Almelek has taught English for more than twenty years in some of
                Istanbul's most respected schools. She now works privately with a small number
                of students each term — on exams, essays, and lasting fluency.
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
                <Pressable onPress={() => jump('contact')} style={({ hovered }) => [styles.ctaPrimary, hovered && { opacity: 0.92 }]}>
                  <Text style={styles.ctaPrimaryText}>Enquire about lessons</Text>
                </Pressable>
                <Pressable onPress={() => jump('programs')} style={({ hovered }) => [styles.ctaSecondary, hovered && { backgroundColor: '#EDF2F9' }]}>
                  <Text style={styles.ctaSecondaryText}>View programs</Text>
                </Pressable>
              </View>
            </View>

            {/* portrait / credential card */}
            <View style={[styles.portraitCard, narrow && { alignSelf: 'center' }]}>
              <View style={styles.portrait}>
                <Text style={styles.portraitInitials}>VA</Text>
              </View>
              <Text style={styles.portraitName}>Vedya Zalma Almelek</Text>
              <Text style={styles.portraitRole}>English Language Teacher</Text>
              <View style={styles.portraitRule} />
              {SCHOOLS.map((s) => (
                <View key={s.name} style={{ marginBottom: 8 }}>
                  <Text style={styles.credName}>{s.name}</Text>
                  <Text style={styles.credDetail}>{s.detail}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ---- exam badge bar ---- */}
        <View style={styles.badgeBar}>
          <View style={[styles.container, { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingVertical: 18 }]}>
            <Text style={styles.badgeLead}>Preparation for</Text>
            {EXAM_BADGES.map((b) => (
              <View key={b} style={styles.examBadge}>
                <Text style={styles.examBadgeText}>{b}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ---- about ---- */}
        <View onLayout={mark('about')} style={[styles.container, styles.section]}>
          <View style={{ flexDirection: narrow ? 'column' : 'row', gap: narrow ? 20 : 64 }}>
            <View style={{ width: narrow ? '100%' : 260 }}>
              <Text style={styles.eyebrow}>ABOUT</Text>
              <Text style={styles.sectionTitle}>A teacher first</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.body}>
                Vedya's career has been spent in the classroom — including twenty-two years at
                Özel Üsküdar SEV, and teaching posts at Irmak Okulları and Istanbul International
                School. That is thousands of hours with real students of every level and age,
                across the Turkish national curriculum, international programs, and the IB.
              </Text>
              <Text style={[styles.body, { marginTop: 14 }]}>
                Private tutoring is the same craft, concentrated: one student, one clear goal,
                and a plan measured in weeks — whether the goal is an IELTS band, an SAT score,
                an IB grade, a university essay, or simply English that finally feels natural.
              </Text>
              <Text style={[styles.body, { marginTop: 14 }]}>
                Families work directly with Vedya — there is no agency, no rotating tutors, and
                no script. Warm with students, direct with parents, and precise about the
                details that move a result.
              </Text>
            </View>
          </View>
        </View>

        {/* ---- programs ---- */}
        <View style={{ backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line }}>
          <View onLayout={mark('programs')} style={[styles.container, styles.section]}>
            <Text style={styles.eyebrow}>PROGRAMS</Text>
            <Text style={styles.sectionTitle}>What students come for</Text>
            <View style={styles.programGrid}>
              {PROGRAMS.map((p) => (
                <View key={p.title} style={styles.programRow}>
                  <View style={styles.programRule} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.programTitle}>{p.title}</Text>
                    <Text style={styles.programBody}>{p.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ---- how it works ---- */}
        <View onLayout={mark('how')} style={[styles.container, styles.section]}>
          <Text style={styles.eyebrow}>HOW IT WORKS</Text>
          <Text style={styles.sectionTitle}>From first meeting to results</Text>
          <View style={{ flexDirection: narrow ? 'column' : 'row', gap: 18, marginTop: 26 }}>
            {STEPS.map((s) => (
              <View key={s.n} style={styles.stepCard}>
                <Text style={styles.stepNum}>{s.n}</Text>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepBody}>{s.body}</Text>
              </View>
            ))}
          </View>
          <View style={styles.parentNote}>
            <Ionicons name="lock-closed" size={15} color={BRASS} style={{ marginRight: 9, marginTop: 2 }} />
            <Text style={[styles.body, { flex: 1, fontSize: 14 }]}>
              Every family receives access to a private portal: upcoming lessons, homework,
              the study roadmap, shared materials, and progress — visible at any time.
            </Text>
          </View>
        </View>

        {/* ---- contact ---- */}
        <View style={{ backgroundColor: NAVY }}>
          <View onLayout={mark('contact')} style={[styles.container, styles.section]}>
            <View style={{ maxWidth: 640 }}>
              <Text style={[styles.eyebrow, { color: BRASS }]}>CONTACT</Text>
              <Text style={[styles.sectionTitle, { color: '#F4F7FB' }]}>Ask about a place</Text>
              <Text style={[styles.body, { color: '#C2CFE2', marginTop: 10 }]}>
                Vedya takes a limited number of private students each term. Write in English or
                Turkish to ask about availability, levels, and scheduling.
              </Text>
              <View style={{ marginTop: 26, gap: 14 }}>
                <ContactRow icon="mail-outline" text="hello@vedyacademy.org" />
                <ContactRow icon="logo-whatsapp" text="+90 5xx xxx xx xx" />
                <ContactRow icon="location-outline" text="Istanbul · in person or online" />
              </View>
              <Text style={[styles.small, { color: '#7E93B3', marginTop: 34 }]}>
                Already a student or parent here?{' '}
                <Text onPress={() => router.push('/signin')} style={{ color: BRASS, fontFamily: fonts.bodySemi }}>
                  Sign in to your portal
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* ---- footer ---- */}
        <View style={styles.footer}>
          <Text style={styles.small}>
            © {new Date().getFullYear()} VedyAcademy — English tutoring by Vedya Zalma Almelek, Istanbul
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function NavLink({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ hovered }) => [{ paddingVertical: 6 }, hovered && { opacity: 0.65 }]}>
      <Text style={styles.navLink}>{label}</Text>
    </Pressable>
  );
}

function ContactRow({ icon, text }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name={icon} size={17} color={BRASS} style={{ width: 30 }} />
      <Text style={[styles.body, { color: '#F4F7FB' }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  container: { width: '100%', maxWidth: 1080, alignSelf: 'center', paddingHorizontal: 24 },

  nav: {
    backgroundColor: '#FFFFFFF2', borderBottomWidth: 1, borderBottomColor: colors.line,
    ...(web ? { position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(8px)' } : {}),
  },
  navInner: {
    width: '100%', maxWidth: 1080, alignSelf: 'center', paddingHorizontal: 24,
    paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  navLogo: { width: 30, height: 30, borderRadius: 7, marginRight: 10 },
  navBrand: { fontFamily: fonts.displayBold, fontSize: 18, color: INK, letterSpacing: 0.2 },
  navLink: { fontFamily: fonts.bodyMedium, fontSize: 14, color: '#44536E' },
  signInBtn: {
    borderWidth: 1.5, borderColor: NAVY, paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 8, backgroundColor: 'transparent',
  },
  signInText: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: INK },

  eyebrow: { fontFamily: fonts.bodySemi, fontSize: 11.5, letterSpacing: 2.4, color: '#5B6B85' },
  heroTitle: { fontFamily: fonts.displayBold, fontSize: 44, lineHeight: 54, color: INK, marginTop: 16 },
  heroSub: { fontFamily: fonts.body, fontSize: 16.5, lineHeight: 26, color: '#44536E', marginTop: 16, maxWidth: 540 },
  ctaPrimary: { backgroundColor: NAVY, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8 },
  ctaPrimaryText: { fontFamily: fonts.bodySemi, fontSize: 15, color: '#FFFFFF' },
  ctaSecondary: { borderWidth: 1.5, borderColor: colors.line, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, backgroundColor: '#FFFFFF' },
  ctaSecondaryText: { fontFamily: fonts.bodySemi, fontSize: 15, color: INK },

  portraitCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: colors.line,
    padding: 26, width: 300, ...shadow.card,
  },
  portrait: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: NAVY,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  portraitInitials: { fontFamily: fonts.displayBold, fontSize: 32, color: '#fff' },
  portraitName: { fontFamily: fonts.displayBold, fontSize: 17, color: INK, textAlign: 'center', marginTop: 14 },
  portraitRole: { fontFamily: fonts.body, fontSize: 13, color: '#5B6B85', textAlign: 'center', marginTop: 2 },
  portraitRule: { height: 1, backgroundColor: colors.line, marginVertical: 16 },
  credName: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: INK },
  credDetail: { fontFamily: fonts.body, fontSize: 12.5, color: '#5B6B85', marginTop: 1 },

  badgeBar: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
  badgeLead: { fontFamily: fonts.bodyMedium, fontSize: 13, color: '#5B6B85', marginRight: 6 },
  examBadge: {
    borderWidth: 1, borderColor: '#D5DDEA', borderRadius: 6,
    paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#FBFCFE',
  },
  examBadgeText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: '#33456B', letterSpacing: 0.4 },

  section: { paddingVertical: 64 },
  sectionTitle: { fontFamily: fonts.displayBold, fontSize: 30, color: INK, marginTop: 8 },
  body: { fontFamily: fonts.body, fontSize: 15.5, lineHeight: 25, color: '#33415C' },
  small: { fontFamily: fonts.body, fontSize: 13, color: '#5B6B85' },

  programGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 44, rowGap: 30, marginTop: 30 },
  programRow: { flexDirection: 'row', flexBasis: 440, flexGrow: 1 },
  programRule: { width: 3, borderRadius: 2, backgroundColor: BRASS, marginRight: 16, marginTop: 3, marginBottom: 3 },
  programTitle: { fontFamily: fonts.displayBold, fontSize: 17.5, color: INK },
  programBody: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21.5, color: '#44536E', marginTop: 4 },

  stepCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line,
    borderRadius: 12, padding: 22,
  },
  stepNum: { fontFamily: fonts.display, fontSize: 15, color: BRASS, letterSpacing: 1 },
  stepTitle: { fontFamily: fonts.displayBold, fontSize: 18, color: INK, marginTop: 8 },
  stepBody: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21.5, color: '#44536E', marginTop: 6 },
  parentNote: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line,
    borderRadius: 12, padding: 16, marginTop: 22, alignItems: 'flex-start',
  },

  footer: {
    borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 24, alignItems: 'center',
    backgroundColor: colors.paper,
  },
});