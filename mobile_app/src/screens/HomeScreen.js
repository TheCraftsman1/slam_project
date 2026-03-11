import React, { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function HomeScreen() {
  const [aqi, setAqi] = useState(150); // Hardcoded for now
  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Clean Air App</Text>
      
      <View style={styles.aqiCard}>
        <Text style={styles.aqiText}>AQI: {aqi}</Text>
        <Text style={styles.statusDescription}>Unhealthy</Text>
      </View>

      <Button title="Hold to Speak to EcoBot" onPress={() => console.log('Voice activated')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  aqiCard: { padding: 30, backgroundColor: '#ff9900', borderRadius: 15, marginBottom: 20 },
  aqiText: { fontSize: 40, color: 'white', fontWeight: 'bold' },
  statusDescription: { fontSize: 18, color: 'white', textAlign: 'center' }
});
