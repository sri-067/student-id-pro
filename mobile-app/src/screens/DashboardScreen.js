import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function DashboardScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Dashboard</Text>
      
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('StudentID')}
      >
        <Text style={styles.cardTitle}>📱 My Digital ID</Text>
        <Text style={styles.cardText}>View your student ID card</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('Scanner')}
      >
        <Text style={styles.cardTitle}>📷 QR Scanner</Text>
        <Text style={styles.cardText}>Scan student QR codes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: '#333' },
  card: { backgroundColor: 'white', padding: 20, marginBottom: 15, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  cardText: { fontSize: 14, color: '#666' }
});