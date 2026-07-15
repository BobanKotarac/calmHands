import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { RootStackParamList } from '../navigation/RootNavigation';
import { useAuth } from '../context/authContext';

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
        Alert.alert('Error', e?.message ?? 'Failed to load plan');
        navigation.goBack();
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
  container: { flex: 1, padding: 16, backgroundColor: '#0B1220' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1220' },
  title: { color: 'white', fontSize: 20, fontWeight: '800', marginBottom: 12 },
  card: { backgroundColor: '#121A23', padding: 14, borderRadius: 12, marginBottom: 12 },
  stepTitle: { color: '#9AA4B2', marginBottom: 6 },
  stepKind: { color: 'white', fontSize: 18, fontWeight: '800' },
  primaryBtn: { paddingVertical: 12, borderRadius: 10, backgroundColor: '#2D6CDF', alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { color: 'white', fontWeight: '800' },
  secondaryBtn: { paddingVertical: 12, borderRadius: 10, backgroundColor: '#1F2A37', alignItems: 'center' },
  secondaryBtnText: { color: 'white', fontWeight: '700' },
});
