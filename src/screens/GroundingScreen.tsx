import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/authContext';
import { logRitualEvent } from '../utils/ritualPlans';
import { unlockAchievement } from '../utils/achievements';
import { theme } from '../theme';
import { AppBackground } from '../components/ui/AppBackground';
import { StackHeader } from '../components/ui/StackHeader';
import { Button } from '../components/ui/Button';

type Step = { k: string; title: string; prompt: string; lines: number };

const STEPS: Step[] = [
  { k: '5', title: '5 stvari koje vidiš', prompt: 'Nabroj 5 detalja oko sebe (boje, oblici, svetlo...)', lines: 4 },
  { k: '4', title: '4 stvari koje dodiruješ', prompt: 'Npr. odeća na koži, stolica, telefon...', lines: 3 },
  { k: '3', title: '3 zvuka koja čuješ', prompt: 'Npr. klima, kola, glasovi, tišina...', lines: 3 },
  { k: '2', title: '2 osećaja u telu', prompt: 'Npr. stopala na podu, ruke, disanje...', lines: 3 },
  { k: '1', title: '1 stvar koja ti prija', prompt: 'Npr. gutljaj vode, topla šolja, rečenica podrške...', lines: 2 },
];

export default function GroundingScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const source = route?.params?.source;
  const planId = route?.params?.planId ?? null;
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(STEPS.length).fill(''));

  React.useEffect(() => {
    if (source === 'sos' && user?.uid) {
      unlockAchievement(user.uid, 'sos_first').catch(() => {});
    }
  }, [source, user?.uid]);

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
    try {
      await Haptics.selectionAsync();
    } catch {}
    if (!done) setI((x) => x + 1);
    else {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

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
    try {
      await Haptics.selectionAsync();
    } catch {}
    if (i > 0) setI((x) => x - 1);
    else navigation.goBack();
  };

  return (
    <AppBackground>
      <StackHeader title="Grounding 5–4–3–2–1" onBack={back} />
      <View style={{ flex: 1, padding: theme.padding.screen, gap: theme.padding.sectionGap, paddingBottom: theme.padding.screen + 8 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {STEPS.map((_, idx) => (
            <View
              key={idx}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: idx <= i ? theme.colors.primary : theme.colors.cardBorder,
              }}
            />
          ))}
        </View>

        <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
          Korak {i + 1}/{STEPS.length}
        </Text>

        <View
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: theme.radius.card,
            padding: theme.padding.card,
            gap: 12,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
            ...theme.shadow.card,
          }}
        >
          <Text style={[theme.typography.sectionTitle, { color: theme.colors.text }]}>{step.title}</Text>
          <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>{step.prompt}</Text>

          <TextInput
            multiline
            numberOfLines={step.lines}
            value={answers[i]}
            onChangeText={setAnswer}
            placeholder="Upiši ili samo opiši ukratko..."
            placeholderTextColor={theme.colors.textDim}
            style={{
              backgroundColor: theme.colors.input,
              borderRadius: theme.radius.cardSmall,
              padding: 14,
              color: theme.colors.text,
              borderWidth: 1,
              borderColor: theme.colors.cardBorder,
              minHeight: 120,
              textAlignVertical: 'top',
              fontFamily: theme.typography.fontRegular,
              fontSize: 16,
            }}
          />
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Button title={t('common.back')} variant="muted" onPress={back} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title={done ? t('common.done') : t('onboarding.next')} variant="primary" onPress={next} />
          </View>
        </View>
      </View>
    </AppBackground>
  );
}
