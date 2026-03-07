import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, BackHandler } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';
import { LocalStorageService, Task as LocalTask, TreatmentProject, Patient } from '@/services/localStorage';

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

interface PatientGroup {
  patient: Task['patients'];
  tasks: Task[];
}

export default function TasksScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<TreatmentProject[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(true);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [expandedPatients, setExpandedPatients] = useState<Set<number>>(new Set());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [timers, setTimers] = useState<Record<number, { elapsed: number; isRunning: boolean; startTime: number | null }>>({});

  const [patientName, setPatientName] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskNotes, setTaskNotes] = useState('');
  const [taskDuration, setTaskDuration] = useState('20');

  const scrollViewRef = useRef<ScrollView>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [projectsData, patientsData, tasksData] = await Promise.all([
        LocalStorageService.getProjects(),
        LocalStorageService.getPatients(),
        LocalStorageService.getTasks(selectedDate),
      ]);
      
      setProjects(projectsData);
      setPatients(patientsData);
      
      const enrichedTasks: Task[] = tasksData.map(task => {
        const patient = patientsData.find(p => p.id === task.patient_id);
        const project = projectsData.find(p => p.id === task.project_id);
        return {
          ...task,
          patients: patient ? { id: patient.id, name: patient.name, bed_number: patient.bed_number } : { id: task.patient_id, name: '未知病人', bed_number: '-' },
          treatment_projects: project ? { ...project } : { id: task.project_id, name: '未知项目', description: '', default_duration: 20, icon: 'notes-medical' },
        };
      });
      
      setTasks(enrichedTasks);
      
      const timerStates: Record<number, { elapsed: number; isRunning: boolean; startTime: number | null }> = {};
      enrichedTasks.forEach((task: Task) => {
        if (task.status === 'in_progress') {
          const startTime = task.started_at ? new Date(task.started_at).getTime() : Date.now();
          const prevElapsed = timers[task.id]?.elapsed || 0;
          timerStates[task.id] = {
            elapsed: prevElapsed,
            isRunning: true,
            startTime,
          };
        } else if (task.status === 'pending' || task.status === 'needs_collection') {
          const prevElapsed = timers[task.id]?.elapsed || 0;
          timerStates[task.id] = {
            elapsed: prevElapsed,
            isRunning: false,
            startTime: null,
          };
        } else {
          timerStates[task.id] = {
            elapsed: 0,
            isRunning: false,
            startTime: null,
          };
        }
      });
      setTimers(timerStates);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      const newDate = dayjs(selectedDate).format('YYYY-MM-DD');
      setSelectedDate(newDate);
    }
  };

  const startTimer = async (taskId: number) => {
    try {
      await LocalStorageService.updateTaskStatus(taskId, 'in_progress');
      setTimers((prev) => ({
        ...prev,
        [taskId]: {
          elapsed: 0,
          isRunning: true,
          startTime: Date.now(),
        },
      }));
      loadData();
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const pauseTimer = async (taskId: number) => {
    try {
      await LocalStorageService.updateTaskStatus(taskId, 'pending');
      setTimers((prev) => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          isRunning: false,
          startTime: null,
        },
      }));
      loadData();
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  };

  const completeTimer = async (taskId: number) => {
    try {
      await LocalStorageService.updateTaskStatus(taskId, 'needs_collection');
      setTimers((prev) => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          isRunning: false,
          startTime: null,
        },
      }));
      loadData();
    } catch (error) {
      console.error('Failed to complete timer:', error);
    }
  };

  const collectMachine = async (taskId: number) => {
    try {
      await LocalStorageService.updateTaskStatus(taskId, 'completed');
      setTimers((prev) => ({
        ...prev,
        [taskId]: {
          elapsed: 0,
          isRunning: false,
          startTime: null,
        },
      }));
      loadData();
    } catch (error) {
      console.error('Failed to collect machine:', error);
    }
  };

  const deleteTask = async (taskId: number, projectName: string) => {
    Alert.alert('确认删除', `确定要删除任务"${projectName}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await LocalStorageService.deleteTask(taskId);
            setTimers((prev) => {
              const newTimers = { ...prev };
              delete newTimers[taskId];
              return newTimers;
            });
            loadData();
          } catch (error) {
            console.error('Failed to delete task:', error);
            Alert.alert('错误', '删除失败，请重试');
          }
        },
      },
    ]);
  };

  const handleSaveTask = async () => {
    if (!patientName.trim() || !bedNumber.trim() || selectedProjectIds.length === 0) {
      Alert.alert('错误', '请填写病人信息并选择至少一个治疗项目');
      return;
    }

    try {
      if (editingTask) {
        await LocalStorageService.updatePatient(editingTask.patient_id, {
          name: patientName.trim(),
          bed_number: bedNumber.trim(),
        });

        await LocalStorageService.updateTask(editingTask.id, {
          duration: parseInt(taskDuration, 10) || 20,
          notes: taskNotes.trim() || null,
        });

        setTaskModalVisible(false);
        resetForm();
        loadData();
      } else {
        let patient = patients.find(p => p.name === patientName.trim() && p.bed_number === bedNumber.trim());
        
        if (!patient) {
          patient = await LocalStorageService.createPatient({
            name: patientName.trim(),
            bed_number: bedNumber.trim(),
          });
        }

        const tasksData = selectedProjectIds.map(projectId => {
          const project = projects.find(p => p.id === projectId);
          return {
            patient_id: patient!.id,
            project_id: projectId,
            task_date: selectedDate,
            duration: project?.default_duration || 20,
            notes: null,
            status: 'pending' as const,
            started_at: null,
            completed_at: null,
            machine_collected_at: null,
          };
        });

        await LocalStorageService.createTasksBatch(tasksData);
        setTaskModalVisible(false);
        resetForm();
        loadData();
      }
    } catch (error) {
      console.error('Failed to save task:', error);
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  const resetForm = () => {
    setPatientName('');
    setBedNumber('');
    setSelectedProjectIds([]);
    setEditingTask(null);
    setTaskNotes('');
    setTaskDuration('20');
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setPatientName(task.patients.name);
    setBedNumber(task.patients.bed_number);
    setSelectedProjectIds([task.project_id]);
    setTaskNotes(task.notes || '');
    setTaskDuration(task.duration.toString());
    setTaskModalVisible(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    };
    return iconMap[iconName] || 'notes-medical';
  };

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
        <ThemedView style={styles.header}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <FontAwesome6 name="calendar" size={18} color={theme.primary} />
            <ThemedText style={styles.dateText}>{selectedDate}</ThemedText>
            <FontAwesome6 name="chevron-down" size={12} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.iconButton, styles.addButton]}
              onPress={() => setTaskModalVisible(true)}
            >
              <FontAwesome6 name="plus" size={16} color={theme.buttonPrimaryText} />
            </TouchableOpacity>
          </View>
        </ThemedView>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.taskList}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
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

        {showDatePicker && (
          <DateTimePicker
            value={dayjs(selectedDate).toDate()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

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

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
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

                  {editingTask && (
                    <>
                      <View style={styles.formGroup}>
                        <ThemedText variant="caption" color={theme.textSecondary} style={styles.label}>
                          治疗时长（分钟）
                        </ThemedText>
                        <TextInput
                          style={[styles.input, styles.textInput]}
                          value={taskDuration}
                          onChangeText={setTaskDuration}
                          placeholder="请输入治疗时长"
                          placeholderTextColor={theme.textMuted}
                          keyboardType="number-pad"
                        />
                      </View>

                      <View style={styles.formGroup}>
                        <ThemedText variant="caption" color={theme.textSecondary} style={styles.label}>
                          备注
                        </ThemedText>
                        <TextInput
                          style={[styles.input, styles.textInput, styles.textArea]}
                          value={taskNotes}
                          onChangeText={setTaskNotes}
                          placeholder="请输入备注信息"
                          placeholderTextColor={theme.textMuted}
                          multiline
                          numberOfLines={3}
                          textAlignVertical="top"
                        />
                      </View>
                    </>
                  )}
                </ScrollView>

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
