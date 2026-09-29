import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { RootStackParamList } from '../navigation/RootNavigation';
import { useAuth } from '../context/authContext';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RunPlan'>;

export default function RunPlanScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const uid = user?.uid;
  const { planId } = route.params;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    (async () => {
      if (!uid) return;
      setLoading(true);
      try {
        const ref = doc(db, 'users', uid, 'ritualPlans', planId);
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error('Plan not found');
        const data = snap.data() as any;
        setTitle(data.title ?? 'Plan');
        setSteps(Array.isArray(data.steps) ? data.steps : []);
        setIdx(0);
      } catch (e: any) {
        Alert.alert('Error', e?.message ?? 'Failed to load plan', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid, planId]);

  const step = useMemo(() => steps[idx], [steps, idx]);

  const runCurrent = () => {
    if (!step) return;

    switch (step.kind) {
      case 'breathing':
        navigation.navigate('Breathing', { durationSec: step.durationSec });
        break;
      case 'grounding':
        navigation.navigate('Grounding');
        break;
      case 'mudra':
        navigation.navigate('MudraPractice', { mudraId: step.mudraId, minutes: step.minutes });
        break;
      case 'thoughtLog':
        navigation.navigate('ThoughtLog');
        break;
      default:
        Alert.alert('Unknown step', JSON.stringify(step));
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.card}>
        <Text style={styles.stepTitle}>Step {idx + 1} / {steps.length}</Text>
        <Text style={styles.stepKind}>{step?.kind ?? 'Done'}</Text>
      </View>

      <TouchableOpacity onPress={runCurrent} style={styles.primaryBtn} disabled={!step}>
        <Text style={styles.primaryBtnText}>{step ? 'Start step' : 'Finished'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setIdx(i => Math.min(i + 1, steps.length))}
        style={styles.secondaryBtn}
        disabled={!step}
      >
        <Text style={styles.secondaryBtnText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.padding.screen, backgroundColor: theme.colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  title: { color: theme.colors.text, fontSize: 20, fontFamily: theme.typography.fontBold, marginBottom: 12 },
  card: {
    backgroundColor: theme.colors.card,
    padding: theme.padding.cardTight,
    borderRadius: theme.radius.cardSmall,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  stepTitle: { color: theme.colors.textMuted, marginBottom: 6 },
  stepKind: { color: theme.colors.text, fontSize: 18, fontFamily: theme.typography.fontBold },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: { color: theme.colors.onPrimary, fontFamily: theme.typography.fontBold },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  secondaryBtnText: { color: theme.colors.text, fontFamily: theme.typography.fontSemiBold },
});
