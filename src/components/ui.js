// Shared UI kit. Everything visual and reusable lives here so screens stay
// focused on behavior.

import React from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, Modal, Platform, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, shadow, examMeta } from '../lib/theme';

const web = Platform.OS === 'web';

// ---------- layout ----------
export function Screen({ children, scroll = true, pad = true }) {
  const inner = (
    <View style={[styles.container, pad && { padding: 20, paddingBottom: 48 }]}>{children}</View>
  );
  if (!scroll) return <View style={styles.screen}>{inner}</View>;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      {inner}
    </ScrollView>
  );
}

export function PageHeader({ eyebrow, title, right, icon }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        {!!icon && (
          <View style={styles.headerBadge}>
            <Ionicons name={icon} size={26} color={colors.pine} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
          <Text style={styles.pageTitle}>{title}</Text>
        </View>
      </View>
      {right}
    </View>
  );
}

// Hero banner — the signature element. Deep navy panel with faint stationery
// motifs (book, pencil, pen) watermarked in the background, used to open the
// Today screen (and anywhere a warm welcome fits).
export function Hero({ children, style }) {
  return (
    <View style={[styles.hero, style]}>
      {/* decorative stationery watermarks */}
      <View style={[styles.heroCircle, { width: 220, height: 220, top: -90, right: -60, backgroundColor: '#FFFFFF10' }]} />
      <View style={[styles.heroCircle, { width: 120, height: 120, bottom: -50, right: 70, backgroundColor: '#B98B3E22' }]} />
      <Ionicons name="book" size={92} color="#FFFFFF12" style={{ position: 'absolute', top: 10, right: 18, transform: [{ rotate: '-12deg' }] }} />
      <Ionicons name="pencil" size={54} color="#FFFFFF14" style={{ position: 'absolute', bottom: 8, right: 130, transform: [{ rotate: '18deg' }] }} />
      <Ionicons name="create-outline" size={38} color="#B98B3E33" style={{ position: 'absolute', top: 22, right: 128 }} />
      {children}
    </View>
  );
}

export function Card({ children, style, onPress, tint, accent }) {
  const body = (
    <View style={[styles.card, tint && { backgroundColor: tint }, style]}>
      {!!accent && <View style={[styles.cardAccent, { backgroundColor: accent }]} />}
      {children}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed, hovered }) => [
      { borderRadius: radius.lg },
      (pressed || hovered) && web && { transform: [{ translateY: -2 }] },
      pressed && !web && { opacity: 0.92 },
    ]}>
      {body}
    </Pressable>
  );
}

export function SectionTitle({ children, right, icon, style }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {!!icon && (
          <View style={styles.sectionBadge}>
            <Ionicons name={icon} size={15} color={colors.pineDark} />
          </View>
        )}
        <Text style={styles.sectionTitle}>{children}</Text>
      </View>
      {right}
    </View>
  );
}

// Round icon medallion — used for stats, empty states, library categories.
export function IconBadge({ icon, color = colors.pine, soft = colors.pineSoft, size = 44 }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2, backgroundColor: soft,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Ionicons name={icon} size={size * 0.48} color={color} />
    </View>
  );
}

// ---------- text ----------
export const T = {
  body: (p) => <Text {...p} style={[styles.body, p.style]} />,
  muted: (p) => <Text {...p} style={[styles.mutedText, p.style]} />,
  semi: (p) => <Text {...p} style={[styles.semi, p.style]} />,
  small: (p) => <Text {...p} style={[styles.small, p.style]} />,
};

