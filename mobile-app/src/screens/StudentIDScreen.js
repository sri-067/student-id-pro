import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export default function StudentIDScreen() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/student-portal/profile`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStudent(response.data);
    } catch (error) {
      console.error('Failed to fetch student data:', error);
    }
  };

  if (!student) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Digital Student ID</Text>
        </View>
        
        <View style={styles.photoContainer}>
          <Image 
            source={{ uri: student.photo }} 
            style={styles.photo}
            // defaultSource={require('../../assets/default-avatar.png')}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.regNo}>Reg No: {student.regNo}</Text>
          <Text style={styles.department}>{student.department}</Text>
          <Text style={styles.year}>Year: {student.year}</Text>
        </View>

        <View style={styles.qrContainer}>
          <Image 
            source={{ uri: student.qrCode }} 
            style={styles.qrCode}
          />
          <Text style={styles.qrText}>Scan for verification</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Valid until: {new Date(student.cardExpiry).toLocaleDateString()}</Text>
          <Text style={styles.footerText}>Status: {student.status}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#2196F3',
  },
  info: {
    alignItems: 'center',
    marginBottom: 30,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  regNo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  department: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  year: {
    fontSize: 16,
    color: '#666',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCode: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  qrText: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
});