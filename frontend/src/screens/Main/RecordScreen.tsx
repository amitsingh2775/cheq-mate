// src/screens/Main/RecordScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RecordStackParamList } from '../../navigation/MainTabs';
import { Audio } from 'expo-av';
import { Mic, Square, Play, Pause, RotateCcw, ArrowRight } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

type RecordScreenNavigationProp = StackNavigationProp<RecordStackParamList, 'RecordMain'>;

export default function RecordScreen() {
  const navigation = useNavigation<RecordScreenNavigationProp>();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (err) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to get audio permissions', visibilityTime: 3000 });
      }
    })();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // eslint-disable-line

  const startRecording = async () => {
    try {
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setDuration(0);

      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      newRecording.setOnRecordingStatusUpdate((status) => {
        if (!status.isRecording) {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to start recording', visibilityTime: 3000 });
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setRecordedUri(uri ?? null);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to stop recording', visibilityTime: 3000 });
    }
  };

  const playRecording = async () => {
    if (!recordedUri) return;

    try {
      if (isPlaying && sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recordedUri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to play recording', visibilityTime: 3000 });
    }
  };

  const resetRecording = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
    } catch (_e) {
      // ignore unload errors
    }
    setRecordedUri(null);
    setIsPlaying(false);
    setDuration(0);
  };

  const handleNext = () => {
    if (!recordedUri) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please record audio first', visibilityTime: 2500 });
      return;
    }
    navigation.navigate('CreatePost', { audioUri: recordedUri });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Record Echo</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.recordingContainer}>
          {recording ? (
            <>
              <View style={styles.recordingIndicator}>
                <View style={styles.pulse} />
              </View>
              <Text style={styles.timer}>{formatTime(duration)}</Text>
            </>
          ) : recordedUri ? (
            <>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>🎵</Text>
              </View>
              <Text style={styles.status}>Recording ready</Text>
            </>
          ) : (
            <>
              <View style={styles.iconCircle}>
                <Mic size={48} color="#666" />
              </View>
              <Text style={styles.status}>Tap to record</Text>
            </>
          )}
        </View>

        <View style={styles.controls}>
          {!recording && !recordedUri && (
            <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
              <Mic size={32} color="#000" />
            </TouchableOpacity>
          )}

          {recording && (
            <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
              <Square size={32} color="#fff" fill="#fff" />
            </TouchableOpacity>
          )}

          {recordedUri && (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={playRecording}>
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={resetRecording}>
                <RotateCcw size={24} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextText}>Next</Text>
                <ArrowRight size={20} color="#000" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 40,
  },
  recordingContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 60,
  },
  recordingIndicator: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFD60A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff3b30',
  },
  timer: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 18,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD60A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFD60A',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 28,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
