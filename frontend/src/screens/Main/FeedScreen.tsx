import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import { BASE_URL, echoApi, Echo } from '../../api/api';
import EchoItem from '../../components/EchoItem';
import { useAuthStore } from '../../store/useAuthStore'; 

function ensureCreator(e: Echo): Echo {
  if (e.creator) return e;
  return {
    ...e,
    creator: {
      uid: 'deleted',
      username: 'Unknown',
      profilePhotoUrl: null,
    }
  };
}

export default function FeedScreen() {
  const [echos, setEchos] = useState<Echo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const pageRef = useRef<number>(1);
  const { token, isLoading } = useAuthStore(); // get token state
  const limit = 20;

  const fetchFeed = async (page = 1) => {
    try {
      if (!token) return; // don’t fetch without token
      if (page === 1) setLoading(true);

      const res = await echoApi.getFeed(page, limit);
      const results: Echo[] = res.data?.results ?? [];
      const normalized = results.map(r => ensureCreator(r));

      if (page === 1) {
        setEchos(normalized);
      } else {
        setEchos(prev => {
          const prevArr = Array.isArray(prev) ? prev : [];
          const newItems = normalized.filter(
            r => !prevArr.some(p => String(p._id) === String(r._id))
          );
          return [...prevArr, ...newItems];
        });
      }
      pageRef.current = page;
    } catch (err) {
      console.error('Feed fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // wait until token is loaded
    if (!isLoading && token) {
      fetchFeed(1);

      const socket = io(BASE_URL, {
        transports: ['websocket'],
        auth: { token }, // attach token for protected socket
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Socket connected', socket.id);
      });

      socket.on('new_echo_live', (newEcho: Echo) => {
        const normalized = ensureCreator(newEcho);
        console.log('New echo live:', normalized._id);
        setEchos(prev => {
          const prevArr = Array.isArray(prev) ? prev : [];
          if (prevArr.some(e => String(e._id) === String(normalized._id))) return prevArr;
          return [normalized, ...prevArr];
        });
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socket.on('connect_error', (err: any) => {
        console.warn('Socket connect_error', err);
      });

      return () => {
        socket.off('new_echo_live');
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [token, isLoading]); 

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeed(1);
  };

  const loadMore = () => {
    fetchFeed(pageRef.current + 1);
  };

  const handleDeleteLocal = (id: string) => {
    setEchos(prev => prev.filter(e => String(e._id) !== String(id)));
  };

  const handleUpdateLocal = (updated: Echo) => {
    const normalized = ensureCreator(updated);
    setEchos(prev =>
      prev.map(e => (String(e._id) === String(normalized._id) ? normalized : e))
    );
  };

  if (loading || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFD60A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hi 👋, Fork's</Text>
        <Text style={styles.subtitle}>Become a cheq-Mater</Text>
      </View>

      <FlatList
        data={echos}
        keyExtractor={(item) => String(item._id)}
        renderItem={({ item }) => (
          <EchoItem
            echo={item}
            onDelete={handleDeleteLocal}
            onUpdate={handleUpdateLocal}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No echos yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share your voice</Text>
          </View>
        }
        onEndReachedThreshold={0.5}
        onEndReached={loadMore}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  list: { padding: 16 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#666' },
});
