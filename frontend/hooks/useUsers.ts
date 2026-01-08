import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Fetch all users
export const useUsers = () => {
  const fetchUsers = async () => {
    const { data } = await api.get("/users");
    return data;
  };
  return useQuery({ queryKey: ["users"], queryFn: fetchUsers });
};

// Fetch single user by ID
export const useUserById = (id: string) => {
  const fetchUser = async () => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  };
  return useQuery({ queryKey: ["user", id], queryFn: fetchUser, enabled: !!id });
};

// Fetch all tasks assigned to a user
export const useUserTasks = (id: string) => {
  const fetchTasks = async () => {
    const { data } = await api.get(`/users/${id}/tasks`);
    return data;
  };
  return useQuery({ queryKey: ["userTasks", id], queryFn: fetchTasks, enabled: !!id });
};

// Fetch all teams a user belongs to
export const useUserTeams = (id: string) => {
  const fetchTeams = async () => {
    const { data } = await api.get(`/users/${id}/teams`);
    return data;
  };
  return useQuery({ queryKey: ["userTeams", id], queryFn: fetchTeams, enabled: !!id });
};

// Create a new user
export const useCreateUser = () => {
  return useMutation({
    mutationFn: async (user: Record<string, unknown>) => {
      const { data } = await api.post("/users", user);
      return data;
    },
  });
};
