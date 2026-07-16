import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";

import { SafeAreaView } from "react-native-safe-area-context";
import {
  useInfiniteTasks,
  useUpdateTask,
  flattenInfiniteTasks,
  Task,
  TaskListParams,
} from "@/hooks/useTasks";
import { formatDaysLeft, STATUS_COLORS } from "@/lib/utils";
import TaskCard from "@/components/ui/TaskCard";
import EmptyState from "@/components/ui/EmptyState";
import CreateTaskModal from "@/components/modals/CreateTaskModal";
import TaskDetailModal from "@/components/modals/TaskDetailModal";
import { useAuth } from "@/contexts/AuthContext";


type SortBy = TaskListParams["sortBy"];
type StatusFilter = TaskListParams["status"] & string;
type DateFilter = TaskListParams["dateFilter"] & string;
type PriorityFilter = TaskListParams["priority"] & string;

const STATUS_OPTIONS: StatusFilter[] = ["All", "Todo", "In Progress", "Blocked", "Done"];
const DATE_OPTIONS: { label: string; value: DateFilter }[] = [
  { label: "Any Date", value: "all" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "Overdue", value: "overdue" },
];
const PRIORITY_OPTIONS: { label: string; value: PriorityFilter }[] = [
  { label: "All", value: "all" },
  { label: "High", value: "High" },
  { label: "Medium", value: "Medium" },
  { label: "Low", value: "Low" },
];
const SORT_OPTIONS: { label: string; value: SortBy }[] = [
  { label: "Deadline", value: "deadline" },
  { label: "Priority", value: "priority" },
  { label: "Newest", value: "newest" },
];