// ---------- buttons ----------
export function Button({ title, onPress, kind = 'primary', icon, small, style, disabled }) {
  const kinds = {
    primary: { bg: colors.pine, fg: '#fff', border: colors.pine },
    accent: { bg: colors.marigold, fg: '#3E2E10', border: colors.marigold },
    ghost: { bg: colors.surface, fg: colors.pine, border: colors.line },
    danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
    quiet: { bg: colors.pineSoft, fg: colors.pineDark, border: colors.pineSoft },
  };
  const k = kinds[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed, hovered }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: k.bg, borderColor: k.border, opacity: disabled ? 0.5 : pressed ? 0.85 : hovered ? 0.92 : 1 },
        (kind === 'primary' || kind === 'accent') && !disabled && styles.btnShadow,
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={small ? 15 : 17} color={k.fg} style={{ marginRight: title ? 6 : 0 }} />}
      {!!title && <Text style={[styles.btnText, small && { fontSize: 13 }, { color: k.fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function IconBtn({ icon, onPress, color = colors.muted, size = 20, style }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.6 : 1 }, style]}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

// ---------- chips / tags ----------
export function Chip({ label, active, onPress, color = colors.pine, soft = colors.pineSoft, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? color : soft, borderColor: active ? color : 'transparent' },
        active && styles.chipActive,
        style,
      ]}
    >
      <Text style={[styles.chipText, { color: active ? '#fff' : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function ExamTag({ exam, style }) {
  const m = examMeta[exam] || examMeta.General;
  return (
    <View style={[styles.tag, { backgroundColor: m.soft }, style]}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: m.color, marginRight: 6 }} />
      <Text style={[styles.tagText, { color: colors.ink }]}>{exam}</Text>
    </View>
  );
}

export function StatusPill({ status }) {
  const map = {
    scheduled: { bg: colors.pineSoft, fg: colors.pineDark, label: 'Scheduled', icon: 'time-outline' },
    completed: { bg: colors.satSoft, fg: colors.sat, label: 'Completed', icon: 'checkmark-circle' },
    cancelled: { bg: colors.dangerSoft, fg: colors.danger, label: 'Cancelled', icon: 'close-circle' },
  };
  const m = map[status] || map.scheduled;
  return (
    <View style={[styles.tag, { backgroundColor: m.bg }]}>
      <Ionicons name={m.icon} size={12} color={m.fg} style={{ marginRight: 4 }} />
      <Text style={[styles.tagText, { color: m.fg }]}>{m.label}</Text>
    </View>
  );
}

// ---------- forms ----------
export function Field({ label, value, onChangeText, placeholder, keyboardType, multiline, style }) {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
      <TextInput
        value={value == null ? '' : String(value)}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && { height: 88, textAlignVertical: 'top', paddingTop: 10 }]}
      />
    </View>
  );
}

export function ChipSelect({ label, options, value, onChange, style }) {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((o) => (
          <Chip key={o} label={o} active={value === o} onPress={() => onChange(o)} />
        ))}
      </View>
    </View>
  );
}

