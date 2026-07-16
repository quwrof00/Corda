import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Task, useUpdateTask, useDeleteTask, useTask } from "@/hooks/useTasks";
import { Member } from "@/hooks/useTeams";

import { PRIORITY_COLORS, STATUS_COLORS } from "@/lib/utils";

interface TaskDetailModalProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  isLeader?: boolean;
  currentUserId?: string;
  teamMembers?: Member[];
}

const PRIORITIES = ["Low", "Medium", "High"] as const;

export default function TaskDetailModal({
  task,
  visible,
  onClose,
  isLeader = false,
  currentUserId,
  teamMembers = [],
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAssignPicker, setShowAssignPicker] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    desc: "",
    deadline: "",
    priority: "Medium" as "Low" | "Medium" | "High",
    requiredSkill: "",
  });

  const { data: liveTask } = useTask(task?.id || "");
  const displayTask = liveTask || task;

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();


  useEffect(() => {
    if (displayTask) {
      setEditForm({
        title: displayTask.title || "",
        desc: displayTask.desc || displayTask.description || "",
        deadline: displayTask.deadline ? displayTask.deadline.split("T")[0] : "",
        priority: (displayTask.priority as any) || "Medium",
        requiredSkill: displayTask.requiredSkill || "",
      });
    }
  }, [displayTask?.id, displayTask?.title, displayTask?.desc, displayTask?.description, displayTask?.deadline, displayTask?.priority, displayTask?.requiredSkill]);

  useEffect(() => {
    if (!visible) {
      setIsEditing(false);
    }
  }, [visible]);

  if (!displayTask) return null;

  const isPersonal = displayTask.team?.name === "Personal";
  const isAssignee = currentUserId === displayTask.assignedToId || currentUserId === displayTask.assignedTo?.id;
  const canEdit = isLeader || isPersonal || isAssignee;

  const handleStatusUpdate = async (newStatus: string) => {
    onClose(); // Optimistic UI: close immediately
    try {
      await updateTask.mutateAsync({ id: displayTask.id, status: newStatus });
    } catch {
      Alert.alert("Error", "Failed to update task status.");
    }
  };

  const handleAssign = async (memberId: string | null) => {
    setShowAssignPicker(false);
    onClose(); // Optimistic UI: close immediately
    try {
      await updateTask.mutateAsync({ id: displayTask.id, assignedToId: memberId });
    } catch {
      Alert.alert("Error", "Failed to assign task.");
    }
  };


  const handleSave = async () => {
    if (!editForm.title.trim()) {
      Alert.alert("Error", "Title is required.");
      return;
    }
    let deadlineIso = null;
    if (editForm.deadline) {
      const d = new Date(editForm.deadline);
      if (isNaN(d.getTime())) {
        Alert.alert("Error", "Invalid date format. Please use YYYY-MM-DD.");
        return;
      }
      deadlineIso = d.toISOString();
    }

    const payload = {
      id: displayTask.id,
      title: editForm.title.trim(),
      description: editForm.desc.trim(),
      deadline: deadlineIso,
      priority: editForm.priority,
      requiredSkill: editForm.requiredSkill || null,
    };

    setIsEditing(false);
    onClose(); // Optimistic UI: Close immediately

    try {
      await updateTask.mutateAsync(payload);
    } catch {
      Alert.alert("Error", "Failed to update task.");
    }
  };


  const handleDelete = () => {
    const performDelete = async () => {
      onClose(); // Instant UI change: close drawer immediately
      try {
        await deleteTask.mutateAsync(displayTask.id);
      } catch {
        Alert.alert("Error", "Failed to delete task.");
      }
    };


    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to delete this task?")) {
        void performDelete();
      }
      return;
    }

    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: performDelete,
      },
    ]);
  };


  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={s.sheet}>
          <View style={s.handle} />

          <View style={s.header}>
            <Text style={s.sheetTitle}>{isEditing ? "Edit Task" : "Task Details"}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <MaterialIcons name="close" size={24} color="#71717a" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {isEditing ? (
              <View style={s.editContainer}>
                <Text style={s.label}>Title</Text>
                <TextInput
                  style={s.input}
                  value={editForm.title}
                  onChangeText={(t) => setEditForm((f) => ({ ...f, title: t }))}
                  placeholder="Task title"
                  placeholderTextColor="#52525b"
                />

                <Text style={s.label}>Description</Text>
                <TextInput
                  style={[s.input, s.multiline]}
                  value={editForm.desc}
                  onChangeText={(t) => setEditForm((f) => ({ ...f, desc: t }))}
                  placeholder="Add details..."
                  placeholderTextColor="#52525b"
                  multiline
                  numberOfLines={4}
                />

                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>Priority</Text>
                    <View style={s.priorityPicker}>
                      {PRIORITIES.map((p) => (
                        <TouchableOpacity
                          key={p}
                          style={[s.pBtn, editForm.priority === p && s.pBtnActive]}
                          onPress={() => setEditForm((f) => ({ ...f, priority: p }))}
                        >
                          <Text style={[s.pBtnText, editForm.priority === p && s.pBtnTextActive]}>
                            {p[0]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.label}>Deadline</Text>
                    <TextInput
                      style={s.input}
                      value={editForm.deadline}
                      onChangeText={(t) => setEditForm((f) => ({ ...f, deadline: t }))}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#52525b"
                    />
                  </View>
                </View>

                <Text style={s.label}>Required Skill</Text>
                <TextInput
                  style={s.input}
                  value={editForm.requiredSkill}
                  onChangeText={(t) => setEditForm((f) => ({ ...f, requiredSkill: t }))}
                  placeholder="e.g. React, Design"
                  placeholderTextColor="#52525b"
                />

                <View style={s.editActions}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setIsEditing(false)}>
                    <Text style={s.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
                    {updateTask.isPending ? (
                      <ActivityIndicator color="#09090b" size="small" />
                    ) : (
                      <Text style={s.saveBtnText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={s.viewContainer}>
                {/* Badges */}
                <View style={s.badgeRow}>
                  <View style={[s.badge, { borderColor: PRIORITY_COLORS[task.priority] + "44" }]}>
                    <View style={[s.dot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
                    <Text style={[s.badgeText, { color: PRIORITY_COLORS[task.priority] }]}>
                      {task.priority} Priority
                    </Text>
                  </View>
                  <View style={[s.badge, { borderColor: STATUS_COLORS[task.status] + "44" }]}>
                    <Text style={[s.badgeText, { color: STATUS_COLORS[task.status] }]}>
                      {task.status.replace("-", " ")}
                    </Text>
                  </View>
                </View>

                <Text style={s.titleText}>{task.title}</Text>

                {/* Info Box */}
                <View style={s.infoBox}>
                  <View style={s.infoRow}>
                    <MaterialIcons name="groups" size={18} color="#71717a" />
                    <View style={s.infoCol}>
                      <Text style={s.infoLabel}>Team</Text>
                      <Text style={s.infoValue}>{task.team?.name || "Personal"}</Text>
                    </View>
                  </View>
                  <View style={s.divider} />
                  <View style={s.infoRow}>
                    <MaterialIcons name="event" size={18} color="#71717a" />
                    <View style={s.infoCol}>
                      <Text style={s.infoLabel}>Due Date</Text>
                      <Text style={s.infoValue}>
                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}
                      </Text>
                    </View>
                  </View>
                  <View style={s.divider} />
                  <TouchableOpacity
                    style={s.infoRow}
                    onPress={() => isLeader && setShowAssignPicker(true)}
                    activeOpacity={isLeader ? 0.6 : 1}
                  >
                    <MaterialIcons name="person" size={18} color="#71717a" />
                    <View style={s.infoCol}>
                      <Text style={s.infoLabel}>Assigned To</Text>
                      {displayTask.assignedTo ? (
                        <View style={s.assigneeRow}>
                          <View style={s.assigneeAvatar}>
                            <Text style={s.assigneeInitials}>
                              {displayTask.assignedTo.name.substring(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={s.infoValue}>{displayTask.assignedTo.name}</Text>
                        </View>
                      ) : (
                        <Text style={[s.infoValue, isLeader && s.assignPlaceholder]}>
                          {isLeader ? "Tap to assign →" : "Unassigned"}
                        </Text>
                      )}
                    </View>
                    {isLeader && displayTask.assignedTo && (
                      <MaterialIcons name="edit" size={14} color="#52525b" />
                    )}
                  </TouchableOpacity>
                  {task.requiredSkill && (
                    <>
                      <View style={s.divider} />
                      <View style={s.infoRow}>
                        <MaterialIcons name="build" size={18} color="#71717a" />
                        <View style={s.infoCol}>
                          <Text style={s.infoLabel}>Required Skill</Text>
                          <Text style={s.infoValue}>{task.requiredSkill}</Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>

                {/* Description */}
                <Text style={s.sectionTitle}>Description</Text>
                <View style={s.descBox}>
                  <Text style={s.descText}>
                    {task.desc || task.description || "No description provided."}
                  </Text>
                </View>

                {/* Subtasks (Simplified) */}
                {task.children && task.children.length > 0 && (
                  <>
                    <Text style={s.sectionTitle}>Subtasks</Text>
                    {task.children.map((sub) => (
                      <View key={sub.id} style={s.subtask}>
                        <View
                          style={[
                            s.subDot,
                            { backgroundColor: STATUS_COLORS[sub.status] || "#71717a" },
                          ]}
                        />
                        <Text style={s.subTitle}>{sub.title}</Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Actions */}
                <View style={s.footerActions}>
                  {canEdit && (
                    <View style={s.row}>
                      <TouchableOpacity style={s.editBtn} onPress={() => setIsEditing(true)}>
                        <MaterialIcons name="edit" size={18} color="#fff" />
                        <Text style={s.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                      {isLeader && teamMembers.length > 0 && (
                        <TouchableOpacity style={s.assignBtn} onPress={() => setShowAssignPicker(true)}>
                          <MaterialIcons name="person-add" size={18} color="#a78bfa" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
                        <MaterialIcons name="delete" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {displayTask.status !== "completed" ? (
                    <TouchableOpacity
                      style={s.completeBtn}
                      onPress={() => handleStatusUpdate("completed")}
                    >
                      {updateTask.isPending ? (
                        <ActivityIndicator color="#09090b" size="small" />
                      ) : (
                        <>
                          <MaterialIcons name="check-circle" size={20} color="#09090b" />
                          <Text style={s.completeBtnText}>Complete Task</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={s.reopenBtn}
                      onPress={() => handleStatusUpdate("pending")}
                    >
                      {updateTask.isPending ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <MaterialIcons name="history" size={20} color="#fff" />
                          <Text style={s.reopenBtnText}>Re-open Task</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Member Picker Sheet */}
      <Modal
        visible={showAssignPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssignPicker(false)}
      >
        <TouchableOpacity
          style={s.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowAssignPicker(false)}
        >
          <View style={s.pickerSheet}>
            <View style={s.pickerHandle} />
            <Text style={s.pickerTitle}>Assign to</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Unassign option */}
              {displayTask?.assignedTo && (
                <TouchableOpacity
                  style={s.memberRow}
                  onPress={() => handleAssign(null)}
                >
                  <View style={[s.memberAvatar, s.memberAvatarUnassign]}>
                    <MaterialIcons name="person-off" size={18} color="#71717a" />
                  </View>
                  <Text style={[s.memberName, { color: "#71717a" }]}>Unassign</Text>
                </TouchableOpacity>
              )}

              {teamMembers.map((member) => {
                const isActive = member.id === displayTask?.assignedTo?.id ||
                  member.id === displayTask?.assignedToId;
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[s.memberRow, isActive && s.memberRowActive]}
                    onPress={() => handleAssign(member.id)}
                  >
                    <View style={[s.memberAvatar, isActive && s.memberAvatarActive]}>
                      <Text style={[s.memberInitials, isActive && s.memberInitialsActive]}>
                        {member.name.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.memberName, isActive && { color: "#fff" }]}>{member.name}</Text>
                      {member.email && <Text style={s.memberEmail}>{member.email}</Text>}
                    </View>
                    {isActive && (
                      <MaterialIcons name="check-circle" size={20} color="#a78bfa" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#09090b",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: "#27272a",
    maxHeight: "92%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#27272a",
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sheetTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },

  // View mode
  viewContainer: { paddingBottom: 20 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  titleText: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 20, lineHeight: 32 },
  infoBox: {
    backgroundColor: "#111113",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#18181b",
    padding: 16,
    marginBottom: 24,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoCol: { flex: 1 },
  infoLabel: { color: "#71717a", fontSize: 11, fontWeight: "600", textTransform: "uppercase", marginBottom: 2 },
  infoValue: { color: "#e4e4e7", fontSize: 14, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#18181b", marginVertical: 12 },
  sectionTitle: { color: "#71717a", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  descBox: { backgroundColor: "#111113", borderRadius: 16, padding: 16, marginBottom: 24, minHeight: 80 },
  descText: { color: "#a1a1aa", fontSize: 14, lineHeight: 22 },
  subtask: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8, paddingLeft: 4 },
  subDot: { width: 4, height: 12, borderRadius: 2 },
  subTitle: { color: "#d4d4d8", fontSize: 14 },

  footerActions: { marginTop: 24, gap: 12 },
  row: { flexDirection: "row", gap: 10 },
  editBtn: { flex: 1, backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 12, paddingVertical: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  editBtnText: { color: "#fff", fontWeight: "600" },
  assignBtn: { backgroundColor: "#18181b", borderWidth: 1, borderColor: "#3b2f6b", borderRadius: 12, paddingHorizontal: 16, justifyContent: "center", alignItems: "center" },
  deleteBtn: { backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 12, paddingHorizontal: 16, justifyContent: "center", alignItems: "center" },
  // Assignee display
  assigneeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  assigneeAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#3b2f6b", justifyContent: "center", alignItems: "center" },
  assigneeInitials: { color: "#a78bfa", fontSize: 9, fontWeight: "800" },
  assignPlaceholder: { color: "#a78bfa", fontSize: 13 },
  // Picker sheet
  pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  pickerSheet: { backgroundColor: "#111113", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderTopColor: "#27272a", maxHeight: "70%" },
  pickerHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#27272a", alignSelf: "center", marginBottom: 16 },
  pickerTitle: { color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 16 },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 12, marginBottom: 4 },
  memberRowActive: { backgroundColor: "#1a1030" },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#18181b", justifyContent: "center", alignItems: "center" },
  memberAvatarActive: { backgroundColor: "#3b2f6b" },
  memberAvatarUnassign: { backgroundColor: "#1c1c1f" },
  memberInitials: { color: "#71717a", fontSize: 13, fontWeight: "700" },
  memberInitialsActive: { color: "#a78bfa" },
  memberName: { color: "#e4e4e7", fontSize: 15, fontWeight: "600" },
  memberEmail: { color: "#52525b", fontSize: 12, marginTop: 2 },
  completeBtn: { backgroundColor: "#fff", borderRadius: 12, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  completeBtnText: { color: "#09090b", fontWeight: "700", fontSize: 15 },
  reopenBtn: { backgroundColor: "#18181b", borderRadius: 12, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  reopenBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Edit mode
  editContainer: { gap: 16, paddingBottom: 20 },
  label: { color: "#a1a1aa", fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  input: { backgroundColor: "#111113", borderWidth: 1, borderColor: "#18181b", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: "#fff", fontSize: 15 },
  multiline: { height: 100, textAlignVertical: "top" },
  priorityPicker: { flexDirection: "row", gap: 6 },
  pBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#27272a", alignItems: "center" },
  pBtnActive: { backgroundColor: "#27272a", borderColor: "#52525b" },
  pBtnText: { color: "#52525b", fontWeight: "700" },
  pBtnTextActive: { color: "#fff" },
  editActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "#27272a", alignItems: "center" },
  cancelBtnText: { color: "#71717a", fontWeight: "600" },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: "#fff", alignItems: "center" },
  saveBtnText: { color: "#09090b", fontWeight: "700" },
});
