// src/screens/Auth/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { authApi } from '../../api/api';
import { useAuthStore } from '../../store/useAuthStore';
import { navigateToNested } from '@/navigation/RootNavigation';
import Toast from 'react-native-toast-message';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { setToken, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  
  const showToast = (
    message: string,
    options?: Partial<{ type: 'success' | 'error' | 'info'; duration: number; position: 'top' | 'bottom'; text2: string }>
  ) => {
    Toast.show({
      type: options?.type ?? 'info',
      text1: message,
      text2: options?.text2,
      visibilityTime: options?.duration ?? 4000,
      position: options?.position ?? 'bottom',
      autoHide: true,
      topOffset: 50,
      bottomOffset: 40,
    });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Please fill all fields', { type: 'error', duration: 3000 });
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      await setToken(data.token);
      setUser(data.user);

      
      showToast('Login successful', { type: 'success', duration: 1500 });
      
      navigateToNested('Main', 'Feed');
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || 'Something went wrong';
      showToast(`Login Failed: ${errMsg}`, { type: 'error', duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>🎧</Text>
          </View>
          <Text style={styles.title}>CheqMate</Text>
          <Text style={styles.subtitle}>Share your voice with the world</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.forgotPassContainer}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPassText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.link}>
              Don't have an account? <Text style={styles.linkBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD60A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
  },
  forgotPassContainer: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 8,
  },
  forgotPassText: {
    color: '#666',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#FFD60A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
  },
  linkBold: {
    fontWeight: '600',
    color: '#000',
  },
});
