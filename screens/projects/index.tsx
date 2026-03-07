import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, TouchableOpacity, Alert, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';
import { LocalStorageService, TreatmentProject } from '@/services/localStorage';

const ICON_OPTIONS = [
  { id: 'brain', name: '经颅磁', icon: 'brain' },
  { id: 'heart', name: '生物反馈', icon: 'heart-pulse' },
  { id: 'muscle', name: '肌肉训练', icon: 'hand-fist' },
  { id: 'speech', name: '言语治疗', icon: 'comment-medical' },
  { id: 'balance', name: '平衡训练', icon: 'scale-balanced' },
  { id: 'breathe', name: '呼吸训练', icon: 'wind' },
  { id: 'cognitive', name: '认知训练', icon: 'lightbulb' },
  { id: 'physical', name: '物理治疗', icon: 'person-walking' },
  { id: 'hand', name: '手部康复', icon: 'hand' },
  { id: 'foot', name: '足部康复', icon: 'shoe-prints' },
  { id: 'neck', name: '颈部治疗', icon: 'user-injured' },
  { id: 'back', name: '脊柱康复', icon: 'spine' },
  { id: 'joint', name: '关节治疗', icon: 'bone' },
  { id: 'electro', name: '电疗', icon: 'bolt' },
  { id: 'heat', name: '热疗', icon: 'temperature-high' },
  { id: 'ultrasound', name: '超声治疗', icon: 'wave-square' },
  { id: 'traction', name: '牵引治疗', icon: 'arrows-alt-v' },
  { id: 'massage', name: '推拿按摩', icon: 'hands' },
  { id: 'acupuncture', name: '针灸', icon: 'syringe' },
  { id: 'cupping', name: '拔罐', icon: 'circle' },
  { id: 'moxibustion', name: '艾灸', icon: 'fire' },
  { id: 'water', name: '水疗', icon: 'water' },
  { id: 'oxygen', name: '氧疗', icon: 'lungs' },
  { id: 'light', name: '光疗', icon: 'sun' },
  { id: 'magnetic', name: '磁疗', icon: 'magnet' },
  { id: 'laser', name: '激光治疗', icon: 'bolt-lightning' },
  { id: 'cryo', name: '冷疗', icon: 'snowflake' },
  { id: 'vibration', name: '振动治疗', icon: 'wave-circle' },
  { id: 'stretch', name: '拉伸训练', icon: 'arrows-left-right' },
  { id: 'posture', name: '姿势矫正', icon: 'person' },
];

