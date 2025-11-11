import { useEffect, useState } from 'react';
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
import { useRoute, RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { authApi } from '../../api/api';
import { useAuthStore } from '../../store/useAuthStore';

type VerifyOtpScreenRouteProp = RouteProp<AuthStackParamList, 'VerifyOtp'>;

export default function VerifyOtpScreen() {
  const route = useRoute<VerifyOtpScreenRouteProp>();
  const { setToken, setUser } = useAuthStore();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // New states for resend
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0); // seconds remaining

  // Start a countdown effect when resendTimer > 0
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => {
      setResendTimer((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp({ email: route.params.email, otp });
      await setToken(data.token);
      setUser(data.user);
      // optionally navigate to app home here if you use navigation
    } catch (error: any) {
      Alert.alert('Verification Failed', error.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    // If timer running, do nothing (button disabled in UI anyway)
    if (resendTimer > 0 || resendLoading) return;

    setResendLoading(true);
    try {
      await authApi.resendOtp({ email: route.params.email });
      // On success, start timer (e.g., 60 seconds)
      setResendTimer(60);
      Alert.alert('OTP Sent', `A new OTP has been sent to ${route.params.email}`);
    } catch (error: any) {
      Alert.alert('Resend Failed', error.response?.data?.error || 'Unable to resend OTP. Try again later.');
    } finally {
      setResendLoading(false);
    }
  };

  // Helper to format timer like mm:ss or just seconds
  const formatTimer = (s: number) => {
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    if (mm > 0) return `${mm}:${ss < 10 ? '0' : ''}${ss}`;
    return `${ss}s`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>✉️</Text>
          </View>
          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            {route.params.email}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="000000"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>

          {/* Resend section */}
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.resendButton, (resendTimer > 0 || resendLoading) && styles.resendButtonDisabled]}
              onPress={handleResend}
              disabled={resendTimer > 0 || resendLoading}
            >
              {resendLoading ? (
                <ActivityIndicator />
              ) : (
                <Text style={[styles.resendText, (resendTimer > 0 || resendLoading) && { opacity: 0.6 }]}>
                  {resendTimer > 0 ? `Resend OTP (${formatTimer(resendTimer)})` : 'Resend OTP'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: {
    backgroundColor: '#FFD60A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendText: {
    fontSize: 14,
    color: '#333',
  },
});
