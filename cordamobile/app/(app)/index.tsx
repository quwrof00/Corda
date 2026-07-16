import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  useInfiniteTasks,
  useUpdateTask,
  flattenInfiniteTasks,
  Task,
} from "@/hooks/useTasks";
import { flattenInfiniteTeams, useInfiniteTeams } from "@/hooks/useTeams";
import { formatDaysLeft, getGreeting } from "@/lib/utils";
import TaskCard from "@/components/ui/TaskCard";
import TeamCard from "@/components/ui/TeamCard";
import EmptyState from "@/components/ui/EmptyState";
import CreateTaskModal from "@/components/modals/CreateTaskModal";
import TaskDetailModal from "@/components/modals/TaskDetailModal";


type FilterType = "Today" | "This Week" | "Overdue";

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>("Today");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [greeting, setGreeting] = useState(getGreeting());


  useEffect(() => {
    const interval = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(interval);
  }, []);

  const { todayRange, weekRange, currentNow } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return {
      todayRange: { start: startOfToday.toISOString(), end: endOfToday.toISOString() },
      weekRange: { start: startOfToday.toISOString(), end: endOfWeek.toISOString() },
      currentNow: now.toISOString(),
    };
  }, []);

  const todayQuery = useInfiniteTasks({
    startDate: todayRange.start,
    endDate: todayRange.end,
    dateFilter: "overdue",
    sortBy: "deadline",
    limit: 20,
  });
  const weekQuery = useInfiniteTasks({
    startDate: weekRange.start,
    endDate: weekRange.end,
    dateFilter: "overdue",
    sortBy: "deadline",
    limit: 20,
  });
  const overdueQuery = useInfiniteTasks({
    endDate: currentNow,
    dateFilter: "overdue",
    sortBy: "deadline",
    limit: 20,
  });
  const teamsQuery = useInfiniteTeams({ limit: 6 });
  const updateTask = useUpdateTask();

  const todayTasks = useMemo(
    () => flattenInfiniteTasks(todayQuery.data).filter((t) => t.status !== "completed"),
    [todayQuery.data]
  );
  const weekTasks = useMemo(
    () => flattenInfiniteTasks(weekQuery.data).filter((t) => t.status !== "completed"),
    [weekQuery.data]
  );
  const overdueTasks = useMemo(
    () => flattenInfiniteTasks(overdueQuery.data).filter((t) => t.status !== "completed"),
    [overdueQuery.data]
  );
  const teams = useMemo(() => flattenInfiniteTeams(teamsQuery.data), [teamsQuery.data]);

  const activeTasks =
    activeFilter === "Today"
      ? todayTasks
      : activeFilter === "This Week"
      ? weekTasks
      : overdueTasks;

  const activeQuery =
    activeFilter === "Today"
      ? todayQuery
      : activeFilter === "This Week"
      ? weekQuery
      : overdueQuery;

  const totalToday = todayQuery.data?.pages[0]?.total ?? 0;

  const handleToggleComplete = useCallback(
    (task: Task) => {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      updateTask.mutate({ id: task.id, status: newStatus });
    },
    [updateTask]
  );

  const handleLoadMore = useCallback(() => {
    if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
      void activeQuery.fetchNextPage();
    }
  }, [activeQuery]);

  const isLoading = activeQuery.isPending;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {greeting}, {user?.name?.split(" ")[0] || "there"} 👋
          </Text>
          <Text style={styles.stat}>
            <Text style={styles.statHighlight}>{totalToday}</Text>{" "}
            {totalToday === 1 ? "deadline" : "deadlines"} approaching
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowCreateTask(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Task</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(["Today", "This Week", "Overdue"] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === f && styles.filterTabTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task list */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#71717a" />
        </View>
      ) : (
        <FlatList
          data={activeTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onToggleComplete={() => handleToggleComplete(item)}
              formatDaysLeft={formatDaysLeft}
              showTeamBadge
              onPress={() => setSelectedTask(item)}
            />

          )}
          ListEmptyComponent={
            <EmptyState
              icon="✅"
              message={
                activeFilter === "Today"
                  ? "No tasks due today."
                  : activeFilter === "This Week"
                  ? "No upcoming tasks this week."
                  : "No overdue tasks. Great job!"
              }
              actionLabel="Create Task"
              onAction={() => setShowCreateTask(true)}
            />
          }
          ListFooterComponent={
            <>
              {activeQuery.isFetchingNextPage && (
                <ActivityIndicator color="#71717a" style={{ marginVertical: 12 }} />
              )}
              {/* Teams section */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Teams</Text>
                <TouchableOpacity onPress={() => router.push("/(app)/teams")}>
                  <Text style={styles.seeAll}>See all →</Text>
                </TouchableOpacity>
              </View>
              {teamsQuery.isPending ? (
                <ActivityIndicator color="#71717a" style={{ marginTop: 12 }} />
              ) : teams.length > 0 ? (
                teams
                  .filter((t) => t.name !== "Personal")
                  .map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      onPress={() => router.push(`/(app)/teams/${team.id}`)}
                      compact
                    />
                  ))
              ) : (
                <Text style={styles.emptyTeams}>You're not in any teams.</Text>
              )}
            </>
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={activeQuery.isRefetching}
              onRefresh={() => void activeQuery.refetch()}
              tintColor="#52525b"
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <CreateTaskModal
        visible={showCreateTask}
        onClose={() => setShowCreateTask(false)}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#18181b",
  },
  greeting: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 4 },
  stat: { color: "#71717a", fontSize: 13 },
  statHighlight: { color: "#d4d4d8", fontWeight: "700" },
  addBtn: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
  },
  filterTabActive: {
    backgroundColor: "#27272a",
    borderColor: "#52525b",
  },
  filterTabText: { color: "#52525b", fontSize: 12, fontWeight: "600" },
  filterTabTextActive: { color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  seeAll: { color: "#52525b", fontSize: 13 },
  emptyTeams: {
    color: "#3f3f46",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
});
