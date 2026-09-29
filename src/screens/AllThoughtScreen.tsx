import React, { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';

import { db, auth } from '../firebase/firebase';
import { useRoute } from '@react-navigation/native';
import { PLACE_OPTIONS, SITUATION_OPTIONS, TIME_OF_DAY_OPTIONS } from '../constants/thoughtLogTags';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { onListenError } from '../utils/onListenError';


type ThoughtLog = {
  id: string;
  thoughts: string;
  bodySensations: string;
  intensityBefore: number;
  intensityAfter: number;
  place?: string;
  situation?: string;
  timeOfDay?: string;
  createdAt?: Timestamp;
};

export default function MojiLogoviScreen({ navigation }: any) {
  usePreventScreenCapture('moji-logovi');
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ThoughtLog[]>([]);
  const [loading, setLoading] = useState(true);
  const route = useRoute<any>();
    const dateId: string | undefined = route.params?.dateId;

    function parseDayIdLocal(id: string) {
    const [y, m, d] = id.split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1); // local midnight
    }

  useEffect(() => {
    let unsubLogs: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // ako se user promeni, ugasi prethodni listener
      if (unsubLogs) {
        unsubLogs();
        unsubLogs = null;
      }

      if (!user) {
        setLoading(false);
        navigation.navigate('Auth');
        return;
      }

      let q;

    if (dateId) {
    const start = parseDayIdLocal(dateId);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    q = query(
        collection(db, `users/${user.uid}/thoughtLogs`),
        orderBy('createdAt', 'asc'),
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<', Timestamp.fromDate(end))
    );
    } else {
    q = query(
        collection(db, `users/${user.uid}/thoughtLogs`),
        orderBy('createdAt', 'desc')
    );
    }


      unsubLogs = onSnapshot(q, (snapshot) => {
        const data: ThoughtLog[] = snapshot.docs.map((doc) => {
          const d = doc.data() as any;
          return {
            id: doc.id,
            thoughts: d.thoughts ?? '',
            bodySensations: d.bodySensations ?? '',
            intensityBefore: d.intensityBefore ?? 0,
            intensityAfter: d.intensityAfter ?? 0,
            place: d.place,
            situation: d.situation,
            timeOfDay: d.timeOfDay,
            createdAt: d.createdAt,
          };
        });

        setLogs(data);
        setLoading(false);
      }, (err) => {
        onListenError(err);
        setLoading(false);
      });
    });

    return () => {
      if (unsubLogs) unsubLogs();
      unsubAuth();
    };
  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.text }}>{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 28 }}
        ListEmptyComponent={
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <Text style={{ color: '#94A3B8' }}>{t('myLogs.noLogs')}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ThoughtLog')}
              style={{ marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#3B82F6', borderRadius: 12 }}
            >
              <Text style={{ color: 'white' }}>{t('myLogs.createFirst')}</Text>
            </TouchableOpacity>
          </View>
        }
        
        renderItem={({ item }) => {
          const created = item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString('sr-RS') : 'nedavno';
          const delta = (item.intensityAfter ?? 0) - (item.intensityBefore ?? 0);

          return (
            <View style={{ backgroundColor: '#111827', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#1F2937' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>{created}</Text>
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  {delta < 0 ? '↓' : delta > 0 ? '↑' : '→'} {item.intensityAfter}/10
                </Text>
              </View>

              {(item.place || item.situation || item.timeOfDay) ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {item.place && (
                    <View style={{ backgroundColor: '#1F2937', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 }}>
                      <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                        {PLACE_OPTIONS.find((o) => o.value === item.place)?.label ?? item.place}
                      </Text>
                    </View>
                  )}
                  {item.situation && (
                    <View style={{ backgroundColor: '#1F2937', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 }}>
                      <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                        {SITUATION_OPTIONS.find((o) => o.value === item.situation)?.label ?? item.situation}
                      </Text>
                    </View>
                  )}
                  {item.timeOfDay && (
                    <View style={{ backgroundColor: '#1F2937', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 }}>
                      <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                        {TIME_OF_DAY_OPTIONS.find((o) => o.value === item.timeOfDay)?.label ?? item.timeOfDay}
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>{t('myLogs.thoughts')}</Text>
                  <Text style={{ color: 'white', fontSize: 14 }} numberOfLines={2}>
                    {item.thoughts}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>{t('myLogs.body')}</Text>
                  <Text style={{ color: 'white', fontSize: 14 }} numberOfLines={2}>
                    {item.bodySensations}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
