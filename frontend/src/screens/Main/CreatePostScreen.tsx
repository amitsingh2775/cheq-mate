// src/screens/Main/CreatePostScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RecordStackParamList } from '../../navigation/MainTabs';
import { echoApi } from '../../api/api';
import { ArrowLeft } from 'lucide-react-native';

type CreatePostScreenRouteProp = RouteProp<RecordStackParamList, 'CreatePost'>;
type CreatePostScreenNavigationProp = StackNavigationProp<RecordStackParamList, 'CreatePost'>;

export default function CreatePostScreen() {
  const route = useRoute<CreatePostScreenRouteProp>();
  const navigation = useNavigation<CreatePostScreenNavigationProp>();
  const [caption, setCaption] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [goLiveLater, setGoLiveLater] = useState(true);
  const [loading, setLoading] = useState(false);

  // --- Animated loader values ---
  const bounce1 = useRef(new Animated.Value(0)).current;
  const bounce2 = useRef(new Animated.Value(0)).current;
  const bounce3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let anim1: Animated.CompositeAnimation | null = null;
    let anim2: Animated.CompositeAnimation | null = null;
    let anim3: Animated.CompositeAnimation | null = null;

    if (loading) {
      const createBounce = (animatedValue: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animatedValue, {
              toValue: -8,
              duration: 300,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 0,
              duration: 300,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        );

      anim1 = createBounce(bounce1, 0);
      anim2 = createBounce(bounce2, 120);
      anim3 = createBounce(bounce3, 240);

      anim1.start();
      anim2.start();
      anim3.start();
    }

    return () => {
      anim1?.stop();
      anim2?.stop();
      anim3?.stop();
      // reset values
      bounce1.setValue(0);
      bounce2.setValue(0);
      bounce3.setValue(0);
    };
  }, [loading, bounce1, bounce2, bounce3]);

  const handlePost = async () => {
    const { audioUri } = route.params;

    setLoading(true);
    try {
      const formData = new FormData();

      formData.append('audio', {
        uri: audioUri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      } as any);

      formData.append('isPublic', isPublic ? 'true' : 'false');
      formData.append('caption', caption);
      formData.append('goLiveLater', goLiveLater ? 'true' : 'false');

      await echoApi.createEcho(formData);

      Alert.alert(
        'Success',
        goLiveLater ? 'Your echo is scheduled and will go live after 24 hours.' : 'Your echo is live now!',
        [{ text: 'OK', onPress: () => navigation.navigate('RecordMain') }]
      );
    } catch (error: any) {
      Alert.alert('Upload Failed', error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Loader UI (3 yellow bouncing dots)
  const Loader = () => (
    <View style={styles.loaderContainer}>
      <Animated.View style={[styles.dot, { transform: [{ translateY: bounce1 }] }]} />
      <Animated.View style={[styles.dot, { transform: [{ translateY: bounce2 }] }]} />
      <Animated.View style={[styles.dot, { transform: [{ translateY: bounce3 }] }]} />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Post</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Add a caption..."
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={200}
        />

        <View style={styles.option}>
          <View>
            <Text style={styles.optionLabel}>Public Echo</Text>
            <Text style={styles.optionSubtext}>
              {isPublic ? 'Everyone can see this' : 'Only you can see this'}
            </Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: '#ccc', true: '#FFD60A' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.option}>
          <View>
            <Text style={styles.optionLabel}>Go live after 24 hours</Text>
            <Text style={styles.optionSubtext}>
              {goLiveLater ? 'Will appear in feed after 24 hours' : 'Will go live instantly'}
            </Text>
          </View>
          <Switch
            value={goLiveLater}
            onValueChange={setGoLiveLater}
            trackColor={{ false: '#ccc', true: '#FFD60A' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.infoText}>
            {goLiveLater
              ? '⏰ This echo will be scheduled and visible after 24 hours.'
              : '⚡ This echo will be visible immediately.'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handlePost}
          disabled={loading}
        >
          {loading ? (
            <Loader />
          ) : (
            <Text style={styles.buttonText}>Post Echo</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtext: {
    fontSize: 14,
    color: '#666',
  },
  info: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#FFD60A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.9,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },


  loaderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 28,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 9 / 2,
    backgroundColor: 'white',
    marginHorizontal: 6,
  },
});
