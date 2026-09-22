import { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { Task } from '@/hooks/useTasks';

const GUEST_PERSONAL_TEAM_ID = 'guest-personal-team';
const TASKS_STORAGE_KEY = 'guest_tasks';

function getGuestTasks(): Task[] {
  try {
    const data = localStorage.getItem(TASKS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveGuestTasks(tasks: Task[]) {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

export const guestAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  const { url, method, data, params } = config;

  const respond = (status: number, responseData: any): AxiosResponse => {
    return {
      data: responseData,
      status,
      statusText: status === 200 ? 'OK' : 'Created',
      headers: {},
      config,
      request: {}
    } as AxiosResponse;
  };

  // Ensure tasks are initialized
  const tasks = getGuestTasks();

  if (method === 'get') {
    if (url === '/user/personal') {
      return respond(200, { id: GUEST_PERSONAL_TEAM_ID });
    }

    if (url?.startsWith('/tasks') || url?.includes('/tasks?')) {
      // Mock fetching tasks
      let filteredTasks = [...tasks];
      
      // If fetching single task by id
      const match = url.match(/^\/tasks\/([^?]+)/);
      if (match) {
        const taskId = match[1];
        const task = filteredTasks.find(t => t.id === taskId);
        return respond(200, task || {});
      }

      // Mock pagination/filtering
      return respond(200, {
        items: filteredTasks,
        page: 1,
        limit: 100,
        total: filteredTasks.length,
        hasMore: false,
        nextPage: null
      });
    }

    if (url?.startsWith('/teams')) {
      // Return empty list of teams (excluding personal)
      return respond(200, {
        items: [],
        page: 1,
        limit: 12,
        total: 0,
        hasMore: false,
        nextPage: null
      });
    }
    
    // Fallback for user/teams etc.
    return respond(200, {});
  }

  if (method === 'post') {
    if (url === '/tasks') {
      const newTask = typeof data === 'string' ? JSON.parse(data) : data;
      const createdTask: Task = {
        ...newTask,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        teamId: newTask.teamId || GUEST_PERSONAL_TEAM_ID,
        team: { name: 'Personal' }
      };
      saveGuestTasks([createdTask, ...tasks]);
      return respond(201, createdTask);
    }
  }

  if (method === 'put') {
    const match = url?.match(/^\/tasks\/([^?]+)/);
    if (match) {
      const taskId = match[1];
      const updates = typeof data === 'string' ? JSON.parse(data) : data;
      
      let updatedTask = null;
      const newTasks = tasks.map(t => {
        if (t.id === taskId) {
          updatedTask = { ...t, ...updates };
          return updatedTask;
        }
        return t;
      });
      
      saveGuestTasks(newTasks);
      return respond(200, updatedTask || {});
    }
  }

  if (method === 'delete') {
    const match = url?.match(/^\/tasks\/([^?]+)/);
    if (match) {
      const taskId = match[1];
      const newTasks = tasks.filter(t => t.id !== taskId);
      saveGuestTasks(newTasks);
      return respond(200, { success: true });
    }
  }

  // Default fallback mock response
  return respond(200, {});
};
