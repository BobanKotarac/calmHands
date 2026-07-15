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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';

export default function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

    async function submit() {
        try {
            if (!email || !pass) return Alert.alert('Greška', 'Unesi email i lozinku.');
            if (mode === 'login') await signInWithEmailAndPassword(auth, email.trim(), pass);
            else await createUserWithEmailAndPassword(auth, email.trim(), pass);
            Keyboard.dismiss();
        } catch (e: any) {
            Alert.alert('Auth greška', e?.message ?? 'Unknown error');
        }
    }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0F172A' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20, gap: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ color: 'white', fontSize: 28, textAlign: 'center', marginBottom: 10 }}>
            {mode === 'login' ? 'Uloguj se' : 'Registruj se'}
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email adresa"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            style={{ backgroundColor: '#111827', color: 'white', padding: 14, borderRadius: 12 }}
          />

          <TextInput
            value={pass}
            onChangeText={setPass}
            placeholder="Lozinka"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={submit}
            style={{ backgroundColor: '#111827', color: 'white', padding: 14, borderRadius: 12 }}
          />

          <TouchableOpacity onPress={submit} style={{ backgroundColor: '#10B981', padding: 14, borderRadius: 12 }}>
            <Text style={{ color: 'white', textAlign: 'center', fontSize: 16 }}>
              {mode === 'login' ? 'Login' : 'Register'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
            <Text style={{ color: '#60A5FA', textAlign: 'center', paddingVertical: 10 }}>
              {mode === 'login' ? 'Nemaš nalog? Registruj se' : 'Imaš nalog? Uloguj se'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