export default function TasksScreen() {
  const [status, setStatus] = useState<StatusFilter>("All");
  const [sortBy, setSortBy] = useState<SortBy>("deadline");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { user } = useAuth();

  const params: TaskListParams = useMemo(
    () => {
      if (viewMode === "calendar") {
        return {
          limit: 100, // Fetch more for calendar to show dots
          status: status === "All" ? undefined : status as any,
          priority: priorityFilter === "all" ? undefined : priorityFilter as any,
        };
      }
      return {
        sortBy,
        status: status === "All" ? undefined : status as any,
        dateFilter: dateFilter === "all" ? undefined : dateFilter as any,
        priority: priorityFilter === "all" ? undefined : priorityFilter as any,
        limit: 20,
      };
    },
    [status, sortBy, dateFilter, priorityFilter, viewMode]
  );

  const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage, refetch, isRefetching } =
    useInfiniteTasks(params);

  const tasks = useMemo(() => flattenInfiniteTasks(data), [data]);
  const updateTask = useUpdateTask();

  const handleToggleComplete = useCallback(
    (task: Task) => {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      updateTask.mutate({ id: task.id, status: newStatus });
    },
    [updateTask]
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const getLocalDateString = useCallback((isoString: string) => {
    const d = new Date(isoString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const markedDates = useMemo(() => {
    const dates: any = {};
    tasks.forEach((task) => {
      if (task.deadline) {
        const dateStr = getLocalDateString(task.deadline);
        if (!dates[dateStr]) {
          dates[dateStr] = { dots: [] };
        }
        dates[dateStr].dots.push({ color: STATUS_COLORS[task.status] || '#a78bfa' });
      }
    });
    if (selectedDate) {
      if (!dates[selectedDate]) {
        dates[selectedDate] = {};
      }
      dates[selectedDate].selected = true;
      dates[selectedDate].selectedColor = '#3b2f6b';
    }
    return dates;
  }, [tasks, selectedDate, getLocalDateString]);

  const calendarTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter((t) => t.deadline && getLocalDateString(t.deadline) === selectedDate);
  }, [tasks, selectedDate, getLocalDateString]);

  const FilterDropdown = ({
    label,
    value,
    options,
    onSelect,
    icon,
  }: {
    label: string;
    value: string;
    options: { label: string; value: string }[];
    onSelect: (val: any) => void;
    icon?: string;
  }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const selectedLabel = options.find((o) => o.value === value)?.label || value;

    return (
      <>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownLabel}>{label}:</Text>
          <Text style={styles.dropdownValue} numberOfLines={1}>
            {selectedLabel}
          </Text>
          <MaterialIcons name="expand-more" size={16} color="#71717a" />
        </TouchableOpacity>

        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.menuContainer}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>{label}</Text>
              </View>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.menuItem, value === opt.value && styles.menuItemActive]}
                  onPress={() => {
                    onSelect(opt.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.menuItemText, value === opt.value && styles.menuItemTextActive]}>
                    {opt.label}
                  </Text>
                  {value === opt.value && (
                    <MaterialIcons name="check" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Tasks</Text>
          <Text style={styles.subtitle}>Manage your workload</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            style={styles.viewToggleBtn}
            onPress={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
          >
            <Ionicons
              name={viewMode === "list" ? "calendar-outline" : "list-outline"}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowCreateTask(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {viewMode === "calendar" ? (

        <ScrollView style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}>
          <Calendar
            markingType={'multi-dot'}
            markedDates={markedDates}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            theme={{
              backgroundColor: '#09090b',
              calendarBackground: '#09090b',
              textSectionTitleColor: '#a1a1aa',
              selectedDayBackgroundColor: '#3b2f6b',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#a78bfa',
              dayTextColor: '#e4e4e7',
              textDisabledColor: '#3f3f46',
              dotColor: '#a78bfa',
              selectedDotColor: '#ffffff',
              arrowColor: '#e4e4e7',
              monthTextColor: '#e4e4e7',
              indicatorColor: '#a78bfa',
            }}
            dayComponent={({ date, state, marking }: any) => {
              const isSelected = marking?.selected;
              const dots = marking?.dots || [];
              const isToday = state === 'today';
              const isDisabled = state === 'disabled';

              return (
                <TouchableOpacity
                  onPress={() => setSelectedDate(date.dateString)}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    paddingTop: 4,
                    width: 36,
                    height: 42,
                    backgroundColor: isSelected ? '#3b2f6b' : 'transparent',
                    borderRadius: 8,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{
                    color: isDisabled ? '#3f3f46' : isSelected ? '#ffffff' : isToday ? '#a78bfa' : '#e4e4e7',
                    fontSize: 14,
                    fontWeight: isToday ? 'bold' : 'normal'
                  }}>
                    {date.day}
                  </Text>

                  {dots.length > 0 && (
                    <View style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      width: 16,
                      marginTop: 2,
                    }}>
                      {dots.slice(0, dots.length > 4 ? 3 : 4).map((dot: any, index: number) => (
                        <View key={index} style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: dot.color,
                          margin: 1,
                        }} />
                      ))}
                      {dots.length > 4 && (
                        <View style={{ width: 4, height: 4, margin: 1, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ color: '#a1a1aa', fontSize: 8, fontWeight: 'bold', lineHeight: 8, marginTop: -1 }}>+</Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
          <View style={styles.calendarListHeader}>
            <Text style={styles.calendarListTitle}>
              Tasks for {selectedDate ? new Date(selectedDate).toLocaleDateString() : "Selected Date"}
            </Text>
          </View>
          <FlatList
            data={calendarTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TaskCard
                task={item}
                onToggleComplete={() => handleToggleComplete(item)}
                formatDaysLeft={formatDaysLeft}
                showTeamBadge
                showStatus
                onPress={() => setSelectedTask(item)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                icon="📅"
                message="No tasks due on this date."
                actionLabel="Create Task"
                onAction={() => setShowCreateTask(true)}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </ScrollView>
      ) : (
        <>
          {/* Filters Area */}
          <View style={styles.filtersArea}>
            <View style={styles.filterGrid}>
              <View style={styles.filterItem}>
                <FilterDropdown
                  label="Status"
                  value={status}
                  options={STATUS_OPTIONS.map(s => ({ label: s, value: s }))}
                  onSelect={setStatus}
                />
              </View>
              <View style={styles.filterItem}>
                <FilterDropdown
                  label="Date"
                  value={dateFilter}
                  options={DATE_OPTIONS}
                  onSelect={setDateFilter}
                />
              </View>
              <View style={styles.filterItem}>
                <FilterDropdown
                  label="Priority"
                  value={priorityFilter}
                  options={PRIORITY_OPTIONS}
                  onSelect={setPriorityFilter}
                />
              </View>
              <View style={styles.filterItem}>
                <FilterDropdown
                  label="Sort"
                  value={sortBy as string}
                  options={SORT_OPTIONS}
                  onSelect={setSortBy}
                />
              </View>
            </View>
          </View>

          {/* Tasks list */}
          {isPending ? (
            <View style={styles.center}>
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
                  showTeamBadge
                  showStatus
                  onPress={() => setSelectedTask(item)}
                />
              )}
              ListEmptyComponent={
                <EmptyState
                  icon="✅"
                  message="No tasks found matching these filters."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setStatus("All");
                    setDateFilter("all");
                    setPriorityFilter("all");
                    setSortBy("deadline");
                  }}
                />
              }
              ListFooterComponent={
                isFetchingNextPage ? (
                  <ActivityIndicator color="#71717a" style={{ marginVertical: 16 }} />
                ) : null
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.4}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={() => void refetch()}
                  tintColor="#52525b"
                />
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}

      <CreateTaskModal
        visible={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        defaultDeadline={viewMode === "calendar" ? selectedDate : undefined}
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#71717a", fontSize: 13, marginTop: 2 },
  addBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  addBtnText: { color: "#09090b", fontSize: 14, fontWeight: "700" },
  viewToggleBtn: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarListHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#18181b",
  },
  calendarListTitle: {
    color: "#a1a1aa",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  filtersArea: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#18181b",
    backgroundColor: "#09090b",
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  filterItem: {
    width: "48%",
  },

  // Dropdown UI
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111113",
    borderWidth: 1,
    borderColor: "#18181b",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  dropdownLabel: {
    color: "#52525b",
    fontSize: 12,
    fontWeight: "600",
  },
  dropdownValue: {
    color: "#e4e4e7",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },

  // Modal Menu
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 30,
  },
  menuContainer: {
    backgroundColor: "#18181b",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#27272a",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  menuHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#27272a",
    backgroundColor: "#1c1c1f",
  },
  menuTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuItemActive: {
    backgroundColor: "#27272a",
  },
  menuItemText: {
    color: "#a1a1aa",
    fontSize: 14,
    fontWeight: "500",
  },
  menuItemTextActive: {
    color: "#fff",
    fontWeight: "700",
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
});


