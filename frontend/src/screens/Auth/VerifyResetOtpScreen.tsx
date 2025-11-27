import React, { useEffect, useState } from 'react';
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
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { authApi } from '../../api/api';
import { StackNavigationProp } from '@react-navigation/stack';

type RoutePropType = RouteProp<AuthStackParamList, 'VerifyResetOtp'>;
type NavProp = StackNavigationProp<AuthStackParamList, 'VerifyResetOtp'>;

export default function VerifyResetOtpScreen() {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavProp>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // resend state (optional cooldown)
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // inline messages (replaces Alert)
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => {
      setResendTimer((s) => (s <= 1 ? (clearInterval(t), 0) : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const handleVerify = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!otp || otp.length !== 6) {
      setErrorMessage('Enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.verifyresetPassOtp({ email: route.params.email, otp });
      if (data.verified) {
        setSuccessMessage('OTP verified — continuing...');
        // small delay so user sees success message (optional)
        navigation.navigate('ResetPassword', { email: route.params.email, otp });
      } else {
        setErrorMessage(data.message || 'OTP verification failed');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resendLoading) return;
    setErrorMessage('');
    setSuccessMessage('');
    setResendLoading(true);
    try {
      await authApi.requestResetPassword({ email: route.params.email });
      setResendTimer(60);
      setSuccessMessage(`A new OTP has been sent to ${route.params.email}`);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Unable to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const formatTimer = (s: number) => {
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    if (mm) return `${mm}:${ss < 10 ? '0' : ''}${ss}`;
    return `${ss}s`;
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.topInputs}>
        <Text style={styles.title}>Verify Reset OTP</Text>
        <Text style={styles.subtitle}>Enter the code sent to{'\n'}{route.params?.email}</Text>

        <TextInput
          style={styles.input}
          placeholder="000000"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />

        {/* inline messages */}
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Verify & Continue</Text>}
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendTimer > 0 || resendLoading}
            style={[styles.resendButton, (resendTimer > 0 || resendLoading) && styles.resendButtonDisabled]}
          >
            {resendLoading ? <ActivityIndicator /> : <Text style={styles.resendText}>
              {resendTimer > 0 ? `Resend OTP (${formatTimer(resendTimer)})` : 'Resend OTP'}
            </Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24, justifyContent: 'center' },
  topInputs: { alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  input: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    width: '70%',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#FFD60A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '70%',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  resendButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  resendButtonDisabled: { opacity: 0.6 },
  resendText: { fontSize: 14, color: '#333' },

  /* messages */
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 14,
  },
  success: {
    color: 'green',
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 14,
  },
});
