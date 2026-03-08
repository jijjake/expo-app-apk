import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

const STORAGE_KEYS = {
  PROJECTS: '@projects',
  PATIENTS: '@patients',
  TASKS: '@tasks',
  CHANGE_LOGS: '@change_logs',
};

export interface TreatmentProject {
  id: number;
  name: string;
  description: string;
  default_duration: number;
  icon: string;
}

export interface PatientProject {
  project_id: number;
  project_name: string;
  notes: string;
  time_required: number;
}

export interface Patient {
  id: number;
  name: string;
  bed_number: string;
  projects: PatientProject[];
  is_deleted?: boolean;
  deleted_at?: string | null;
}

export interface Task {
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
  created_at: string;
}

export interface ChangeLog {
  id: number;
  entity_type: 'patient' | 'task' | 'project';
  entity_id: number;
  action: 'create' | 'update' | 'delete';
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  description: string | null;
  related_entity_type: string | null;
  related_entity_id: number | null;
  created_at: string;
}

const DEFAULT_PROJECTS: TreatmentProject[] = [
  { id: 1, name: '脑功能训练', description: '认知功能康复训练', default_duration: 30, icon: 'brain' },
  { id: 2, name: '心脏康复', description: '心血管功能康复', default_duration: 20, icon: 'heart' },
  { id: 3, name: '肌力训练', description: '肌肉力量训练', default_duration: 25, icon: 'muscle' },
  { id: 4, name: '言语治疗', description: '语言功能康复', default_duration: 20, icon: 'speech' },
  { id: 5, name: '平衡训练', description: '平衡能力训练', default_duration: 15, icon: 'balance' },
  { id: 6, name: '呼吸训练', description: '呼吸功能训练', default_duration: 15, icon: 'breathe' },
  { id: 7, name: '认知训练', description: '认知能力训练', default_duration: 20, icon: 'cognitive' },
  { id: 8, name: '物理治疗', description: '物理康复治疗', default_duration: 30, icon: 'physical' },
];

// ==================== 日期工具函数 ====================
export const DateUtils = {
  // 统一日期格式：YYYY-MM-DD
  formatDate(date: Date | string | number): string {
    return dayjs(date).format('YYYY-MM-DD');
  },

  // 获取今天日期字符串
  getToday(): string {
    return dayjs().format('YYYY-MM-DD');
  },

  // 获取ISO格式（带时间）
  getISOString(date?: Date | string): string {
    return dayjs(date).toISOString();
  },

  // 比较两个日期是否同一天
  isSameDay(date1: Date | string, date2: Date | string): boolean {
    return dayjs(date1).format('YYYY-MM-DD') === dayjs(date2).format('YYYY-MM-DD');
  },

  // 日期加减
  addDays(date: Date | string, days: number): string {
    return dayjs(date).add(days, 'day').format('YYYY-MM-DD');
  },

  // 获取星期几
  getDayOfWeek(date: Date | string): string {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return days[dayjs(date).day()];
  },
};

// ==================== 批量导入工具函数 ====================
export interface BatchImportItem {
  bedNumber: string;
  name: string;
  matchedProjects: Array<{
    projectId: number;
    projectName: string;
    notes: string;
  }>;
}

