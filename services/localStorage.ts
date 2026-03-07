import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  PROJECTS: '@projects',
  PATIENTS: '@patients',
  TASKS: '@tasks',
};

export interface TreatmentProject {
  id: number;
  name: string;
  description: string;
  default_duration: number;
  icon: string;
}

export interface Patient {
  id: number;
  name: string;
  bed_number: string;
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

let nextProjectId = 100;
let nextPatientId = 100;
let nextTaskId = 100;

export const LocalStorageService = {
  async initialize(): Promise<void> {
    try {
      const existingProjects = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (!existingProjects) {
        await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(DEFAULT_PROJECTS));
      }
      
      const existingPatients = await AsyncStorage.getItem(STORAGE_KEYS.PATIENTS);
      if (!existingPatients) {
        await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify([]));
      }
      
      const existingTasks = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      if (!existingTasks) {
        await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
      }
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
      id: nextProjectId++,
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

  async getPatients(): Promise<Patient[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PATIENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get patients:', error);
      return [];
    }
  },

  async createPatient(patient: Omit<Patient, 'id'>): Promise<Patient> {
    const patients = await this.getPatients();
    const newPatient: Patient = {
      ...patient,
      id: nextPatientId++,
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

  async deletePatient(id: number): Promise<boolean> {
    const patients = await this.getPatients();
    const filtered = patients.filter(p => p.id !== id);
    if (filtered.length === patients.length) return false;
    
    await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(filtered));
    
    const tasks = await this.getTasks();
    const remainingTasks = tasks.filter(t => t.patient_id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(remainingTasks));
    
    return true;
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
      id: nextTaskId++,
      created_at: new Date().toISOString(),
    };
    tasks.push(newTask);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return newTask;
  },

  async createTasksBatch(tasksData: Array<Omit<Task, 'id' | 'created_at'>>): Promise<Task[]> {
    const tasks = await this.getTasks();
    const newTasks: Task[] = tasksData.map(taskData => ({
      ...taskData,
      id: nextTaskId++,
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

  async clearAllData(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PROJECTS,
      STORAGE_KEYS.PATIENTS,
      STORAGE_KEYS.TASKS,
    ]);
  },
};
