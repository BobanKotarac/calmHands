import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { auth } from '../firebase/firebase';
import { useAuth } from '../context/authContext';
import { theme } from '../theme';
import { Button } from '../components/ui/Button';
import { AppBackground } from '../components/ui/AppBackground';
import type { RootScreenNavigationProp } from '../navigation/types';

export default function LoginScreen() {
  const navigation = useNavigation<RootScreenNavigationProp>();
  const { user, isGuest, continueAsGuest, upgradeToAccount, loginToExistingAccount, sendPasswordReset } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [guestBusy, setGuestBusy] = useState(false);

  const showGuestEntry = !user;

  async function forgotPassword() {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert(t('auth.errorTitle'), t('auth.forgotPasswordNeedEmail'));
      return;
    }
    try {
      await sendPasswordReset(trimmed);
      Alert.alert(t('auth.forgotPasswordSentTitle'), t('auth.forgotPasswordSentBody'));
    } catch (e: any) {
      Alert.alert(t('auth.errorGeneric'), e?.message ?? 'Unknown error');
    }
  }

  async function submit() {
    try {
      if (!email || !pass) return Alert.alert(t('auth.errorTitle'), t('auth.missingFields'));
      if (mode === 'login') {
        await loginToExistingAccount(email, pass);
      } else if (isGuest) {
        await upgradeToAccount(email, pass);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), pass);
      }
      Keyboard.dismiss();
      if (navigation.canGoBack()) navigation.goBack();
    } catch (e: any) {
      Alert.alert(t('auth.errorGeneric'), e?.message ?? 'Unknown error');
    }
  }

  async function onContinueAsGuest() {
    try {
      setGuestBusy(true);
      await continueAsGuest();
    } catch (e: any) {
      Alert.alert(t('auth.errorGeneric'), e?.message ?? 'Unknown error');
    } finally {
      setGuestBusy(false);
    }
  }

  return (
    <AppBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              padding: theme.padding.screen,
              gap: 14,
              paddingVertical: 48,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Text
                style={[
                  theme.typography.hero,
                  {
                    color: theme.colors.text,
                    textAlign: 'center',
                    fontSize: 34,
                    lineHeight: 40,
                    letterSpacing: -0.8,
                  },
                ]}
              >
                CalmHands
              </Text>
              <Text style={[theme.typography.bodySmall, { color: theme.colors.textMuted, textAlign: 'center' }]}>
                {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
              </Text>
            </View>

            {isGuest && (
              <Text style={[theme.typography.bodySmall, { color: theme.colors.textMuted, textAlign: 'center', marginBottom: 4 }]}>
                {mode === 'register' ? t('auth.guestRegisterHint') : t('auth.guestLoginHint')}
              </Text>
            )}

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={theme.colors.textDim}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              style={{
                backgroundColor: theme.colors.input,
                color: theme.colors.text,
                padding: theme.padding.button,
                borderRadius: theme.radius.cardSmall,
                borderWidth: 1,
                borderColor: theme.colors.cardBorder,
                fontFamily: theme.typography.fontRegular,
                fontSize: 16,
              }}
            />

            <TextInput
              value={pass}
              onChangeText={setPass}
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor={theme.colors.textDim}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={submit}
              style={{
                backgroundColor: theme.colors.input,
                color: theme.colors.text,
                padding: theme.padding.button,
                borderRadius: theme.radius.cardSmall,
                borderWidth: 1,
                borderColor: theme.colors.cardBorder,
                fontFamily: theme.typography.fontRegular,
                fontSize: 16,
              }}
            />

            <Button
              title={mode === 'login' ? t('auth.loginButton') : t('auth.registerButton')}
              variant="primary"
              onPress={submit}
            />

            {mode === 'login' ? (
              <TouchableOpacity onPress={forgotPassword}>
                <Text style={[theme.typography.bodySmall, { color: theme.colors.textMuted, textAlign: 'center', paddingVertical: 4 }]}>
                  {t('auth.forgotPassword')}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
              <Text style={[theme.typography.body, { color: theme.colors.primary, textAlign: 'center', paddingVertical: 10, fontFamily: theme.typography.fontSemiBold }]}>
                {mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
              </Text>
            </TouchableOpacity>

            {isGuest && navigation.canGoBack() && (
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={[theme.typography.bodySmall, { color: theme.colors.textDim, textAlign: 'center', paddingVertical: 4 }]}>
                  {t('auth.later')}
                </Text>
              </TouchableOpacity>
            )}

            {showGuestEntry ? (
              <Button
                title={t('auth.continueAsGuest')}
                variant="muted"
                disabled={guestBusy}
                onPress={onContinueAsGuest}
              />
            ) : null}
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
