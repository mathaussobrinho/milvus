import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.badge}>VisoHelp Mobile</Text>
      <Text style={styles.title}>Atendimento em movimento</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tickets em aberto</Text>
        <Text style={styles.cardValue}>12</Text>
      </View>
      <View style={[styles.card, styles.alertCard]}>
        <Text style={styles.cardTitle}>Alertas criticos</Text>
        <Text style={styles.cardValue}>3</Text>
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0d12',
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0048ff',
    color: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dfe3eb',
  },
  alertCard: {
    borderColor: '#d10024',
  },
  cardTitle: {
    color: '#5e6470',
    fontSize: 14,
    marginBottom: 6,
  },
  cardValue: {
    color: '#101010',
    fontSize: 28,
    fontWeight: '700',
  },
});
