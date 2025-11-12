// src/screens/Auth/ResetPasswordScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { authApi } from '../../api/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { Lock } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';

type RoutePropType = RouteProp<AuthStackParamList, 'ResetPassword'>;
type NavProp = StackNavigationProp<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen() {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavProp>();
  const { logout } = useAuthStore(); // <- use logout to clear token and return to Auth flow

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        email: route.params.email,
        newPassword,
        confirmPassword,
      });

      // Successful reset -> log the user out so app shows Auth stack (Login)
      logout();

      Alert.alert('Success', 'Password changed. Please login.', [
        {
          text: 'OK',
          onPress: () => {
            
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Reset Failed', err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Lock size={40} color="#000" />
          </View>
          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>Enter your new password for{'\n'}{route.params.email}</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Save Password</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 24 },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFD60A',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
  form: { gap: 12, marginTop: 12 },
  input: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FFD60A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
