import React, { useState, useCallback, useMemo } from 'react';
import { View, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';

import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';

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

  const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';

  // 加载病人列表
  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/patients`);
      const result = await response.json();

      if (result.success) {
        setPatients(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  }, [EXPO_PUBLIC_BACKEND_BASE_URL]);

  React.useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // 查看病人历史记录
  const viewPatientHistory = (patient: Patient) => {
    router.push('/patient-history', { patientId: patient.id, patientName: patient.name });
  };

  // 打开编辑病人
  const openEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setEditName(patient.name);
    setEditBedNumber(patient.bed_number);
    setEditModalVisible(true);
  };

  // 保存病人信息
  const handleSavePatient = async () => {
    if (!editName.trim() || !editBedNumber.trim()) {
      Alert.alert('错误', '请填写所有必填字段');
      return;
    }

    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/patients/${editingPatient!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          bedNumber: editBedNumber.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setEditModalVisible(false);
        setEditingPatient(null);
        fetchPatients();
      } else {
        Alert.alert('错误', result.error || '保存失败');
      }
    } catch (error) {
      console.error('Failed to save patient:', error);
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <View style={styles.container}>
        {/* 顶部标题栏 */}
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

        {/* 病人列表 */}
        <View style={styles.patientList}>
          {loading ? (
            <View style={styles.emptyContainer}>
              <ThemedText color={theme.textMuted}>加载中...</ThemedText>
            </View>
          ) : patients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="users" size={40} color={theme.textMuted} />
              <ThemedText style={styles.emptyText} color={theme.textMuted}>
                暂无病人
              </ThemedText>
            </View>
          ) : (
            patients.map((patient) => (
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
                  <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 病人编辑模态框 */}
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
