import React, { useState, useMemo, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteTasks, useUpdateTask, flattenInfiniteTasks, Task } from "@/hooks/useTasks";
import { flattenInfiniteTeams, useInfiniteTeams } from "@/hooks/useTeams";
import { formatDaysLeft } from "@/lib/utils";
import TaskCard from "@/components/ui/TaskCard";
import EmptyState from "@/components/ui/EmptyState";
import CreateTaskModal from "@/components/modals/CreateTaskModal";
import TaskDetailModal from "@/components/modals/TaskDetailModal";
import { useAuth } from "@/contexts/AuthContext";

export default function PersonalScreen() {
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { user } = useAuth();

  // Find the Personal team ID
  const teamsQuery = useInfiniteTeams({ limit: 50 });
  const teams = useMemo(() => flattenInfiniteTeams(teamsQuery.data), [teamsQuery.data]);
  const personalTeamId = useMemo(
    () => teams.find((t) => t.name === "Personal")?.id ?? "",
    [teams]
  );

  const tasksQuery = useInfiniteTasks({
    teamId: personalTeamId || undefined,
    sortBy: "deadline",
    limit: 20,
  });

  const tasks = useMemo(() => flattenInfiniteTasks(tasksQuery.data), [tasksQuery.data]);
  const updateTask = useUpdateTask();

  const handleToggleComplete = useCallback(
    (task: Task) => {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      updateTask.mutate({ id: task.id, status: newStatus });
    },
    [updateTask]
  );

  const handleLoadMore = useCallback(() => {
    if (tasksQuery.hasNextPage && !tasksQuery.isFetchingNextPage)
      void tasksQuery.fetchNextPage();
  }, [tasksQuery]);

  const isLoading = teamsQuery.isPending || (!!personalTeamId && tasksQuery.isPending);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Personal</Text>
          <Text style={s.subtitle}>Your private workspace</Text>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => setShowCreateTask(true)}
          activeOpacity={0.8}
          disabled={!personalTeamId}
        >
          <Text style={s.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Task list */}
      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator color="#71717a" />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onToggleComplete={() => handleToggleComplete(item)}
              formatDaysLeft={formatDaysLeft}
              showStatus
              onPress={() => setSelectedTask(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="🏠"
              message="No personal tasks yet. Add one to get started!"
              actionLabel="Create Task"
              onAction={() => setShowCreateTask(true)}
            />
          }
          ListFooterComponent={
            tasksQuery.isFetchingNextPage ? (
              <ActivityIndicator color="#71717a" style={{ marginVertical: 16 }} />
            ) : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={tasksQuery.isRefetching}
              onRefresh={() => void tasksQuery.refetch()}
              tintColor="#52525b"
            />
          }
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <CreateTaskModal
        visible={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        defaultTeamId={personalTeamId}
      />

      <TaskDetailModal
        task={selectedTask}
        visible={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        currentUserId={user?.id}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#18181b",
  },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#71717a", fontSize: 13, marginTop: 2 },
  addBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addBtnText: { color: "#09090b", fontSize: 14, fontWeight: "700" },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
});
