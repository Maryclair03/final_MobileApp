import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function VitalsTimelineScreen({ navigation }) {
  const [selectedPeriod, setSelectedPeriod] = useState('24H');

  // Sample timeline data - replace with real Firebase data
  const timelineData = [
    {
      time: '7:00 AM',
      date: 'Today',
      vitals: {
        sleepDuration: '7.2 hrs',
        heartRate: 108,
        temperature: 36.5,
        oxygen: 97,
        movement: 'Sleep'
      }
    },
    {
      time: '9:00 AM',
      date: 'Today',
      vitals: {
        heartRate: 110,
        temperature: 36.6,
        oxygen: 98,
        movement: 'Resting'
      }
    },
    {
      time: '12:00 PM',
      date: 'Today',
      vitals: {
        heartRate: 115,
        temperature: 36.7,
        oxygen: 97,
        movement: 'Active'
      }
    },
    {
      time: '2:30 PM',
      date: 'Today',
      vitals: {
        heartRate: 120,
        temperature: 36.8,
        oxygen: 98,
        movement: 'Active'
      }
    },
  ];

  const periods = ['24H', '1W', '1M'];

  const VitalItem = ({ icon, label, value, unit, color }) => (
    <View style={styles.vitalItem}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.vitalItemLabel}>{label}:</Text>
      <Text style={[styles.vitalItemValue, { color }]}>{value}{unit}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0091EA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vitals Timeline</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color="#0091EA" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary ({selectedPeriod})</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Ionicons name="moon-outline" size={20} color="#3F51B5" />
              <Text style={styles.summaryLabel}>Avg Sleep</Text>
              <Text style={styles.summaryValue}>7.1 hrs</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="heart" size={20} color="#0091EA" />
              <Text style={styles.summaryLabel}>Avg Heart Rate</Text>
              <Text style={styles.summaryValue}>113 BPM</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="thermometer" size={20} color="#FF9800" />
              <Text style={styles.summaryLabel}>Avg Temperature</Text>
              <Text style={styles.summaryValue}>36.7°C</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="water" size={20} color="#00BCD4" />
              <Text style={styles.summaryLabel}>Avg Oxygen</Text>
              <Text style={styles.summaryValue}>97.5%</Text>
            </View>
          </View>
        </View>

        

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Timeline History</Text>
          {timelineData.map((entry, index) => (
            <View key={index} style={styles.timelineCard}>
              <View style={styles.timelineHeader}>
                <View style={styles.timelineTime}>
                  <Ionicons name="time" size={16} color="#0091EA" />
                  <Text style={styles.timelineTimeText}>{entry.time}</Text>
                </View>
                <Text style={styles.timelineDate}>{entry.date}</Text>
              </View>
              <View style={styles.timelineVitals}>
                {entry.vitals.sleepDuration && (
                  <VitalItem 
                    icon="moon-outline" 
                    label="Sleep" 
                    value={entry.vitals.sleepDuration} 
                    unit=""
                    color="#3F51B5"
                  />
                )}
                <VitalItem 
                  icon="heart" 
                  label="HR" 
                  value={entry.vitals.heartRate} 
                  unit=" BPM"
                  color="#0091EA"
                />
                <VitalItem 
                  icon="thermometer" 
                  label="Temp" 
                  value={entry.vitals.temperature} 
                  unit="°C"
                  color="#FF9800"
                />
                <VitalItem 
                  icon="water" 
                  label="SpO₂" 
                  value={entry.vitals.oxygen} 
                  unit="%"
                  color="#00BCD4"
                />
                <VitalItem 
                  icon="body" 
                  label="Move" 
                  value={entry.vitals.movement} 
                  unit=""
                  color="#9C27B0"
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F7FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0091EA',
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 26,
  },
  periodButtonActive: {
    backgroundColor: '#0091EA',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  graphCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  graphPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  graphPlaceholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  timelineSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timelineTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineTimeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  timelineDate: {
    fontSize: 13,
    color: '#999',
  },
  timelineVitals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  vitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  vitalItemLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  vitalItemValue: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
});
