// screens/PlanEditorScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { addDoc, doc, getDoc, serverTimestamp, updateDoc, collection } from 'firebase/firestore';

import { db } from '../firebase/firebase';
import { RootStackParamList } from '../navigation/RootNavigation';
import { useAuth } from '../context/authContext';
import { useTranslation } from 'react-i18next';
import { MUDRAS } from '../data/mudras';
import { enablePlanReminder, disablePlanReminder, getPlanReminder } from '../utils/reminders';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanEditor'>;

type PlanStep =
  | { id: string; kind: 'breathing'; durationSec: number }
  | { id: string; kind: 'grounding' }
  | { id: string; kind: 'mudra'; mudraId: string; minutes: number }
  | { id: string; kind: 'thoughtLog'; prompt?: string };

function uidStep() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function PlanEditorScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const uid = user?.uid;
  const planId = route.params?.planId;
  const isEdit = !!planId;

  const [title, setTitle] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [steps, setSteps] = useState<PlanStep[]>([]);
  const [loading, setLoading] = useState(false);

  // Reminder UI state
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderTime, setReminderTime] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [remLoading, setRemLoading] = useState(false);

  const timeLabel = useMemo(() => {
    const hh = String(reminderTime.getHours()).padStart(2, '0');
    const mm = String(reminderTime.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }, [reminderTime]);

  const canSave = useMemo(() => title.trim().length > 0 && steps.length > 0, [title, steps.length]);

  const load = useCallback(async () => {
    if (!uid || !planId) return;

    setLoading(true);
    try {
      // 1) Plan
      const ref = doc(db, 'users', uid, 'ritualPlans', planId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        Alert.alert('Not found', 'Plan does not exist.');
        navigation.goBack();
        return;
      }
      const data = snap.data() as any;
      setTitle(data.title ?? '');
      setEnabled(data.enabled !== false);
      setSteps(Array.isArray(data.steps) ? data.steps : []);

      // 2) Reminder
      const r = await getPlanReminder(uid, planId);
      if (r) {
        setReminderOn(!!r.enabled);
        const d = new Date();
        d.setHours(Number(r.hour ?? 9), Number(r.minute ?? 0), 0, 0);
        setReminderTime(d);
      } else {
        setReminderOn(false);
        const d = new Date();
        d.setHours(9, 0, 0, 0);
        setReminderTime(d);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  }, [uid, planId, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  // Step actions
  const addBreathing = () => setSteps(s => [...s, { id: uidStep(), kind: 'breathing', durationSec: 60 }]);

  const addGrounding = () => setSteps(s => [...s, { id: uidStep(), kind: 'grounding' }]);

  const addMudra = () => {
    const first = MUDRAS[0];
    setSteps(s => [
      ...s,
      {
        id: uidStep(),
        kind: 'mudra',
        mudraId: first?.id ?? 'gyan',
        minutes: first?.durationMinDefault ?? 2,
      },
    ]);
  };

  const addThoughtLog = () =>
    setSteps(s => [...s, { id: uidStep(), kind: 'thoughtLog', prompt: 'Kako se osećaš?' }]);

  const removeStep = (stepId: string) => setSteps(s => s.filter(x => x.id !== stepId));

  const updateStep = (stepId: string, patch: Partial<PlanStep>) =>
    setSteps(s => s.map(x => (x.id === stepId ? ({ ...x, ...patch } as PlanStep) : x)));

  const onSave = async () => {
    if (!uid) return;
    if (!canSave) {
      Alert.alert('Missing info', 'Add title and at least one step.');
      return;
    }

    setLoading(true);
    try {
      if (!planId) {
        const ref = await addDoc(collection(db, 'users', uid, 'ritualPlans'), {
          title: title.trim(),
          enabled,
          steps,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        navigation.replace('PlanEditor', { planId: ref.id });
      } else {
        const ref = doc(db, 'users', uid, 'ritualPlans', planId);
        await updateDoc(ref, {
          title: title.trim(),
          enabled,
          steps,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  if (!uid) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Not logged in</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{isEdit ? 'Edit plan' : 'New plan'}</Text>

        <TouchableOpacity onPress={onSave} style={[styles.primaryBtn, (!canSave || loading) && styles.btnDisabled]}>
          <Text style={styles.primaryBtnText}>{loading ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="npr. Jutarnji reset"
          placeholderTextColor="#6B7280"
          style={styles.input}
        />

        <Text style={styles.label}>Reminder</Text>
        <View style={{ backgroundColor: '#111827', borderRadius: 16, padding: 12, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: 'white', fontSize: 16 }}>Plan reminder</Text>
              <Text style={{ color: '#94A3B8' }}>Daily reminder to run this plan.</Text>
            </View>

            <Switch
              value={reminderOn}
              onValueChange={async (v) => {
                if (!uid || !planId) {
                  Alert.alert('Save first', 'First save the plan, then enable reminder.');
                  return;
                }

                setRemLoading(true);
                try {
                  setReminderOn(v);
                  if (v) {
                    await enablePlanReminder(uid, planId, title, reminderTime.getHours(), reminderTime.getMinutes());
                  } else {
                    await disablePlanReminder(uid, planId);
                  }
                } catch (e: any) {
                  setReminderOn(!v);
                  Alert.alert('Error', e?.message ?? 'Reminder failed');
                } finally {
                  setRemLoading(false);
                }
              }}
              disabled={remLoading}
            />
          </View>

          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            style={{
              backgroundColor: '#0F172A',
              borderWidth: 1,
              borderColor: '#1F2937',
              padding: 12,
              borderRadius: 14,
              opacity: remLoading ? 0.6 : 1,
            }}
            disabled={remLoading}
          >
            <Text style={{ color: 'white' }}>Time: {timeLabel}</Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              mode="time"
              value={reminderTime}
              is24Hour
              onChange={async (event, selected) => {
                if (Platform.OS !== 'ios') setShowPicker(false);
                if (event.type === 'dismissed' || !selected) return;

                setReminderTime(selected);

                // If reminder is ON, reschedule immediately
                if (reminderOn && uid && planId) {
                  setRemLoading(true);
                  try {
                    await enablePlanReminder(uid, planId, title, selected.getHours(), selected.getMinutes());
                  } finally {
                    setRemLoading(false);
                  }
                }
              }}
            />
          )}
        </View>

        <View style={styles.row}>
          <TouchableOpacity onPress={() => setEnabled(v => !v)} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>{enabled ? 'Enabled' : 'Disabled'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { marginTop: 14 }]}>Steps</Text>

        <View style={styles.rowWrap}>
          <TouchableOpacity onPress={addBreathing} style={styles.chip}>
            <Text style={styles.chipText}>+ Breathing</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={addGrounding} style={styles.chip}>
            <Text style={styles.chipText}>+ Grounding</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={addMudra} style={styles.chip}>
            <Text style={styles.chipText}>+ Mudra</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={addThoughtLog} style={styles.chip}>
            <Text style={styles.chipText}>+ Log</Text>
          </TouchableOpacity>
        </View>

        {steps.map((s, idx) => (
          <View key={s.id} style={styles.card}>
            <Text style={styles.cardTitle}>
              {idx + 1}. {s.kind}
            </Text>

            {s.kind === 'breathing' && (
              <>
                <Text style={styles.muted}>Duration (sec)</Text>
                <TextInput
                  value={String(s.durationSec)}
                  onChangeText={(t) => updateStep(s.id, { durationSec: Math.max(10, Number(t || 0)) } as any)}
                  keyboardType="number-pad"
                  style={styles.input}
                />

                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {[30, 60, 90, 120].map(v => (
                    <TouchableOpacity
                      key={v}
                      onPress={() => updateStep(s.id, { durationSec: v } as any)}
                      style={styles.chip}
                    >
                      <Text style={styles.chipText}>{v}s</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {s.kind === 'mudra' && (
              <>
                <Text style={styles.muted}>Mudra</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {MUDRAS.map(m => (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => updateStep(s.id, { mudraId: m.id, minutes: m.durationMinDefault } as any)}
                      style={[styles.chip, s.mudraId === m.id && { backgroundColor: '#2D6CDF' }]}
                    >
                      <Text style={styles.chipText}>{t(m.titleKey)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.muted}>Minutes</Text>
                <TextInput
                  value={String(s.minutes)}
                  onChangeText={(t) => updateStep(s.id, { minutes: Math.max(1, Number(t || 0)) } as any)}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </>
            )}

            {s.kind === 'thoughtLog' && (
              <>
                <Text style={styles.muted}>Prompt</Text>
                <TextInput
                  value={s.prompt ?? ''}
                  onChangeText={(t) => updateStep(s.id, { prompt: t } as any)}
                  style={styles.input}
                />
              </>
            )}

            <TouchableOpacity onPress={() => removeStep(s.id)} style={styles.dangerBtn}>
              <Text style={styles.dangerBtnText}>Remove step</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0B0F14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { color: 'white', fontSize: 18, fontWeight: '800' },
  headerBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#1F2A37' },
  headerBtnText: { color: 'white', fontWeight: '700' },
  label: { color: '#C7D2FE', fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: '#111827',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  chip: { backgroundColor: '#1F2A37', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999 },
  chipText: { color: 'white', fontWeight: '700' },
  card: { backgroundColor: '#121A23', padding: 12, borderRadius: 12, marginBottom: 10 },
  cardTitle: { color: 'white', fontWeight: '800', marginBottom: 8 },
  muted: { color: '#9AA4B2', marginBottom: 8 },
  primaryBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#2D6CDF' },
  primaryBtnText: { color: 'white', fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },
  secondaryBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#1F2A37' },
  secondaryBtnText: { color: 'white', fontWeight: '700' },
  dangerBtn: { marginTop: 8, paddingVertical: 10, borderRadius: 10, backgroundColor: '#3B1B1B', alignItems: 'center' },
  dangerBtnText: { color: '#FFB4B4', fontWeight: '800' },
});