export const ImportUtils = {
  // 解析批量导入文本
  parseBatchImportText(text: string, availableProjects: TreatmentProject[]): BatchImportItem[] {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const parsed: BatchImportItem[] = [];

    for (const line of lines) {
      // 匹配格式：床号 姓名 项目1 项目2 ...
      // 例如：7-6 石光春 生反 m下 经颅磁（左额叶背外侧） 气压
      const parts = line.trim().split(/\s+/);

      if (parts.length >= 2) {
        const bedNumber = parts[0];
        const name = parts[1];
        const matchedProjects: Array<{ projectId: number; projectName: string; notes: string }> = [];

        // 从第3部分开始查找项目
        for (let i = 2; i < parts.length; i++) {
          const part = parts[i];

          // 提取备注（括号内的内容）
          let notes = '';
          let projectPart = part;
          const bracketMatch = part.match(/(.+?)（(.+?)）/);
          if (bracketMatch) {
            projectPart = bracketMatch[1];
            notes = bracketMatch[2];
          }

          // 直接匹配系统预设的项目名称
          const matchedProject = availableProjects.find(p =>
            p.name === projectPart
          );

          if (matchedProject) {
            matchedProjects.push({
              projectId: matchedProject.id,
              projectName: matchedProject.name,
              notes: notes,
            });
          }
        }

        if (bedNumber && name) {
          parsed.push({
            bedNumber,
            name,
            matchedProjects,
          });
        }
      }
    }

    return parsed;
  },

  // 检查任务是否重复
  isTaskDuplicate(
    patientId: number,
    projectId: number,
    taskDate: string,
    existingTasks: Task[]
  ): boolean {
    return existingTasks.some(t =>
      t.patient_id === patientId &&
      t.project_id === projectId &&
      t.task_date === taskDate
    );
  },

  // 生成任务唯一键
  getTaskKey(patientId: number, projectId: number, taskDate: string): string {
    return `${patientId}-${projectId}-${taskDate}`;
  },
};

// ID 生成器，从现有数据中计算下一个 ID
const getNextId = (items: { id: number }[]): number => {
  if (items.length === 0) return 100;
  return Math.max(...items.map(item => item.id), 99) + 1;
};

