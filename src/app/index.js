// Public landing page — the front door of vedyacademy.org.
// No student data here: a promotional page about Vedya with a Sign in button.

import React, { useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Image, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, shadow, examMeta } from '../lib/theme';

const web = Platform.OS === 'web';

const PROGRAMS = [
  { icon: 'earth', title: 'IELTS', body: 'Band-focused preparation across all four papers, with weekly timed practice and examiner-style feedback.', color: examMeta.IELTS.color, soft: examMeta.IELTS.soft },
  { icon: 'school', title: 'TOEFL', body: 'Structured training for every section, from note-taking systems to speaking templates that hold up under pressure.', color: examMeta.TOEFL.color, soft: examMeta.TOEFL.soft },
  { icon: 'ribbon', title: 'SAT & ACT English', body: 'Grammar rules that repeat, evidence-based reading strategy, and pacing plans built from real practice tests.', color: examMeta.SAT.color, soft: examMeta.SAT.soft },
  { icon: 'create', title: 'University application essays', body: 'From story mining to final polish — essays that sound like the student, not a template.', color: examMeta.Essays.color, soft: examMeta.Essays.soft },
  { icon: 'balloon', title: 'Cambridge KET & PET', body: 'Confidence-first preparation for younger learners, keeping exams motivating instead of intimidating.', color: examMeta.KET.color, soft: examMeta.KET.soft },
  { icon: 'library', title: 'School English & general fluency', body: 'Support tied directly to the school syllabus, plus reading, writing, and speaking that grows with the student.', color: examMeta.School.color, soft: examMeta.School.soft },
];

const APPROACH = [
  { icon: 'person', title: 'Truly one-on-one', body: 'Every lesson plan, reading list, and homework set is built around one student — their level, their goals, their interests.' },
  { icon: 'map', title: 'A roadmap, not just lessons', body: 'Each student gets a phased study plan with milestones, so families always know where things stand and what comes next.' },
  { icon: 'trending-up', title: 'Progress you can see', body: 'Scores, homework, and curriculum progress are tracked lesson by lesson — improvement is measured, not guessed.' },
  { icon: 'chatbubbles', title: 'In person or online', body: 'Lessons in Istanbul or remotely — the same materials, structure, and attention either way.' },
];

