import { useState } from 'react';
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
  const [loading, setLoading] = useState(false);

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

      await echoApi.createEcho(formData);

      Alert.alert(
        'Success',
        '',
        [{ text: 'OK', onPress: () => navigation.navigate('RecordMain') }]
      );
    } catch (error: any) {
      Alert.alert('Upload Failed', error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

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

        <View style={styles.info}>
          <Text style={styles.infoText}>⏰ Your echo will go live in 24 hours</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handlePost}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
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
    marginBottom: 24,
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
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
