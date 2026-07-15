import React, { useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/authContext';
import { logRitualEvent } from '../utils/ritualPlans';
import { unlockAchievement } from '../utils/achievements';


type Step = { k: string; title: string; prompt: string; lines: number };

const STEPS: Step[] = [
  { k: '5', title: '5 stvari koje vidiš', prompt: 'Nabroj 5 detalja oko sebe (boje, oblici, svetlo...)', lines: 4 },
  { k: '4', title: '4 stvari koje dodiruješ', prompt: 'Npr. odeća na koži, stolica, telefon...', lines: 3 },
  { k: '3', title: '3 zvuka koja čuješ', prompt: 'Npr. klima, kola, glasovi, tišina...', lines: 3 },
  { k: '2', title: '2 osećaja u telu', prompt: 'Npr. stopala na podu, ruke, disanje...', lines: 3 },
  { k: '1', title: '1 stvar koja ti prija', prompt: 'Npr. gutljaj vode, topla šolja, rečenica podrške...', lines: 2 },
];

export default function GroundingScreen({ navigation, route }: any) {
    const { user } = useAuth();
  const source = route?.params?.source;
  const planId = route?.params?.planId ?? null;
  const [i, setI] = useState(0);

  React.useEffect(() => {
    if (source === 'sos' && user?.uid) {
      unlockAchievement(user.uid, 'sos_first').catch(() => {});
    }
  }, [source, user?.uid]);
  const [answers, setAnswers] = useState<string[]>(Array(STEPS.length).fill(''));

  const step = STEPS[i];
  const done = i === STEPS.length - 1;

  const setAnswer = (text: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = text;
      return next;
    });
  };

  const next = async () => {
    try { await Haptics.selectionAsync(); } catch {}
    if (!done) setI((x) => x + 1);
    else {
  try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}

  try {
    if (user?.uid) {
      await logRitualEvent(user.uid, {
        stepType: 'grounding',
        planId,
        source,
      });
    }
  } catch {}

  navigation.goBack();
}
  };

  const back = async () => {
    try { await Haptics.selectionAsync(); } catch {}
    if (i > 0) setI((x) => x - 1);
    else navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1220' }} edges={['top']}>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={back}
            style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#111827' }}
          >
            <Text style={{ color: 'white' }}>← Nazad</Text>
          </TouchableOpacity>

          <Text style={{ color: 'white', fontSize: 18 }}>Grounding 5–4–3–2–1</Text>
          <View style={{ width: 70 }} />
        </View>

        <Text style={{ color: '#94A3B8' }}>
          Korak {i + 1}/{STEPS.length}
        </Text>

        <View style={{ backgroundColor: '#111827', borderRadius: 18, padding: 14, gap: 10, borderWidth: 1, borderColor: '#1F2937' }}>
          <Text style={{ color: 'white', fontSize: 18 }}>{step.title}</Text>
          <Text style={{ color: '#94A3B8' }}>{step.prompt}</Text>

          <TextInput
            multiline
            numberOfLines={step.lines}
            value={answers[i]}
            onChangeText={setAnswer}
            placeholder="Upiši ili samo opiši ukratko..."
            placeholderTextColor="#64748B"
            style={{
              backgroundColor: '#0F172A',
              borderRadius: 14,
              padding: 12,
              color: 'white',
              borderWidth: 1,
              borderColor: '#1F2937',
              minHeight: 110,
              textAlignVertical: 'top',
            }}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={back}
            style={{ flex: 1, backgroundColor: '#111827', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#1F2937' }}
          >
            <Text style={{ color: 'white', textAlign: 'center' }}>Nazad</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={next}
            style={{ flex: 1, backgroundColor: '#3B82F6', padding: 12, borderRadius: 14 }}
          >
            <Text style={{ color: 'white', textAlign: 'center' }}>{done ? 'Gotovo' : 'Dalje'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
