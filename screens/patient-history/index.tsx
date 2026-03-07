import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';

import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';
import { LocalStorageService, Task, TreatmentProject } from '@/services/localStorage';

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

export default function PatientHistoryScreen() {
  const { theme, isDark } = useTheme();
  const router = useSafeRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { patientId, patientName } = useSafeSearchParams<{ patientId: string; patientName: string }>();

  const [history, setHistory] = useState<Record<string, TreatmentTask[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const allTasks = await LocalStorageService.getTasks();
      const projects = await LocalStorageService.getProjects();
      
      const patientTasks = allTasks.filter(t => t.patient_id === parseInt(patientId, 10));
      
      const groupedByDate: Record<string, TreatmentTask[]> = {};
      patientTasks.forEach(task => {
        const project = projects.find(p => p.id === task.project_id);
        const enrichedTask: TreatmentTask = {
          ...task,
          treatment_projects: project ? { ...project } : { id: task.project_id, name: '未知项目', description: '', default_duration: 20, icon: 'notes-medical' },
        };
        
        if (!groupedByDate[task.task_date]) {
          groupedByDate[task.task_date] = [];
        }
        groupedByDate[task.task_date].push(enrichedTask);
      });
      
      setHistory(groupedByDate);
    } catch (error) {
      console.error('Failed to fetch patient history:', error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

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

  const dates = Object.keys(history).sort((a, b) => b.localeCompare(a));

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ThemedView style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome6 name="arrow-left" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <ThemedText variant="h4" color={theme.textPrimary} style={styles.headerTitle}>
            {patientName}
          </ThemedText>
          <View style={{ width: 40 }} />
        </ThemedView>

        <ScrollView style={styles.historyList}>
          {loading ? (
            <View style={styles.emptyContainer}>
              <ThemedText color={theme.textMuted}>加载中...</ThemedText>
            </View>
          ) : dates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="file-medical" size={40} color={theme.textMuted} />
              <ThemedText style={styles.emptyText} color={theme.textMuted}>
                暂无历史记录
              </ThemedText>
            </View>
          ) : (
            dates.map((date) => (
              <View key={date} style={styles.dateSection}>
                <ThemedView style={styles.dateHeader}>
                  <ThemedText variant="bodyMedium" color={theme.primary}>
                    {date}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {history[date].length} 个项目
                  </ThemedText>
                </ThemedView>

                {history[date].map((task) => (
                  <View key={task.id} style={styles.taskItem}>
                    <FontAwesome6
                      name={getProjectIcon(task.treatment_projects.icon)}
                      size={16}
                      color={theme.primary}
                      style={styles.taskIcon}
                    />
                    <ThemedText variant="body" color={theme.textPrimary} style={styles.taskName}>
                      {task.treatment_projects.name}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textSecondary} style={styles.taskDuration}>
                      {task.duration}分钟
                    </ThemedText>
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
              </View>
            ))
          )}
        </ScrollView>
    </Screen>
  );
}