export default function ProjectsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [projects, setProjects] = useState<TreatmentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<TreatmentProject | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultDuration, setDefaultDuration] = useState('20');
  const [selectedIcon, setSelectedIcon] = useState('brain');

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const projectsData = await LocalStorageService.getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setDefaultDuration('20');
    setSelectedIcon('brain');
    setEditingProject(null);
  };

  const openAddProject = () => {
    resetForm();
    setProjectModalVisible(true);
  };

  const openEditProject = (project: TreatmentProject) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setDefaultDuration(project.default_duration.toString());
    setSelectedIcon(project.icon);
    setProjectModalVisible(true);
  };

  const handleSaveProject = async () => {
    if (!name.trim() || !defaultDuration.trim()) {
      Alert.alert('错误', '请填写所有必填字段');
      return;
    }

    try {
      if (editingProject) {
        await LocalStorageService.updateProject(editingProject.id, {
          name: name.trim(),
          description: description.trim(),
          default_duration: parseInt(defaultDuration.trim(), 10),
          icon: selectedIcon,
        });
      } else {
        await LocalStorageService.createProject({
          name: name.trim(),
          description: description.trim(),
          default_duration: parseInt(defaultDuration.trim(), 10),
          icon: selectedIcon,
        });
      }
      setProjectModalVisible(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      console.error('Failed to save project:', error);
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  const deleteProject = async (projectId: number, projectName: string) => {
    Alert.alert('确认删除', `确定要删除项目"${projectName}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const success = await LocalStorageService.deleteProject(projectId);
            if (success) {
              fetchProjects();
            } else {
              Alert.alert('删除失败', '请重试');
            }
          } catch (error) {
            console.error('Failed to delete project:', error);
            Alert.alert('错误', '删除失败，请重试');
          }
        },
      },
    ]);
  };

  const getIconComponent = (iconName: string) => {
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

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ThemedView style={styles.header}>
        <ThemedText variant="h3" color={theme.textPrimary}>
          治疗项目管理
        </ThemedText>
        <TouchableOpacity
          style={[styles.iconButton, styles.addButton]}
          onPress={openAddProject}
        >
          <FontAwesome6 name="plus" size={16} color={theme.buttonPrimaryText} />
        </TouchableOpacity>
      </ThemedView>

        <ScrollView 
          style={styles.projectList}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          {loading ? (
            <View style={styles.emptyContainer}>
              <ThemedText color={theme.textMuted}>加载中...</ThemedText>
            </View>
          ) : projects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="clipboard-list" size={40} color={theme.textMuted} />
              <ThemedText style={styles.emptyText} color={theme.textMuted}>
                暂无治疗项目
              </ThemedText>
              <TouchableOpacity style={styles.emptyButton} onPress={openAddProject}>
                <ThemedText style={styles.emptyButtonText} color={theme.buttonPrimaryText}>
                  创建项目
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            projects.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={styles.projectItem}
                onPress={() => openEditProject(project)}
              >
                <View style={styles.projectLeft}>
                  <View style={styles.projectIconWrapper}>
                    <FontAwesome6
                      name={getIconComponent(project.icon)}
                      size={18}
                      color={theme.primary}
                    />
                  </View>
                  <View style={styles.projectInfo}>
                    <ThemedText variant="body" color={theme.textPrimary} style={styles.projectName}>
                      {project.name}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textSecondary}>
                      默认时长: {project.default_duration}分钟
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    deleteProject(project.id, project.name);
                  }}
                >
                  <FontAwesome6 name="xmark" size={14} color={theme.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <Modal
          visible={projectModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setProjectModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalContainer}>
              <ThemedView level="default" style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <ThemedText variant="h4">
                    {editingProject ? '编辑项目' : '创建项目'}
                  </ThemedText>
                  <TouchableOpacity onPress={() => setProjectModalVisible(false)}>
                    <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  <View style={styles.formGroup}>
                    <ThemedText variant="caption" color={theme.textSecondary} style={styles.label}>
                      项目名称 *
                    </ThemedText>
                    <TextInput
                      style={[styles.input, styles.textInput]}
                      value={name}
                      onChangeText={setName}
                      placeholder="请输入项目名称"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedText variant="caption" color={theme.textSecondary} style={styles.label}>
                      项目描述
                    </ThemedText>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={description}
                      onChangeText={setDescription}
                      placeholder="请输入项目描述"
                      placeholderTextColor={theme.textMuted}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedText variant="caption" color={theme.textSecondary} style={styles.label}>
                      默认时长 (分钟) *
                    </ThemedText>
                    <TextInput
                      style={[styles.input, styles.textInput]}
                      value={defaultDuration}
                      onChangeText={setDefaultDuration}
                      placeholder="请输入时长"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="number-pad"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedText variant="caption" color={theme.textSecondary} style={styles.label}>
                      项目图标 *
                    </ThemedText>
                    <View style={styles.iconSelector}>
                      {ICON_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.iconOption,
                            selectedIcon === option.id && styles.iconOptionSelected,
                          ]}
                          onPress={() => setSelectedIcon(option.id)}
                        >
                          <FontAwesome6
                            name={option.icon as any}
                            size={16}
                            color={
                              selectedIcon === option.id
                                ? theme.buttonPrimaryText
                                : theme.textSecondary
                            }
                          />
                          <ThemedText
                            variant="caption"
                            color={
                              selectedIcon === option.id
                                ? theme.buttonPrimaryText
                                : theme.textSecondary
                            }
                            style={styles.iconOptionText}
                          >
                            {option.name}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setProjectModalVisible(false)}
                  >
                    <ThemedText style={styles.cancelButtonText} color={theme.textSecondary}>
                      取消
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleSaveProject}
                  >
                    <ThemedText style={styles.confirmButtonText} color={theme.buttonPrimaryText}>
                      保存
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </ThemedView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
    </Screen>
  );
}
