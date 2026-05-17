import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const chartData = [
  { day: 'Lun', sessions: 120 },
  { day: 'Mar', sessions: 210 },
  { day: 'Mié', sessions: 150 },
  { day: 'Jue', sessions: 290 },
  { day: 'Vie', sessions: 420 },
  { day: 'Sáb', sessions: 550 },
  { day: 'Dom', sessions: 490 }
];

const MOCK_EVENTS = [
  { id: 1, title: 'Fiesta de la Virgen', date: '24 Ago' },
  { id: 2, title: 'Feria Gastronómica', date: '10 Sep' }
];

export default function AdminDashboardScreen({ navigation }: any) {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Turismo Santa Rosa</Text>
        <Text style={styles.subtitle}>Administrador</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Métricas Generales</Text>
        
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Ionicons name="eye-outline" size={24} color="#5dcaa5" />
            <Text style={styles.metricValue}>12.4k</Text>
            <Text style={styles.metricLabel}>Vistas</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="people-outline" size={24} color="#5dcaa5" />
            <Text style={styles.metricValue}>2.8k</Text>
            <Text style={styles.metricLabel}>Sesiones</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="calendar-outline" size={24} color="#5dcaa5" />
            <Text style={styles.metricValue}>5</Text>
            <Text style={styles.metricLabel}>Eventos</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Sesiones (Últimos 7 días)</Text>
        <View style={styles.chartContainer}>
          <View style={styles.customChart}>
            {chartData.map((data, index) => {
              // Altura máxima del contenedor = 150px
              const maxSessions = Math.max(...chartData.map(d => d.sessions));
              const barHeight = (data.sessions / maxSessions) * 150;
              
              return (
                <View key={index} style={styles.barColumn}>
                  <Text style={styles.barValue}>{data.sessions}</Text>
                  <View style={[styles.bar, { height: barHeight }]} />
                  <Text style={styles.barLabel}>{data.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AdminSolicitudesScreen')}>
            <View style={styles.actionIconBadge}>
              <Ionicons name="document-text-outline" size={24} color="#1a472a" />
              <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
            </View>
            <Text style={styles.actionText}>Solicitudes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ValidateAccountsScreen')}>
            <View style={styles.actionIconBadge}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#1a472a" />
              <View style={styles.badge}><Text style={styles.badgeText}>1</Text></View>
            </View>
            <Text style={styles.actionText}>Validar Cuentas</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Próximos Eventos</Text>
        {MOCK_EVENTS.map(ev => (
          <View key={ev.id} style={styles.eventRow}>
            <View style={styles.eventDateBox}>
              <Text style={styles.eventDate}>{ev.date}</Text>
            </View>
            <Text style={styles.eventTitle}>{ev.title}</Text>
          </View>
        ))}

      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f4f0' },
  header: { backgroundColor: '#1a472a', padding: 20, paddingTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#5dcaa5' },
  logoutBtn: { padding: 5 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#1a472a', marginTop: 10 },
  
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  metricCard: { backgroundColor: '#fff', width: '31%', padding: 15, borderRadius: 12, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  metricValue: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 8 },
  metricLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  
  chartContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 15, elevation: 2, marginBottom: 20 },
  customChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 180, paddingTop: 10 },
  barColumn: { alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barValue: { fontSize: 10, color: '#666', marginBottom: 5 },
  bar: { width: 24, backgroundColor: '#1a472a', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barLabel: { fontSize: 12, color: '#333', marginTop: 8, fontWeight: 'bold' },
  
  quickActions: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 20 },
  actionBtn: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginRight: 15, alignItems: 'center', width: 100, elevation: 2 },
  actionIconBadge: { position: 'relative', marginBottom: 8 },
  badge: { position: 'absolute', top: -5, right: -10, backgroundColor: '#dc3545', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  actionText: { fontSize: 12, color: '#333', textAlign: 'center', fontWeight: 'bold' },
  
  eventRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 1 },
  eventDateBox: { backgroundColor: '#e9f5f0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginRight: 15 },
  eventDate: { color: '#1a472a', fontWeight: 'bold', fontSize: 12 },
  eventTitle: { fontSize: 14, color: '#333', fontWeight: '600', flex: 1 }
});