// ---------- modal sheet ----------
export function Sheet({ visible, onClose, title, children, wide }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, wide && web && { maxWidth: 720 }]} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <IconBtn icon="close" onPress={onClose} />
          </View>
          <ScrollView style={{ maxHeight: web ? 560 : 480 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------- misc ----------
export function Avatar({ name, color = colors.pine, size = 42 }) {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2, backgroundColor: color,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: '#FFFFFF', ...shadow.card,
    }}>
      <Text style={{ color: '#fff', fontFamily: fonts.bodySemi, fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

// Signature element: the "score journey" — a track from current score to goal,
// with a marker knob at the current position and a flag at the goal.
export function ScoreJourney({ exam, current, goal, compact }) {
  const m = examMeta[exam] || examMeta.General;
  const span = Math.max(1, m.max - m.min);
  const pos = Math.min(1, Math.max(0, (current - m.min) / span));
  const goalPos = Math.min(1, Math.max(0, (goal - m.min) / span));
  return (
    <View style={{ marginTop: compact ? 8 : 12 }}>
      {!compact && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={[styles.small, { color: m.color, fontFamily: fonts.bodySemi }]}>{m.label}</Text>
          <Text style={styles.small}>
            {current} → <Text style={{ fontFamily: fonts.bodySemi, color: colors.ink }}>{goal}</Text> {m.unit}
          </Text>
        </View>
      )}
      <View style={{ height: 10, borderRadius: 6, backgroundColor: m.soft, marginVertical: 4 }}>
        <View style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pos * 100}%`, backgroundColor: m.color, borderRadius: 6,
        }} />
        {/* current knob */}
        <View style={{
          position: 'absolute', left: `${pos * 100}%`, top: -3, marginLeft: -8,
          width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff',
          borderWidth: 3, borderColor: m.color, ...shadow.card,
        }} />
        {/* goal flag */}
        <View style={{ position: 'absolute', left: `${goalPos * 100}%`, top: -9, marginLeft: -1 }}>
          <View style={{ width: 2, height: 20, backgroundColor: colors.marigold, borderRadius: 1 }} />
          <View style={{
            position: 'absolute', left: 2, top: 0, width: 0, height: 0,
            borderTopWidth: 5, borderBottomWidth: 5, borderLeftWidth: 8,
            borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: colors.marigold,
          }} />
        </View>
      </View>
    </View>
  );
}

export function EmptyState({ icon = 'leaf-outline', title, body, action }) {
  return (
    <View style={styles.empty}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <View style={[styles.emptyRing, { width: 92, height: 92, backgroundColor: colors.pineSoft + '66' }]} />
        <View style={[styles.emptyRing, { width: 72, height: 72, backgroundColor: colors.pineSoft }]} />
        <View style={styles.emptyIcon}>
          <Ionicons name={icon} size={26} color={colors.pine} />
        </View>
      </View>
      <Text style={[styles.semi, { fontSize: 16, marginTop: 14 }]}>{title}</Text>
      {!!body && <Text style={[styles.mutedText, { textAlign: 'center', marginTop: 4, maxWidth: 320 }]}>{body}</Text>}
      {action && <View style={{ marginTop: 14 }}>{action}</View>}
    </View>
  );
}

export function Divider({ style }) {
  return <View style={[{ height: 1, backgroundColor: colors.line, marginVertical: 12 }, style]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  container: { width: '100%', maxWidth: 1040, alignSelf: 'center' },
  eyebrow: {
    fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase',
    color: colors.pine, marginBottom: 4,
  },
  pageTitle: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.ink, lineHeight: 36 },
  headerBadge: {
    width: 52, height: 52, borderRadius: 18, backgroundColor: colors.pineSoft,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
    borderWidth: 1, borderColor: '#FFFFFF', ...shadow.card,
  },
  hero: {
    backgroundColor: colors.pineDark, borderRadius: radius.xxl, padding: 22,
    overflow: 'hidden', ...shadow.card,
  },
  heroCircle: { position: 'absolute', borderRadius: 999 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  sectionBadge: {
    width: 28, height: 28, borderRadius: 9, backgroundColor: colors.pineSoft,
    alignItems: 'center', justifyContent: 'center', marginRight: 9,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16,
    borderWidth: 1, borderColor: colors.line, overflow: 'hidden', ...shadow.card,
  },
  cardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  body: { fontFamily: fonts.body, fontSize: 14.5, color: colors.ink, lineHeight: 21 },
  mutedText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, lineHeight: 19 },
  semi: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: colors.ink },
  small: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, paddingVertical: 11, borderRadius: radius.md, borderWidth: 1,
  },
  btnSmall: { paddingHorizontal: 12, paddingVertical: 7 },
  btnShadow: {
    shadowColor: colors.pineDark, shadowOpacity: 0.25, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 14.5 },
  chip: {
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1,
  },
  chipActive: {
    shadowColor: colors.pineDark, shadowOpacity: 0.2, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  tag: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: radius.pill, alignSelf: 'flex-start',
  },
  tagText: { fontFamily: fonts.bodySemi, fontSize: 11.5 },
  fieldLabel: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: fonts.body, fontSize: 14.5, color: colors.ink,
  },
  backdrop: {
    flex: 1, backgroundColor: 'rgba(32,48,43,0.45)', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  sheet: {
    backgroundColor: colors.paper, borderRadius: radius.xl, padding: 20,
    width: '100%', maxWidth: 520, ...shadow.card,
  },
  sheetHandle: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.line, marginBottom: 10,
  },
  sheetTitle: { fontFamily: fonts.display, fontSize: 21, color: colors.ink },
  empty: {
    alignItems: 'center', paddingVertical: 42, paddingHorizontal: 20,
  },
  emptyRing: { position: 'absolute', borderRadius: 999 },
  emptyIcon: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line,
  },
});
