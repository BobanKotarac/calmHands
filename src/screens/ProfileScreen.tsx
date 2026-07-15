import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Switch, Text, TouchableOpacity, View } from 'react-native';
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
import { theme } from '../theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import type { TabScreenNavigationProp } from '../navigation/types';

function initialLetter(email?: string | null, displayName?: string | null) {
  const s = (displayName?.trim() || email?.trim() || '?').toUpperCase();
  return s[0] ?? '?';
}

export default function ProfileScreen() {
    const { user, logout, isGuest } = useAuth();
    const navigation = useNavigation<TabScreenNavigationProp>();
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
        <ScreenContainer>
                <Text style={{ color: theme.colors.text, fontSize: 22 }}>{t('profile.title')}</Text>

                {isGuest && (
                    <TouchableOpacity
                        onPress={() => navigation.getParent()?.navigate('Auth')}
                        style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.card, padding: theme.padding.cardTight, gap: 4 }}
                    >
                        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>
                            {t('profile.guestBannerTitle')}
                        </Text>
                        <Text style={{ color: theme.colors.text }}>{t('profile.guestBannerDesc')}</Text>
                    </TouchableOpacity>
                )}

                {/* JEZIK */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: theme.colors.textMuted }}>{t('profile.language')}</Text>
                    <TouchableOpacity
                        onPress={() => changeAppLanguage('sr')}
                        style={{
                            paddingVertical: 8,
                            paddingHorizontal: 14,
                            borderRadius: theme.radius.buttonSmall,
                            backgroundColor: i18n.language === 'sr' ? theme.colors.primary : theme.colors.card,
                        }}
                    >
                        <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{t('profile.serbian')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => changeAppLanguage('en')}
                        style={{
                            paddingVertical: 8,
                            paddingHorizontal: 14,
                            borderRadius: theme.radius.buttonSmall,
                            backgroundColor: i18n.language === 'en' ? theme.colors.primary : theme.colors.card,
                        }}
                    >
                        <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{t('profile.english')}</Text>
                    </TouchableOpacity>
                </View>

                {/* USER CARD (inicijalni avatar) */}
                <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: theme.colors.cardMuted,
                        borderWidth: 1,
                        borderColor: theme.colors.cardBorder,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    >
                    <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '700' }}>{initial}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 16 }}>
                        {user?.displayName?.trim() ? user.displayName : t('profile.noNickname')}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted }}>{user?.email ?? '—'}</Text>
                    </View>
                </View>

                <Text style={{ color: theme.colors.textMuted }}>
                    {t('profile.avatarHint')}
                </Text>
                <View style={{ gap: 8 }}>
                <Text style={{ color: theme.colors.textMuted }}>{t('profile.nickname')}</Text>

                <TextInput
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder={t('profile.nickname')}
                    placeholderTextColor={theme.colors.textDim}
                    style={{
                    backgroundColor: theme.colors.cardMuted,
                    borderWidth: 1,
                    borderColor: theme.colors.cardBorder,
                    padding: 12,
                    borderRadius: theme.radius.cardSmall,
                    color: theme.colors.text,
                    }}
                    autoCapitalize="none"
                />

                <Button
                    title={savingNick ? t('profile.saving') : t('profile.saveNickname')}
                    disabled={savingNick || !nickname.trim()}
                    onPress={saveNickname}
                    style={{ backgroundColor: savingNick || !nickname.trim() ? theme.colors.cardBorder : theme.colors.primary, padding: 12 }}
                />
                {nickSaved && <Text style={{ color: theme.colors.success }}>{t('profile.saved')}</Text>}
                </View>

                </Card>

                {/* REMINDER */}
                <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 16 }}>{t('profile.reminder')}</Text>
                    <Text style={{ color: theme.colors.textMuted }}>{t('profile.reminderDesc')}</Text>
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
                    backgroundColor: theme.colors.cardMuted,
                    borderWidth: 1,
                    borderColor: theme.colors.cardBorder,
                    padding: 12,
                    borderRadius: theme.radius.cardSmall,
                    }}
                >
                    <Text style={{ color: theme.colors.text }}>{t('profile.time')}: {timeLabel}</Text>
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
                </Card>

                <TouchableOpacity
                    onPress={() => navigation.getParent()?.navigate('SafetyPlanEditor')}
                    style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius.card, padding: theme.padding.cardTight, borderWidth: 1, borderColor: theme.colors.cardBorder }}
                >
                    <Text style={{ color: theme.colors.text, fontSize: 16 }}>{t('profile.safetyPlan')}</Text>
                    <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>{t('profile.safetyPlanDesc')}</Text>
                </TouchableOpacity>

                <Card>
                    <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>{t('profile.achievements')}</Text>
                    {longestStreaks && (
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1, backgroundColor: theme.colors.cardMuted, borderRadius: theme.radius.cardSmall, padding: 10 }}>
                                <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{t('profile.longestMoodStreak')}</Text>
                                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>{longestStreaks.mood} {t('common.days')}</Text>
                            </View>
                            <View style={{ flex: 1, backgroundColor: theme.colors.cardMuted, borderRadius: theme.radius.cardSmall, padding: 10 }}>
                                <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{t('profile.longestRitualStreak')}</Text>
                                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>{longestStreaks.ritual} {t('common.days')}</Text>
                            </View>
                        </View>
                    )}
                    {Object.keys(achievements).length > 0 && (
                        <View style={{ gap: 6 }}>
                            <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{t('profile.unlocked')}</Text>
                            {(Object.keys(achievements) as AchievementId[]).map((id) => (
                                <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={{ color: theme.colors.success }}>✓</Text>
                                    <Text style={{ color: theme.colors.text }}>{t(`achievements.${id}`)}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </Card>

                {!isGuest && (
                    <Button title={t('profile.logout')} variant="danger" onPress={logout} />
                )}
        </ScreenContainer>
    );
}
