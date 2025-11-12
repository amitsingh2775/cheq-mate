
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import VerifyOtpScreen from '../screens/Auth/VerifyOtpScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import VerifyResetOtpScreen from '../screens/Auth/VerifyResetOtpScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  VerifyOtp: { email: string };
  ForgotPassword: undefined;
  VerifyResetOtp: { email: string };
  ResetPassword: { email: string; otp?: string };
};

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      {/* <Stack.Screen name="VerifyResetOtp" component={VerifyResetOtpScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} /> */}
    </Stack.Navigator>
  );
}