export const LocalStorageService = {
  async initialize(): Promise<void> {
    try {
      // 只在键完全不存在时初始化，避免覆盖已有数据
      const keys = await AsyncStorage.getAllKeys();
      
      if (!keys.includes(STORAGE_KEYS.PROJECTS)) {
        await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(DEFAULT_PROJECTS));
        console.log('Initialized projects with defaults');
      }
      
      if (!keys.includes(STORAGE_KEYS.PATIENTS)) {
        await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify([]));
        console.log('Initialized empty patients');
      }
      
      if (!keys.includes(STORAGE_KEYS.TASKS)) {
        await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
        console.log('Initialized empty tasks');
      }

      if (!keys.includes(STORAGE_KEYS.CHANGE_LOGS)) {
        await AsyncStorage.setItem(STORAGE_KEYS.CHANGE_LOGS, JSON.stringify([]));
        console.log('Initialized empty change logs');
      }
      
      console.log('Storage initialized, existing keys:', keys);
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  },

  async getProjects(): Promise<TreatmentProject[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);
      return data ? JSON.parse(data) : DEFAULT_PROJECTS;
    } catch (error) {
      console.error('Failed to get projects:', error);
      return DEFAULT_PROJECTS;
    }
  },

  async createProject(project: Omit<TreatmentProject, 'id'>): Promise<TreatmentProject> {
    const projects = await this.getProjects();
    const newProject: TreatmentProject = {
      ...project,
      id: getNextId(projects),
    };
    projects.push(newProject);
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return newProject;
  },

  async updateProject(id: number, updates: Partial<TreatmentProject>): Promise<TreatmentProject | null> {
    const projects = await this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    projects[index] = { ...projects[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return projects[index];
  },

  async deleteProject(id: number): Promise<boolean> {
    const projects = await this.getProjects();
    const filtered = projects.filter(p => p.id !== id);
    if (filtered.length === projects.length) return false;
    
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
    return true;
  },

  async getPatients(includeDeleted = false): Promise<Patient[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PATIENTS);
      const patients: Patient[] = data ? JSON.parse(data) : [];
      if (includeDeleted) {
        return patients;
      }
      return patients.filter(p => !p.is_deleted);
    } catch (error) {
      console.error('Failed to get patients:', error);
      return [];
    }
  },

  async getPatientById(id: number, includeDeleted = false): Promise<Patient | null> {
    const patients = await this.getPatients(includeDeleted);
    return patients.find(p => p.id === id) || null;
  },

  async createPatient(patient: Omit<Patient, 'id'>): Promise<Patient> {
    const patients = await this.getPatients();
    const newPatient: Patient = {
      ...patient,
      id: getNextId(patients),
      projects: patient.projects || [],
    };
    patients.push(newPatient);
    await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    return newPatient;
  },

  async updatePatient(id: number, updates: Partial<Patient>): Promise<Patient | null> {
    const patients = await this.getPatients();
    const index = patients.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    patients[index] = { ...patients[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    return patients[index];
  },

  async deletePatient(id: number, softDelete = true): Promise<boolean> {
    try {
      const patients = await this.getPatients(true); // 获取所有病人包括已删除
      console.log('Deleting patient id:', id, 'Total patients:', patients.length);
      
      const patientIndex = patients.findIndex(p => p.id === id);
      if (patientIndex === -1) {
        console.log('Patient not found:', id);
        return false;
      }
      
      if (softDelete) {
        // 软删除：标记为已删除，保留数据
        patients[patientIndex] = {
          ...patients[patientIndex],
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        };
        console.log('Soft deleted patient:', id);
      } else {
        // 硬删除：彻底删除（可选）
        patients.splice(patientIndex, 1);
        console.log('Hard deleted patient:', id);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
      
      // 注意：不删除相关任务，保留历史记录
      // 任务中仍然可以通过 patient_id 关联到已删除的病人
      
      return true;
    } catch (error) {
      console.error('Error in deletePatient:', error);
      throw error;
    }
  },

  async restorePatient(id: number): Promise<boolean> {
    try {
      const patients = await this.getPatients(true);
      const patientIndex = patients.findIndex(p => p.id === id);
      
      if (patientIndex === -1) return false;
      
      patients[patientIndex] = {
        ...patients[patientIndex],
        is_deleted: false,
        deleted_at: null,
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
      return true;
    } catch (error) {
      console.error('Error in restorePatient:', error);
      throw error;
    }
  },

  async getTasks(date?: string): Promise<Task[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      const tasks: Task[] = data ? JSON.parse(data) : [];
      
      if (date) {
        return tasks.filter(t => t.task_date === date);
      }
      return tasks;
    } catch (error) {
      console.error('Failed to get tasks:', error);
      return [];
    }
  },

  async getTaskById(id: number): Promise<Task | null> {
    const tasks = await this.getTasks();
    return tasks.find(t => t.id === id) || null;
  },

  async createTask(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
    const tasks = await this.getTasks();
    const newTask: Task = {
      ...task,
      id: getNextId(tasks),
      created_at: new Date().toISOString(),
    };
    tasks.push(newTask);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return newTask;
  },

  async createTasksBatch(tasksData: Array<Omit<Task, 'id' | 'created_at'>>): Promise<Task[]> {
    const tasks = await this.getTasks();
    let nextId = getNextId(tasks);
    const newTasks: Task[] = tasksData.map(taskData => ({
      ...taskData,
      id: nextId++,
      created_at: new Date().toISOString(),
    }));
    
    tasks.push(...newTasks);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return newTasks;
  },

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | null> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    tasks[index] = { ...tasks[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return tasks[index];
  },

  async updateTaskStatus(id: number, status: Task['status']): Promise<Task | null> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    const now = new Date().toISOString();
    const updates: Partial<Task> = { status };
    
    if (status === 'in_progress') {
      updates.started_at = now;
    } else if (status === 'completed') {
      updates.completed_at = now;
    } else if (status === 'needs_collection') {
      updates.machine_collected_at = now;
    }
    
    tasks[index] = { ...tasks[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return tasks[index];
  },

  async deleteTask(id: number): Promise<boolean> {
    const tasks = await this.getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    if (filtered.length === tasks.length) return false;
    
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
    return true;
  },

  async getPatientWithTasks(patientId: number): Promise<{ patient: Patient | null; tasks: Task[] }> {
    const patients = await this.getPatients();
    const patient = patients.find(p => p.id === patientId) || null;
    const tasks = await this.getTasks();
    const patientTasks = tasks.filter(t => t.patient_id === patientId);
    
    return { patient, tasks: patientTasks };
  },

  async createChangeLog(changeLog: Omit<ChangeLog, 'id' | 'created_at'>): Promise<ChangeLog> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CHANGE_LOGS);
      const changeLogs: ChangeLog[] = data ? JSON.parse(data) : [];
      
      const newChangeLog: ChangeLog = {
        ...changeLog,
        id: getNextId(changeLogs),
        created_at: new Date().toISOString(),
      };
      
      changeLogs.push(newChangeLog);
      await AsyncStorage.setItem(STORAGE_KEYS.CHANGE_LOGS, JSON.stringify(changeLogs));
      return newChangeLog;
    } catch (error) {
      console.error('Failed to create change log:', error);
      throw error;
    }
  },

  async getChangeLogs(filters?: {
    entityType?: string;
    entityId?: number;
    relatedEntityType?: string;
    relatedEntityId?: number;
  }): Promise<ChangeLog[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CHANGE_LOGS);
      let changeLogs: ChangeLog[] = data ? JSON.parse(data) : [];
      
      if (filters) {
        if (filters.entityType) {
          changeLogs = changeLogs.filter(log => log.entity_type === filters.entityType);
        }
        if (filters.entityId !== undefined) {
          changeLogs = changeLogs.filter(log => log.entity_id === filters.entityId);
        }
        if (filters.relatedEntityType) {
          changeLogs = changeLogs.filter(log => log.related_entity_type === filters.relatedEntityType);
        }
        if (filters.relatedEntityId !== undefined) {
          changeLogs = changeLogs.filter(log => log.related_entity_id === filters.relatedEntityId);
        }
      }
      
      return changeLogs.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('Failed to get change logs:', error);
      return [];
    }
  },

  async getPatientChangeLogs(patientId: number): Promise<ChangeLog[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CHANGE_LOGS);
      const changeLogs: ChangeLog[] = data ? JSON.parse(data) : [];
      
      const patientLogs = changeLogs.filter(log => 
        (log.entity_type === 'patient' && log.entity_id === patientId) ||
        (log.related_entity_type === 'patient' && log.related_entity_id === patientId)
      );
      
      return patientLogs.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('Failed to get patient change logs:', error);
      return [];
    }
  },

  async createPatientWithLog(patient: Omit<Patient, 'id'>): Promise<Patient> {
    const newPatient = await this.createPatient(patient);
    
    await this.createChangeLog({
      entity_type: 'patient',
      entity_id: newPatient.id,
      action: 'create',
      field_name: null,
      old_value: null,
      new_value: JSON.stringify(newPatient),
      description: `创建病人: ${newPatient.name} (床号: ${newPatient.bed_number})`,
      related_entity_type: null,
      related_entity_id: null,
    });
    
    return newPatient;
  },

  async updatePatientWithLog(id: number, updates: Partial<Patient>): Promise<Patient | null> {
    const patients = await this.getPatients();
    const oldPatient = patients.find(p => p.id === id);
    
    if (!oldPatient) return null;
    
    const updatedPatient = await this.updatePatient(id, updates);
    
    if (updatedPatient) {
      if (updates.name !== undefined && updates.name !== oldPatient.name) {
        await this.createChangeLog({
          entity_type: 'patient',
          entity_id: id,
          action: 'update',
          field_name: 'name',
          old_value: oldPatient.name,
          new_value: updates.name,
          description: `修改病人姓名: "${oldPatient.name}" → "${updates.name}"`,
          related_entity_type: null,
          related_entity_id: null,
        });
      }
      
      if (updates.bed_number !== undefined && updates.bed_number !== oldPatient.bed_number) {
        await this.createChangeLog({
          entity_type: 'patient',
          entity_id: id,
          action: 'update',
          field_name: 'bed_number',
          old_value: oldPatient.bed_number,
          new_value: updates.bed_number,
          description: `修改床号: "${oldPatient.bed_number}" → "${updates.bed_number}"`,
          related_entity_type: null,
          related_entity_id: null,
        });
      }
      
      // 记录治疗项目变更
      if (updates.projects !== undefined) {
        const oldProjects = (oldPatient.projects || []).map(p => p.project_name).join(', ') || '无';
        const newProjects = (updates.projects || []).map(p => p.project_name).join(', ') || '无';
        
        if (oldProjects !== newProjects) {
          await this.createChangeLog({
            entity_type: 'patient',
            entity_id: id,
            action: 'update',
            field_name: 'projects',
            old_value: oldProjects,
            new_value: newProjects,
            description: `修改治疗项目: [${oldProjects}] → [${newProjects}]`,
            related_entity_type: null,
            related_entity_id: null,
          });
        }
      }
    }
    
    return updatedPatient;
  },

  async deletePatientWithLog(id: number): Promise<boolean> {
    try {
      const patients = await this.getPatients();
      console.log('deletePatientWithLog called with id:', id, 'Found', patients.length, 'patients');
      
      const patient = patients.find(p => p.id === id);
      
      if (!patient) {
        console.log('Patient not found for deletion:', id);
        return false;
      }
      
      console.log('Found patient to delete:', patient.name, 'id:', patient.id);
      
      await this.createChangeLog({
        entity_type: 'patient',
        entity_id: id,
        action: 'delete',
        field_name: null,
        old_value: JSON.stringify(patient),
        new_value: null,
        description: `删除病人: ${patient.name} (床号: ${patient.bed_number})`,
        related_entity_type: null,
        related_entity_id: null,
      });
      
      const result = await this.deletePatient(id);
      console.log('deletePatient result:', result);
      return result;
    } catch (error) {
      console.error('Error in deletePatientWithLog:', error);
      throw error;
    }
  },

  async createTaskWithLog(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
    const newTask = await this.createTask(task);
    
    const projects = await this.getProjects();
    const project = projects.find(p => p.id === task.project_id);
    
    await this.createChangeLog({
      entity_type: 'task',
      entity_id: newTask.id,
      action: 'create',
      field_name: null,
      old_value: null,
      new_value: JSON.stringify(newTask),
      description: `创建治疗任务: ${project?.name || '未知项目'}`,
      related_entity_type: 'patient',
      related_entity_id: task.patient_id,
    });
    
    return newTask;
  },

  async createTasksBatchWithLog(tasksData: Array<Omit<Task, 'id' | 'created_at'>>): Promise<Task[]> {
    const newTasks = await this.createTasksBatch(tasksData);
    
    const projects = await this.getProjects();
    
    for (const task of newTasks) {
      const project = projects.find(p => p.id === task.project_id);
      await this.createChangeLog({
        entity_type: 'task',
        entity_id: task.id,
        action: 'create',
        field_name: null,
        old_value: null,
        new_value: JSON.stringify(task),
        description: `批量创建治疗任务: ${project?.name || '未知项目'}`,
        related_entity_type: 'patient',
        related_entity_id: task.patient_id,
      });
    }
    
    return newTasks;
  },

  async updateTaskStatusWithLog(id: number, status: Task['status']): Promise<Task | null> {
    const tasks = await this.getTasks();
    const oldTask = tasks.find(t => t.id === id);
    
    if (!oldTask) return null;
    
    const updatedTask = await this.updateTaskStatus(id, status);
    
    if (updatedTask) {
      const statusTextMap: Record<string, string> = {
        pending: '待开始',
        in_progress: '进行中',
        completed: '已完成',
        needs_collection: '待取机',
      };
      
      await this.createChangeLog({
        entity_type: 'task',
        entity_id: id,
        action: 'update',
        field_name: 'status',
        old_value: oldTask.status,
        new_value: status,
        description: `任务状态变更: ${statusTextMap[oldTask.status]} → ${statusTextMap[status]}`,
        related_entity_type: 'patient',
        related_entity_id: oldTask.patient_id,
      });
    }
    
    return updatedTask;
  },

  async deleteTaskWithLog(id: number): Promise<boolean> {
    const tasks = await this.getTasks();
    const task = tasks.find(t => t.id === id);
    
    if (!task) return false;
    
    const projects = await this.getProjects();
    const project = projects.find(p => p.id === task.project_id);
    
    await this.createChangeLog({
      entity_type: 'task',
      entity_id: id,
      action: 'delete',
      field_name: null,
      old_value: JSON.stringify(task),
      new_value: null,
      description: `删除治疗任务: ${project?.name || '未知项目'}`,
      related_entity_type: 'patient',
      related_entity_id: task.patient_id,
    });
    
    return this.deleteTask(id);
  },

  async clearAllData(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PROJECTS,
      STORAGE_KEYS.PATIENTS,
      STORAGE_KEYS.TASKS,
      STORAGE_KEYS.CHANGE_LOGS,
    ]);
  },

  // 导出所有数据用于备份
  async exportAllData(): Promise<{
    projects: TreatmentProject[];
    patients: Patient[];
    tasks: Task[];
    changeLogs: ChangeLog[];
  }> {
    const [projects, patients, tasks, changeLogs] = await Promise.all([
      this.getProjects(),
      this.getPatients(),
      this.getTasks(),
      this.getChangeLogs(),
    ]);
    return { projects, patients, tasks, changeLogs };
  },

  // 导入数据用于恢复
  async importAllData(data: {
    projects: TreatmentProject[];
    patients: Patient[];
    tasks: Task[];
    changeLogs: ChangeLog[];
  }): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(data.projects));
    await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(data.patients));
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data.tasks));
    await AsyncStorage.setItem(STORAGE_KEYS.CHANGE_LOGS, JSON.stringify(data.changeLogs));
  },

  // ==================== 离线同步机制 ====================
  // 获取待同步的数据（用于后续云端同步）
  async getPendingSyncData(): Promise<{
    patients: Patient[];
    tasks: Task[];
    changeLogs: ChangeLog[];
    lastSyncAt: string | null;
  }> {
    const [patients, tasks, changeLogs] = await Promise.all([
      this.getPatients(true),
      this.getTasks(),
      this.getChangeLogs(),
    ]);

    const lastSyncAt = await AsyncStorage.getItem('@last_sync_at');

    return {
      patients,
      tasks,
      changeLogs,
      lastSyncAt,
    };
  },

  // 更新最后同步时间
  async updateLastSyncTime(): Promise<void> {
    await AsyncStorage.setItem('@last_sync_at', new Date().toISOString());
  },

  // 合并服务器数据（冲突解决：服务器优先）
  async mergeServerData(serverData: {
    projects?: TreatmentProject[];
    patients?: Patient[];
    tasks?: Task[];
  }): Promise<void> {
    // 合并项目（服务器优先）
    if (serverData.projects) {
      const localProjects = await this.getProjects();
      const projectMap = new Map(localProjects.map(p => [p.id, p]));

      for (const serverProject of serverData.projects) {
        projectMap.set(serverProject.id, serverProject);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(Array.from(projectMap.values())));
    }

    // 合并病人（服务器优先，但保留本地删除标记）
    if (serverData.patients) {
      const localPatients = await this.getPatients(true);
      const patientMap = new Map(localPatients.map(p => [p.id, p]));

      for (const serverPatient of serverData.patients) {
        const localPatient = patientMap.get(serverPatient.id);
        if (localPatient?.is_deleted) {
          // 本地已删除，保留删除状态
          continue;
        }
        patientMap.set(serverPatient.id, serverPatient);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(Array.from(patientMap.values())));
    }

    // 合并任务（服务器优先）
    if (serverData.tasks) {
      const localTasks = await this.getTasks();
      const taskMap = new Map(localTasks.map(t => [t.id, t]));

      for (const serverTask of serverData.tasks) {
        taskMap.set(serverTask.id, serverTask);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(Array.from(taskMap.values())));
    }
  },
};
