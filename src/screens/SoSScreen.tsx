import React, { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/authContext';
import { getSafetyPlan, type SafetyPlanDoc } from '../utils/safetyPlan';
import { theme } from '../theme';
import { AppBackground } from '../components/ui/AppBackground';

export default function SOSSustainScreen({ navigation }: any) {
  usePreventScreenCapture('sos');
  const { user } = useAuth();
  const { t } = useTranslation();
  const [safetyPlan, setSafetyPlan] = useState<SafetyPlanDoc | null>(null);

  const loadPlan = useCallback(async () => {
    if (!user?.uid) return;
    const plan = await getSafetyPlan(user.uid);
    setSafetyPlan(plan);
  }, [user?.uid]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const onPress = async (
    screen: string,
    opts?: { params?: any; haptic?: Haptics.ImpactFeedbackStyle }
  ) => {
    try {
      await Haptics.impactAsync(opts?.haptic ?? Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    navigation.navigate(screen, opts?.params);
  };

  return (
    <AppBackground>
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: theme.padding.screen, paddingBottom: 48, gap: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Text style={[theme.typography.hero, { color: theme.colors.text }]}>{t('sos.title')}</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: '90%' }}>
            {t('sos.subtitle')}
          </Text>
        </View>

        {/* Sigurnosni plan + osoba za pomoć */}
        {safetyPlan && (safetyPlan.steps?.length > 0 || safetyPlan.contacts?.length > 0 || safetyPlan.whatHelps || safetyPlan.selfObservation || safetyPlan.crisisPhone) && (
          <View style={{ backgroundColor: theme.colors.primaryDark + '22', borderRadius: theme.radius.card, padding: 18, gap: 14, borderWidth: 1, borderColor: theme.colors.primary }}>
            <Text style={[theme.typography.sectionTitle, { color: theme.colors.text, fontSize: 16 }]}>{t('sos.safetyPlan')}</Text>
            {safetyPlan.whatHelps ? (
              <View style={{ gap: 4 }}>
                <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>{t('sos.whatHelps')}</Text>
                <Text style={{ color: '#E2E8F0', fontSize: 14 }}>{safetyPlan.whatHelps}</Text>
              </View>
            ) : null}
            {safetyPlan.selfObservation ? (
              <View style={{ gap: 4 }}>
                <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>{t('sos.whatNotice')}</Text>
                <Text style={{ color: '#E2E8F0', fontSize: 14 }}>{safetyPlan.selfObservation}</Text>
              </View>
            ) : null}
            {safetyPlan.crisisPhone ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>{t('sos.crisisPhone')}</Text>
                <TouchableOpacity
                  activeOpacity={theme.activeOpacity}
                  onPress={() => Linking.openURL('tel:' + safetyPlan.crisisPhone!.replace(/\s/g, ''))}
                  style={{ backgroundColor: theme.colors.danger, paddingVertical: theme.padding.buttonSmall, paddingHorizontal: 14, borderRadius: theme.radius.buttonSmall }}
                >
                  <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{t('sos.callCrisis')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {safetyPlan.steps?.length > 0 && (
              <View style={{ gap: 4 }}>
                <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>{t('sos.steps')}</Text>
                {safetyPlan.steps.slice(0, 3).map((step, i) => (
                  <Text key={step.id} style={{ color: '#E2E8F0', fontSize: 14 }}>
                    {i + 1}. {step.label}
                  </Text>
                ))}
              </View>
            )}
            {safetyPlan.contacts?.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={[theme.typography.caption, { color: theme.colors.textMuted, fontSize: 13 }]}>{t('sos.personToHelp')}</Text>
                {safetyPlan.contacts.filter((c) => c.name?.trim()).slice(0, 2).map((c) => (
                  <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.colors.text, fontWeight: '500' }}>{c.name}</Text>
                    {c.phone ? (
                      <TouchableOpacity
                        activeOpacity={theme.activeOpacity}
                        onPress={() => Linking.openURL('tel:' + c.phone!.replace(/\s/g, ''))}
                        style={{ backgroundColor: theme.colors.success, paddingVertical: theme.padding.buttonSmall, paddingHorizontal: 14, borderRadius: theme.radius.buttonSmall }}
                      >
                        <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{t('sos.call')}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity
              activeOpacity={theme.activeOpacity}
              onPress={() => navigation.navigate('SafetyPlanEditor')}
              style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.card, paddingVertical: theme.padding.buttonSmall, paddingHorizontal: 14, borderRadius: theme.radius.buttonSmall, borderWidth: 1, borderColor: theme.colors.accent }}
            >
              <Text style={{ color: theme.colors.accent, fontSize: 14, fontWeight: '600' }}>{t('sos.editPlan')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Buttons */}
        <View style={{ gap: 16 }}>
          {/* Disanje - gradient kao primarna akcija */}
          <TouchableOpacity
            activeOpacity={theme.activeOpacity}
            onPress={() =>
              onPress('Breathing', {
                haptic: Haptics.ImpactFeedbackStyle.Medium,
                params: { durationSec: 60, patternId: 'physioSigh', source: 'sos' },
              })
            }
            style={{ overflow: 'hidden', borderRadius: theme.radius.card }}
          >
            <LinearGradient
              colors={[theme.colors.primary + 'E6', theme.colors.primaryDark + 'E6']}
              style={{ padding: 20, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.primary }}
            >
              <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>{t('sos.breathing')}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 }}>{t('sos.breathingHint')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Grounding */}
          <TouchableOpacity
            activeOpacity={theme.activeOpacity}
            onPress={() => onPress('Grounding', { haptic: Haptics.ImpactFeedbackStyle.Medium, params: { source: 'sos' } })}
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.card,
              padding: 20,
              borderWidth: 1,
              borderColor: theme.colors.cardBorder,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '500' }}>{t('sos.grounding')}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 14, marginTop: 4 }}>{t('sos.groundingHint')}</Text>
          </TouchableOpacity>

          {/* Mudra */}
          <TouchableOpacity
            activeOpacity={theme.activeOpacity}
            onPress={() => onPress('MudraDetail', { haptic: Haptics.ImpactFeedbackStyle.Medium, params: { mudraId: 'gyan', source: 'sos' } })}
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.card,
              padding: 20,
              borderWidth: 1,
              borderColor: theme.colors.cardBorder,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '500' }}>{t('sos.mudra')}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 14, marginTop: 4 }}>{t('sos.mudraHint')}</Text>
          </TouchableOpacity>

          {/* Log misli */}
          <TouchableOpacity
            activeOpacity={theme.activeOpacity}
            onPress={() => onPress('ThoughtLog', { haptic: Haptics.ImpactFeedbackStyle.Light })}
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.card,
              padding: 20,
              borderWidth: 1,
              borderColor: theme.colors.cardBorder,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '500' }}>{t('sos.thoughtLog')}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 14, marginTop: 4 }}>{t('sos.thoughtLogHint')}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <TouchableOpacity
          activeOpacity={theme.activeOpacity}
          onPress={() => navigation.goBack()}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: theme.radius.button,
            backgroundColor: theme.colors.card,
            alignSelf: 'center',
          }}
        >
          <Text style={{ color: theme.colors.textMuted }}>{t('sos.backToHome')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
    </AppBackground>
  );
}
