// src/screens/ProfileScreen.tsx
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/MainTabs';
import { useAuthStore } from '../../store/useAuthStore';
import { Clock, LogOut, Library } from 'lucide-react-native';   // ✅ ADDED Library icon

type ProfileScreenNavigationProp = StackNavigationProp<
  ProfileStackParamList,
  'ProfileMain'
>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {user?.profilePhotoUrl ? (
              <Image
                source={{ uri: user.profilePhotoUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {user?.username?.[0]?.toUpperCase() || '?'}
              </Text>
            )}
          </View>
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* ✅ Pending Box */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('PendingBox')}
        >
          <View style={styles.menuIcon}>
            <Clock size={24} color="#000" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Pending Box</Text>
            <Text style={styles.menuSubtext}>View your scheduled echos</Text>
          </View>
        </TouchableOpacity>

        {/* ✅ My Records (Updated Icon Here) */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('MyRecords')}
        >
          <View style={styles.menuIcon}>
            <Library size={24} color="#000" />   {/* ✅ NEW ICON */}
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>My Records</Text>
            <Text style={styles.menuSubtext}>View all your posts</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#ff3b30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: { fontSize: 28, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  profileCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD60A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { fontSize: 32, fontWeight: 'bold' },
  username: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 14, color: '#666' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 16,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  menuSubtext: { fontSize: 14, color: '#666' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff3b30',
    marginTop: 'auto',
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#ff3b30' },
});
