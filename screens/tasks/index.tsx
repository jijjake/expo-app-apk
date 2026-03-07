import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, TouchableOpacity, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';

interface Task {
  id: number;
  patient_id: number;
  project_id: number;
  task_date: string;
  duration: number;
  notes: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'needs_collection';
  started_at: string | null;
  completed_at: string | null;
  machine_collected_at: string | null;
  patients: {
    id: number;
    name: string;
    bed_number: string;
  };
  treatment_projects: {
    id: number;
    name: string;
    description: string;
    default_duration: number;
    icon: string;
  };
  created_at: string;
}

interface TreatmentProject {
  id: number;
  name: string;
  description: string;
  default_duration: number;
  icon: string;
}

interface PatientGroup {
  patient: Task['patients'];
  tasks: Task[];
}

export default function TasksScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<TreatmentProject[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(true);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [expandedPatients, setExpandedPatients] = useState<Set<number>>(new Set());

  // 计时器状态 - 暂停时保存已用时间
  const [timers, setTimers] = useState<Record<number, { elapsed: number; isRunning: boolean; startTime: number | null }>>({});

  // 任务表单状态
  const [patientName, setPatientName] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';

  // 加载任务列表
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/tasks?date=${selectedDate}`);
      const result = await response.json();

      if (result.success) {
        setTasks(result.data);
        // 初始化计时器状态，保留已用时间
        const timerStates: Record<number, { elapsed: number; isRunning: boolean; startTime: number | null }> = {};
        result.data.forEach((task: Task) => {
          if (task.status === 'in_progress') {
            const startTime = task.started_at ? new Date(task.started_at).getTime() : Date.now();
            // 保留之前的elapsed时间
            const prevElapsed = timers[task.id]?.elapsed || 0;
            timerStates[task.id] = {
              elapsed: prevElapsed,
              isRunning: true,
              startTime,
            };
          } else if (task.status === 'pending' || task.status === 'needs_collection') {
            // 保留之前的elapsed时间（暂停状态）
            const prevElapsed = timers[task.id]?.elapsed || 0;
            timerStates[task.id] = {
              elapsed: prevElapsed,
              isRunning: false,
              startTime: null,
            };
          } else {
            // 完成状态，重置计时器
            timerStates[task.id] = {
              elapsed: 0,
              isRunning: false,
              startTime: null,
            };
          }
        });
        setTimers(timerStates);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, EXPO_PUBLIC_BACKEND_BASE_URL, timers]);

  // 加载治疗项目列表
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/projects`);
      const result = await response.json();

      if (result.success) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }, [EXPO_PUBLIC_BACKEND_BASE_URL]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // 计时器效果
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const newTimers = { ...prev };
        Object.keys(newTimers).forEach((taskId) => {
          const timer = newTimers[Number(taskId)];
          if (timer.isRunning && timer.startTime) {
            newTimers[Number(taskId)] = {
              ...timer,
              elapsed: Math.floor((Date.now() - timer.startTime) / 1000),
            };
          }
        });
        return newTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 按病人分组任务
  const groupedTasks = useMemo(() => {
    const groups: PatientGroup[] = [];
    const patientMap = new Map<number, PatientGroup>();

    tasks.forEach((task) => {
      if (!patientMap.has(task.patient_id)) {
        patientMap.set(task.patient_id, {
          patient: task.patients,
          tasks: [],
        });
      }
      patientMap.get(task.patient_id)!.tasks.push(task);
    });

    return Array.from(patientMap.values());
  }, [tasks]);

  // 展开/折叠病人任务
  const togglePatient = (patientId: number) => {
    setExpandedPatients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(patientId)) {
        newSet.delete(patientId);
      } else {
        newSet.add(patientId);
      }
      return newSet;
    });
  };

  // 日期选择
  const showDatePickerDialog = () => {
    DateTimePickerAndroid.open({
      value: dayjs(selectedDate).toDate(),
      onChange: (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
          const newDate = dayjs(selectedDate).format('YYYY-MM-DD');
          setSelectedDate(newDate);
        }
      },
      mode: 'date',
      is24Hour: true,
    });
  };

  // 开始计时
  const startTimer = async (taskId: number) => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      });

      const result = await response.json();

      if (result.success) {
        setTimers((prev) => ({
          ...prev,
          [taskId]: {
            elapsed: 0,
            isRunning: true,
            startTime: Date.now(),
          },
        }));
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  // 暂停计时
  const pauseTimer = async (taskId: number) => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      });

      const result = await response.json();

      if (result.success) {
        // 保留已用时间，不重置
        setTimers((prev) => ({
          ...prev,
          [taskId]: {
            ...prev[taskId],
            isRunning: false,
            startTime: null,
          },
        }));
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  };

  // 完成计时（标记为需要取机器）
  const completeTimer = async (taskId: number) => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'needs_collection' }),
      });

      const result = await response.json();

      if (result.success) {
        setTimers((prev) => ({
          ...prev,
          [taskId]: {
            ...prev[taskId],
            isRunning: false,
            startTime: null,
          },
        }));
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to complete timer:', error);
    }
  };

  // 标记机器已取
  const collectMachine = async (taskId: number) => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      const result = await response.json();

      if (result.success) {
        setTimers((prev) => ({
          ...prev,
          [taskId]: {
            elapsed: 0,
            isRunning: false,
            startTime: null,
          },
        }));
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to collect machine:', error);
    }
  };

  // 删除任务
  const deleteTask = async (taskId: number, projectName: string) => {
    Alert.alert('确认删除', `确定要删除任务"${projectName}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/tasks/${taskId}`, {
              method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
              // 清除计时器状态
              setTimers((prev) => {
                const newTimers = { ...prev };
                delete newTimers[taskId];
                return newTimers;
              });
              fetchTasks();
            } else {
              Alert.alert('删除失败', result.error || '请重试');
            }
          } catch (error) {
            console.error('Failed to delete task:', error);
            Alert.alert('错误', '删除失败，请重试');
          }
        },
      },
    ]);
  };

  // 保存任务（创建或编辑）
  const handleSaveTask = async () => {
    if (!patientName.trim() || !bedNumber.trim() || selectedProjectIds.length === 0) {
      Alert.alert('错误', '请填写病人信息并选择至少一个治疗项目');
      return;
    }

    try {
      // 编辑模式：更新病人信息和任务时长
      if (editingTask) {
        // 更新病人信息
        await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/patients/${editingTask.patient_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: patientName.trim(),
            bedNumber: bedNumber.trim(),
          }),
        });

        // 更新任务时长
        const project = projects.find(p => p.id === selectedProjectIds[0]);
        await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            duration: project?.default_duration || 20,
          }),
        });

        setTaskModalVisible(false);
        resetForm();
        fetchTasks();
      } else {
        // 创建模式：批量创建任务
        const durations = selectedProjectIds.map(id => {
          const project = projects.find(p => p.id === id);
          return project?.default_duration || 20;
        });

        const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/tasks/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientName: patientName.trim(),
            bedNumber: bedNumber.trim(),
            projectIds: selectedProjectIds,
            taskDate: selectedDate,
            durations,
            notes: null,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setTaskModalVisible(false);
          resetForm();
          fetchTasks();
        } else {
          Alert.alert('错误', result.error || '保存失败');
        }
      }
    } catch (error) {
      console.error('Failed to save task:', error);
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  // 重置表单
  const resetForm = () => {
    setPatientName('');
    setBedNumber('');
    setSelectedProjectIds([]);
    setEditingTask(null);
  };

  // 打开任务编辑
  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setPatientName(task.patients.name);
    setBedNumber(task.patients.bed_number);
    setSelectedProjectIds([task.project_id]);
    setTaskModalVisible(true);
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取项目图标
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
    };
    return iconMap[iconName] || 'notes-medical';
  };

  // 切换项目选择
  const toggleProject = (projectId: number) => {
    setSelectedProjectIds((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <View style={styles.container}>
        {/* 顶部日期选择和操作栏 */}
        <ThemedView style={styles.header}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={showDatePickerDialog}
          >
            <FontAwesome6 name="calendar" size={18} color={theme.primary} />
            <ThemedText style={styles.dateText}>{selectedDate}</ThemedText>
            <FontAwesome6 name="chevron-down" size={12} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setImportModalVisible(true)}
            >
              <FontAwesome6 name="file-import" size={16} color={theme.primary} />
              <ThemedText variant="caption" style={styles.iconButtonText} color={theme.primary}>导入</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, styles.addButton]}
              onPress={() => setTaskModalVisible(true)}
            >
              <FontAwesome6 name="plus" size={16} color={theme.buttonPrimaryText} />
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* 任务列表 */}
        <ScrollView style={styles.taskList}>
          {loading ? (
            <View style={styles.emptyContainer}>
              <ThemedText color={theme.textMuted}>加载中...</ThemedText>
            </View>
          ) : tasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="clipboard-list" size={40} color={theme.textMuted} />
              <ThemedText style={styles.emptyText} color={theme.textMuted}>
                暂无任务
              </ThemedText>
            </View>
          ) : (
            groupedTasks.map((group) => {
              const isExpanded = expandedPatients.has(group.patient.id);
              return (
                <View key={group.patient.id} style={styles.patientCard}>
                  {/* 病人头部 */}
                  <TouchableOpacity
                    style={styles.patientHeader}
                    onPress={() => togglePatient(group.patient.id)}
                  >
                    <View style={styles.patientInfo}>
                      <View style={styles.bedBadge}>
                        <ThemedText variant="caption" style={styles.bedNumber} color={theme.buttonPrimaryText}>
                          {group.patient.bed_number}
                        </ThemedText>
                      </View>
                      <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                        {group.patient.name}
                      </ThemedText>
                    </View>
                    <View style={styles.patientHeaderRight}>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {group.tasks.length} 个项目
                      </ThemedText>
                      <FontAwesome6
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={14}
                        color={theme.textMuted}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* 任务列表 */}
                  {isExpanded && (
                    <View style={styles.tasksContainer}>
                      {group.tasks.map((task) => {
                        const timer = timers[task.id] || { elapsed: 0, isRunning: false, startTime: null };
                        const needsCollection = task.status === 'needs_collection';

                        return (
                          <View key={task.id} style={styles.taskItem}>
                            <View style={styles.taskLeft}>
                              <FontAwesome6
                                name={getProjectIcon(task.treatment_projects.icon)}
                                size={16}
                                color={needsCollection ? theme.success : theme.primary}
                              />
                              <View style={styles.taskInfo}>
                                <ThemedText variant="body" color={theme.textPrimary} style={styles.taskName}>
                                  {task.treatment_projects.name}
                                </ThemedText>
                                <ThemedText variant="caption" color={theme.textSecondary}>
                                  {task.duration}分钟
                                </ThemedText>
                              </View>
                            </View>
                            <View style={styles.taskRight}>
                              {needsCollection ? (
                                <View style={styles.collectionPrompt}>
                                  <FontAwesome6 name="bell" size={14} color="#F59E0B" />
                                  <ThemedText variant="caption" color="#F59E0B" style={styles.collectionText}>
                                    请取机器
                                  </ThemedText>
                                </View>
                              ) : (
                                <View style={styles.timerDisplay}>
                                  <FontAwesome6
                                    name={timer.isRunning ? "clock" : "hourglass"}
                                    size={14}
                                    color={timer.isRunning ? "#F59E0B" : theme.textMuted}
                                  />
                                  <ThemedText variant="caption" color={theme.textPrimary}>
                                    {formatTime(timer.elapsed)}
                                  </ThemedText>
                                </View>
                              )}
                              <View style={styles.taskActions}>
                                {needsCollection ? (
                                  <TouchableOpacity
                                    style={[styles.timerButton, styles.collectButton]}
                                    onPress={() => collectMachine(task.id)}
                                  >
                                    <FontAwesome6 name="check-double" size={12} color={theme.buttonPrimaryText} />
                                  </TouchableOpacity>
                                ) : !timer.isRunning ? (
                                  <TouchableOpacity
                                    style={[styles.timerButton, styles.startButton]}
                                    onPress={() => startTimer(task.id)}
                                  >
                                    <FontAwesome6 name="play" size={12} color={theme.buttonPrimaryText} />
                                  </TouchableOpacity>
                                ) : (
                                  <View style={styles.timerButtons}>
                                    <TouchableOpacity
                                      style={[styles.timerButton, styles.pauseButton]}
                                      onPress={() => pauseTimer(task.id)}
                                    >
                                      <FontAwesome6 name="pause" size={12} color={theme.buttonPrimaryText} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[styles.timerButton, styles.completeButton]}
                                      onPress={() => completeTimer(task.id)}
                                    >
                                      <FontAwesome6 name="check" size={12} color={theme.buttonPrimaryText} />
                                    </TouchableOpacity>
                                  </View>
                                )}
                                <TouchableOpacity
                                  style={styles.editTaskButton}
                                  onPress={() => openEditTask(task)}
                                >
                                  <FontAwesome6 name="pen" size={12} color={theme.textMuted} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.deleteTaskButton}
                                  onPress={() => deleteTask(task.id, task.treatment_projects.name)}
                                >
                                  <FontAwesome6 name="trash" size={12} color="#EF4444" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* 任务创建模态框 */}
        <Modal
          visible={taskModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setTaskModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalContainer}>
              <ThemedView level="default" style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <ThemedText variant="h4">{editingTask ? '编辑任务' : '创建任务'}</ThemedText>
                  <TouchableOpacity onPress={() => setTaskModalVisible(false)}>
                    <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.formGroup}>
                    <ThemedText variant="caption" color={theme.textSecondary} style={styles.label}>
                      病人姓名 *
                    </ThemedText>
                    <TextInput
                      style={[styles.input, styles.textInput]}
                      value={patientName}
                      onChangeText={setPatientName}
                      placeholder="请输入病人姓名"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedText variant="caption" color={theme.textSecondary} style={styles.label}>
                      床号 *
                    </ThemedText>
                    <TextInput
                      style={[styles.input, styles.textInput]}
                      value={bedNumber}
                      onChangeText={setBedNumber}
                      placeholder="请输入床号"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedText variant="caption" color={theme.textSecondary} style={styles.label}>
                      治疗项目 {editingTask ? '' : '(可多选)'} *
                    </ThemedText>
                    <View style={styles.projectSelector}>
                      {projects.map((project) => (
                        <TouchableOpacity
                          key={project.id}
                          style={[
                            styles.projectOption,
                            selectedProjectIds.includes(project.id) && styles.projectOptionSelected,
                          ]}
                          onPress={() => toggleProject(project.id)}
                        >
                          <FontAwesome6
                            name={getProjectIcon(project.icon)}
                            size={14}
                            color={
                              selectedProjectIds.includes(project.id)
                                ? theme.buttonPrimaryText
                                : theme.textSecondary
                            }
                          />
                          <ThemedText
                            variant="caption"
                            color={
                              selectedProjectIds.includes(project.id)
                                ? theme.buttonPrimaryText
                                : theme.textSecondary
                            }
                          >
                            {project.name}
                          </ThemedText>
                          {selectedProjectIds.includes(project.id) && (
                            <FontAwesome6
                              name="check"
                              size={10}
                              color={theme.buttonPrimaryText}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setTaskModalVisible(false)}
                  >
                    <ThemedText style={styles.cancelButtonText} color={theme.textSecondary}>
                      取消
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleSaveTask}
                  >
                    <ThemedText style={styles.confirmButtonText} color={theme.buttonPrimaryText}>
                      {editingTask ? '保存' : `创建 (${selectedProjectIds.length})`}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </ThemedView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </Screen>
  );
}
