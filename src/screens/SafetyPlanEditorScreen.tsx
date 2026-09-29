import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useAuth } from '../context/authContext';
import {
  getSafetyPlan,
  saveSafetyPlan,
  type SafetyPlanStep,
  type SafetyPlanContact,
} from '../utils/safetyPlan';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function SafetyPlanEditorScreen({ navigation }: any) {
  usePreventScreenCapture('safety-plan');
  const { user } = useAuth();
  const { t } = useTranslation();
  const [steps, setSteps] = useState<SafetyPlanStep[]>([]);
  const [contacts, setContacts] = useState<SafetyPlanContact[]>([]);
  const [whatHelps, setWhatHelps] = useState('');
  const [selfObservation, setSelfObservation] = useState('');
  const [crisisPhone, setCrisisPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const plan = await getSafetyPlan(user.uid);
      if (plan) {
        setSteps(plan.steps);
        setContacts(plan.contacts);
        setWhatHelps(plan.whatHelps ?? '');
        setSelfObservation(plan.selfObservation ?? '');
        setCrisisPhone(plan.crisisPhone ?? '');
      } else {
        setSteps([]);
        setContacts([]);
        setWhatHelps('');
        setSelfObservation('');
        setCrisisPhone('');
      }
    } catch (e: any) {
      Alert.alert(t('safetyPlan.errorTitle'), e?.message ?? t('safetyPlan.errorAlert'));
    } finally {
      setLoading(false);
    }
  }, [user?.uid, t]);

  useEffect(() => {
    load();
  }, [load]);

  const addStep = () => {
    setSteps((s) => [...s, { id: uid(), label: '', order: s.length }]);
  };

  const updateStep = (id: string, label: string) => {
    setSteps((s) => s.map((x) => (x.id === id ? { ...x, label } : x)));
  };

  const removeStep = (id: string) => {
    setSteps((s) => s.filter((x) => x.id !== id).map((x, i) => ({ ...x, order: i })));
  };

  const addContact = () => {
    setContacts((c) => [...c, { id: uid(), name: '', phone: '', role: '' }]);
  };

  const updateContact = (id: string, patch: Partial<SafetyPlanContact>) => {
    setContacts((c) => c.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const removeContact = (id: string) => {
    setContacts((c) => c.filter((x) => x.id !== id));
  };

  const leave = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Tabs');
  }, [navigation]);

  const onSave = async () => {
    if (!user?.uid) return;
    const stepsValid = steps.map((s, i) => ({ ...s, order: i })).filter((s) => s.label.trim());
    if (
      stepsValid.length === 0 &&
      contacts.length === 0 &&
      !whatHelps.trim() &&
      !selfObservation.trim() &&
      !crisisPhone.trim()
    ) {
      Alert.alert(t('safetyPlan.emptyTitle'), t('safetyPlan.emptyAlert'));
      return;
    }
    setSaving(true);
    try {
      await saveSafetyPlan(user.uid, {
        steps: stepsValid,
        contacts: contacts.filter((c) => c.name.trim()),
        whatHelps: whatHelps.trim() || undefined,
        selfObservation: selfObservation.trim() || undefined,
        crisisPhone: crisisPhone.trim() || undefined,
      });
      // goBack only after Alert dismiss — Alert + immediate goBack leaves a black overlay on iOS
      Alert.alert(t('safetyPlan.savedTitle'), t('safetyPlan.savedAlert'), [
        { text: t('common.close'), onPress: leave },
      ]);
    } catch (e: any) {
      Alert.alert(t('safetyPlan.errorTitle'), e?.message ?? t('safetyPlan.errorAlert'));
    } finally {
      setSaving(false);
    }
  };

  if (!user?.uid) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Text style={styles.title}>{t('safetyPlan.notLoggedIn')}</Text>
        <TouchableOpacity onPress={leave} style={styles.backFallback}>
          <Text style={styles.backFallbackText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Text style={styles.muted}>{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>{t('safetyPlan.subtitle')}</Text>

          <Text style={styles.sectionTitle}>{t('safetyPlan.whatHelps')}</Text>
          <TextInput
            value={whatHelps}
            onChangeText={setWhatHelps}
            placeholder={t('safetyPlan.whatHelpsPlaceholder')}
            placeholderTextColor={theme.colors.textDim}
            style={[styles.input, styles.inputMultiline]}
            multiline
          />

          <Text style={styles.sectionTitle}>{t('safetyPlan.selfObservation')}</Text>
          <TextInput
            value={selfObservation}
            onChangeText={setSelfObservation}
            placeholder={t('safetyPlan.selfObservationPlaceholder')}
            placeholderTextColor={theme.colors.textDim}
            style={[styles.input, styles.inputMultiline]}
            multiline
          />

          <Text style={styles.sectionTitle}>{t('safetyPlan.crisisPhone')}</Text>
          <TextInput
            value={crisisPhone}
            onChangeText={setCrisisPhone}
            placeholder={t('safetyPlan.crisisPhonePlaceholder')}
            placeholderTextColor={theme.colors.textDim}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <Text style={styles.sectionTitle}>{t('safetyPlan.stepsTitle')}</Text>
          {steps.map((step, idx) => (
            <View key={step.id} style={styles.row}>
              <Text style={styles.orderLabel}>{idx + 1}.</Text>
              <TextInput
                value={step.label}
                onChangeText={(txt) => updateStep(step.id, txt)}
                placeholder={t('safetyPlan.stepPlaceholder')}
                placeholderTextColor={theme.colors.textDim}
                style={styles.input}
              />
              <TouchableOpacity onPress={() => removeStep(step.id)} style={styles.removeBtn} hitSlop={8}>
                <Text style={styles.removeBtnText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={addStep} style={styles.addBtn}>
            <Text style={styles.addBtnText}>{t('safetyPlan.addStep')}</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t('safetyPlan.personToHelpTitle')}</Text>
          <Text style={styles.muted}>{t('safetyPlan.personToHelpDesc')}</Text>
          {contacts.map((c) => (
            <View key={c.id} style={styles.contactCard}>
              <TextInput
                value={c.name}
                onChangeText={(txt) => updateContact(c.id, { name: txt })}
                placeholder={t('safetyPlan.name')}
                placeholderTextColor={theme.colors.textDim}
                style={styles.input}
              />
              <TextInput
                value={c.phone ?? ''}
                onChangeText={(txt) => updateContact(c.id, { phone: txt })}
                placeholder={t('safetyPlan.phone')}
                placeholderTextColor={theme.colors.textDim}
                style={styles.input}
                keyboardType="phone-pad"
              />
              <TextInput
                value={c.role ?? ''}
                onChangeText={(txt) => updateContact(c.id, { role: txt })}
                placeholder={t('safetyPlan.role')}
                placeholderTextColor={theme.colors.textDim}
                style={styles.input}
              />
              <TouchableOpacity onPress={() => removeContact(c.id)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>{t('safetyPlan.remove')}</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={addContact} style={styles.addBtn}>
            <Text style={styles.addBtnText}>{t('safetyPlan.addContact')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onSave}
            disabled={saving}
            style={[styles.saveBtn, saving && styles.btnDisabled]}
          >
            <Text style={styles.saveBtnText}>{saving ? t('safetyPlan.saving') : t('safetyPlan.savePlan')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.padding.screen, paddingBottom: 120, gap: 4 },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: '700', padding: 16 },
  subtitle: { color: theme.colors.textMuted, marginBottom: 8, lineHeight: 20 },
  sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '600', marginTop: 12 },
  muted: { color: theme.colors.textDim, fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  orderLabel: { color: theme.colors.textMuted, width: 24 },
  input: {
    flex: 1,
    backgroundColor: theme.colors.cardMuted,
    borderRadius: theme.radius.button,
    padding: 12,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  removeBtn: { padding: 8 },
  removeBtnText: { color: theme.colors.sos },
  addBtn: {
    backgroundColor: theme.colors.card,
    padding: 12,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  addBtnText: { color: theme.colors.textMuted, fontWeight: '600' },
  contactCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.cardSmall,
    padding: 12,
    gap: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: { color: theme.colors.background, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  backFallback: {
    margin: 16,
    padding: 12,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.button,
    alignItems: 'center',
  },
  backFallbackText: { color: theme.colors.text },
});
