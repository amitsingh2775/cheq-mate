import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Play } from 'lucide-react-native';
import { echoApi, Echo } from '../../api/api';
import { formatTimeRemaining } from '../../utils/time';

export default function PendingBoxScreen() {
  const navigation = useNavigation();
  const [echos, setEchos] = useState<Echo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const { data } = await echoApi.getPending();
      setEchos(data);
    } catch (error) {
      console.error('Pending fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleTriggerGoLive = async (echoId: string) => {
    try {
      await echoApi.triggerGoLive(echoId);
      Alert.alert('Success', 'Your echo is now live!');
      fetchPending();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Could not trigger go live');
    }
  };

  const renderItem = ({ item }: { item: Echo }) => {
    const timeRemaining = formatTimeRemaining(item.goLiveAt);
    const canGoLive = new Date(item.goLiveAt) <= new Date();

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🎵</Text>
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.caption} numberOfLines={2}>
              {item.caption || 'No caption'}
            </Text>
            <Text style={styles.status}>
              {item.isPublic ? 'Public' : 'Private'} • {timeRemaining}
            </Text>
          </View>
        </View>

        {canGoLive && (
          <TouchableOpacity
            style={styles.goLiveButton}
            onPress={() => handleTriggerGoLive(item._id)}
          >
            <Play size={16} color="#000" />
            <Text style={styles.goLiveText}>Go Live Now</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFD60A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ✅ Proper Back Button (Better Touch Area + Centered Header) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={26} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Pending Box</Text>

        <View style={{ width: 26 }} />
      </View>

      <FlatList
        data={echos}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No pending echos</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ✅ Better Header UI
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  backBtn: {
    padding: 4,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },

  list: {
    padding: 16,
  },

  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD60A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  iconText: {
    fontSize: 24,
  },

  cardInfo: {
    flex: 1,
  },

  caption: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  status: {
    fontSize: 14,
    color: '#666',
  },

  goLiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFD60A',
    paddingVertical: 12,
    borderRadius: 8,
  },

  goLiveText: {
    fontSize: 14,
    fontWeight: '600',
  },

  empty: {
    alignItems: 'center',
    marginTop: 100,
  },

  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
