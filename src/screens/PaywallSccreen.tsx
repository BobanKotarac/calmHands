import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { PurchasesPackage } from 'react-native-purchases';
import type { RootScreenNavigationProp } from '../navigation/types';
import { theme } from '../theme';
import { usePremiumContext } from '../context/premiumContext';
import { AppBackground } from '../components/ui/AppBackground';
import { Button } from '../components/ui/Button';
import {
  getCurrentOfferingPackages,
  getRevenueCatApiKey,
  isPurchasesNativeAvailable,
  purchasePackageSafe,
  restorePurchasesSafe,
} from '../utils/revenueCat';

function packageLabel(pkg: PurchasesPackage): string {
  const product = pkg.product;
  const price = product.priceString;
  const title = product.title || pkg.packageType;
  return `${title} — ${price}`;
}

export default function PaywallScreen() {
  const navigation = useNavigation<RootScreenNavigationProp>();
  const { t } = useTranslation();
  const { isPremium, purchasesReady, applyCustomerInfo, refreshPremium } = usePremiumContext();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const leave = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Tabs' as never);
  };

  const loadOfferings = useCallback(async () => {
    setLoading(true);
    try {
      const pkgs = await getCurrentOfferingPackages();
      setPackages(pkgs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  useEffect(() => {
    if (isPremium) leave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  const onPurchase = async (pkg: PurchasesPackage) => {
    try {
      setBusy(true);
      const info = await purchasePackageSafe(pkg);
      applyCustomerInfo(info);
      Alert.alert(t('paywall.successTitle'), t('paywall.successBody'));
      leave();
    } catch (e: any) {
      if (e?.userCancelled) return;
      Alert.alert(t('paywall.errorTitle'), e?.message ?? t('paywall.purchaseFailed'));
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    try {
      setBusy(true);
      const info = await restorePurchasesSafe();
      applyCustomerInfo(info);
      await refreshPremium();
      Alert.alert(t('paywall.restoreTitle'), t('paywall.restoreBody'));
    } catch (e: any) {
      Alert.alert(t('paywall.errorTitle'), e?.message ?? t('paywall.restoreFailed'));
    } finally {
      setBusy(false);
    }
  };

  const nativeOk = isPurchasesNativeAvailable();
  const hasKey = !!getRevenueCatApiKey();

  return (
    <AppBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <TouchableOpacity
          onPress={leave}
          style={{
            alignSelf: 'flex-start',
            margin: theme.padding.screen,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: theme.radius.buttonSmall,
            backgroundColor: theme.colors.card,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
          }}
          hitSlop={12}
        >
          <Text style={{ color: theme.colors.text }}>{t('common.back')}</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, paddingHorizontal: theme.padding.screen, justifyContent: 'center', gap: 14 }}>
          <Text style={[theme.typography.hero, { color: theme.colors.text, textAlign: 'center' }]}>
            {t('paywall.title')}
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textMuted, textAlign: 'center' }]}>
            {t('paywall.featurePlans')}
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textMuted, textAlign: 'center' }]}>
            {t('paywall.featureInsights')}
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textMuted, textAlign: 'center' }]}>
            {t('paywall.featureRecs')}
          </Text>

          <View style={{ marginTop: 24, gap: 12 }}>
            {!nativeOk ? (
              <Text style={[theme.typography.bodySmall, { color: theme.colors.warning, textAlign: 'center' }]}>
                {t('paywall.needsDevBuild')}
              </Text>
            ) : !hasKey ? (
              <Text style={[theme.typography.bodySmall, { color: theme.colors.warning, textAlign: 'center' }]}>
                {t('paywall.missingKey')}
              </Text>
            ) : null}

            {loading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : packages.length > 0 ? (
              packages.map((pkg) => (
                <Button
                  key={pkg.identifier}
                  title={packageLabel(pkg)}
                  variant="primary"
                  disabled={busy || !purchasesReady}
                  onPress={() => onPurchase(pkg)}
                />
              ))
            ) : nativeOk && hasKey ? (
              <Text style={[theme.typography.bodySmall, { color: theme.colors.textMuted, textAlign: 'center' }]}>
                {t('paywall.noOfferings')}
              </Text>
            ) : (
              <>
                <View
                  style={{
                    padding: 15,
                    backgroundColor: theme.colors.card,
                    borderRadius: theme.radius.button,
                    borderWidth: 1,
                    borderColor: theme.colors.cardBorder,
                    opacity: 0.6,
                  }}
                >
                  <Text style={{ fontSize: 16, fontFamily: theme.typography.fontSemiBold, color: theme.colors.textMuted, textAlign: 'center' }}>
                    4.99€ / {t('paywall.month')}
                  </Text>
                </View>
                <View
                  style={{
                    padding: 15,
                    backgroundColor: theme.colors.card,
                    borderRadius: theme.radius.button,
                    borderWidth: 1,
                    borderColor: theme.colors.cardBorder,
                    opacity: 0.6,
                  }}
                >
                  <Text style={{ fontSize: 16, fontFamily: theme.typography.fontSemiBold, color: theme.colors.textMuted, textAlign: 'center' }}>
                    39.99€ / {t('paywall.year')}
                  </Text>
                </View>
              </>
            )}

            <Button title={t('paywall.restore')} variant="muted" disabled={busy || !purchasesReady} onPress={onRestore} />
            <TouchableOpacity onPress={leave} disabled={busy}>
              <Text style={{ textAlign: 'center', color: theme.colors.accent, fontSize: 16, fontFamily: theme.typography.fontSemiBold }}>
                {t('paywall.continueFree')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}
