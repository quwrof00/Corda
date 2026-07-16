import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Task } from "@/hooks/useTasks";
import { PRIORITY_COLORS, STATUS_COLORS } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onToggleComplete: () => void;
  formatDaysLeft: (date?: string) => string;
  showTeamBadge?: boolean;
  showStatus?: boolean;
  showAssignee?: boolean;
  onPress?: () => void;
}

export default function TaskCard({
  task,
  onToggleComplete,
  formatDaysLeft,
  showTeamBadge,
  showStatus,
  showAssignee,
  onPress,
}: TaskCardProps) {
  const isCompleted = task.status === "completed";
  const daysLeft = task.deadline ? formatDaysLeft(task.deadline) : null;
  const isOverdue = daysLeft?.includes("overdue");

  return (
    <TouchableOpacity
      style={[s.card, isCompleted && s.cardCompleted]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Complete toggle */}
      <TouchableOpacity style={s.checkArea} onPress={onToggleComplete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <View style={[s.check, isCompleted && s.checkDone]}>
          {isCompleted && <Text style={s.checkMark}>✓</Text>}
        </View>
      </TouchableOpacity>

      {/* Content */}
      <View style={s.content}>
        <Text style={[s.title, isCompleted && s.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>

        <View style={s.meta}>
          {/* Priority badge */}
          <View style={[s.badge, { borderColor: PRIORITY_COLORS[task.priority] + "44" }]}>
            <View style={[s.dot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
            <Text style={[s.badgeText, { color: PRIORITY_COLORS[task.priority] }]}>
              {task.priority}
            </Text>
          </View>

          {/* Status badge */}
          {showStatus && (
            <View style={[s.badge, { borderColor: STATUS_COLORS[task.status] + "44" }]}>
              <Text style={[s.badgeText, { color: STATUS_COLORS[task.status] }]}>
                {task.status}
              </Text>
            </View>
          )}

          {/* Assignee badge */}
          {showAssignee && task.assignedTo && (
            <View style={s.assigneeBadge}>
              <View style={s.assigneeAvatar}>
                <Text style={s.assigneeInitials}>
                  {task.assignedTo.name.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={s.assigneeName} numberOfLines={1}>
                {task.assignedTo.name.split(" ")[0]}
              </Text>
            </View>
          )}

          {/* Team badge */}
          {showTeamBadge && task.team?.name && task.team.name !== "Personal" && (
            <View style={s.teamBadge}>
              <Text style={s.teamBadgeText}>{task.team.name}</Text>
            </View>
          )}
        </View>

        {/* Deadline */}
        {daysLeft && (
          <Text style={[s.deadline, isOverdue && s.deadlineOverdue]}>{daysLeft}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#111113",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  cardCompleted: { opacity: 0.5 },
  checkArea: { paddingTop: 2 },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#3f3f46",
    justifyContent: "center",
    alignItems: "center",
  },
  checkDone: { borderColor: "#22c55e", backgroundColor: "#22c55e22" },
  checkMark: { color: "#22c55e", fontSize: 11, fontWeight: "700" },
  content: { flex: 1 },
  title: { color: "#e4e4e7", fontSize: 15, fontWeight: "500", marginBottom: 8, lineHeight: 21 },
  titleDone: { textDecorationLine: "line-through", color: "#52525b" },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  teamBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  teamBadgeText: { color: "#71717a", fontSize: 10, fontWeight: "600" },
  assigneeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: "#3b2f6b" },
  assigneeAvatar: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#3b2f6b", justifyContent: "center", alignItems: "center" },
  assigneeInitials: { color: "#a78bfa", fontSize: 7, fontWeight: "800" },
  assigneeName: { color: "#a78bfa", fontSize: 10, fontWeight: "600", maxWidth: 60 },
  deadline: { color: "#52525b", fontSize: 12 },
  deadlineOverdue: { color: "#ef4444" },
});
