import { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { Task } from '@/hooks/useTasks';

export const GUEST_PERSONAL_TEAM_ID = 'guest-personal-team';
const TASKS_STORAGE_KEY = 'guest_tasks';

const GUEST_PERSONAL_TEAM = {
  id: GUEST_PERSONAL_TEAM_ID,
  name: 'Personal',
  desc: 'Your personal workspace',
  members: [],
  leader: null,
  tasks: [],
  _count: { tasks: 0 },
};

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
  const { url, method, data } = config;

  const respond = (status: number, responseData: unknown): AxiosResponse => ({
    data: responseData,
    status,
    statusText: status === 200 ? 'OK' : status === 201 ? 'Created' : 'OK',
    headers: {},
    config,
    request: {}
  } as AxiosResponse);

  const tasks = getGuestTasks();

  if (method === 'get') {
    // --- User/personal workspace ---
    if (url === '/user/personal') {
      return respond(200, { id: GUEST_PERSONAL_TEAM_ID });
    }

    // --- Single team by id ---
    const teamByIdMatch = url?.match(/^\/teams\/([^/?]+)$/);
    if (teamByIdMatch) {
      // For the guest personal team, return it. For any other team ID, return 404-like empty.
      if (teamByIdMatch[1] === GUEST_PERSONAL_TEAM_ID) {
        return respond(200, GUEST_PERSONAL_TEAM);
      }
      return respond(200, GUEST_PERSONAL_TEAM); // graceful fallback
    }

    // --- Team members ---
    if (url?.match(/^\/teams\/[^/?]+\/members/)) {
      // Return a single "guest" member so the page doesn't crash
      return respond(200, []);
    }

    // --- Team tasks ---
    if (url?.match(/^\/teams\/[^/?]+\/tasks/)) {
      const filteredTasks = tasks.filter(t => t.teamId === GUEST_PERSONAL_TEAM_ID);
      return respond(200, {
        items: filteredTasks,
        page: 1,
        limit: 100,
        total: filteredTasks.length,
        hasMore: false,
        nextPage: null
      });
    }

    // --- Teams list (paginated) ---
    if (url?.match(/^\/teams(\?|$)/)) {
      return respond(200, {
        items: [GUEST_PERSONAL_TEAM],
        page: 1,
        limit: 12,
        total: 1,
        hasMore: false,
        nextPage: null
      });
    }

    // --- Single task ---
    const taskByIdMatch = url?.match(/^\/tasks\/([^?]+)/);
    if (taskByIdMatch) {
      const task = tasks.find(t => t.id === taskByIdMatch[1]);
      return respond(200, task || {});
    }

    // --- Tasks list (paginated) ---
    if (url?.match(/^\/tasks(\?|$)/)) {
      const urlObj = new URL(url, 'http://localhost');
      const startDateStr = urlObj.searchParams.get('startDate');
      const endDateStr = urlObj.searchParams.get('endDate');
      const dateFilter = urlObj.searchParams.get('dateFilter');
      
      let filteredTasks = [...tasks];
      
      if (startDateStr) {
        const start = new Date(startDateStr).getTime();
        filteredTasks = filteredTasks.filter(t => t.deadline && new Date(t.deadline).getTime() >= start);
      }
      if (endDateStr) {
        const end = new Date(endDateStr).getTime();
        filteredTasks = filteredTasks.filter(t => t.deadline && new Date(t.deadline).getTime() <= end);
      }
      if (dateFilter === 'overdue') {
        filteredTasks = filteredTasks.filter(t => t.status !== 'completed');
      }

      return respond(200, {
        items: filteredTasks,
        page: 1,
        limit: 100,
        total: filteredTasks.length,
        hasMore: false,
        nextPage: null
      });
    }

    // Fallback
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
    // Moodle and other POSTs — silently ignore
    return respond(200, {});
  }

  if (method === 'put') {
    const match = url?.match(/^\/tasks\/([^?]+)/);
    if (match) {
      const taskId = match[1];
      const updates = typeof data === 'string' ? JSON.parse(data) : data;
      let updatedTask: Task | null = null;
      const newTasks = tasks.map(t => {
        if (t.id === taskId) {
          updatedTask = { ...t, ...updates } as Task;
          return updatedTask;
        }
        return t;
      }).filter((t): t is Task => t !== null);
      saveGuestTasks(newTasks);
      return respond(200, updatedTask || {});
    }
    return respond(200, {});
  }

  if (method === 'delete') {
    const match = url?.match(/^\/tasks\/([^?]+)/);
    if (match) {
      const taskId = match[1];
      saveGuestTasks(tasks.filter(t => t.id !== taskId));
      return respond(200, { success: true });
    }
    return respond(200, { success: true });
  }

  return respond(200, {});
};
