import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { saveWeeklyReflection, WhatHelpedOption } from '../utils/weeklyReflection';
import { theme } from '../theme';

const WHAT_HELPED_OPTIONS: { id: WhatHelpedOption; labelKey: string }[] = [
  { id: 'breathing', labelKey: 'weeklyReview.breathing' },
  { id: 'grounding', labelKey: 'weeklyReview.grounding' },
  { id: 'mudras', labelKey: 'weeklyReview.mudras' },
  { id: 'thoughtLog', labelKey: 'weeklyReview.thoughtLog' },
  { id: 'ritualPlans', labelKey: 'weeklyReview.ritualPlans' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  weekId: string;
  uid: string;
  onSaved: () => void;
  /** Predložene reči iz logova (poslednjih 7 dana) – prikazuju se kao chipovi */
  suggestionWords?: string[];
};

export default function WeeklyReviewModal({
  visible,
  onClose,
  weekId,
  uid,
  onSaved,
  suggestionWords = [],
}: Props) {
  const { t } = useTranslation();
  const [whatHelped, setWhatHelped] = useState<WhatHelpedOption[]>([]);
  const [topTriggers, setTopTriggers] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const addSuggestionToTriggers = (word: string) => {
    setTopTriggers((prev) => (prev.trim() ? `${prev.trim()}, ${word}` : word));
  };

  const toggleWhatHelped = (id: WhatHelpedOption) => {
    setWhatHelped((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveWeeklyReflection(uid, weekId, {
        whatHelped,
        topTriggersThisWeek: topTriggers.trim() || undefined,
        note: note.trim() || undefined,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.backdrop}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.card}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{t('weeklyReview.title')}</Text>
            <Text style={styles.subtitle}>{t('weeklyReview.subtitle')}</Text>

            <View style={styles.chipRow}>
              {WHAT_HELPED_OPTIONS.map((opt) => {
                const selected = whatHelped.includes(opt.id);
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => toggleWhatHelped(opt.id)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {t(opt.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>{t('weeklyReview.triggersLabel')}</Text>
            {suggestionWords.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={styles.label}>{t('weeklyReview.suggestedFromLogs')}</Text>
                <View style={styles.chipRow}>
                  {suggestionWords.map((word) => (
                    <TouchableOpacity
                      key={word}
                      onPress={() => addSuggestionToTriggers(word)}
                      style={styles.suggestionChip}
                    >
                      <Text style={styles.suggestionChipText}>+ {word}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <TextInput
              value={topTriggers}
              onChangeText={setTopTriggers}
              placeholder={t('weeklyReview.triggersPlaceholder')}
              placeholderTextColor="#64748B"
              style={styles.input}
              multiline
            />

            <Text style={styles.label}>{t('weeklyReview.noteLabel')}</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('weeklyReview.notePlaceholder')}
              placeholderTextColor="#64748B"
              style={[styles.input, styles.inputMultiline]}
              multiline
            />

            <View style={styles.buttons}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={[styles.primaryBtn, saving && styles.btnDisabled]}
              >
                <Text style={styles.primaryBtnText}>{saving ? t('profile.saving') : t('common.save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: 18,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  scroll: { gap: 14, paddingBottom: 8 },
  title: { color: theme.colors.text, fontSize: 20, fontFamily: theme.typography.fontBold },
  subtitle: { color: theme.colors.textMuted, fontSize: 14 },
  label: { color: theme.colors.textMuted, fontSize: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: theme.colors.input,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  chipSelected: { backgroundColor: theme.colors.primaryMuted, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textMuted, fontWeight: '600' },
  chipTextSelected: { color: theme.colors.primary },
  input: {
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.cardSmall,
    padding: 12,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  suggestionChip: {
    backgroundColor: theme.colors.primaryMuted,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.primarySoft,
  },
  suggestionChipText: { color: theme.colors.accent, fontSize: 13 },
  buttons: { gap: 10, marginTop: 8 },
  primaryBtn: { backgroundColor: theme.colors.primary, padding: 14, borderRadius: theme.radius.button, alignItems: 'center' },
  primaryBtnText: { color: theme.colors.onPrimary, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  secondaryBtn: { padding: 14, borderRadius: theme.radius.button, alignItems: 'center' },
  secondaryBtnText: { color: theme.colors.textMuted },
});
