import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import { useAuthStore } from '../store/useAuthStore';
import { rootNavigationRef } from './RootNavigation';

const Root = createStackNavigator();

export default function RootNavigator() {
  const { token, isLoading, checkAuth } = useAuthStore();

 
  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) return null; 
  return (
    <NavigationContainer ref={rootNavigationRef}>
      {token ? (
        <Root.Navigator screenOptions={{ headerShown: false }}>
          <Root.Screen name="Main" component={MainTabs} />
        </Root.Navigator>
      ) : (
        <Root.Navigator screenOptions={{ headerShown: false }}>
          <Root.Screen name="Auth" component={AuthStack} />
        </Root.Navigator>
      )}
    </NavigationContainer>
  );
}
