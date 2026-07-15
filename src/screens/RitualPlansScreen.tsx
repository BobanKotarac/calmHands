import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/authContext'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePremiumContext } from '../context/premiumContext';
import { getPlanCount } from '../utils/countPlans';

type PlanDoc = {
  title: string;
  enabled?: boolean;
  steps?: any[];
  createdAt?: any;
  updatedAt?: any;
};

type PlanStep =
  | { id: string; kind: 'breathing'; durationSec: number }
  | { id: string; kind: 'grounding' }
  | { id: string; kind: 'mudra'; mudraId: string; minutes: number }
  | { id: string; kind: 'thoughtLog'; prompt?: string };


export default function RitualPlansScreen({ navigation }:any) {
  const { user } = useAuth();
  const uid = user?.uid;

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Array<{ id: string } & PlanDoc>>([]);
  const [planCount, setPlanCount] = useState(0);
  const { isPremium, showPaywall } = usePremiumContext();

  useEffect(() => {
    if (!user) return;
    getPlanCount(user.uid).then(setPlanCount);
  }, [user?.uid]);

  const canCreate = isPremium || planCount < 1;

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'users', uid, 'ritualPlans'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setPlans(snap.docs.map(d => ({ id: d.id, ...(d.data() as PlanDoc) })));
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  const onNew = () => navigation.getParent('RootStack')?.navigate('PlanEditor');



  const onDelete = (planId: string) => {
    if (!uid) return;
    Alert.alert('Delete plan?', 'This will delete the plan (reminders not handled here yet).', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'users', uid, 'ritualPlans', planId));
            await load();
          } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (!uid) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Not logged in</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { flex: 1, backgroundColor: '#0B1220' }]} edges={['top']}>
    
        <View style={styles.header} >
            <Text style={styles.title}>Ritual plans</Text>
            {!canCreate && (
              <TouchableOpacity onPress={showPaywall}>
                <Text style={styles.primaryBtnText}>🔒 Neograničeni planovi</Text>
              </TouchableOpacity>
            )}
            {canCreate &&
              <TouchableOpacity onPress={onNew} style={styles.primaryBtn}>  
                <Text style={styles.primaryBtnText}>New</Text>
              </TouchableOpacity>
            }
        </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        <FlatList
        style={{ flex: 1 }}
          data={plans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={plans.length ? undefined : styles.center}
          ListEmptyComponent={<Text style={styles.muted}>No plans yet.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.getParent()?.navigate('PlanEditor', { planId: item.id })}

            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title || 'Untitled plan'}</Text>
                <Text style={styles.muted}>
                  Steps: {(item.steps?.length ?? 0)} • {item.enabled === false ? 'Disabled' : 'Enabled'}
                </Text>
              </View>

              <TouchableOpacity onPress={(e) => { e.stopPropagation(); onDelete(item.id); }} style={styles.dangerBtn}>
                <Text style={styles.dangerBtnText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); navigation.getParent('RootStack')?.navigate('RunPlan', { planId: item.id }); }}
                style={styles.runBtn}
                >
                <Text style={styles.runBtnText}>Run</Text>
                </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity onPress={load} style={styles.secondaryBtn}>
        <Text style={styles.secondaryBtnText}>Refresh</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0B0F14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, width: '100%' },
  title: { color: 'white', fontSize: 20, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: '#121A23', marginBottom: 10 },
  cardTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
  muted: { color: '#9AA4B2' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#2D6CDF' },
  primaryBtnText: { color: 'white', fontWeight: '700' },
  secondaryBtn: { marginTop: 10, paddingVertical: 12, borderRadius: 10, backgroundColor: '#1F2A37', alignItems: 'center' },
  secondaryBtnText: { color: 'white', fontWeight: '600' },
  dangerBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#3B1B1B' },
  dangerBtnText: { color: '#FFB4B4', fontWeight: '700' },
  runBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#31863f' },
  runBtnText: { color: 'white', fontWeight: '700' },
});
