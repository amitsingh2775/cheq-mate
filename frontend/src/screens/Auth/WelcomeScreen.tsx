import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { ArrowRight, Mic, Users, Zap, Music } from 'lucide-react-native';
import { AuthStackParamList } from '@/navigation/AuthStack'; // path adjust if needed

type AuthNavProp = StackNavigationProp<AuthStackParamList, 'Signup'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<AuthNavProp>();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const featureFadeAnim = useRef(new Animated.Value(0)).current;
  const featureSlideAnim = useRef(new Animated.Value(30)).current;

  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(featureFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(featureSlideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });

    const createWaveAnimation = (waveAnim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const wave1Anim = createWaveAnimation(wave1, 0);
    const wave2Anim = createWaveAnimation(wave2, 500);
    const wave3Anim = createWaveAnimation(wave3, 1000);

    wave1Anim.start();
    wave2Anim.start();
    wave3Anim.start();

    return () => {
      wave1Anim.stop();
      wave2Anim.stop();
      wave3Anim.stop();
    };
  }, [fadeAnim, slideAnim, scaleAnim, featureFadeAnim, featureSlideAnim, wave1, wave2, wave3]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.headerBlock,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.logoCircle}>
              <Animated.View
                style={[
                  styles.wave,
                  styles.wave1,
                  {
                    opacity: wave1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0],
                    }),
                    transform: [
                      {
                        scale: wave1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.8],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.wave,
                  styles.wave2,
                  {
                    opacity: wave2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0],
                    }),
                    transform: [
                      {
                        scale: wave2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.8],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.wave,
                  styles.wave3,
                  {
                    opacity: wave3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0],
                    }),
                    transform: [
                      {
                        scale: wave3.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.8],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <View style={styles.logoInner}>
                <Music size={60} color="#FFD60A" strokeWidth={2} />
              </View>
            </View>
          </Animated.View>

          <Text style={styles.title}>Welcome to CheQmate</Text>
          <Text style={styles.subtitle}>Your audio community</Text>
          <Text style={styles.description}>
            Record, share, and connect with audio moments that matter
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.featuresContainer,
            {
              opacity: featureFadeAnim,
              transform: [{ translateY: featureSlideAnim }],
            },
          ]}
        >
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Mic size={28} color="#FFD60A" strokeWidth={2.5} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Record & Share</Text>
              <Text style={styles.featureText}>
                Capture your moments in crystal clear audio
              </Text>
            </View>
          </View>

         

          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Zap size={28} color="#FFD60A" strokeWidth={2.5} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Go Live</Text>
              <Text style={styles.featureText}>Schedule or publish instantly</Text>
            </View>
          </View>
        </Animated.View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => {
            if (navigation && typeof navigation.navigate === 'function') {
              navigation.navigate('Signup');
            } else {
              console.warn('Navigation not ready');
            }
          }}
        >
          <Text style={styles.nextButtonText}>Get Started</Text>
          <ArrowRight size={20} color="#000" strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Join thousands of voices sharing their stories
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  headerBlock: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFD60A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  wave: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#FFD60A',
  },
  wave1: {
    borderWidth: 2,
  },
  wave2: {
    borderWidth: 2.5,
  },
  wave3: {
    borderWidth: 2,
  },
  logoInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 340,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 18,
    alignItems: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  featureIconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD60A',
  },
  featureContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  featureText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  nextButton: {
    width: '100%',
    backgroundColor: '#FFD60A',
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
});
