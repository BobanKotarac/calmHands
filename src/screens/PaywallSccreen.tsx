import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PaywallScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Unlock CalmHands Pro</Text>
      <Text style={styles.feature}>✅ Unlimited reminders & plans</Text>
      <Text style={styles.feature}>✅ Advanced insights & export</Text>
      <Text style={styles.feature}>✅ Adaptive recommendations</Text>
      <View style={styles.pricing}>
        <TouchableOpacity style={styles.priceBtn}>
          <Text style={styles.price}>4.99€ / mesec</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.priceBtn}>
          <Text style={styles.price}>39.99€ / godina (save 60%)</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.free}>Continue Free</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  feature: { fontSize: 16, marginBottom: 10, textAlign: 'center' },
  pricing: { marginVertical: 40 },
  priceBtn: { padding: 15, backgroundColor: '#4CAF50', marginBottom: 10, borderRadius: 8 },
  price: { fontSize: 20, fontWeight: 'bold', color: 'white', textAlign: 'center' },
  free: { textAlign: 'center', color: '#2196F3', fontSize: 16, fontWeight: '500' },
});

export default PaywallScreen;
