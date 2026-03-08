import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, BackHandler } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useFocusEffect } from '@react-navigation/native';

import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';
import { LocalStorageService, Task as LocalTask, TreatmentProject, Patient, PatientProject, DateUtils, ImportUtils } from '@/services/localStorage';

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
    projects?: PatientProject[];
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
  const [selectedDate, setSelectedDate] = useState(DateUtils.getToday());
  const [loading, setLoading] = useState(true);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [expandedPatients, setExpandedPatients] = useState<Set<number>>(new Set());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(dayjs());

  const [timers, setTimers] = useState<Record<number, { elapsed: number; isRunning: boolean; startTime: number | null; totalElapsed: number }>>({});

  const [patientName, setPatientName] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskNotes, setTaskNotes] = useState('');
  const [taskDuration, setTaskDuration] = useState('20');
  
  // 编辑病人所有任务的状态
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null);
  const [editingPatientTasks, setEditingPatientTasks] = useState<Task[]>([]);

  // 导入今日任务相关状态
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importMode, setImportMode] = useState<'patients' | 'history'>('patients');
  const [importSearchQuery, setImportSearchQuery] = useState('');
  const [selectedPatientsForImport, setSelectedPatientsForImport] = useState<number[]>([]);
  const [selectedProjectsByPatient, setSelectedProjectsByPatient] = useState<Record<number, number[]>>({});
  const [activePatientForProjects, setActivePatientForProjects] = useState<number | null>(null);
  
  // 历史任务导入相关状态
  const [historyTasks, setHistoryTasks] = useState<Task[]>([]);
  const [selectedHistoryTasks, setSelectedHistoryTasks] = useState<number[]>([]);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>('');
  const [importCalendarMonth, setImportCalendarMonth] = useState(dayjs());

  // 批量粘贴导入相关状态
  const [batchImportModalVisible, setBatchImportModalVisible] = useState(false);
  const [batchImportText, setBatchImportText] = useState('');
  const [parsedBatchData, setParsedBatchData] = useState<Array<{ bedNumber: string; name: string; matchedProjects: Array<{ projectId: number; projectName: string; notes: string }> }>>([]);

  const scrollViewRef = useRef<ScrollView>(null);

  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const [projectsData, patientsData, tasksData] = await Promise.all([
        LocalStorageService.getProjects(),
        LocalStorageService.getPatients(),
        LocalStorageService.getTasks(selectedDate),
      ]);
      
      setProjects(projectsData);
      setPatients(patientsData);
      
      // 清理重复任务：只保留每个病人-项目组合的第一个任务
      const seen = new Set<string>();
      const duplicates: number[] = [];
      const uniqueTasks = tasksData.filter(t => {
        const key = `${t.patient_id}-${t.project_id}`;
        if (seen.has(key)) {
          duplicates.push(t.id);
          return false;
        }
        seen.add(key);
        return true;
      });
      
      // 删除重复的任务
      if (duplicates.length > 0) {
        for (const taskId of duplicates) {
          await LocalStorageService.deleteTaskWithLog(taskId);
        }
        console.log(`Deleted ${duplicates.length} duplicate tasks`);
      }
      
      const enrichedTasks: Task[] = uniqueTasks.map(task => {
        const patient = patientsData.find(p => p.id === task.patient_id);
        const project = projectsData.find(p => p.id === task.project_id);
        return {
          ...task,
          patients: patient ? { id: patient.id, name: patient.name, bed_number: patient.bed_number, projects: patient.projects } : { id: task.patient_id, name: '未知病人', bed_number: '-', projects: [] },
          treatment_projects: project ? { ...project } : { id: task.project_id, name: '未知项目', description: '', default_duration: 20, icon: 'notes-medical' },
        };
      });
      
      setTasks(enrichedTasks);
      
      // 默认展开所有病人
      const allPatientIds = new Set(enrichedTasks.map(t => t.patient_id));
      setExpandedPatients(allPatientIds);
      
      const timerStates: Record<number, { elapsed: number; isRunning: boolean; startTime: number | null; totalElapsed: number }> = {};
      enrichedTasks.forEach((task: Task) => {
        // 计算已累积的时间（从 started_at 到 completed_at 或 now）
        let totalElapsed = 0;
        if (task.started_at) {
          const startTime = new Date(task.started_at).getTime();
          const endTime = task.completed_at ? new Date(task.completed_at).getTime() : Date.now();
          totalElapsed = Math.floor((endTime - startTime) / 1000);
        }

        if (task.status === 'in_progress') {
          const startTime = Date.now();
          timerStates[task.id] = {
            elapsed: 0, // 当前这次运行的经过时间
            isRunning: true,
            startTime,
            totalElapsed, // 总累积时间
          };
        } else if (task.status === 'pending' || task.status === 'needs_collection') {
          timerStates[task.id] = {
            elapsed: 0,
            isRunning: false,
            startTime: null,
            totalElapsed,
          };
        } else {
          timerStates[task.id] = {
            elapsed: 0,
            isRunning: false,
            startTime: null,
            totalElapsed: 0,
          };
        }
      });
      setTimers(timerStates);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedDate])
  );

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

  const startTimer = async (taskId: number) => {
    try {
      await LocalStorageService.updateTaskStatusWithLog(taskId, 'in_progress');
      setTimers((prev) => {
        const currentTotal = prev[taskId]?.totalElapsed || 0;
        return {
          ...prev,
          [taskId]: {
            elapsed: 0,
            isRunning: true,
            startTime: Date.now(),
            totalElapsed: currentTotal,
          },
        };
      });
      loadData(false);
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const pauseTimer = async (taskId: number) => {
    try {
      // 暂停时保存已累积的时间
      setTimers((prev) => {
        const timer = prev[taskId];
        if (!timer) return prev;

        const currentElapsed = timer.isRunning && timer.startTime
          ? Math.floor((Date.now() - timer.startTime) / 1000)
          : 0;
        const newTotalElapsed = timer.totalElapsed + currentElapsed;

        return {
          ...prev,
          [taskId]: {
            ...timer,
            elapsed: 0,
            isRunning: false,
            startTime: null,
            totalElapsed: newTotalElapsed,
          },
        };
      });

      await LocalStorageService.updateTaskStatusWithLog(taskId, 'pending');
      loadData(false);
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  };

  const completeTimer = async (taskId: number) => {
    try {
      await LocalStorageService.updateTaskStatusWithLog(taskId, 'needs_collection');
      setTimers((prev) => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          isRunning: false,
          startTime: null,
        },
      }));
      loadData(false);
    } catch (error) {
      console.error('Failed to complete timer:', error);
    }
  };

  const collectMachine = async (taskId: number) => {
    try {
      await LocalStorageService.updateTaskStatusWithLog(taskId, 'completed');
      setTimers((prev) => ({
        ...prev,
        [taskId]: {
          elapsed: 0,
          isRunning: false,
          startTime: null,
        },
      }));
      loadData(false);
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
            await LocalStorageService.deleteTaskWithLog(taskId);
            setTimers((prev) => {
              const newTimers = { ...prev };
              delete newTimers[taskId];
              return newTimers;
            });
            loadData(false);
          } catch (error) {
            console.error('Failed to delete task:', error);
            Alert.alert('错误', '删除失败，请重试');
          }
        },
      },
    ]);
  };

  const handleSaveTask = async () => {
    if (!patientName.trim() || !bedNumber.trim()) {
      Alert.alert('错误', '请填写病人信息');
      return;
    }

    try {
      if (editingPatientId) {
        // 选择今天做哪些项目（只操作任务，不修改病人信息）
        
        // 获取当前日期的现有任务
        const existingTasks = await LocalStorageService.getTasks(selectedDate);
        const existingTaskProjectIds = existingTasks
          .filter(t => t.patient_id === editingPatientId)
          .map(t => t.project_id);

        // 要添加的项目（选中但不存在）
        const toAdd = editingPatientTasks.filter(t => !existingTaskProjectIds.includes(t.project_id));
        // 要删除的任务（存在但未选中）
        const toDelete = existingTasks.filter(t => 
          t.patient_id === editingPatientId && 
          !editingPatientTasks.some(et => et.project_id === t.project_id)
        );

        // 删除任务
        for (const task of toDelete) {
          await LocalStorageService.deleteTaskWithLog(task.id);
        }

        // 添加新任务（使用病人项目中的时长和备注）
        for (const task of toAdd) {
          const patient = patients.find(p => p.id === editingPatientId);
          const patientProject = patient?.projects?.find(p => p.project_id === task.project_id);
          
          await LocalStorageService.createTask({
            patient_id: editingPatientId,
            project_id: task.project_id,
            task_date: selectedDate,
            duration: patientProject?.time_required || 20,
            notes: patientProject?.notes || null,
            status: 'pending',
            started_at: null,
            completed_at: null,
            machine_collected_at: null,
          });
        }

        setTaskModalVisible(false);
        setEditingPatientId(null);
        setEditingPatientTasks([]);
        resetForm();
        loadData(false);
      } else if (editingTask) {
        // 编辑单个任务模式
        await LocalStorageService.updatePatientWithLog(editingTask.patient_id, {
          name: patientName.trim(),
          bed_number: bedNumber.trim(),
        });

        await LocalStorageService.updateTask(editingTask.id, {
          duration: parseInt(taskDuration, 10) || 20,
          notes: taskNotes.trim() || null,
        });

        setTaskModalVisible(false);
        resetForm();
        loadData(false);
      } else {
        // 创建模式：需要选择至少一个项目
        if (selectedProjectIds.length === 0) {
          Alert.alert('错误', '请至少选择一个治疗项目');
          return;
        }
        let patient = patients.find(p => p.name === patientName.trim() && p.bed_number === bedNumber.trim());
        
        if (!patient) {
          patient = await LocalStorageService.createPatientWithLog({
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

        await LocalStorageService.createTasksBatchWithLog(tasksData);
        setTaskModalVisible(false);
        resetForm();
        loadData(false);
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

  // 导入今日任务相关方法
  const openImportModal = () => {
    setImportMode('patients');
    setImportSearchQuery('');
    setSelectedPatientsForImport([]);
    setSelectedProjectsByPatient({});
    setActivePatientForProjects(null);
    setHistoryTasks([]);
    setSelectedHistoryTasks([]);
    setDatePickerVisibility(false);
    setSelectedHistoryDate('');
    setImportModalVisible(true);
  };

  const closeImportModal = () => {
    setImportModalVisible(false);
    setImportMode('patients');
    setImportSearchQuery('');
    setSelectedPatientsForImport([]);
    setSelectedProjectsByPatient({});
    setActivePatientForProjects(null);
    setHistoryTasks([]);
    setSelectedHistoryTasks([]);
    setDatePickerVisibility(false);
    setSelectedHistoryDate('');
  };

  // 加载历史任务
  const loadHistoryTasks = async (date: string) => {
    if (!date) return;
    try {
      const tasks = await LocalStorageService.getTasks(date);
      // 去重：只保留每个病人-项目组合的第一个任务
      const seen = new Set<string>();
      const uniqueTasks = tasks.filter(t => {
        const key = `${t.patient_id}-${t.project_id}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
      setHistoryTasks(uniqueTasks);
      setSelectedHistoryTasks(uniqueTasks.map(t => t.id));
    } catch (error) {
      console.error('Failed to load history tasks:', error);
    }
  };

  // 显示导入日期选择器
  const showImportDatePickerModal = () => {
    setDatePickerVisibility(true);
  };

  // 隐藏导入日期选择器
  const hideImportDatePickerModal = () => {
    setDatePickerVisibility(false);
  };

  // 切换历史任务选择
  const toggleHistoryTask = (taskId: number) => {
    setSelectedHistoryTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  // 导入历史任务
  const handleImportHistoryTasks = async () => {
    if (selectedHistoryTasks.length === 0) {
      Alert.alert('提示', '请至少选择一个任务');
      return;
    }

    try {
      // 获取当前日期的现有任务，用于检查重复
      const existingTasks = await LocalStorageService.getTasks(selectedDate);
      const existingKeys = new Set(
        existingTasks.map(t => `${t.patient_id}-${t.project_id}`)
      );

      const tasksToImport = historyTasks
        .filter(t => selectedHistoryTasks.includes(t.id))
        .filter(t => {
          // 检查是否已存在相同的病人-项目组合
          const key = `${t.patient_id}-${t.project_id}`;
          if (existingKeys.has(key)) {
            return false; // 已存在，跳过
          }
          existingKeys.add(key); // 添加到集合，防止本次导入重复
          return true;
        })
        .map(t => ({
          patient_id: t.patient_id,
          project_id: t.project_id,
          task_date: selectedDate,
          duration: t.duration,
          notes: t.notes,
          status: 'pending' as const,
          started_at: null,
          completed_at: null,
          machine_collected_at: null,
        }));

      if (tasksToImport.length === 0) {
        Alert.alert('提示', '选中的任务都已存在，无需重复导入');
        return;
      }

      await LocalStorageService.createTasksBatchWithLog(tasksToImport);
      closeImportModal();
      loadData(false);
      Alert.alert('成功', `已导入 ${tasksToImport.length} 个任务`);
    } catch (error) {
      console.error('Failed to import history tasks:', error);
      Alert.alert('错误', '导入失败，请重试');
    }
  };

  // 切换选中医人
  const togglePatientSelection = (patientId: number) => {
    setSelectedPatientsForImport(prev => {
      if (prev.includes(patientId)) {
        // 取消选择时，清除该病人的项目选择
        const newProjectsByPatient = { ...selectedProjectsByPatient };
        delete newProjectsByPatient[patientId];
        setSelectedProjectsByPatient(newProjectsByPatient);
        if (activePatientForProjects === patientId) {
          setActivePatientForProjects(null);
        }
        return prev.filter(id => id !== patientId);
      } else {
        // 选择病人时，默认选中所有项目
        const patient = patients.find(p => p.id === patientId);
        if (patient?.projects) {
          setSelectedProjectsByPatient(prev => ({
            ...prev,
            [patientId]: patient.projects!.map(p => p.project_id)
          }));
        }
        setActivePatientForProjects(patientId);
        return [...prev, patientId];
      }
    });
  };

  // 点击病人行（不切换复选框，只显示项目）
  const selectPatientForProjectView = (patientId: number) => {
    setActivePatientForProjects(patientId);
    // 如果该病人还没被选中，默认选中其所有项目
    if (!selectedPatientsForImport.includes(patientId)) {
      const patient = patients.find(p => p.id === patientId);
      if (patient?.projects && !selectedProjectsByPatient[patientId]) {
        setSelectedProjectsByPatient(prev => ({
          ...prev,
          [patientId]: patient.projects!.map(p => p.project_id)
        }));
      }
    }
  };

  // 切换项目选择
  const toggleProjectSelection = (patientId: number, projectId: number) => {
    setSelectedProjectsByPatient(prev => {
      const currentProjects = prev[patientId] || [];
      if (currentProjects.includes(projectId)) {
        return {
          ...prev,
          [patientId]: currentProjects.filter(id => id !== projectId)
        };
      } else {
        return {
          ...prev,
          [patientId]: [...currentProjects, projectId]
        };
      }
    });
  };

  // 全选/取消全选所有病人的所有项目
  const toggleSelectAll = () => {
    if (selectedPatientsForImport.length === filteredPatientsForImport.length) {
      // 取消全选
      setSelectedPatientsForImport([]);
      setSelectedProjectsByPatient({});
      setActivePatientForProjects(null);
    } else {
      // 全选所有病人及其项目
      const allPatientIds = filteredPatientsForImport.map(p => p.id);
      const allProjectsByPatient: Record<number, number[]> = {};
      filteredPatientsForImport.forEach(patient => {
        if (patient.projects) {
          allProjectsByPatient[patient.id] = patient.projects.map(p => p.project_id);
        }
      });
      setSelectedPatientsForImport(allPatientIds);
      setSelectedProjectsByPatient(allProjectsByPatient);
      if (filteredPatientsForImport.length > 0) {
        setActivePatientForProjects(filteredPatientsForImport[0].id);
      }
    }
  };

  const handleImportTasks = async () => {
    const totalTasks = Object.values(selectedProjectsByPatient).flat().length;
    if (totalTasks === 0) {
      Alert.alert('提示', '请至少选择一个病人的一个项目');
      return;
    }

    try {
      const tasksData: Array<{
        patient_id: number;
        project_id: number;
        task_date: string;
        duration: number;
        notes: string | null;
        status: 'pending';
        started_at: null;
        completed_at: null;
        machine_collected_at: null;
      }> = [];

      Object.entries(selectedProjectsByPatient).forEach(([patientId, projectIds]) => {
        const patient = patients.find(p => p.id === parseInt(patientId));
        projectIds.forEach(projectId => {
          const patientProject = patient?.projects?.find(p => p.project_id === projectId);
          tasksData.push({
            patient_id: parseInt(patientId),
            project_id: projectId,
            task_date: selectedDate,
            duration: patientProject?.time_required || 20,
            notes: patientProject?.notes || null,
            status: 'pending' as const,
            started_at: null,
            completed_at: null,
            machine_collected_at: null,
          });
        });
      });

      await LocalStorageService.createTasksBatchWithLog(tasksData);
      closeImportModal();
      loadData();
      Alert.alert('成功', `已导入 ${tasksData.length} 个任务`);
    } catch (error) {
      console.error('Failed to import tasks:', error);
      Alert.alert('错误', '导入失败，请重试');
    }
  };

  // 搜索过滤病人（使用病人列表页相同的逻辑）
  const filteredPatientsForImport = useMemo(() => {
    if (!importSearchQuery.trim()) return patients;
    const query = importSearchQuery.toLowerCase().trim();
    return patients.filter(p => {
      const nameLower = p.name.toLowerCase();
      const bedLower = p.bed_number.toLowerCase();
      return nameLower.includes(query) || bedLower.includes(query);
    });
  }, [patients, importSearchQuery]);

  // 解析批量导入文本 - 使用工具函数
  const parseBatchImportText = useCallback((text: string) => {
    return ImportUtils.parseBatchImportText(text, projects);
  }, [projects]);

  // 处理批量导入
  const handleBatchImport = async () => {
    if (parsedBatchData.length === 0) {
      Alert.alert('提示', '没有可导入的数据');
      return;
    }

    try {
      let importedCount = 0;
      
      for (const item of parsedBatchData) {
        // 查找病人（只按姓名匹配，床号可能变化）
        let patient = patients.find(p => p.name === item.name);
        
        if (!patient) {
          // 创建新病人
          patient = await LocalStorageService.createPatientWithLog({
            name: item.name,
            bed_number: item.bedNumber,
            projects: [],
          });
        } else {
          // 更新床号（可能变化了）
          if (patient.bed_number !== item.bedNumber) {
            await LocalStorageService.updatePatientWithLog(patient.id, {
              bed_number: item.bedNumber,
            });
            patient.bed_number = item.bedNumber;
          }
        }

        // 导入匹配的项目（完全替换：本次导入的项目就是当前项目）
        const newProjects = item.matchedProjects.map(matchedProj => {
          const matchedProject = projects.find(p => p.id === matchedProj.projectId);
          return {
            project_id: matchedProj.projectId,
            project_name: matchedProj.projectName,
            notes: matchedProj.notes || '',
            time_required: matchedProject?.default_duration || 20,
          };
        });
        
        // 更新病人的项目列表（完全替换，updatePatientWithLog 会自动记录变更）
        await LocalStorageService.updatePatientWithLog(patient.id, {
          projects: newProjects,
        });
        
        // 创建今日任务
        for (const matchedProj of item.matchedProjects) {
          const matchedProject = projects.find(p => p.id === matchedProj.projectId);
          
          if (matchedProject) {
            // 检查是否已存在任务
            const existingTasks = await LocalStorageService.getTasks(selectedDate);
            const exists = existingTasks.some(t => 
              t.patient_id === patient!.id && t.project_id === matchedProject.id
            );

            if (!exists) {
              await LocalStorageService.createTask({
                patient_id: patient!.id,
                project_id: matchedProject.id,
                task_date: selectedDate,
                duration: matchedProject.default_duration || 20,
                notes: matchedProj.notes || null,
                status: 'pending',
                started_at: null,
                completed_at: null,
                machine_collected_at: null,
              });
              importedCount++;
            }
          }
        }
      }

      setBatchImportModalVisible(false);
      setBatchImportText('');
      setParsedBatchData([]);
      loadData();
      Alert.alert('成功', `已导入 ${importedCount} 个任务`);
    } catch (error) {
      console.error('Failed to batch import:', error);
      Alert.alert('错误', '导入失败，请重试');
    }
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
              style={[styles.iconButton, { backgroundColor: theme.primary, marginRight: 8 }]}
              onPress={() => setBatchImportModalVisible(true)}
            >
              <FontAwesome6 name="paste" size={16} color={theme.buttonPrimaryText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, styles.addButton]}
              onPress={openImportModal}
            >
              <FontAwesome6 name="file-import" size={16} color={theme.buttonPrimaryText} />
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
                  <View style={styles.patientHeader}>
                    <TouchableOpacity 
                      style={styles.patientInfo}
                      onPress={() => togglePatient(group.patient.id)}
                    >
                      <View style={styles.bedBadge}>
                        <ThemedText variant="caption" style={styles.bedNumber} color={theme.buttonPrimaryText}>
                          {group.patient.bed_number}
                        </ThemedText>
                      </View>
                      <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                        {group.patient.name}
                      </ThemedText>
                    </TouchableOpacity>
                    <View style={styles.patientHeaderRight}>
                      <TouchableOpacity
                        style={{ padding: 4, marginRight: 8 }}
                        onPress={() => {
                          // 打开编辑病人所有任务的模态框
                          setEditingPatientId(group.patient.id);
                          setPatientName(group.patient.name);
                          setBedNumber(group.patient.bed_number);
                          // 从病人的所有项目中初始化编辑任务
                          const patient = patients.find(p => p.id === group.patient.id);
                          const patientProjects = patient?.projects || [];
                          const initialTasks = patientProjects.map(pp => {
                            const existingTask = group.tasks.find(t => t.project_id === pp.project_id);
                            if (existingTask) {
                              return existingTask;
                            }
                            const project = projects.find(p => p.id === pp.project_id);
                            return {
                              id: Date.now() + pp.project_id,
                              patient_id: group.patient.id,
                              project_id: pp.project_id,
                              task_date: selectedDate,
                              duration: pp.time_required || project?.default_duration || 20,
                              notes: pp.notes || '',
                              status: 'pending' as const,
                              started_at: null,
                              completed_at: null,
                              machine_collected_at: null,
                              treatment_projects: project || { id: pp.project_id, name: pp.project_name, description: '', default_duration: pp.time_required || 20, icon: 'notes-medical' },
                              patients: { id: group.patient.id, name: group.patient.name, bed_number: group.patient.bed_number },
                            };
                          });
                          setEditingPatientTasks(initialTasks);
                          setTaskModalVisible(true);
                        }}
                      >
                        <FontAwesome6 name="pen" size={14} color={theme.textMuted} />
                      </TouchableOpacity>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {group.tasks.length} 个项目
                      </ThemedText>
                      <TouchableOpacity
                        style={{ padding: 4, marginLeft: 8 }}
                        onPress={() => togglePatient(group.patient.id)}
                      >
                        <FontAwesome6
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={14}
                          color={theme.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {isExpanded && (
                    <View style={styles.tasksContainer}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {group.tasks.map((task) => {
                          const timer = timers[task.id] || { elapsed: 0, isRunning: false, startTime: null };
                          const needsCollection = task.status === 'needs_collection';
                          const patient = patients.find(p => p.id === task.patient_id);
                          const patientProject = patient?.projects?.find(p => p.project_id === task.project_id);
                          const displayNotes = patientProject?.notes || task.notes;

                          return (
                            <View key={`task-${group.patient.id}-${task.id}`} style={{ width: '50%', padding: 4 }}>
                              <View style={{ 
                                backgroundColor: theme.backgroundRoot, 
                                borderRadius: 8, 
                                padding: 8,
                                borderWidth: 1,
                                borderColor: timer.isRunning ? theme.primary : theme.borderLight
                              }}>
                                {/* 第一排：项目名称 | 倒计时 | 按钮 */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <ThemedText variant="caption" color={theme.textPrimary} style={{ fontWeight: '500', flex: 1 }} numberOfLines={1}>
                                    {task.treatment_projects.name}
                                  </ThemedText>
                                  
                                  <ThemedText variant="caption" color={theme.textPrimary} style={{ marginHorizontal: 8 }}>
                                    {formatTime((timer.totalElapsed || 0) + timer.elapsed)}
                                  </ThemedText>

                                  {needsCollection ? (
                                    <TouchableOpacity
                                      style={[styles.timerButton, { width: 48, height: 24, backgroundColor: '#F59E0B' }]}
                                      onPress={() => collectMachine(task.id)}
                                    >
                                      <ThemedText variant="caption" color="#fff" style={{ fontSize: 11, fontWeight: '500' }}>
                                        取机
                                      </ThemedText>
                                    </TouchableOpacity>
                                  ) : task.status === 'completed' ? (
                                    <View style={[styles.timerButton, { width: 48, height: 24, backgroundColor: theme.success }]}>
                                      <ThemedText variant="caption" color="#fff" style={{ fontSize: 11, fontWeight: '500' }}>
                                        完成
                                      </ThemedText>
                                    </View>
                                  ) : !timer.isRunning ? (
                                    <TouchableOpacity
                                      style={[styles.timerButton, { width: 48, height: 24, backgroundColor: theme.primary }]}
                                      onPress={() => startTimer(task.id)}
                                    >
                                      <ThemedText variant="caption" color="#fff" style={{ fontSize: 11, fontWeight: '500' }}>
                                        开始
                                      </ThemedText>
                                    </TouchableOpacity>
                                  ) : (
                                    <View style={{ flexDirection: 'row' }}>
                                      <TouchableOpacity
                                        style={{ width: 32, height: 28, backgroundColor: '#F59E0B', marginRight: 4, borderRadius: 4, justifyContent: 'center', alignItems: 'center' }}
                                        onPress={() => pauseTimer(task.id)}
                                      >
                                        <ThemedText variant="caption" color="#fff" style={{ fontSize: 10, fontWeight: 'bold' }}>||</ThemedText>
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        style={{ width: 32, height: 28, backgroundColor: theme.success, borderRadius: 4, justifyContent: 'center', alignItems: 'center' }}
                                        onPress={() => completeTimer(task.id)}
                                      >
                                        <ThemedText variant="caption" color="#fff" style={{ fontSize: 10, fontWeight: 'bold' }}>✓</ThemedText>
                                      </TouchableOpacity>
                                    </View>
                                  )}
                                </View>

                                {/* 第二排：备注（有备注才显示） */}
                                {displayNotes && (
                                  <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: 4 }} numberOfLines={1}>
                                    {displayNotes}
                                  </ThemedText>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* 主界面日期选择器 - 月视图 */}
        {showDatePicker && (
          <Modal
            visible={showDatePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <TouchableOpacity 
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            >
              <View style={{ backgroundColor: theme.backgroundDefault, padding: 20, borderRadius: 12, width: '90%', maxWidth: 380 }}>
                {/* 头部 - 月份切换 */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <TouchableOpacity onPress={() => setCalendarMonth(calendarMonth.subtract(1, 'month'))}>
                    <FontAwesome6 name="chevron-left" size={20} color={theme.textPrimary} />
                  </TouchableOpacity>
                  <ThemedText variant="h4">{calendarMonth.format('YYYY年M月')}</ThemedText>
                  <TouchableOpacity onPress={() => setCalendarMonth(calendarMonth.add(1, 'month'))}>
                    <FontAwesome6 name="chevron-right" size={20} color={theme.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* 星期标题 */}
                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                    <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                      <ThemedText variant="caption" color={theme.textMuted}>{day}</ThemedText>
                    </View>
                  ))}
                </View>

                {/* 日期网格 */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {(() => {
                    const startOfMonth = calendarMonth.startOf('month');
                    const endOfMonth = calendarMonth.endOf('month');
                    const startDay = startOfMonth.day(); // 0 = Sunday
                    const daysInMonth = calendarMonth.daysInMonth();
                    
                    // 空白占位（月初之前的空位）
                    const blanks = Array.from({ length: startDay }, (_, i) => (
                      <View key={`main-blank-${i}`} style={{ width: '14.28%', aspectRatio: 1 }} />
                    ));
                    
                    // 日期按钮
                    const days = Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const dateStr = calendarMonth.date(day).format('YYYY-MM-DD');
                      const isSelected = selectedDate === dateStr;
                      const isToday = dateStr === dayjs().format('YYYY-MM-DD');
                      
                      return (
                        <TouchableOpacity
                          key={`main-date-${dateStr}`}
                          style={{
                            width: '14.28%',
                            aspectRatio: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          onPress={() => {
                            setSelectedDate(dateStr);
                            setShowDatePicker(false);
                          }}
                        >
                          <View
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: isSelected ? theme.primary : 'transparent',
                              borderWidth: isToday && !isSelected ? 1 : 0,
                              borderColor: theme.primary,
                            }}
                          >
                            <ThemedText
                              variant="body"
                              color={isSelected ? theme.buttonPrimaryText : isToday ? theme.primary : theme.textPrimary}
                            >
                              {day}
                            </ThemedText>
                          </View>
                        </TouchableOpacity>
                      );
                    });
                    
                    return [...blanks, ...days];
                  })()}
                </View>

                {/* 底部按钮 */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                  <TouchableOpacity 
                    style={{ padding: 8 }}
                    onPress={() => {
                      setSelectedDate(dayjs().format('YYYY-MM-DD'));
                      setCalendarMonth(dayjs());
                    }}
                  >
                    <ThemedText color={theme.primary}>今天</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ padding: 8 }}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <ThemedText color={theme.textSecondary}>取消</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        <Modal
          visible={taskModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setTaskModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ThemedView level="default" style={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}>
                <View style={styles.modalHeader}>
                  <ThemedText variant="h4">
                    {editingPatientId ? `选择今日任务` : '创建任务'}
                  </ThemedText>
                  <TouchableOpacity onPress={() => {
                    setTaskModalVisible(false);
                    setEditingPatientId(null);
                    setEditingPatientTasks([]);
                  }}>
                    <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* 显示病人信息（只读） */}
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText variant="caption" color={theme.textSecondary}>床号</ThemedText>
                    <ThemedText variant="body" color={theme.textPrimary} style={{ 
                      backgroundColor: theme.backgroundRoot,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}>
                      {bedNumber}
                    </ThemedText>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText variant="caption" color={theme.textSecondary}>姓名</ThemedText>
                    <ThemedText variant="body" color={theme.textPrimary} style={{ 
                      backgroundColor: theme.backgroundRoot,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}>
                      {patientName}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={{ 
                      padding: 10, 
                      backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                      borderRadius: 8,
                      marginBottom: 0,
                    }}
                    onPress={() => {
                      Alert.alert(
                        '确认删除',
                        `确定要删除 ${patientName} 的所有任务吗？`,
                        [
                          { text: '取消', style: 'cancel' },
                          {
                            text: '删除',
                            style: 'destructive',
                            onPress: async () => {
                              for (const task of editingPatientTasks) {
                                if (task.id) {
                                  await LocalStorageService.deleteTaskWithLog(task.id);
                                }
                              }
                              setTaskModalVisible(false);
                              setEditingPatientId(null);
                              setEditingPatientTasks([]);
                              loadData(false);
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <FontAwesome6 name="trash" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {editingPatientId && (
                  <>
                    <View style={{ gap: 8 }}>
                      <ThemedText variant="body" color={theme.textSecondary} style={{ fontWeight: '500' }}>
                        治疗项目（点击选择今天要做的）
                      </ThemedText>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {(() => {
                          const patient = patients.find(p => p.id === editingPatientId);
                          const patientProjects = patient?.projects || [];
                          return patientProjects.map((pp) => {
                            const isSelected = editingPatientTasks.some(t => t.project_id === pp.project_id);
                            return (
                              <TouchableOpacity
                                key={pp.project_id}
                                style={{
                                  paddingHorizontal: 12,
                                  paddingVertical: 4,
                                  borderRadius: 16,
                                  backgroundColor: isSelected ? theme.primary : theme.backgroundRoot,
                                  borderWidth: 1,
                                  borderColor: isSelected ? theme.primary : theme.border,
                                }}
                                onPress={() => {
                                  if (isSelected) {
                                    setEditingPatientTasks(prev => prev.filter(t => t.project_id !== pp.project_id));
                                  } else {
                                    const project = projects.find(p => p.id === pp.project_id);
                                    const newTask = {
                                      id: Date.now() + pp.project_id,
                                      patient_id: editingPatientId!,
                                      project_id: pp.project_id,
                                      task_date: selectedDate,
                                      duration: pp.time_required || project?.default_duration || 20,
                                      notes: pp.notes || '',
                                      status: 'pending' as const,
                                      started_at: null,
                                      completed_at: null,
                                      machine_collected_at: null,
                                      treatment_projects: project || { id: pp.project_id, name: pp.project_name, description: '', default_duration: pp.time_required || 20, icon: 'notes-medical' },
                                      patients: { id: editingPatientId!, name: patientName, bed_number: bedNumber },
                                    };
                                    setEditingPatientTasks(prev => [...prev, newTask]);
                                  }
                                }}
                              >
                                <ThemedText
                                  variant="caption"
                                  color={isSelected ? theme.buttonPrimaryText : theme.textSecondary}
                                >
                                  {pp.project_name}
                                </ThemedText>
                              </TouchableOpacity>
                            );
                          });
                        })()}
                      </View>
                    </View>

                    {editingPatientTasks.length > 0 && (
                      <View style={{ gap: 6 }}>
                        <ThemedText variant="caption" color={theme.textSecondary}>
                          已选择 {editingPatientTasks.length} 个项目
                        </ThemedText>
                        {editingPatientTasks.map((task) => {
                          const project = projects.find(p => p.id === task.project_id);
                          return (
                            <View key={task.id || `new-${task.project_id}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <ThemedText variant="caption" color={theme.textPrimary} style={{ flex: 1, fontSize: 13 }}>
                                {project?.name || task.treatment_projects?.name || '?'}
                                {task.notes ? ` (${task.notes})` : ''}
                              </ThemedText>
                              <TouchableOpacity
                                style={{ width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                onPress={() => {
                                  setEditingPatientTasks(prev => prev.filter(t => t.project_id !== task.project_id));
                                }}
                              >
                                <FontAwesome6 name="xmark" size={10} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </>
                )}

                {!editingPatientId && (
                    <View style={styles.formGroup}>
                      <ThemedText variant="caption" color={theme.textSecondary} style={styles.label}>
                        治疗项目 (可多选) *
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
                  )}

                  {editingTask && (
                    <>
                      <View style={styles.formGroup}>
                        <ThemedText variant="caption" color={theme.textSecondary} style={styles.label}>
                          治疗项目
                        </ThemedText>
                        <View style={styles.projectSelector}>
                          {projects
                            .filter((p) => selectedProjectIds.includes(p.id))
                            .map((project) => (
                              <View
                                key={project.id}
                                style={[styles.projectOption, styles.projectOptionSelected]}
                              >
                                <FontAwesome6
                                  name={getProjectIcon(project.icon)}
                                  size={14}
                                  color={theme.buttonPrimaryText}
                                />
                                <ThemedText variant="caption" color={theme.buttonPrimaryText}>
                                  {project.name}
                                </ThemedText>
                              </View>
                            ))}
                        </View>
                      </View>

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

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setTaskModalVisible(false);
                      setEditingPatientId(null);
                      setEditingPatientTasks([]);
                    }}
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
                      {editingPatientId ? '保存' : editingTask ? '保存' : `创建 (${selectedProjectIds.length})`}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </ThemedView>
            </View>
          </View>
        </Modal>

        {/* 导入今日任务模态框 */}
        <Modal
          visible={importModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeImportModal}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { height: '75%', maxHeight: 600 }]}>
              <ThemedView level="default" style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <ThemedText variant="h4">导入今日任务</ThemedText>
                  <TouchableOpacity onPress={closeImportModal}>
                    <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* 导入日期选择器弹窗 */}
                <Modal
                  visible={isDatePickerVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={hideImportDatePickerModal}
                >
                  <TouchableOpacity 
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    activeOpacity={1}
                    onPress={hideImportDatePickerModal}
                  >
                    <View style={{ backgroundColor: theme.backgroundDefault, padding: 20, borderRadius: 12, width: '90%', maxWidth: 380 }}>
                      {/* 头部 - 月份切换 */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <TouchableOpacity onPress={() => setImportCalendarMonth(importCalendarMonth.subtract(1, 'month'))}>
                          <FontAwesome6 name="chevron-left" size={20} color={theme.textPrimary} />
                        </TouchableOpacity>
                        <ThemedText variant="h4">{importCalendarMonth.format('YYYY年M月')}</ThemedText>
                        <TouchableOpacity onPress={() => setImportCalendarMonth(importCalendarMonth.add(1, 'month'))}>
                          <FontAwesome6 name="chevron-right" size={20} color={theme.textPrimary} />
                        </TouchableOpacity>
                      </View>

                      {/* 星期标题 */}
                      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                          <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                            <ThemedText variant="caption" color={theme.textMuted}>{day}</ThemedText>
                          </View>
                        ))}
                      </View>

                      {/* 日期网格 */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {(() => {
                          const startOfMonth = importCalendarMonth.startOf('month');
                          const startDay = startOfMonth.day();
                          const daysInMonth = importCalendarMonth.daysInMonth();
                          
                          const blanks = Array.from({ length: startDay }, (_, i) => (
                            <View key={`import-blank-${i}`} style={{ width: '14.28%', aspectRatio: 1 }} />
                          ));
                          
                          const days = Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const dateStr = importCalendarMonth.date(day).format('YYYY-MM-DD');
                            const isSelected = selectedHistoryDate === dateStr;
                            const isToday = dateStr === dayjs().format('YYYY-MM-DD');
                            
                            return (
                              <TouchableOpacity
                                key={`import-${dateStr}`}
                                style={{
                                  width: '14.28%',
                                  aspectRatio: 1,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                }}
                                onPress={() => {
                                  setSelectedHistoryDate(dateStr);
                                  setImportMode('history');
                                  loadHistoryTasks(dateStr);
                                  hideImportDatePickerModal();
                                }}
                              >
                                <View
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: isSelected ? theme.primary : 'transparent',
                                    borderWidth: isToday && !isSelected ? 1 : 0,
                                    borderColor: theme.primary,
                                  }}
                                >
                                  <ThemedText
                                    variant="body"
                                    color={isSelected ? theme.buttonPrimaryText : isToday ? theme.primary : theme.textPrimary}
                                  >
                                    {day}
                                  </ThemedText>
                                </View>
                              </TouchableOpacity>
                            );
                          });
                          
                          return [...blanks, ...days];
                        })()}
                      </View>

                      {/* 底部按钮 */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                        <TouchableOpacity 
                          onPress={() => {
                            const today = dayjs().format('YYYY-MM-DD');
                            setSelectedHistoryDate(today);
                            setImportCalendarMonth(dayjs());
                            setImportMode('history');
                            loadHistoryTasks(today);
                            hideImportDatePickerModal();
                          }}
                        >
                          <ThemedText color={theme.primary}>今天</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={hideImportDatePickerModal}>
                          <ThemedText color={theme.textSecondary}>取消</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Modal>

                {/* 搜索框 - 带日期选择按钮 */}
                <View style={{ padding: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: theme.backgroundRoot, borderRadius: 8 }}>
                    <TouchableOpacity 
                      onPress={showImportDatePickerModal}
                      style={{ marginRight: 8 }}
                    >
                      <FontAwesome6 
                        name="calendar-days" 
                        size={18} 
                        color={importMode === 'history' ? theme.primary : theme.textMuted} 
                      />
                    </TouchableOpacity>
                    <TextInput
                      style={{ flex: 1, fontSize: 15, color: theme.textPrimary }}
                      value={importSearchQuery}
                      onChangeText={(text) => {
                        setImportSearchQuery(text);
                        if (text === '') {
                          // 清空搜索时，如果有选择日期则保持历史模式，否则切换到病人模式
                          if (!selectedHistoryDate) {
                            setImportMode('patients');
                          }
                        }
                      }}
                      placeholder={importMode === 'history' ? "在历史任务中搜索..." : "搜索病人姓名或床号..."}
                      placeholderTextColor={theme.textMuted}
                    />
                    {importSearchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setImportSearchQuery('')}>
                        <FontAwesome6 name="xmark" size={14} color={theme.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {selectedHistoryDate && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                      <ThemedText variant="caption" color={theme.primary}>
                        已选择: {selectedHistoryDate}
                      </ThemedText>
                      <TouchableOpacity onPress={() => { setSelectedHistoryDate(''); setHistoryTasks([]); setImportMode('patients'); }}>
                        <ThemedText variant="caption" color={theme.textMuted}>清除</ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {importMode === 'history' ? (
                  /* 历史任务列表 */
                  <>
                    <ScrollView style={{ flex: 1, paddingHorizontal: 8 }}>
                      {historyTasks.length === 0 ? (
                        <View style={styles.emptyContainer}>
                          <FontAwesome6 name="clipboard" size={40} color={theme.textMuted} />
                          <ThemedText style={styles.emptyText} color={theme.textMuted}>
                            该日期没有任务
                          </ThemedText>
                        </View>
                      ) : (
                        (() => {
                          // 过滤任务（按内容搜索）
                          const filteredTasks = importSearchQuery
                            ? historyTasks.filter(task => {
                                const patient = patients.find(p => p.id === task.patient_id);
                                const project = projects.find(p => p.id === task.project_id);
                                const query = importSearchQuery.toLowerCase();
                                return (
                                  patient?.name.toLowerCase().includes(query) ||
                                  patient?.bed_number.toLowerCase().includes(query) ||
                                  project?.name.toLowerCase().includes(query)
                                );
                              })
                            : historyTasks;
                          
                          if (filteredTasks.length === 0) {
                            return (
                              <View style={styles.emptyContainer}>
                                <ThemedText color={theme.textMuted}>未找到匹配的内容</ThemedText>
                              </View>
                            );
                          }
                          
                          // 按病人ID分组，并对每个病人的项目去重（只保留一个项目类型）
                          const groupedByPatient = filteredTasks.reduce((acc, task) => {
                            const patient = patients.find(p => p.id === task.patient_id);
                            const patientId = task.patient_id;
                            if (!acc[patientId]) {
                              acc[patientId] = {
                                patient,
                                tasks: []
                              };
                            }
                            // 检查该项目是否已存在，避免重复
                            const exists = acc[patientId].tasks.some(t => t.project_id === task.project_id);
                            if (!exists) {
                              acc[patientId].tasks.push(task);
                            }
                            return acc;
                          }, {} as Record<number, { patient: Patient | undefined; tasks: Task[] }>);
                          
                          return Object.entries(groupedByPatient).map(([patientId, { patient, tasks }]) => {
                            // 检查该病人的所有任务是否都被选中
                            const allTaskIds = tasks.map(t => t.id);
                            const allSelected = allTaskIds.every(id => selectedHistoryTasks.includes(id));
                            const someSelected = allTaskIds.some(id => selectedHistoryTasks.includes(id));
                            
                            const patientName = patient?.name || '未知病人';
                            
                            return (
                              <TouchableOpacity
                                key={`history-patient-${patientId}`}
                                style={styles.importPatientItem}
                                onPress={() => {
                                  // 切换该病人所有任务的选中状态
                                  if (allSelected) {
                                    // 如果全部选中，则取消全选
                                    setSelectedHistoryTasks(prev => prev.filter(id => !allTaskIds.includes(id)));
                                  } else {
                                    // 否则全选
                                    setSelectedHistoryTasks(prev => [...new Set([...prev, ...allTaskIds])]);
                                  }
                                }}
                              >
                                <View style={styles.importPatientItemLeft}>
                                  <View style={[styles.checkbox, allSelected && styles.checkboxChecked, someSelected && !allSelected && { backgroundColor: theme.primary, borderColor: theme.primary, opacity: 0.5 }]}>
                                    {allSelected && <FontAwesome6 name="check" size={12} color="#fff" />}
                                    {someSelected && !allSelected && <FontAwesome6 name="check" size={12} color="#fff" />}
                                  </View>
                                  <View style={styles.bedBadgeSmall}>
                                    <ThemedText variant="caption" color={theme.buttonPrimaryText}>
                                      {patient?.bed_number || '?'}
                                    </ThemedText>
                                  </View>
                                  <ThemedText variant="body" color={theme.textPrimary} style={styles.importPatientName}>
                                    {patientName}
                                  </ThemedText>
                                </View>
                                <View style={styles.importPatientItemRight}>
                                  <View style={styles.importProjectsRow}>
                                    {tasks.map((task) => {
                                      const project = projects.find(p => p.id === task.project_id);
                                      const isTaskSelected = selectedHistoryTasks.includes(task.id);
                                      return (
                                        <TouchableOpacity
                                          key={`history-task-${patientId}-${task.id}-${task.project_id}`}
                                          style={[
                                            styles.importProjectTag,
                                            isTaskSelected && styles.importProjectTagSelected
                                          ]}
                                          onPress={(e) => {
                                            e.stopPropagation();
                                            toggleHistoryTask(task.id);
                                          }}
                                        >
                                          <ThemedText 
                                            variant="caption" 
                                            color={isTaskSelected ? theme.buttonPrimaryText : theme.textSecondary}
                                          >
                                            {project?.name || '未知项目'}
                                          </ThemedText>
                                        </TouchableOpacity>
                                      );
                                    })}
                                  </View>
                                </View>
                              </TouchableOpacity>
                            );
                          });
                        })()
                      )}
                    </ScrollView>

                    {/* 底部按钮 */}
                    <View style={styles.modalFooter}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={closeImportModal}
                      >
                        <ThemedText color={theme.textSecondary}>取消</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.confirmButton]}
                        onPress={handleImportHistoryTasks}
                      >
                        <ThemedText color={theme.buttonPrimaryText}>
                          导入 ({selectedHistoryTasks.length})
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  /* 病人列表导入 */
                  <>
                    {/* 病人列表 */}
                    <ScrollView style={{ flex: 1, paddingHorizontal: 12 }}>
                      {filteredPatientsForImport.length === 0 ? (
                        <View style={styles.emptyContainer}>
                          <FontAwesome6 name="users" size={40} color={theme.textMuted} />
                          <ThemedText style={styles.emptyText} color={theme.textMuted}>
                            {importSearchQuery ? '未找到匹配的病人' : '点击日历选择历史任务，或输入搜索病人'}
                          </ThemedText>
                        </View>
                      ) : (
                        filteredPatientsForImport.map((patient) => {
                          const isPatientSelected = selectedPatientsForImport.includes(patient.id);
                          const patientProjects = patient.projects || [];
                          const selectedProjects = selectedProjectsByPatient[patient.id] || [];
                          
                          return (
                            <View key={patient.id} style={styles.importPatientItem}>
                              <TouchableOpacity 
                                style={styles.importPatientItemLeft}
                                onPress={() => togglePatientSelection(patient.id)}
                              >
                                <View style={[styles.checkbox, isPatientSelected && styles.checkboxChecked]}>
                                  {isPatientSelected && <FontAwesome6 name="check" size={12} color="#fff" />}
                                </View>
                                <View style={styles.bedBadgeSmall}>
                                  <ThemedText variant="caption" color={theme.buttonPrimaryText}>
                                    {patient.bed_number}
                                  </ThemedText>
                                </View>
                                <ThemedText variant="body" color={theme.textPrimary} style={styles.importPatientName}>
                                  {patient.name}
                                </ThemedText>
                              </TouchableOpacity>
                              <View style={styles.importPatientItemRight}>
                                {patientProjects.length > 0 ? (
                                  <View style={styles.importProjectsRow}>
                                    {patientProjects.map((pp) => {
                                      const isProjectSelected = selectedProjects.includes(pp.project_id);
                                      return (
                                        <TouchableOpacity
                                          key={pp.project_id}
                                          style={[
                                            styles.importProjectTag,
                                            isProjectSelected && styles.importProjectTagSelected
                                          ]}
                                          onPress={() => toggleProjectSelection(patient.id, pp.project_id)}
                                        >
                                          <ThemedText 
                                            variant="caption" 
                                            color={isProjectSelected ? theme.buttonPrimaryText : theme.textSecondary}
                                          >
                                            {pp.project_name}
                                          </ThemedText>
                                        </TouchableOpacity>
                                      );
                                    })}
                                  </View>
                                ) : (
                                  <ThemedText variant="caption" color={theme.textMuted}>无项目</ThemedText>
                                )}
                              </View>
                            </View>
                          );
                        })
                      )}
                    </ScrollView>

                    {/* 底部按钮 */}
                    <View style={styles.modalFooter}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={closeImportModal}
                      >
                        <ThemedText color={theme.textSecondary}>取消</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.confirmButton]}
                        onPress={handleImportTasks}
                      >
                        <ThemedText color={theme.buttonPrimaryText}>
                          导入 ({Object.values(selectedProjectsByPatient).flat().length})
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </ThemedView>
            </View>
          </View>
        </Modal>

        {/* 批量粘贴导入模态框 */}
        <Modal
          visible={batchImportModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setBatchImportModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { height: '80%', maxHeight: 700 }]}>
              <ThemedView level="default" style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <ThemedText variant="h4">批量导入</ThemedText>
                  <TouchableOpacity onPress={() => setBatchImportModalVisible(false)}>
                    <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  {/* 粘贴区域 */}
                  <View style={{ padding: 12 }}>
                    <ThemedText variant="caption" color={theme.textSecondary} style={{ marginBottom: 8 }}>
                      粘贴文本（格式：床号 姓名 项目1 项目2...）
                    </ThemedText>
                    <TextInput
                      style={{
                        backgroundColor: theme.backgroundRoot,
                        borderRadius: 8,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: theme.border,
                        minHeight: 120,
                        color: theme.textPrimary,
                        fontSize: 14,
                        textAlignVertical: 'top',
                      }}
                      multiline
                      placeholder={`例如：
7-6 石光春 生反 m下 经颅磁（左额叶背外侧） 气压
7-8 唐星玲 生反 m下
7-10 朱朝铭 生反6`}
                      placeholderTextColor={theme.textMuted}
                      value={batchImportText}
                      onChangeText={(text) => {
                        setBatchImportText(text);
                        const parsed = parseBatchImportText(text);
                        setParsedBatchData(parsed);
                      }}
                    />
                  </View>

                  {/* 解析结果预览 */}
                  {parsedBatchData.length > 0 && (
                    <View style={{ padding: 12 }}>
                      <ThemedText variant="body" color={theme.textPrimary} style={{ marginBottom: 8, fontWeight: '500' }}>
                        识别结果（{parsedBatchData.length} 个病人）
                      </ThemedText>
                      {parsedBatchData.map((item, index) => (
                        <View
                          key={index}
                          style={{
                            backgroundColor: theme.backgroundRoot,
                            borderRadius: 8,
                            padding: 10,
                            marginBottom: 8,
                            borderWidth: 1,
                            borderColor: theme.border,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <View style={[styles.bedBadgeSmall, { marginRight: 8 }]}>
                              <ThemedText variant="caption" color={theme.buttonPrimaryText}>
                                {item.bedNumber}
                              </ThemedText>
                            </View>
                            <ThemedText variant="body" color={theme.textPrimary}>
                              {item.name}
                            </ThemedText>
                          </View>
                          {item.matchedProjects.length > 0 ? (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                              {item.matchedProjects.map((proj, idx) => (
                                <View
                                  key={idx}
                                  style={{
                                    backgroundColor: theme.primary + '20',
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: 4,
                                  }}
                                >
                                  <ThemedText variant="caption" color={theme.primary}>
                                    {proj.projectName}
                                    {proj.notes ? ` (${proj.notes})` : ''}
                                  </ThemedText>
                                </View>
                              ))}
                            </View>
                          ) : (
                            <ThemedText variant="caption" color={theme.textMuted}>
                              未匹配到系统项目
                            </ThemedText>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </ScrollView>

                {/* 底部按钮 */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setBatchImportModalVisible(false);
                      setBatchImportText('');
                      setParsedBatchData([]);
                    }}
                  >
                    <ThemedText color={theme.textSecondary}>取消</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleBatchImport}
                  >
                    <ThemedText color={theme.buttonPrimaryText}>
                      导入 ({parsedBatchData.reduce((sum, item) => sum + item.matchedProjects.length, 0)})
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