export default function Landing() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const sections = useRef({});
  const { width } = useWindowDimensions();
  const narrow = width < 760;

  const jump = (key) => {
    const y = sections.current[key];
    if (scrollRef.current && y != null) scrollRef.current.scrollTo({ y: y - 70, animated: true });
  };
  const mark = (key) => (e) => { sections.current[key] = e.nativeEvent.layout.y; };

  return (
    <View style={styles.screen}>
      {/* nav bar */}
      <View style={styles.nav}>
        <View style={styles.navInner}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../../assets/images/icon.png')} style={styles.navLogo} resizeMode="contain" />
            <Text style={styles.navBrand}>VedyAcademy</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: narrow ? 10 : 22 }}>
            {!narrow && (
              <>
                <NavLink label="About" onPress={() => jump('about')} />
                <NavLink label="Programs" onPress={() => jump('programs')} />
                <NavLink label="Contact" onPress={() => jump('contact')} />
              </>
            )}
            <Pressable onPress={() => router.push('/signin')} style={({ hovered }) => [styles.signInBtn, hovered && { opacity: 0.9 }]}>
              <Text style={styles.signInText}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }}>
        {/* hero */}
        <View style={styles.hero}>
          <View style={[styles.heroCircle, { width: 340, height: 340, top: -140, right: -80, backgroundColor: '#FFFFFF10' }]} />
          <View style={[styles.heroCircle, { width: 160, height: 160, bottom: -70, left: -40, backgroundColor: '#B98B3E22' }]} />
          <Ionicons name="book" size={120} color="#FFFFFF10" style={{ position: 'absolute', top: 30, right: 40, transform: [{ rotate: '-12deg' }] }} />
          <Ionicons name="pencil" size={70} color="#FFFFFF12" style={{ position: 'absolute', bottom: 24, right: 190, transform: [{ rotate: '18deg' }] }} />

          <View style={[styles.container, { paddingVertical: narrow ? 48 : 84 }]}>
            <Text style={styles.heroEyebrow}>PRIVATE ENGLISH TUTORING · ISTANBUL & ONLINE</Text>
            <Text style={[styles.heroTitle, narrow && { fontSize: 34, lineHeight: 42 }]}>
              English, taught the way{'\n'}your child learns best.
            </Text>
            <Text style={styles.heroSub}>
              One-on-one lessons with Vedya Zalma Almelek — an English teacher with more than
              two decades in Istanbul's leading schools, now working with a small number of
              private students on exams, essays, and real fluency.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
              <Pressable onPress={() => jump('contact')} style={({ hovered }) => [styles.ctaPrimary, hovered && { opacity: 0.92 }]}>
                <Text style={styles.ctaPrimaryText}>Ask about lessons</Text>
              </Pressable>
              <Pressable onPress={() => jump('programs')} style={({ hovered }) => [styles.ctaGhost, hovered && { backgroundColor: '#FFFFFF14' }]}>
                <Text style={styles.ctaGhostText}>See programs</Text>
              </Pressable>
            </View>

            {/* stat strip */}
            <View style={[styles.statRow, narrow && { flexDirection: 'column' }]}>
              <Stat value="20+" label="years teaching English" />
              <Stat value="3" label="leading Istanbul schools" />
              <Stat value="6" label="exam & essay programs" />
              <Stat value="1:1" label="every single lesson" />
            </View>
          </View>
        </View>

        {/* about */}
        <View onLayout={mark('about')} style={[styles.container, styles.section]}>
          <Text style={styles.sectionEyebrow}>ABOUT</Text>
          <Text style={styles.sectionTitle}>Meet Vedya</Text>
          <View style={[{ flexDirection: narrow ? 'column' : 'row', gap: 28, marginTop: 18 }]}>
            <View style={styles.portraitCard}>
              <View style={styles.portrait}>
                <Text style={styles.portraitInitials}>VA</Text>
              </View>
              <Text style={styles.portraitName}>Vedya Zalma Almelek</Text>
              <Text style={styles.portraitRole}>English Language Teacher</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.body}>
                Vedya has spent her career teaching English in some of Istanbul's most respected
                schools — including 22 years at Özel Üsküdar SEV, along with Irmak Okulları and
                Istanbul International School. That means thousands of hours in real classrooms,
                with students of every level, age, and temperament.
              </Text>
              <Text style={[styles.body, { marginTop: 12 }]}>
                Today she brings that experience to private, one-on-one tutoring: exam preparation
                (IELTS, TOEFL, SAT, ACT, KET, PET), university application essays, and school
                English support. Lessons are structured around a personal roadmap for each student —
                with clear milestones, weekly plans, and honest progress tracking — because
                families deserve to see the improvement, not just hope for it.
              </Text>
              <Text style={[styles.body, { marginTop: 12 }]}>
                Warm with students, direct with parents, and relentless about the details that
                move a score: that's the teaching style, in one sentence.
              </Text>
            </View>
          </View>
        </View>

        {/* programs */}
        <View style={{ backgroundColor: colors.pineSoft }}>
          <View onLayout={mark('programs')} style={[styles.container, styles.section]}>
            <Text style={styles.sectionEyebrow}>PROGRAMS</Text>
            <Text style={styles.sectionTitle}>What students come for</Text>
            <View style={styles.grid}>
              {PROGRAMS.map((p) => (
                <View key={p.title} style={styles.programCard}>
                  <View style={[styles.programIcon, { backgroundColor: p.soft }]}>
                    <Ionicons name={p.icon} size={22} color={p.color} />
                  </View>
                  <Text style={styles.cardTitle}>{p.title}</Text>
                  <Text style={styles.cardBody}>{p.body}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* approach */}
        <View style={[styles.container, styles.section]}>
          <Text style={styles.sectionEyebrow}>THE APPROACH</Text>
          <Text style={styles.sectionTitle}>How lessons work</Text>
          <View style={styles.grid}>
            {APPROACH.map((a) => (
              <View key={a.title} style={styles.approachCard}>
                <View style={styles.approachIcon}>
                  <Ionicons name={a.icon} size={19} color={colors.pine} />
                </View>
                <Text style={styles.cardTitle}>{a.title}</Text>
                <Text style={styles.cardBody}>{a.body}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* contact */}
        <View style={{ backgroundColor: colors.pineDark }}>
          <View onLayout={mark('contact')} style={[styles.container, styles.section]}>
            <Text style={[styles.sectionEyebrow, { color: colors.marigold }]}>CONTACT</Text>
            <Text style={[styles.sectionTitle, { color: '#F4F7FB' }]}>Ask about a spot</Text>
            <Text style={[styles.body, { color: '#C9D6E8', maxWidth: 560, marginTop: 8 }]}>
              Vedya takes a limited number of private students each term. Reach out to ask about
              availability, levels, and scheduling — in English or Turkish.
            </Text>
            <View style={{ flexDirection: narrow ? 'column' : 'row', gap: 14, marginTop: 22 }}>
              <ContactRow icon="mail" text="hello@vedyacademy.org" />
              <ContactRow icon="logo-whatsapp" text="+90 5xx xxx xx xx" />
              <ContactRow icon="location" text="Istanbul · and online everywhere" />
            </View>
            <Text style={[styles.small, { color: '#8FA3C0', marginTop: 34 }]}>
              Already a student or parent here? {' '}
              <Text onPress={() => router.push('/signin')} style={{ color: colors.marigold, fontFamily: fonts.bodySemi }}>
                Sign in to your portal →
              </Text>
            </Text>
          </View>
        </View>

        {/* footer */}
        <View style={styles.footer}>
          <Text style={styles.small}>© {new Date().getFullYear()} VedyAcademy · English tutoring by Vedya Zalma Almelek</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function NavLink({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ hovered }) => [{ paddingVertical: 6 }, hovered && { opacity: 0.7 }]}>
      <Text style={styles.navLink}>{label}</Text>
    </Pressable>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ContactRow({ icon, text }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={styles.contactIcon}>
        <Ionicons name={icon} size={16} color={colors.marigold} />
      </View>
      <Text style={[styles.body, { color: '#F4F7FB' }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  container: { width: '100%', maxWidth: 1040, alignSelf: 'center', paddingHorizontal: 22 },
  nav: {
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line,
    ...(web ? { position: 'sticky', top: 0, zIndex: 100 } : {}),
  },
  navInner: {
    width: '100%', maxWidth: 1040, alignSelf: 'center', paddingHorizontal: 22,
    paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  navLogo: { width: 34, height: 34, borderRadius: 9, marginRight: 10 },
  navBrand: { fontFamily: fonts.displayBold, fontSize: 19, color: colors.ink },
  navLink: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.muted },
  signInBtn: {
    backgroundColor: colors.pine, paddingVertical: 9, paddingHorizontal: 18, borderRadius: radius.md,
    ...shadow.card,
  },
  signInText: { fontFamily: fonts.bodySemi, fontSize: 14, color: '#fff' },

  hero: { backgroundColor: colors.pineDark, overflow: 'hidden' },
  heroCircle: { position: 'absolute', borderRadius: 999 },
  heroEyebrow: { fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 2.2, color: colors.marigold },
  heroTitle: { fontFamily: fonts.displayBold, fontSize: 46, lineHeight: 54, color: '#F4F7FB', marginTop: 14 },
  heroSub: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: '#C9D6E8', marginTop: 14, maxWidth: 560 },
  ctaPrimary: { backgroundColor: colors.marigold, paddingVertical: 13, paddingHorizontal: 22, borderRadius: radius.md, ...shadow.card },
  ctaPrimaryText: { fontFamily: fonts.bodySemi, fontSize: 15, color: '#2E230C' },
  ctaGhost: { borderWidth: 1, borderColor: '#FFFFFF44', paddingVertical: 13, paddingHorizontal: 22, borderRadius: radius.md },
  ctaGhostText: { fontFamily: fonts.bodySemi, fontSize: 15, color: '#F4F7FB' },
  statRow: { flexDirection: 'row', gap: 12, marginTop: 38, flexWrap: 'wrap' },
  stat: {
    flexGrow: 1, flexBasis: 150, backgroundColor: '#FFFFFF12', borderWidth: 1, borderColor: '#FFFFFF22',
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16,
  },
  statValue: { fontFamily: fonts.display, fontSize: 28, color: '#FFFFFF' },
  statLabel: { fontFamily: fonts.body, fontSize: 12.5, color: '#C9D6E8', marginTop: 2 },

  section: { paddingVertical: 56 },
  sectionEyebrow: { fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 2, color: colors.pine },
  sectionTitle: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.ink, marginTop: 6 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.ink },
  small: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },

  portraitCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line,
    padding: 22, alignItems: 'center', alignSelf: 'flex-start', ...shadow.card,
  },
  portrait: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: colors.pine,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.marigold,
  },
  portraitInitials: { fontFamily: fonts.displayBold, fontSize: 40, color: '#fff' },
  portraitName: { fontFamily: fonts.bodySemi, fontSize: 15.5, color: colors.ink, marginTop: 12 },
  portraitRole: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 22 },
  programCard: {
    flexGrow: 1, flexBasis: 280, backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.line, padding: 18, ...shadow.card,
  },
  programIcon: {
    width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  approachCard: {
    flexGrow: 1, flexBasis: 220, backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.line, padding: 18, ...shadow.card,
  },
  approachIcon: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: colors.pineSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  cardTitle: { fontFamily: fonts.bodySemi, fontSize: 15.5, color: colors.ink, marginBottom: 5 },
  cardBody: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.muted },

  contactIcon: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFFFFF14',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  footer: {
    borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 22, alignItems: 'center',
    backgroundColor: colors.surface,
  },
});
