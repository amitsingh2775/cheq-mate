import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { echoApi, Echo } from '../../api/api';
import EchoItem from '../../components/EchoItem';

export default function PendingBoxScreen() {
  const navigation = useNavigation();
  const [echos, setEchos] = useState<Echo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

 
  const fetchPendingEchos = async () => {
    try {
      setLoading(true);
      const res = await echoApi.getPending();
      const data = res.data.results ?? res.data;
      setEchos(data);
    } catch (error) {
      console.error('Failed to fetch pending echos:', error);
      Alert.alert('Error', 'Unable to load pending echos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingEchos();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingEchos();
  };

  const handleDeleteLocal = (id: string) => {
    setEchos(prev => prev.filter(e => String(e._id) !== String(id)));
  };

  const handleUpdateLocal = (updated: Echo) => {
    setEchos(prev =>
      prev.map(e => (String(e._id) === String(updated._id) ? updated : e))
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
        renderItem={({ item }) => (
          <EchoItem
            echo={item}
            onDelete={handleDeleteLocal}
            onUpdate={handleUpdateLocal}
            showPendingStatus
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No pending echos found.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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

  backBtn: { padding: 4 },

  title: { fontSize: 20, fontWeight: '700', color: '#000' },

  list: { paddingHorizontal: 16, paddingTop: 10 },

  empty: { alignItems: 'center', marginTop: 80 },

  emptyText: { fontSize: 16, color: '#666' },
});
