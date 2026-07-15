import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TextInput } from 'react-native';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useAuth } from '../context/authContext';
import { scheduleDailyMoodReminderForUser, cancelDailyMoodReminderForUser, cancelAllMoodReminderNotifications, syncNotificationsWithFirebase } from '../utils/reminders';
import { Keyboard } from 'react-native';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import {
  getLongestStreaks,
  getUnlockedAchievements,
  ACHIEVEMENT_LABELS,
  type AchievementId,
} from '../utils/achievements';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../i18n';

function initialLetter(email?: string | null, displayName?: string | null) {
  const s = (displayName?.trim() || email?.trim() || '?').toUpperCase();
  return s[0] ?? '?';
}

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const navigation = useNavigation<any>();
    const { t, i18n } = useTranslation();
    const [nickname, setNickname] = useState(user?.displayName ?? '');
    const [savingNick, setSavingNick] = useState(false);
    const [nickSaved, setNickSaved] = useState(false);


    const saveNickname = async () => {
        const trimmed = nickname.trim();
        if (!trimmed) return;
        if (!auth.currentUser) return;

        setSavingNick(true);
        Keyboard.dismiss();
        setNickSaved(true);
        setTimeout(() => setNickSaved(false), 1200);

        try {
            await updateProfile(auth.currentUser, { displayName: trimmed });
            // ako se UI ne osveži odmah, rešićemo u authContext-u (reload / onAuthStateChanged)
        } finally {
            setSavingNick(false);
        }
    };

    const [reminderOn, setReminderOn] = useState(false);

    const [reminderTime, setReminderTime] = useState(() => {
        const d = new Date();
        d.setHours(21, 0, 0, 0);
        return d;
    });
    const [showPicker, setShowPicker] = useState(false);
    const [longestStreaks, setLongestStreaks] = useState<{ mood: number; ritual: number } | null>(null);
    const [achievements, setAchievements] = useState<Record<string, any>>({});

    const initial = useMemo(
        () => initialLetter(user?.email ?? null, user?.displayName ?? null),
        [user?.email, user?.displayName]
    );

    const timeLabel = useMemo(() => {
        const hh = String(reminderTime.getHours()).padStart(2, '0');
        const mm = String(reminderTime.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
    }, [reminderTime]);

    // 1) Učitaj settings iz Firestore (users/{uid}) i sinhronizuj notifikacije sa Firebase-om
    useEffect(() => {
        if (!user?.uid) return;

        syncNotificationsWithFirebase(user.uid);

        const ref = doc(db, 'users', user.uid);
        const unsub = onSnapshot(ref, (snap) => {
        const data = snap.data() as any | undefined;
        const s = data?.settings;

        if (typeof s?.moodReminderOn === 'boolean') {
            setReminderOn(s.moodReminderOn);
            if (!s.moodReminderOn) cancelAllMoodReminderNotifications();
        }

        if (typeof s?.moodReminderHour === 'number' && typeof s?.moodReminderMinute === 'number') {
            const d = new Date();
            d.setHours(s.moodReminderHour, s.moodReminderMinute, 0, 0);
            setReminderTime(d);
        }
        });

        return unsub;
    }, [user?.uid]);

    useEffect(() => {
      if (!user?.uid) return;
      (async () => {
        try {
          const [streaks, unlocked] = await Promise.all([
            getLongestStreaks(user.uid),
            getUnlockedAchievements(user.uid),
          ]);
          setLongestStreaks(streaks);
          setAchievements(unlocked);
        } catch (_) {}
      })();
    }, [user?.uid]);

  // helper: sačuvaj u firestore
    const persistReminder = async (on: boolean, d: Date) => {
        if (!user?.uid) return;

        await setDoc(
        doc(db, 'users', user.uid),
        {
            settings: {
            moodReminderOn: on,
            moodReminderHour: d.getHours(),
            moodReminderMinute: d.getMinutes(),
            },
        },
        { merge: true }
        );
    };

  
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1220' }} edges={['top']}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}>
                <Text style={{ color: 'white', fontSize: 22 }}>{t('profile.title')}</Text>

                {/* JEZIK */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: '#94A3B8' }}>{t('profile.language')}</Text>
                    <TouchableOpacity
                        onPress={() => changeAppLanguage('sr')}
                        style={{
                            paddingVertical: 8,
                            paddingHorizontal: 14,
                            borderRadius: 10,
                            backgroundColor: i18n.language === 'sr' ? '#2563EB' : '#1F2937',
                        }}
                    >
                        <Text style={{ color: 'white', fontWeight: '600' }}>{t('profile.serbian')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => changeAppLanguage('en')}
                        style={{
                            paddingVertical: 8,
                            paddingHorizontal: 14,
                            borderRadius: 10,
                            backgroundColor: i18n.language === 'en' ? '#2563EB' : '#1F2937',
                        }}
                    >
                        <Text style={{ color: 'white', fontWeight: '600' }}>{t('profile.english')}</Text>
                    </TouchableOpacity>
                </View>

                {/* USER CARD (inicijalni avatar) */}
                <View style={{ backgroundColor: '#111827', borderRadius: 18, padding: 14, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: '#0F172A',
                        borderWidth: 1,
                        borderColor: '#1F2937',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    >
                    <Text style={{ color: 'white', fontSize: 22, fontWeight: '700' }}>{initial}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                    <Text style={{ color: 'white', fontSize: 16 }}>
                        {user?.displayName?.trim() ? user.displayName : t('profile.noNickname')}
                    </Text>
                    <Text style={{ color: '#94A3B8' }}>{user?.email ?? '—'}</Text>
                    </View>
                </View>

                <Text style={{ color: '#94A3B8' }}>
                    {t('profile.avatarHint')}
                </Text>
                <View style={{ gap: 8 }}>
                <Text style={{ color: '#94A3B8' }}>{t('profile.nickname')}</Text>

                <TextInput
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder={t('profile.nickname')}
                    placeholderTextColor="#64748B"
                    style={{
                    backgroundColor: '#0F172A',
                    borderWidth: 1,
                    borderColor: '#1F2937',
                    padding: 12,
                    borderRadius: 14,
                    color: 'white',
                    }}
                    autoCapitalize="none"
                />

                <TouchableOpacity
                    disabled={savingNick || !nickname.trim()}
                    onPress={saveNickname}
                    style={{
                    backgroundColor: savingNick || !nickname.trim() ? '#1F2937' : '#3B82F6',
                    padding: 12,
                    borderRadius: 14,
                    }}
                >
                    <Text style={{ color: 'white', textAlign: 'center' }}>
                    {savingNick ? t('profile.saving') : t('profile.saveNickname')}
                    </Text>
                </TouchableOpacity>
                {nickSaved && <Text style={{ color: '#10B981' }}>{t('profile.saved')}</Text>}
                </View>

                </View>

                {/* REMINDER */}
                <View style={{ backgroundColor: '#111827', borderRadius: 18, padding: 14, gap: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ color: 'white', fontSize: 16 }}>{t('profile.reminder')}</Text>
                    <Text style={{ color: '#94A3B8' }}>{t('profile.reminderDesc')}</Text>
                    </View>

                    <Switch
                    value={reminderOn}
                    onValueChange={async (v) => {
                        if (!user) return;
                        setReminderOn(v);

                        if (v) await scheduleDailyMoodReminderForUser(user.uid, reminderTime.getHours(), reminderTime.getMinutes());
                        else await cancelDailyMoodReminderForUser(user.uid);        

                        await persistReminder(v, reminderTime);
                    }}
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
                    }}
                >
                    <Text style={{ color: 'white' }}>{t('profile.time')}: {timeLabel}</Text>
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

                        if (reminderOn) {
                            if (!user) return;
                            await scheduleDailyMoodReminderForUser(user.uid, selected.getHours(), selected.getMinutes());
                        }

                        await persistReminder(reminderOn, selected);
                    }}
                    />
                )}
                </View>

                <TouchableOpacity
                    onPress={() => navigation.getParent()?.navigate('SafetyPlanEditor')}
                    style={{ backgroundColor: '#111827', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#1F2937' }}
                >
                    <Text style={{ color: 'white', fontSize: 16 }}>{t('profile.safetyPlan')}</Text>
                    <Text style={{ color: '#94A3B8', marginTop: 4 }}>{t('profile.safetyPlanDesc')}</Text>
                </TouchableOpacity>

                <View style={{ backgroundColor: '#111827', borderRadius: 18, padding: 14, gap: 10 }}>
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('profile.achievements')}</Text>
                    {longestStreaks && (
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1, backgroundColor: '#0F172A', borderRadius: 12, padding: 10 }}>
                                <Text style={{ color: '#94A3B8', fontSize: 12 }}>{t('profile.longestMoodStreak')}</Text>
                                <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>{longestStreaks.mood} {t('common.days')}</Text>
                            </View>
                            <View style={{ flex: 1, backgroundColor: '#0F172A', borderRadius: 12, padding: 10 }}>
                                <Text style={{ color: '#94A3B8', fontSize: 12 }}>{t('profile.longestRitualStreak')}</Text>
                                <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>{longestStreaks.ritual} {t('common.days')}</Text>
                            </View>
                        </View>
                    )}
                    {Object.keys(achievements).length > 0 && (
                        <View style={{ gap: 6 }}>
                            <Text style={{ color: '#94A3B8', fontSize: 12 }}>{t('profile.unlocked')}</Text>
                            {(Object.keys(achievements) as AchievementId[]).map((id) => (
                                <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={{ color: '#22C55E' }}>✓</Text>
                                    <Text style={{ color: 'white' }}>{t(`achievements.${id}`)}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <TouchableOpacity onPress={logout} style={{ backgroundColor: '#EF4444', padding: 12, borderRadius: 14 }}>
                <Text style={{ color: 'white', textAlign: 'center' }}>{t('profile.logout')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
