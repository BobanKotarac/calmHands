import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { exportThoughtLogsToCsv } from '../utils/exportThoughtLogsToCsv';
import { useAuth } from '../context/authContext';
import { logRitualEvent } from '../utils/ritualPlans';
import {
  PLACE_OPTIONS,
  SITUATION_OPTIONS,
  TIME_OF_DAY_OPTIONS,
  type PlaceTag,
  type SituationTag,
  type TimeOfDayTag,
} from '../constants/thoughtLogTags';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';

export default function ThoughtLogScreen({ navigation, route }: any) {
  usePreventScreenCapture('thought-log');
  const source = route?.params?.source;
  const planId = route?.params?.planId ?? null;
  const [thoughts, setThoughts] = useState('');
  const [bodySensations, setBodySensations] = useState('');
  const [intensityBefore, setIntensityBefore] = useState(7);
  const [intensityAfter, setIntensityAfter] = useState(7);
  const [place, setPlace] = useState<PlaceTag | undefined>(undefined);
  const [situation, setSituation] = useState<SituationTag | undefined>(undefined);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDayTag | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();


  const saveLog = async () => {
    if (!thoughts.trim() && !bodySensations.trim()) {
      Alert.alert(t('safetyPlan.emptyTitle'), t('thoughtLog.emptyAlert'));
      return;
    }

    setSaving(true);
    try {
      // čekaj user-a (ako nije login-ovan, preskoči ili redirect)
      const user = auth.currentUser;
      if(!user) return;
      await logRitualEvent(user.uid, {
                stepType: 'thoughtlog',
                planId,
                source,
              });
      if (!user) {
        Alert.alert('Login?', 'Log-ovi se čuvaju po user-u. Hoćeš li se logovati?');
        return;
      }

      await addDoc(collection(db, `users/${user.uid}/thoughtLogs`), {
        thoughts: thoughts.trim(),
        bodySensations: bodySensations.trim(),
        intensityBefore: Math.round(intensityBefore),
        intensityAfter: Math.round(intensityAfter),
        ...(place && { place }),
        ...(situation && { situation }),
        ...(timeOfDay && { timeOfDay }),
        createdAt: serverTimestamp(),
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('thoughtLog.savedTitle'), t('thoughtLog.savedAlert'), [
        {
          text: t('common.close'),
          onPress: () => {
            if (navigation.canGoBack()) navigation.goBack();
          },
        },
      ]);

    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Greška', `Nešto je pošlo naopako: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 28 }}>
        <Text style={[theme.typography.bodySmall, { color: theme.colors.textMuted, lineHeight: 20 }]}>
          {t('thoughtLog.subtitle')}
        </Text>

        {/* 2 kolone */}
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {/* Misli */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#94A3B8' }}>{t('thoughtLog.thoughts')}</Text>
            <TextInput
              multiline
              numberOfLines={4}
              value={thoughts}
              onChangeText={setThoughts}
              placeholder={t('thoughtLog.thoughtsPlaceholder')}
              placeholderTextColor="#64748B"
              style={{
                backgroundColor: '#111827',
                borderRadius: 14,
                padding: 12,
                color: 'white',
                borderWidth: 1,
                borderColor: '#1F2937',
                height: 100,
                textAlignVertical: 'top',
              }}
            />
          </View>

          {/* Telo */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#94A3B8' }}>{t('thoughtLog.body')}</Text>
            <TextInput
              multiline
              numberOfLines={4}
              value={bodySensations}
              onChangeText={setBodySensations}
              placeholder={t('thoughtLog.bodyPlaceholder')}
              placeholderTextColor="#64748B"
              style={{
                backgroundColor: '#111827',
                borderRadius: 14,
                padding: 12,
                color: 'white',
                borderWidth: 1,
                borderColor: '#1F2937',
                height: 100,
                textAlignVertical: 'top',
              }}
            />
          </View>
        </View>

        {/* Tagovi */}
        <View style={{ gap: 10 }}>
          <Text style={{ color: '#94A3B8' }}>{t('thoughtLog.place')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PLACE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setPlace(place === opt.value ? undefined : opt.value)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: place === opt.value ? '#3B82F6' : '#0F172A',
                  borderWidth: 1,
                  borderColor: place === opt.value ? '#60A5FA' : '#1F2937',
                }}
              >
                <Text style={{ color: place === opt.value ? 'white' : '#94A3B8' }}>{t(`place.${opt.value}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{ gap: 10 }}>
          <Text style={{ color: '#94A3B8' }}>{t('thoughtLog.situation')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SITUATION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setSituation(situation === opt.value ? undefined : opt.value)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: situation === opt.value ? '#3B82F6' : '#0F172A',
                  borderWidth: 1,
                  borderColor: situation === opt.value ? '#60A5FA' : '#1F2937',
                }}
              >
                <Text style={{ color: situation === opt.value ? 'white' : '#94A3B8' }}>{t(`situation.${opt.value}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{ gap: 10 }}>
          <Text style={{ color: '#94A3B8' }}>{t('thoughtLog.timeOfDay')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TIME_OF_DAY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setTimeOfDay(timeOfDay === opt.value ? undefined : opt.value)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: timeOfDay === opt.value ? '#3B82F6' : '#0F172A',
                  borderWidth: 1,
                  borderColor: timeOfDay === opt.value ? '#60A5FA' : '#1F2937',
                }}
              >
                <Text style={{ color: timeOfDay === opt.value ? 'white' : '#94A3B8' }}>{t(`timeOfDay.${opt.value}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Intenzitet */}
        <View style={{ gap: 12 }}>
          <Text style={{ color: '#94A3B8' }}>{t('thoughtLog.intensity')}</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: 'white' }}>{t('thoughtLog.before')}: {Math.round(intensityBefore)}</Text>
            <Slider
              style={{ flex: 1, marginLeft: 16 }}
              minimumValue={0}
              maximumValue={10}
              value={intensityBefore}
              onSlidingComplete={setIntensityBefore}
              minimumTrackTintColor="#3B82F6"
              maximumTrackTintColor="#1F2937"
              thumbTintColor="#3B82F6"
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: 'white' }}>{t('thoughtLog.after')}: {Math.round(intensityAfter)}</Text>
            <Slider
              style={{ flex: 1, marginLeft: 16 }}
              minimumValue={0}
              maximumValue={10}
              value={intensityAfter}
              onSlidingComplete={setIntensityAfter}
              minimumTrackTintColor="#3B82F6"
              maximumTrackTintColor="#1F2937"
              thumbTintColor="#3B82F6"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={saveLog}
          style={{
            backgroundColor: '#3B82F6',
            padding: 16,
            borderRadius: 14,
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('thoughtLog.saveLog')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('MojiLogovi')}>
            <Text style={{ color: '#3B82F6', textAlign: 'center' }}>{t('thoughtLog.openLogs')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
            onPress={async () => {
                try {
                if (!user?.uid) return Alert.alert(t('safetyPlan.notLoggedIn'));
                await exportThoughtLogsToCsv(user.uid);
                } catch (e: any) {
                Alert.alert('Export', e.message ?? 'Error');
                }
            }}
            style={{ backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1F2937', padding: 12, borderRadius: 14 }}
            >
            <Text style={{ color: 'white', textAlign: 'center' }}>{t('thoughtLog.exportCsv')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
