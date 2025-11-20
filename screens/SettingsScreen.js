import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen({ navigation }) {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [vibration, setVibration] = useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          // TODO: Clear user session
          navigation.replace('Onboarding');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deleted', 'Your account has been deleted');
            navigation.replace('Onboarding');
          },
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, showChevron = true }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={22} color="#0091EA" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showChevron && <Ionicons name="chevron-forward" size={20} color="#999" />}
    </TouchableOpacity>
  );

  const SettingToggle = ({ icon, title, subtitle, value, onValueChange }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={22} color="#0091EA" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D1D1D1', true: '#B3E5FC' }}
        thumbColor={value ? '#0091EA' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0091EA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={40} color="#0091EA" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Parent Name</Text>
            <Text style={styles.profileEmail}>parent@email.com</Text>
          </View>
        </View>

        {/* Account Settings */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.settingsGroup}>
          <SettingItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => navigation.navigate('ParentAccount')}
          />
        </View>

        

        {/* Danger Zone */}
        <Text style={styles.sectionTitle}>Logout</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity
            style={[styles.settingItem, styles.dangerItem]}
            onPress={handleLogout}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, styles.dangerIcon]}>
                <Ionicons name="log-out-outline" size={22} color="#FF5252" />
              </View>
              <Text style={[styles.settingTitle, styles.dangerText]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF5252" />
          </TouchableOpacity>

          
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            LittleWatch © 2025{'\n'}USTP Cagayan de Oro
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E6F7FF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#0091EA' },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 20 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 4 },
  profileEmail: { fontSize: 14, color: '#999' },
  editProfileButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#666', marginBottom: 12, marginTop: 8 },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 2 },
  settingSubtitle: { fontSize: 13, color: '#999' },
  dangerItem: { backgroundColor: '#FFF5F5' },
  dangerIcon: { backgroundColor: '#FFEBEE' },
  dangerText: { color: '#FF5252' },
  footer: { alignItems: 'center', paddingVertical: 30 },
  footerText: { fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 18 },
});
