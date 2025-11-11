import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { BASE_URL } from '../api/api';

let currentSound: Audio.Sound | null = null;
let currentEchoId: string | null = null;

export function useAudioPlayer(audioUrl: string, echoId: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (currentEchoId !== echoId) {
      setIsPlaying(false);
    }
  }, [currentEchoId]);

  const togglePlayPause = async () => {
    try {
      if (currentSound && currentEchoId !== echoId) {
        await currentSound.pauseAsync();
        currentEchoId = null;
      }

      if (soundRef.current && currentEchoId === echoId) {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
      } else {
        const fullUrl = audioUrl.startsWith('http') ? audioUrl : `${BASE_URL}${audioUrl}`;

        const { sound } = await Audio.Sound.createAsync(
          { uri: fullUrl },
          { shouldPlay: true }
        );

        soundRef.current = sound;
        currentSound = sound;
        currentEchoId = echoId;
        setIsPlaying(true);

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            currentEchoId = null;
          }
        });
      }
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  };

  return { isPlaying, togglePlayPause };
}
