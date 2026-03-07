import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';

import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';
import { LocalStorageService, Patient as LocalPatient } from '@/services/localStorage';

interface Patient {
  id: number;
  name: string;
  bed_number: string;
  created_at: string;
}

export default function PatientsScreen() {
  const { theme, isDark } = useTheme();
  const router = useSafeRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editName, setEditName] = useState('');
  const [editBedNumber, setEditBedNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const patientsData = await LocalStorageService.getPatients();
      setPatients(patientsData.map(p => ({ ...p, created_at: new Date().toISOString() })));
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const query = searchQuery.toLowerCase().trim();
    return patients.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.bed_number.toLowerCase().includes(query)
    );
  }, [patients, searchQuery]);

  const viewPatientHistory = (patient: Patient) => {
    router.push('/patient-history', { patientId: patient.id, patientName: patient.name });
  };

  const openEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setEditName(patient.name);
    setEditBedNumber(patient.bed_number);
    setEditModalVisible(true);
  };

  const handleSavePatient = async () => {
    if (!editName.trim() || !editBedNumber.trim()) {
      Alert.alert('错误', '请填写所有必填字段');
      return;
    }

    try {
      await LocalStorageService.updatePatient(editingPatient!.id, {
        name: editName.trim(),
        bed_number: editBedNumber.trim(),
      });
      setEditModalVisible(false);
      setEditingPatient(null);
      fetchPatients();
    } catch (error) {
      console.error('Failed to save patient:', error);
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  const deletePatient = async (patient: Patient) => {
    Alert.alert('确认删除', `确定要删除病人"${patient.name}"吗？相关的任务记录也会被删除。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await LocalStorageService.deletePatient(patient.id);
            fetchPatients();
          } catch (error) {
            console.error('Failed to delete patient:', error);
            Alert.alert('错误', '删除失败，请重试');
          }
        },
      },
    ]);
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <View style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText variant="h3" color={theme.textPrimary}>
            病人档案
          </ThemedText>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={fetchPatients}
          >
            <FontAwesome6 name="rotate" size={16} color={theme.primary} />
          </TouchableOpacity>
        </ThemedView>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <FontAwesome6 name="magnifying-glass" size={16} color={theme.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="搜索病人姓名或床号..."
              placeholderTextColor={theme.textMuted}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <FontAwesome6 name="xmark" size={14} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView 
          style={styles.patientList}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          {loading ? (
            <View style={styles.emptyContainer}>
              <ThemedText color={theme.textMuted}>加载中...</ThemedText>
            </View>
          ) : filteredPatients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="users" size={40} color={theme.textMuted} />
              <ThemedText style={styles.emptyText} color={theme.textMuted}>
                {searchQuery ? '未找到匹配的病人' : '暂无病人'}
              </ThemedText>
            </View>
          ) : (
            filteredPatients.map((patient) => (
              <TouchableOpacity
                key={patient.id}
                style={styles.patientItem}
                onPress={() => viewPatientHistory(patient)}
              >
                <View style={styles.patientLeft}>
                  <View style={styles.bedBadge}>
                    <ThemedText variant="caption" style={styles.bedNumber} color={theme.buttonPrimaryText}>
                      {patient.bed_number}
                    </ThemedText>
                  </View>
                  <ThemedText variant="body" color={theme.textPrimary} style={styles.patientName}>
                    {patient.name}
                  </ThemedText>
                </View>
                <View style={styles.patientRight}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      openEditPatient(patient);
                    }}
                  >
                    <FontAwesome6 name="pen" size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      deletePatient(patient);
                    }}
                  >
                    <FontAwesome6 name="trash" size={14} color="#EF4444" />
                  </TouchableOpacity>
                  <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <Modal
          visible={editModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ThemedView level="default" style={styles.modalBody}>
                <View style={styles.modalHeader}>
                  <ThemedText variant="h4">编辑病人</ThemedText>
                  <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                    <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <ThemedText variant="caption" color={theme.textSecondary} style={styles.label}>
                    病人姓名 *
                  </ThemedText>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="请输入病人姓名"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                <View style={styles.formGroup}>
                  <ThemedText variant="caption" color={theme.textSecondary} style={styles.label}>
                    床号 *
                  </ThemedText>
                  <TextInput
                    style={styles.input}
                    value={editBedNumber}
                    onChangeText={setEditBedNumber}
                    placeholder="请输入床号"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <ThemedText style={styles.cancelButtonText} color={theme.textSecondary}>
                      取消
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleSavePatient}
                  >
                    <ThemedText style={styles.confirmButtonText} color={theme.buttonPrimaryText}>
                      保存
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </ThemedView>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}
