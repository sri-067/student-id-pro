import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [regNo, setRegNo] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (regNo && password) {
      navigation.navigate('Dashboard');
    } else {
      Alert.alert('Error', 'Please enter registration number and password');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student ID Pro</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Registration Number"
        value={regNo}
        onChangeText={setRegNo}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 40, color: '#333' },
  input: { backgroundColor: 'white', padding: 15, marginBottom: 15, borderRadius: 8, fontSize: 16 },
  button: { backgroundColor: '#2196F3', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});