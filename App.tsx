import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { API_URL, apiFetch } from './src/lib/api';

type Health = { status: string; database: string; timestamp: string };

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const check = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch<Health>('/health')
      .then(setHealth)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(check, [check]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AAWRO</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Backend</Text>
        <Text style={styles.url}>{API_URL}</Text>
        {loading ? (
          <ActivityIndicator style={styles.spacer} />
        ) : error ? (
          <Text style={[styles.status, styles.error]}>Unreachable: {error}</Text>
        ) : (
          <Text style={styles.status}>
            {health?.status} · MongoDB {health?.database}
          </Text>
        )}
        <Pressable style={styles.button} onPress={check}>
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 24 },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  label: { fontSize: 13, color: '#71717a' },
  url: { fontSize: 12, color: '#a1a1aa', marginTop: 2 },
  status: { fontSize: 18, fontWeight: '600', marginTop: 12 },
  error: { color: '#dc2626', fontSize: 14 },
  spacer: { marginTop: 12 },
  button: {
    marginTop: 16,
    backgroundColor: '#18181b',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
