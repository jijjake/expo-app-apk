import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Modal, TextInput, FlatList } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useFocusEffect } from '@react-navigation/native';

import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';
import { LocalStorageService, ChangeLog, Task, TreatmentProject, Patient, PatientProject, DateUtils } from '@/services/localStorage';
import dayjs from 'dayjs';

interface TreatmentTask {
  id: number;
  patient_id: number;
  project_id: number;
  task_date: string;
  duration: number;
  notes: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  treatment_projects: {
    id: number;
    name: string;
    description: string;
    default_duration: number;
    icon: string;
  };
}

export default function PatientDetailScreen() {
  const { theme, isDark } = useTheme();
  const router = useSafeRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { patientId, patientName } = useSafeSearchParams<{ patientId: string; patientName: string }>();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [recentTasks, setRecentTasks] = useState<TreatmentTask[]>([]);
  const [allProjects, setAllProjects] = useState<TreatmentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'logs'>('info');
  
  // 编辑模式状态
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBedNumber, setEditBedNumber] = useState('');
  const [editProjects, setEditProjects] = useState<PatientProject[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const id = parseInt(patientId, 10);
      
      // 获取病人，包括已删除的（用于查看历史记录）
      const patientData = await LocalStorageService.getPatientById(id, true);
      setPatient(patientData || null);
      
      if (patientData) {
        setEditName(patientData.name);
        setEditBedNumber(patientData.bed_number);
        setEditProjects(patientData.projects || []);
      }
      
      // 退出编辑模式
      setIsEditing(false);

      const logs = await LocalStorageService.getPatientChangeLogs(id);
      setChangeLogs(logs);

      const allTasks = await LocalStorageService.getTasks();
      const projects = await LocalStorageService.getProjects();
      setAllProjects(projects);
      
      const patientTasks = allTasks
        .filter(t => t.patient_id === id)
        .sort((a, b) => new Date(b.task_date).getTime() - new Date(a.task_date).getTime())
        .slice(0, 10);
      
      const enrichedTasks: TreatmentTask[] = patientTasks.map(task => {
        const project = projects.find(p => p.id === task.project_id);
        return {
          ...task,
          treatment_projects: project ? { ...project } : { 
            id: task.project_id, 
            name: '未知项目', 
            description: '', 
            default_duration: 20, 
            icon: 'notes-medical' 
          },
        };
      });
      
      setRecentTasks(enrichedTasks);
    } catch (error) {
      console.error('Failed to fetch patient detail:', error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleSavePatient = async () => {
    if (!editName.trim() || !editBedNumber.trim()) {
      Alert.alert('错误', '请填写床号和姓名');
      return;
    }

    try {
      await LocalStorageService.updatePatientWithLog(patient!.id, {
        name: editName.trim(),
        bed_number: editBedNumber.trim(),
        projects: editProjects,
      });
      setIsEditing(false);
      fetchData();
      Alert.alert('成功', '保存成功');
    } catch (error) {
      console.error('Failed to save patient:', error);
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  // 切换编辑模式
  const toggleEditMode = () => {
    if (isEditing) {
      // 取消编辑，恢复原始数据
      if (patient) {
        setEditName(patient.name);
        setEditBedNumber(patient.bed_number);
        setEditProjects(patient.projects || []);
      }
      setIsEditing(false);
    } else {
      // 进入编辑模式
      setIsEditing(true);
    }
  };

  // 添加项目到病人
  const addProjectToPatient = (projectId: number) => {
    const project = allProjects.find(p => p.id === projectId);
    if (!project) return;
    
    // 检查是否已存在
    const exists = editProjects.some(p => p.project_id === projectId);
    if (exists) return;
    
    setEditProjects([...editProjects, {
      project_id: projectId,
      project_name: project.name,
      notes: '',
      time_required: project.default_duration || 20,
    }]);
  };

  // 移除项目
  const removeProject = (projectId: number) => {
    setEditProjects(editProjects.filter(p => p.project_id !== projectId));
  };

  // 更新项目备注
  const updateProjectNotes = (projectId: number, notes: string) => {
    setEditProjects(editProjects.map(p => 
      p.project_id === projectId ? { ...p, notes } : p
    ));
  };

  // 更新项目时长
  const updateProjectTime = (projectId: number, time: number) => {
    setEditProjects(editProjects.map(p => 
      p.project_id === projectId ? { ...p, time_required: time } : p
    ));
  };

  const getProjectIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      brain: 'brain',
      heart: 'heart-pulse',
      muscle: 'hand-fist',
      speech: 'comment-medical',
      balance: 'scale-balanced',
      breathe: 'wind',
      cognitive: 'lightbulb',
      physical: 'person-walking',
      hand: 'hand',
      foot: 'shoe-prints',
      neck: 'user-injured',
      back: 'spine',
      joint: 'bone',
      electro: 'bolt',
      heat: 'temperature-high',
      ultrasound: 'wave-square',
      traction: 'arrows-alt-v',
      massage: 'hands',
      acupuncture: 'syringe',
      cupping: 'circle',
      moxibustion: 'fire',
      water: 'water',
      oxygen: 'lungs',
      light: 'sun',
      magnetic: 'magnet',
      laser: 'bolt-lightning',
      cryo: 'snowflake',
      vibration: 'wave-circle',
      stretch: 'arrows-left-right',
      posture: 'person',
    };
    return iconMap[iconName] || 'notes-medical';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.textMuted;
      case 'in_progress':
        return '#F59E0B';
      case 'completed':
        return theme.success;
      case 'needs_collection':
        return '#F59E0B';
      default:
        return theme.textMuted;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待开始';
      case 'in_progress':
        return '进行中';
      case 'completed':
        return '已完成';
      case 'needs_collection':
        return '待取机';
      default:
        return status;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return 'plus-circle';
      case 'update':
        return 'pen-to-square';
      case 'delete':
        return 'trash';
      default:
        return 'circle-info';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return theme.success;
      case 'update':
        return theme.primary;
      case 'delete':
        return '#EF4444';
      default:
        return theme.textMuted;
    }
  };

  const formatDateTime = (dateStr: string) => {
    return dayjs(dateStr).format('MM-DD HH:mm');
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ThemedView style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome6 name="arrow-left" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.headerTitle}>
            {patient?.name || patientName}
          </ThemedText>
          {patient?.is_deleted && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <FontAwesome6 name="trash" size={10} color="#EF4444" style={{ marginRight: 4 }} />
              <ThemedText variant="caption" color="#EF4444">
                已删除 {patient.deleted_at ? dayjs(patient.deleted_at).format('YYYY-MM-DD') : ''}
              </ThemedText>
            </View>
          )}
        </View>
        {activeTab === 'info' && (
          <TouchableOpacity
            style={styles.editHeaderButton}
            onPress={isEditing ? handleSavePatient : toggleEditMode}
          >
            <FontAwesome6 
              name={isEditing ? "check" : "pen"} 
              size={16} 
              color={isEditing ? theme.success : theme.primary} 
            />
          </TouchableOpacity>
        )}
      </ThemedView>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.activeTab]}
          onPress={() => setActiveTab('info')}
        >
          <ThemedText
            variant="body"
            color={activeTab === 'info' ? theme.primary : theme.textMuted}
            style={activeTab === 'info' && styles.activeTabText}
          >
            基本信息
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <ThemedText
            variant="body"
            color={activeTab === 'history' ? theme.primary : theme.textMuted}
            style={activeTab === 'history' && styles.activeTabText}
          >
            治疗记录
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
          onPress={() => setActiveTab('logs')}
        >
          <ThemedText
            variant="body"
            color={activeTab === 'logs' ? theme.primary : theme.textMuted}
            style={activeTab === 'logs' && styles.activeTabText}
          >
            变更历史
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {loading ? (
          <View style={styles.emptyContainer}>
            <ThemedText color={theme.textMuted}>加载中...</ThemedText>
          </View>
        ) : activeTab === 'info' ? (
          <View style={styles.infoSection}>
            {/* 基本信息卡片 */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <FontAwesome6 name="bed" size={16} color={theme.primary} />
                  <ThemedText variant="body" color={theme.textSecondary}>床号</ThemedText>
                </View>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editBedNumber}
                    onChangeText={setEditBedNumber}
                    placeholder="床号"
                    placeholderTextColor={theme.textMuted}
                  />
                ) : (
                  <View style={styles.bedBadge}>
                    <ThemedText variant="bodyMedium" style={styles.bedNumber} color={theme.buttonPrimaryText}>
                      {patient?.bed_number || '-'}
                    </ThemedText>
                  </View>
                )}
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <FontAwesome6 name="user" size={16} color={theme.primary} />
                  <ThemedText variant="body" color={theme.textSecondary}>姓名</ThemedText>
                </View>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="姓名"
                    placeholderTextColor={theme.textMuted}
                  />
                ) : (
                  <ThemedText variant="body" color={theme.textPrimary}>{patient?.name || '-'}</ThemedText>
                )}
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <FontAwesome6 name="calendar-plus" size={16} color={theme.primary} />
                  <ThemedText variant="body" color={theme.textSecondary}>创建时间</ThemedText>
                </View>
                <ThemedText variant="body" color={theme.textPrimary}>
                  {patient ? dayjs(patient.created_at).format('YYYY-MM-DD HH:mm') : '-'}
                </ThemedText>
              </View>
            </View>

            {/* 治疗项目卡片 */}
            <View style={styles.projectsCard}>
              <View style={styles.projectsCardHeader}>
                <ThemedText variant="h5" color={theme.textPrimary} style={styles.sectionTitle}>
                  治疗项目
                </ThemedText>
                {isEditing && (
                  <ThemedText variant="caption" color={theme.textMuted}>
                    点击添加，下方编辑
                  </ThemedText>
                )}
              </View>
              
              {isEditing ? (
                // 编辑模式
                <View style={styles.editableProjectsList}>
                  {/* 上方：所有预设项目选项 */}
                  <View style={styles.projectSelectorSection}>
                    <ThemedText variant="caption" color={theme.textSecondary} style={styles.selectorLabel}>
                      可选项目（点击添加）
                    </ThemedText>
                    <View style={styles.projectGrid}>
                      {allProjects.map((project) => {
                        const isSelected = editProjects.some(p => p.project_id === project.id);
                        return (
                          <TouchableOpacity
                            key={project.id}
                            style={[
                              styles.projectChip,
                              isSelected && styles.projectChipSelected
                            ]}
                            onPress={() => {
                              if (isSelected) {
                                removeProject(project.id);
                              } else {
                                addProjectToPatient(project.id);
                              }
                            }}
                          >
                            <FontAwesome6
                              name={getProjectIcon(project.icon)}
                              size={12}
                              color={isSelected ? '#fff' : theme.textSecondary}
                              style={styles.chipIcon}
                            />
                            <ThemedText
                              variant="caption"
                              color={isSelected ? '#fff' : theme.textPrimary}
                              style={styles.chipText}
                            >
                              {project.name}
                            </ThemedText>
                            {isSelected && (
                              <FontAwesome6
                                name="check"
                                size={10}
                                color="#fff"
                                style={styles.chipCheck}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* 分隔线 */}
                  {editProjects.length > 0 && (
                    <View style={styles.divider} />
                  )}

                  {/* 下方：已选项目编辑区 */}
                  {editProjects.length > 0 && (
                    <View style={styles.selectedProjectsSection}>
                      <ThemedText variant="caption" color={theme.textSecondary} style={styles.selectorLabel}>
                        已选项目（点击上方可移除）
                      </ThemedText>
                      <View style={styles.selectedProjectsList}>
                        {editProjects.map((project) => (
                          <View key={project.project_id} style={styles.selectedProjectEditItem}>
                            <View style={styles.selectedProjectHeader}>
                              <FontAwesome6
                                name={getProjectIcon(allProjects.find(p => p.id === project.project_id)?.icon || 'notes-medical')}
                                size={14}
                                color={theme.primary}
                              />
                              <ThemedText variant="body" color={theme.textPrimary} style={styles.selectedProjectName}>
                                {project.project_name}
                              </ThemedText>
                            </View>
                            <View style={styles.selectedProjectInputs}>
                              <View style={styles.timeInputContainer}>
                                <FontAwesome6 name="clock" size={12} color={theme.textMuted} />
                                <TextInput
                                  style={styles.editTimeInput}
                                  value={project.time_required.toString()}
                                  onChangeText={(text) => {
                                    const num = parseInt(text) || 0;
                                    updateProjectTime(project.project_id, num);
                                  }}
                                  keyboardType="numeric"
                                  placeholder="时长"
                                  placeholderTextColor={theme.textMuted}
                                />
                                <ThemedText variant="caption" color={theme.textMuted}>分</ThemedText>
                              </View>
                              <TextInput
                                style={styles.editNotesInput}
                                value={project.notes}
                                onChangeText={(text) => updateProjectNotes(project.project_id, text)}
                                placeholder="备注（可选）"
                                placeholderTextColor={theme.textMuted}
                              />
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {editProjects.length === 0 && (
                    <View style={styles.emptySelectedProjects}>
                      <FontAwesome6 name="hand-pointer" size={24} color={theme.textMuted} />
                      <ThemedText variant="caption" color={theme.textMuted} style={styles.emptySelectedText}>
                        点击上方项目添加到此处
                      </ThemedText>
                    </View>
                  )}
                </View>
              ) : (
                // 查看模式：显示项目列表
                <View style={styles.projectsList}>
                  {patient?.projects && patient.projects.length > 0 ? (
                    patient.projects.map((project) => (
                      <View key={project.project_id} style={styles.projectItem}>
                        <View style={styles.projectItemLeft}>
                          <FontAwesome6 name="check-circle" size={16} color={theme.primary} />
                          <ThemedText variant="body" color={theme.textPrimary} style={styles.projectItemName}>
                            {project.project_name}
                          </ThemedText>
                        </View>
                        <View style={styles.projectItemRight}>
                          <ThemedText variant="caption" color={theme.textMuted}>
                            {project.time_required}分钟
                          </ThemedText>
                          {project.notes ? (
                            <ThemedText variant="caption" color={theme.textSecondary} style={styles.projectNotes}>
                              {project.notes}
                            </ThemedText>
                          ) : null}
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyProjects}>
                      <FontAwesome6 name="clipboard-list" size={32} color={theme.textMuted} />
                      <ThemedText variant="body" color={theme.textMuted} style={styles.emptyProjectsText}>
                        暂无治疗项目
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        点击右上角编辑按钮添加
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* 统计概览卡片 */}
            <View style={styles.statsCard}>
              <ThemedText variant="h5" color={theme.textPrimary} style={styles.sectionTitle}>
                统计概览
              </ThemedText>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <ThemedText variant="h3" color={theme.primary}>{changeLogs.length}</ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>变更记录</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText variant="h3" color={theme.primary}>{recentTasks.length}</ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>治疗任务</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText variant="h3" color={theme.primary}>{patient?.projects?.length || 0}</ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>治疗项目</ThemedText>
                </View>
              </View>
            </View>
          </View>
        ) : activeTab === 'history' ? (
          recentTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="file-medical" size={40} color={theme.textMuted} />
              <ThemedText style={styles.emptyText} color={theme.textMuted}>
                暂无治疗记录
              </ThemedText>
            </View>
          ) : (
            <View style={styles.historySection}>
              {recentTasks.map((task) => (
                <View key={task.id} style={styles.taskItem}>
                  <View style={styles.taskLeft}>
                    <FontAwesome6
                      name={getProjectIcon(task.treatment_projects.icon)}
                      size={20}
                      color={theme.primary}
                      style={styles.taskIcon}
                    />
                    <View>
                      <ThemedText variant="body" color={theme.textPrimary} style={styles.taskName}>
                        {task.treatment_projects.name}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {task.task_date} · {task.duration}分钟
                      </ThemedText>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(task.status) + '15' },
                    ]}
                  >
                    <ThemedText variant="caption" color={getStatusColor(task.status)}>
                      {getStatusText(task.status)}
                    </ThemedText>
                  </View>
                </View>
              ))}
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push('/patient-history', { patientId, patientName })}
              >
                <ThemedText variant="body" color={theme.primary}>查看全部治疗记录</ThemedText>
                <FontAwesome6 name="chevron-right" size={14} color={theme.primary} />
              </TouchableOpacity>
            </View>
          )
        ) : (
          changeLogs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="clock-rotate-left" size={40} color={theme.textMuted} />
              <ThemedText style={styles.emptyText} color={theme.textMuted}>
                暂无变更记录
              </ThemedText>
            </View>
          ) : (
            <View style={styles.logsSection}>
              {changeLogs.map((log) => (
                <View key={log.id} style={styles.logItem}>
                  <View style={styles.logLeft}>
                    <View style={[styles.logIcon, { backgroundColor: getActionColor(log.action) + '15' }]}>
                      <FontAwesome6
                        name={getActionIcon(log.action)}
                        size={14}
                        color={getActionColor(log.action)}
                      />
                    </View>
                    <View style={styles.logContent}>
                      <ThemedText variant="body" color={theme.textPrimary} style={styles.logDescription}>
                        {log.description}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {formatDateTime(log.created_at)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )
        )}
      </ScrollView>

    </Screen>
  );
}
