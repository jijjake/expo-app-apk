import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, TouchableOpacity, Alert, Modal, TextInput, ScrollView, Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useFocusEffect } from '@react-navigation/native';

import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';
import { LocalStorageService, Patient as LocalPatient, ChangeLog, TreatmentProject, PatientProject, DateUtils } from '@/services/localStorage';

interface Patient {
  id: number;
  name: string;
  bed_number: string;
  projects: PatientProject[];
  created_at: string;
}

export default function PatientsScreen() {
  const { theme, isDark } = useTheme();
  const router = useSafeRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [allProjects, setAllProjects] = useState<TreatmentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editName, setEditName] = useState('');
  const [editBedNumber, setEditBedNumber] = useState('');
  const [editProjects, setEditProjects] = useState<PatientProject[]>([]);
  const [newName, setNewName] = useState('');
  const [newBedNumber, setNewBedNumber] = useState('');
  const [newProjects, setNewProjects] = useState<PatientProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [changeLogModalVisible, setChangeLogModalVisible] = useState(false);
  const [selectedPatientLogs, setSelectedPatientLogs] = useState<ChangeLog[]>([]);
  const [selectedPatientName, setSelectedPatientName] = useState('');
  
  // 更多操作菜单状态
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedPatientForAction, setSelectedPatientForAction] = useState<Patient | null>(null);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const patientsData = await LocalStorageService.getPatients();
      const projectsData = await LocalStorageService.getProjects();
      setPatients(patientsData.map(p => ({ ...p, created_at: new Date().toISOString() })));
      setAllProjects(projectsData);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPatients();
    }, [fetchPatients])
  );

  // 常用姓氏拼音首字母映射
  const getPinYinFirstChar = (str: string): string => {
    const pinyinMap: Record<string, string> = {
      '阿': 'a', '安': 'a', '艾': 'a', '爱': 'a',
      '巴': 'b', '白': 'b', '百': 'b', '北': 'b', '本': 'b', '边': 'b', '博': 'b',
      '蔡': 'c', '曹': 'c', '陈': 'c', '程': 'c', '崔': 'c', '春': 'c',
      '大': 'd', '戴': 'd', '邓': 'd', '丁': 'd', '董': 'd', '杜': 'd', '段': 'd',
      '范': 'f', '方': 'f', '费': 'f', '冯': 'f', '傅': 'f', '福': 'f',
      '高': 'g', '葛': 'g', '龚': 'g', '古': 'g', '顾': 'g', '郭': 'g', '国': 'g',
      '韩': 'h', '何': 'h', '贺': 'h', '洪': 'h', '侯': 'h', '胡': 'h', '黄': 'h', '霍': 'h', '华': 'h', '海': 'h',
      '季': 'j', '江': 'j', '姜': 'j', '蒋': 'j', '金': 'j', '靳': 'j', '贾': 'j',
      '康': 'k', '柯': 'k', '孔': 'k',
      '赖': 'l', '蓝': 'l', '郎': 'l', '雷': 'l', '黎': 'l', '李': 'l', '梁': 'l', '廖': 'l', '林': 'l', '刘': 'l', '龙': 'l', '卢': 'l', '鲁': 'l', '陆': 'l', '路': 'l', '罗': 'l', '吕': 'l',
      '马': 'm', '毛': 'm', '梅': 'm', '孟': 'm', '莫': 'm', '牟': 'm', '穆': 'm',
      '倪': 'n', '聂': 'n', '宁': 'n', '牛': 'n',
      '欧': 'o',
      '潘': 'p', '庞': 'p', '裴': 'p', '彭': 'p', '平': 'p', '浦': 'p',
      '戚': 'q', '祁': 'q', '钱': 'q', '强': 'q', '乔': 'q', '秦': 'q', '邱': 'q', '丘': 'q', '屈': 'q',
      '任': 'r', '荣': 'r', '阮': 'r', '瑞': 'r',
      '邵': 's', '申': 's', '沈': 's', '施': 's', '石': 's', '史': 's', '宋': 's', '苏': 's', '孙': 's', '舒': 's',
      '谭': 't', '汤': 't', '唐': 't', '陶': 't', '田': 't', '童': 't', '屠': 't',
      '万': 'w', '汪': 'w', '王': 'w', '韦': 'w', '魏': 'w', '卫': 'w', '温': 'w', '文': 'w', '翁': 'w', '吴': 'w', '伍': 'w', '武': 'w',
      '夏': 'x', '向': 'x', '肖': 'x', '谢': 'x', '辛': 'x', '邢': 'x', '熊': 'x', '徐': 'x', '许': 'x', '薛': 'x',
      '严': 'y', '颜': 'y', '阎': 'y', '杨': 'y', '姚': 'y', '叶': 'y', '易': 'y', '殷': 'y', '尹': 'y', '应': 'y', '雍': 'y', '于': 'y', '俞': 'y', '余': 'y', '虞': 'y', '禹': 'y', '袁': 'y', '岳': 'y', '云': 'y',
      '曾': 'z', '詹': 'z', '张': 'z', '章': 'z', '赵': 'z', '甄': 'z', '郑': 'z', '钟': 'z', '周': 'z', '朱': 'z', '诸': 'z', '竺': 'z', '祝': 'z', '庄': 'z', '卓': 'z', '子': 'z', '左': 'z',
      // 常见名字用字
      '伟': 'w', '芳': 'f', '娜': 'n', '敏': 'm', '静': 'j', '丽': 'l', '强': 'q', '磊': 'l', '军': 'j', '洋': 'y',
      '勇': 'y', '艳': 'y', '杰': 'j', '娟': 'j', '涛': 't', '明': 'm', '超': 'c', '秀': 'x', '霞': 'x', '平': 'p',
      '刚': 'g', '桂': 'g', '英': 'y', '华': 'h', '建': 'j', '文': 'w', '辉': 'h', '玲': 'l', '梅': 'm', '燕': 'y',
      '宇': 'y', '欣': 'x', '雨': 'y', '晨': 'c', '轩': 'x', '昊': 'h', '瑞': 'r', '嘉': 'j', '琪': 'q', '浩': 'h',
      '博': 'b', '思': 's', '佳': 'j', '怡': 'y', '彤': 't', '梓': 'z', '涵': 'h', '语': 'y', '宸': 'c', '逸': 'y',
      '三': 's', '四': 's', '五': 'w', '六': 'l', '七': 'q', '八': 'b', '九': 'j', '十': 's',
      '大': 'd', '小': 'x', '老': 'l',
    };
    
    let result = '';
    for (const char of str) {
      if (pinyinMap[char]) {
        result += pinyinMap[char];
      } else if (/[a-zA-Z]/.test(char)) {
        result += char.toLowerCase();
      }
    }
    return result;
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const query = searchQuery.toLowerCase().trim();
    return patients.filter(p => {
      const nameLower = p.name.toLowerCase();
      const bedLower = p.bed_number.toLowerCase();
      const namePinyin = getPinYinFirstChar(p.name);
      
      // 直接包含匹配
      const directMatch = nameLower.includes(query) || bedLower.includes(query);
      
      // 拼音首字母匹配（如 "ls" 匹配 "李四"）
      const pinyinMatch = namePinyin.includes(query);
      
      return directMatch || pinyinMatch;
    });
  }, [patients, searchQuery]);

  const viewPatientHistory = (patient: Patient) => {
    router.push('/patient-detail', { patientId: String(patient.id), patientName: patient.name });
  };

  const openEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setEditName(patient.name);
    setEditBedNumber(patient.bed_number);
    setEditProjects(patient.projects || []);
    setEditModalVisible(true);
  };

  const toggleProject = (projectId: number, isEdit: boolean) => {
    const projects = isEdit ? editProjects : newProjects;
    const setProjects = isEdit ? setEditProjects : setNewProjects;
    
    const exists = projects.find(p => p.project_id === projectId);
    if (exists) {
      setProjects(projects.filter(p => p.project_id !== projectId));
    } else {
      const project = allProjects.find(p => p.id === projectId);
      setProjects([...projects, {
        project_id: projectId,
        project_name: project?.name || '未知项目',
        notes: '',
        time_required: project?.default_duration || 20,
      }]);
    }
  };

  const removeProject = (projectId: number, isEdit: boolean) => {
    const setProjects = isEdit ? setEditProjects : setNewProjects;
    const projects = isEdit ? editProjects : newProjects;
    setProjects(projects.filter(p => p.project_id !== projectId));
  };

  const updateProjectNotes = (projectId: number, notes: string, isEdit: boolean) => {
    const setProjects = isEdit ? setEditProjects : setNewProjects;
    const projects = isEdit ? editProjects : newProjects;
    setProjects(projects.map(p => 
      p.project_id === projectId ? { ...p, notes } : p
    ));
  };

  const updateProjectTime = (projectId: number, time: number, isEdit: boolean) => {
    const setProjects = isEdit ? setEditProjects : setNewProjects;
    const projects = isEdit ? editProjects : newProjects;
    setProjects(projects.map(p => 
      p.project_id === projectId ? { ...p, time_required: time } : p
    ));
  };

  const getProjectName = (projectId: number, projects?: PatientProject[]) => {
    // 优先从当前编辑的项目列表中获取保存的名称
    const currentList = projects || editProjects;
    const savedProject = currentList.find(p => p.project_id === projectId);
    if (savedProject?.project_name) {
      return savedProject.project_name;
    }
    // 否则从项目列表中获取
    return allProjects.find(p => p.id === projectId)?.name || '未知项目';
  };

  const handleSavePatient = async () => {
    if (!editName.trim() || !editBedNumber.trim()) {
      Alert.alert('错误', '请填写床号和姓名');
      return;
    }

    try {
      await LocalStorageService.updatePatientWithLog(editingPatient!.id, {
        name: editName.trim(),
        bed_number: editBedNumber.trim(),
        projects: editProjects,
      });
      setEditModalVisible(false);
      setEditingPatient(null);
      fetchPatients();
    } catch (error) {
      console.error('Failed to save patient:', error);
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  const openAddPatient = () => {
    setNewName('');
    setNewBedNumber('');
    setNewProjects([]);
    setAddModalVisible(true);
  };

  const handleAddPatient = async () => {
    if (!newName.trim() || !newBedNumber.trim()) {
      Alert.alert('错误', '请填写床号和姓名');
      return;
    }

    try {
      await LocalStorageService.createPatientWithLog({
        name: newName.trim(),
        bed_number: newBedNumber.trim(),
        projects: newProjects,
      });
      setAddModalVisible(false);
      setNewName('');
      setNewBedNumber('');
      setNewProjects([]);
      fetchPatients();
    } catch (error) {
      console.error('Failed to add patient:', error);
      Alert.alert('错误', '添加失败，请重试');
    }
  };

  const deletePatient = async (patient: Patient) => {
    console.log('Attempting to delete patient:', patient.id, patient.name);
    
    // 网页使用 window.confirm
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`确定要删除病人"${patient.name}"吗？相关的任务记录也会被删除。`);
      if (confirmed) {
        try {
          console.log('Confirmed deletion for patient id:', patient.id);
          const result = await LocalStorageService.deletePatientWithLog(patient.id);
          console.log('Delete result:', result);
          fetchPatients();
        } catch (error) {
          console.error('Failed to delete patient:', error);
          window.alert('删除失败，请重试');
        }
      }
      return;
    }
    
    // 移动端使用 Alert
    Alert.alert('确认删除', `确定要删除病人"${patient.name}"吗？相关的任务记录也会被删除。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('Confirmed deletion for patient id:', patient.id);
            const result = await LocalStorageService.deletePatientWithLog(patient.id);
            console.log('Delete result:', result);
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
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={openAddPatient}
            >
              <FontAwesome6 name="plus" size={16} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={fetchPatients}
            >
              <FontAwesome6 name="rotate" size={16} color={theme.primary} />
            </TouchableOpacity>
          </View>
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
                activeOpacity={0.7}
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
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedPatientForAction(patient);
                    setActionMenuVisible(true);
                  }}
                >
                  <FontAwesome6 name="ellipsis-vertical" size={16} color={theme.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <Modal
          visible={editModalVisible}
          transparent
          animationType="fade"
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

                <View style={styles.rowInput}>
                  <View style={styles.halfInput}>
                    <ThemedText variant="caption" color={theme.textSecondary}>床号 *</ThemedText>
                    <TextInput
                      style={styles.inputSmall}
                      value={editBedNumber}
                      onChangeText={setEditBedNumber}
                      placeholder="床号"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <ThemedText variant="caption" color={theme.textSecondary}>姓名 *</ThemedText>
                    <TextInput
                      style={styles.inputSmall}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="姓名"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.projectSection}>
                  <ThemedText variant="body" color={theme.textSecondary} style={styles.sectionLabel}>
                    治疗项目
                  </ThemedText>
                  <View style={styles.projectGrid}>
                    {allProjects.map((project) => {
                      const isSelected = editProjects.some(p => p.project_id === project.id);
                      return (
                        <TouchableOpacity
                          key={project.id}
                          style={[styles.projectChip, isSelected && styles.projectChipSelected]}
                          onPress={() => toggleProject(project.id, true)}
                        >
                          <ThemedText
                            variant="caption"
                            color={isSelected ? theme.buttonPrimaryText : theme.textSecondary}
                          >
                            {project.name}
                          </ThemedText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {editProjects.length > 0 && (
                  <View style={styles.selectedProjects}>
                    {editProjects.map((pp, index) => {
                      const projectName = pp.project_name || getProjectName(pp.project_id);
                      return (
                        <View key={`edit-${pp.project_id}-${index}`} style={styles.projectEditRow}>
                          <ThemedText 
                            variant="body" 
                            color={theme.textPrimary} 
                            style={styles.projectEditName}
                          >
                            {projectName}
                          </ThemedText>
                          <View style={styles.projectEditInputs}>
                            <TextInput
                              style={styles.timeInput}
                              defaultValue={pp.time_required.toString()}
                              onEndEditing={(e) => {
                                const text = e.nativeEvent.text;
                                const num = parseInt(text);
                                updateProjectTime(pp.project_id, isNaN(num) || num <= 0 ? 20 : num, true);
                              }}
                              keyboardType="numeric"
                              placeholder="分钟"
                              placeholderTextColor={theme.textMuted}
                            />
                            <TextInput
                              style={styles.notesInput}
                              value={pp.notes}
                              onChangeText={(text) => updateProjectNotes(pp.project_id, text, true)}
                              placeholder="备注"
                              placeholderTextColor={theme.textMuted}
                            />
                            <TouchableOpacity
                              style={styles.removeProjectButton}
                              onPress={() => removeProject(pp.project_id, true)}
                            >
                              <FontAwesome6 name="xmark" size={14} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <ThemedText color={theme.textSecondary}>取消</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleSavePatient}
                  >
                    <ThemedText color={theme.buttonPrimaryText}>保存</ThemedText>
                  </TouchableOpacity>
                </View>
              </ThemedView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={addModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAddModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ThemedView level="default" style={styles.modalBody}>
                <View style={styles.modalHeader}>
                  <ThemedText variant="h4">新建病人</ThemedText>
                  <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                    <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.rowInput}>
                  <View style={styles.halfInput}>
                    <ThemedText variant="caption" color={theme.textSecondary}>床号 *</ThemedText>
                    <TextInput
                      style={styles.inputSmall}
                      value={newBedNumber}
                      onChangeText={setNewBedNumber}
                      placeholder="床号"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <ThemedText variant="caption" color={theme.textSecondary}>姓名 *</ThemedText>
                    <TextInput
                      style={styles.inputSmall}
                      value={newName}
                      onChangeText={setNewName}
                      placeholder="姓名"
                      placeholderTextColor={theme.textMuted}
                      autoFocus
                    />
                  </View>
                </View>

                <View style={styles.projectSection}>
                  <ThemedText variant="body" color={theme.textSecondary} style={styles.sectionLabel}>
                    治疗项目
                  </ThemedText>
                  <View style={styles.projectGrid}>
                    {allProjects.map((project) => {
                      const isSelected = newProjects.some(p => p.project_id === project.id);
                      return (
                        <TouchableOpacity
                          key={project.id}
                          style={[styles.projectChip, isSelected && styles.projectChipSelected]}
                          onPress={() => toggleProject(project.id, false)}
                        >
                          <ThemedText
                            variant="caption"
                            color={isSelected ? theme.buttonPrimaryText : theme.textSecondary}
                          >
                            {project.name}
                          </ThemedText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {newProjects.length > 0 && (
                  <View style={styles.selectedProjects}>
                    {newProjects.map((pp, index) => (
                      <View key={`new-${pp.project_id}-${index}`} style={styles.projectEditRow}>
                        <ThemedText variant="body" color={theme.textPrimary} style={styles.projectEditName}>
                          {getProjectName(pp.project_id)}
                        </ThemedText>
                        <View style={styles.projectEditInputs}>
                          <TextInput
                            style={styles.timeInput}
                            defaultValue={pp.time_required.toString()}
                            onEndEditing={(e) => {
                              const text = e.nativeEvent.text;
                              const num = parseInt(text);
                              updateProjectTime(pp.project_id, isNaN(num) || num <= 0 ? 20 : num, false);
                            }}
                            keyboardType="numeric"
                            placeholder="分钟"
                            placeholderTextColor={theme.textMuted}
                          />
                          <TextInput
                            style={styles.notesInput}
                            value={pp.notes}
                            onChangeText={(text) => updateProjectNotes(pp.project_id, text, false)}
                            placeholder="备注"
                            placeholderTextColor={theme.textMuted}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setAddModalVisible(false)}
                  >
                    <ThemedText color={theme.textSecondary}>取消</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleAddPatient}
                  >
                    <ThemedText color={theme.buttonPrimaryText}>创建</ThemedText>
                  </TouchableOpacity>
                </View>
              </ThemedView>
            </View>
          </View>
        </Modal>

        {/* 操作菜单模态框 */}
        <Modal
          visible={actionMenuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setActionMenuVisible(false)}
        >
          <TouchableOpacity 
            style={styles.actionMenuOverlay}
            activeOpacity={1}
            onPress={() => setActionMenuVisible(false)}
          >
            <View style={styles.actionMenuContent}>
              <ThemedView level="default" style={styles.actionMenuBody}>
                <View style={styles.actionMenuHeader}>
                  <ThemedText variant="body" color={theme.textSecondary}>
                    {selectedPatientForAction?.bed_number}床 {selectedPatientForAction?.name}
                  </ThemedText>
                </View>
                
                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={() => {
                    setActionMenuVisible(false);
                    if (selectedPatientForAction) {
                      openEditPatient(selectedPatientForAction);
                    }
                  }}
                >
                  <FontAwesome6 name="pen" size={18} color={theme.primary} />
                  <ThemedText variant="body" color={theme.textPrimary} style={styles.actionMenuText}>
                    编辑信息
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={async () => {
                    if (selectedPatientForAction) {
                      const logs = await LocalStorageService.getPatientChangeLogs(selectedPatientForAction.id);
                      setSelectedPatientLogs(logs);
                      setSelectedPatientName(selectedPatientForAction.name);
                      setActionMenuVisible(false);
                      setChangeLogModalVisible(true);
                    }
                  }}
                >
                  <FontAwesome6 name="clock-rotate-left" size={18} color={theme.primary} />
                  <ThemedText variant="body" color={theme.textPrimary} style={styles.actionMenuText}>
                    变更记录
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={() => {
                    setActionMenuVisible(false);
                    if (selectedPatientForAction) {
                      viewPatientHistory(selectedPatientForAction);
                    }
                  }}
                >
                  <FontAwesome6 name="file-medical" size={18} color={theme.primary} />
                  <ThemedText variant="body" color={theme.textPrimary} style={styles.actionMenuText}>
                    查看详情
                  </ThemedText>
                </TouchableOpacity>
                
                <View style={styles.actionMenuDivider} />
                
                <TouchableOpacity
                  style={[styles.actionMenuItem, styles.actionMenuItemDanger]}
                  onPress={() => {
                    setActionMenuVisible(false);
                    if (selectedPatientForAction) {
                      deletePatient(selectedPatientForAction);
                    }
                  }}
                >
                  <FontAwesome6 name="trash" size={18} color="#EF4444" />
                  <ThemedText variant="body" color="#EF4444" style={styles.actionMenuText}>
                    删除病人
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* 变更记录模态框 */}
        <Modal
          visible={changeLogModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setChangeLogModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '70%' }]}>
              <ThemedView level="default" style={styles.modalBody}>
                <View style={styles.modalHeader}>
                  <ThemedText variant="h4">{selectedPatientName} - 变更记录</ThemedText>
                  <TouchableOpacity onPress={() => setChangeLogModalVisible(false)}>
                    <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 400 }}>
                  {selectedPatientLogs.length === 0 ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <ThemedText color={theme.textMuted}>暂无变更记录</ThemedText>
                    </View>
                  ) : (
                    selectedPatientLogs.map((log, index) => (
                      <View
                        key={log.id || index}
                        style={{
                          padding: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.border,
                        }}
                      >
                        <ThemedText variant="caption" color={theme.textMuted}>
                          {new Date(log.created_at).toLocaleString('zh-CN')}
                        </ThemedText>
                        <ThemedText variant="body" color={theme.textPrimary} style={{ marginTop: 4 }}>
                          {log.description}
                        </ThemedText>
                      </View>
                    ))
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, { marginTop: 12 }]}
                  onPress={() => setChangeLogModalVisible(false)}
                >
                  <ThemedText color={theme.textSecondary}>关闭</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}
