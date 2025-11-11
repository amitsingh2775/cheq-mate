// src/components/EchoItem.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Alert,
} from 'react-native';
import { Echo, echoApi } from '../api/api';
import { useAudioPlayer } from './AudioPlayer';
import { Play, Pause, MoreVertical } from 'lucide-react-native';
import { formatRelativeTime } from '../utils/time';
import { useAuthStore } from '../store/useAuthStore';

interface EchoItemProps {
  echo: Echo;
  onDelete?: (id: string) => void;
  onUpdate?: (updated: Echo) => void;
}

export default function EchoItem({ echo, onDelete, onUpdate }: EchoItemProps) {
  const { isPlaying, togglePlayPause } = useAudioPlayer(echo.audioUrl, echo._id);
  const authUser = useAuthStore((s) => s.user);

  const isOwner = !!authUser && !!echo.creator && authUser.uid === echo.creator.uid;

  const [menuVisible, setMenuVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [captionInput, setCaptionInput] = useState(echo.caption ?? '');
  const [loading, setLoading] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleMenuPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setMenuVisible((v) => !v);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await echoApi.deleteEcho(echo._id);
              onDelete?.(echo._id);
            } catch (err) {
              console.error('Delete error:', err);
              Alert.alert('Error', 'Could not delete post. Try again.');
            } finally {
              setLoading(false);
              setMenuVisible(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditStart = () => {
    setCaptionInput(echo.caption ?? '');
    setEditing(true);
    setMenuVisible(false);
  };

  const handleSaveEdit = async () => {
    if ((echo.caption ?? '') === captionInput) {
      setEditing(false);
      return;
    }

    try {
      setLoading(true);
      const res = await echoApi.updateCaption(echo._id, { caption: captionInput });
      const updatedEcho: Echo = (res as any).data ?? { ...echo, caption: captionInput };
      onUpdate?.(updatedEcho);
      setEditing(false);
    } catch (err) {
      console.error('Update caption error:', err);
      Alert.alert('Error', 'Could not update caption. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {echo.creator?.profilePhotoUrl ? (
            <Image
              source={{ uri: echo.creator.profilePhotoUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarText}>
              {(echo.creator?.username?.[0] ?? '?').toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.username}>{echo.creator?.username ?? 'Unknown'}</Text>
          <Text style={styles.time}>{formatRelativeTime(echo.goLiveAt)}</Text>
        </View>

        {isOwner && (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[styles.menuButton, menuVisible && styles.menuButtonActive]}
              onPress={handleMenuPress}
              activeOpacity={0.7}
            >
              <MoreVertical size={20} color={menuVisible ? '#FFD60A' : '#666'} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {echo.caption && !editing && <Text style={styles.caption}>{echo.caption}</Text>}

      {editing && (
        <View style={styles.editor}>
          <TextInput
            value={captionInput}
            onChangeText={setCaptionInput}
            placeholder="Edit caption..."
            style={styles.input}
            multiline
          />
          <View style={styles.editorRow}>
            <TouchableOpacity onPress={() => setEditing(false)} style={styles.outlineBtn}>
              <Text style={styles.outlineBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSaveEdit} style={styles.primaryBtn} disabled={loading}>
              {loading ? <ActivityIndicator /> : <Text style={styles.primaryBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.playButton}
        onPress={togglePlayPause}
        activeOpacity={0.8}
      >
        {isPlaying ? <Pause size={24} color="#000" /> : <Play size={24} color="#000" />}

        <View style={styles.waveform}>
          <View style={[styles.bar, { height: 12 }]} />
          <View style={[styles.bar, { height: 20 }]} />
          <View style={[styles.bar, { height: 16 }]} />
          <View style={[styles.bar, { height: 24 }]} />
          <View style={[styles.bar, { height: 18 }]} />
          <View style={[styles.bar, { height: 14 }]} />
        </View>
      </TouchableOpacity>

      {menuVisible && (
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={handleEditStart}>
            <Text style={styles.menuItemText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
            <Text style={[styles.menuItemText, { color: '#d00' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD60A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuButtonActive: {
    backgroundColor: '#2a2a2a',
  },
  caption: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  bar: {
    width: 3,
    backgroundColor: '#FFD60A',
    borderRadius: 2,
  },
  menu: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 120,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editor: {
    marginVertical: 8,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
  },
  input: {
    minHeight: 40,
    maxHeight: 140,
    marginBottom: 8,
  },
  editorRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#FFD60A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  primaryBtnText: {
    fontWeight: '600',
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  outlineBtnText: {},
});
