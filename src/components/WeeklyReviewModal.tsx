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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
    maxHeight: '80%',
  },
  scroll: { gap: 14, paddingBottom: 8 },
  title: { color: 'white', fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#94A3B8', fontSize: 14 },
  label: { color: '#94A3B8', fontSize: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  chipSelected: { backgroundColor: '#2563EB', borderColor: '#3B82F6' },
  chipText: { color: '#94A3B8', fontWeight: '600' },
  chipTextSelected: { color: 'white' },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    color: 'white',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  suggestionChip: {
    backgroundColor: '#1E3A5F',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  suggestionChipText: { color: '#93C5FD', fontSize: 13 },
  buttons: { gap: 10, marginTop: 8 },
  primaryBtn: { backgroundColor: '#3B82F6', padding: 14, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { color: 'white', fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  secondaryBtn: { padding: 14, borderRadius: 14, alignItems: 'center' },
  secondaryBtnText: { color: '#94A3B8' },
});
