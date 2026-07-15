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
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebase/firebase';
import { useAuth } from '../context/authContext';
import { theme } from '../theme';
import { Button } from '../components/ui/Button';
import type { RootScreenNavigationProp } from '../navigation/types';

export default function LoginScreen() {
  const navigation = useNavigation<RootScreenNavigationProp>();
  const { isGuest, upgradeToAccount, loginToExistingAccount } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

    async function submit() {
        try {
            if (!email || !pass) return Alert.alert('Greška', 'Unesi email i lozinku.');
            if (mode === 'login') {
                await loginToExistingAccount(email, pass);
            } else if (isGuest) {
                // Upgrades the current guest session in place — same uid, data stays intact.
                await upgradeToAccount(email, pass);
            } else {
                await createUserWithEmailAndPassword(auth, email.trim(), pass);
            }
            Keyboard.dismiss();
            if (navigation.canGoBack()) navigation.goBack();
        } catch (e: any) {
            Alert.alert('Auth greška', e?.message ?? 'Unknown error');
        }
    }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: theme.padding.screen, gap: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ color: theme.colors.text, fontSize: 28, textAlign: 'center', marginBottom: 10 }}>
            {mode === 'login' ? 'Uloguj se' : 'Registruj se'}
          </Text>

          {isGuest && (
            <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginBottom: 4 }}>
              {mode === 'register'
                ? 'Trenutno koristiš gost nalog. Registracija čuva tvoj postojeći napredak.'
                : 'Prijava na postojeći nalog zamenjuje trenutnu gost sesiju.'}
            </Text>
          )}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email adresa"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            style={{
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
              padding: theme.padding.button,
              borderRadius: theme.radius.cardSmall,
            }}
          />

          <TextInput
            value={pass}
            onChangeText={setPass}
            placeholder="Lozinka"
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={submit}
            style={{
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
              padding: theme.padding.button,
              borderRadius: theme.radius.cardSmall,
            }}
          />

          <Button title={mode === 'login' ? 'Login' : 'Register'} variant="success" onPress={submit} />

          <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
            <Text style={{ color: theme.colors.accent, textAlign: 'center', paddingVertical: 10 }}>
              {mode === 'login' ? 'Nemaš nalog? Registruj se' : 'Imaš nalog? Uloguj se'}
            </Text>
          </TouchableOpacity>

          {isGuest && navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={{ color: theme.colors.textDim, textAlign: 'center', paddingVertical: 4 }}>
                Kasnije
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
