import React, { useState } from "react";
import {
  Modal, View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useCreateTask } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";

import { MaterialIcons } from "@expo/vector-icons";
import { useInfiniteTeams, flattenInfiniteTeams, useTeamMembers } from "@/hooks/useTeams";

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  defaultTeamId?: string;
  defaultAssignedToId?: string;
  defaultDeadline?: string | Date;
}

const PRIORITIES = ["Low", "Medium", "High"] as const;

export default function CreateTaskModal({ visible, onClose, defaultTeamId, defaultAssignedToId, defaultDeadline }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [deadline, setDeadline] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(defaultTeamId ?? "");
  const [assignedToId, setAssignedToId] = useState<string | undefined>(defaultAssignedToId);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [showAssignPicker, setShowAssignPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setTitle("");
      setDesc("");
      setPriority("Medium");
      setShowDatePicker(false);
      setSelectedTeamId(defaultTeamId ?? "");
      setAssignedToId(defaultAssignedToId);

      if (defaultDeadline) {
        setDeadline(new Date(defaultDeadline));
      } else {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        setDeadline(todayDate);
      }
    }
  }, [visible, defaultDeadline, defaultTeamId]);

  const { user } = useAuth();
  const createTask = useCreateTask();

  const teamsQuery = useInfiniteTeams({ limit: 50 });
  const teams = flattenInfiniteTeams(teamsQuery.data);

  const membersQuery = useTeamMembers(selectedTeamId || undefined);
  const members = membersQuery.data ?? [];

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a task title.");
      return;
    }

    // Resolve teamId (Personal is a real team in the backend)
    let teamId = selectedTeamId;
    if (!teamId) {
      const personalTeam = teams.find((t) => t.name === "Personal");
      if (personalTeam) {
        teamId = personalTeam.id;
      } else {
        Alert.alert("Error", "Could not find Personal workspace. Please select a team.");
        return;
      }
    }

    const deadlineIso = deadline.toISOString();

    // Auto-assign to self if it's a personal task
    const isPersonal = !selectedTeamId || teams.find(t => t.id === teamId)?.name === "Personal";

    const payload = {
      title: title.trim(),
      description: desc.trim() || undefined,
      priority,
      deadline: deadlineIso,
      teamId: teamId,
      assignedToId: assignedToId || (isPersonal ? user?.id : undefined),
    };

    handleClose(); // Optimistic UI: Close immediately

    try {
      await createTask.mutateAsync(payload);
    } catch (e: any) {
      const msg = e?.response?.data?.error || "Failed to create task.";
      Alert.alert("Error", msg);
    }
  };


  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>New Task</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={s.label}>Title *</Text>
            <TextInput
              style={s.input}
              placeholder="What needs to be done?"
              placeholderTextColor="#52525b"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />

            <Text style={s.label}>Description</Text>
            <TextInput
              style={[s.input, s.multiline]}
              placeholder="Add details..."
              placeholderTextColor="#52525b"
              value={desc}
              onChangeText={setDesc}
              multiline
              numberOfLines={3}
            />

            <Text style={s.label}>Priority</Text>
            <View style={s.priorityRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[s.priorityBtn, priority === p && s.priorityBtnActive]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[s.priorityBtnText, priority === p && s.priorityBtnTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Deadline</Text>
            <TouchableOpacity style={s.dateButton} onPress={() => setShowDatePicker(true)} activeOpacity={0.75}>
              <Text style={s.dateButtonText}>
                {deadline.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </Text>
              <Text style={s.dateButtonIcon}>📅</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={deadline}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                minimumDate={today}
                onChange={(_event: DateTimePickerEvent, selected?: Date) => {
                  if (Platform.OS === "android") setShowDatePicker(false);
                  if (selected) setDeadline(selected);
                }}
              />
            )}
            {Platform.OS === "ios" && showDatePicker && (
              <TouchableOpacity style={s.doneBtn} onPress={() => setShowDatePicker(false)}>
                <Text style={s.doneBtnText}>Done</Text>
              </TouchableOpacity>
            )}

            <Text style={s.label}>Team *</Text>
            <TouchableOpacity style={s.dropdownButton} onPress={() => setShowTeamPicker(true)} activeOpacity={0.75} disabled={teamsQuery.isPending}>
              {teamsQuery.isPending ? (
                <>
                  <Text style={[s.dropdownButtonText, { color: '#71717a' }]}>Loading teams...</Text>
                  <ActivityIndicator size="small" color="#71717a" />
                </>
              ) : (
                <>
                  <Text style={s.dropdownButtonText}>
                    {selectedTeamId ? (teams.find(t => t.id === selectedTeamId)?.name || "Personal") : "Personal"}
                  </Text>
                  <MaterialIcons name="expand-more" size={20} color="#a1a1aa" />
                </>
              )}
            </TouchableOpacity>

            {(selectedTeamId && teams.find(t => t.id === selectedTeamId)?.name !== "Personal") && (
              <>
                <Text style={s.label}>Assign To (Optional)</Text>
                <TouchableOpacity style={s.dropdownButton} onPress={() => setShowAssignPicker(true)} activeOpacity={0.75} disabled={membersQuery.isPending}>
                  {membersQuery.isPending ? (
                    <>
                      <Text style={[s.dropdownButtonText, { color: '#71717a' }]}>Loading members...</Text>
                      <ActivityIndicator size="small" color="#71717a" />
                    </>
                  ) : (
                    <>
                      <Text style={s.dropdownButtonText}>
                        {assignedToId ? (members.find((m: any) => m.id === assignedToId)?.name || "Unassigned") : "Unassigned"}
                      </Text>
                      <MaterialIcons name="expand-more" size={20} color="#a1a1aa" />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            <View style={s.actions}>
              <TouchableOpacity style={s.cancelBtn} onPress={handleClose}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitBtn, isSubmitting && s.btnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#09090b" size="small" />
                ) : (
                  <Text style={s.submitBtnText}>Create Task</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Team Picker Modal */}
      <Modal visible={showTeamPicker} transparent animationType="fade" onRequestClose={() => setShowTeamPicker(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowTeamPicker(false)}>
          <View style={s.menuContainer}>
            <View style={s.menuHeader}>
              <Text style={s.menuTitle}>Select Team</Text>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={[s.menuItem, !selectedTeamId && s.menuItemActive]}
                onPress={() => {
                  setSelectedTeamId("");
                  setAssignedToId(undefined);
                  setShowTeamPicker(false);
                }}
              >
                <Text style={[s.menuItemText, !selectedTeamId && s.menuItemTextActive]}>Personal</Text>
                {!selectedTeamId && <MaterialIcons name="check" size={18} color="#fff" />}
              </TouchableOpacity>
              {teams.filter((t) => t.name !== "Personal").map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={[s.menuItem, selectedTeamId === team.id && s.menuItemActive]}
                  onPress={() => {
                    setSelectedTeamId(team.id);
                    setAssignedToId(undefined);
                    setShowTeamPicker(false);
                  }}
                >
                  <Text style={[s.menuItemText, selectedTeamId === team.id && s.menuItemTextActive]}>
                    {team.name}
                  </Text>
                  {selectedTeamId === team.id && <MaterialIcons name="check" size={18} color="#fff" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Assignee Picker Modal */}
      <Modal visible={showAssignPicker} transparent animationType="fade" onRequestClose={() => setShowAssignPicker(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowAssignPicker(false)}>
          <View style={s.menuContainer}>
            <View style={s.menuHeader}>
              <Text style={s.menuTitle}>Assign Task</Text>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={[s.menuItem, !assignedToId && s.menuItemActive]}
                onPress={() => {
                  setAssignedToId(undefined);
                  setShowAssignPicker(false);
                }}
              >
                <Text style={[s.menuItemText, !assignedToId && s.menuItemTextActive]}>Unassigned</Text>
                {!assignedToId && <MaterialIcons name="check" size={18} color="#fff" />}
              </TouchableOpacity>
              {members.map((member: any) => (
                <TouchableOpacity
                  key={member.id}
                  style={[s.menuItem, assignedToId === member.id && s.menuItemActive]}
                  onPress={() => {
                    setAssignedToId(member.id);
                    setShowAssignPicker(false);
                  }}
                >
                  <Text style={[s.menuItemText, assignedToId === member.id && s.menuItemTextActive]}>
                    {member.name}
                  </Text>
                  {assignedToId === member.id && <MaterialIcons name="check" size={18} color="#fff" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#111113", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderTopColor: "#27272a", maxHeight: "90%" },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#27272a", alignSelf: "center", marginBottom: 20 },
  sheetTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 20 },
  label: { color: "#a1a1aa", fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  input: { backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: "#fff", fontSize: 15, marginBottom: 16 },
  multiline: { height: 80, textAlignVertical: "top" },
  priorityRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  priorityBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#27272a", alignItems: "center" },
  priorityBtnActive: { backgroundColor: "#27272a", borderColor: "#52525b" },
  priorityBtnText: { color: "#52525b", fontWeight: "600", fontSize: 13 },
  priorityBtnTextActive: { color: "#fff" },
  dropdownButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  dropdownButtonText: { color: "#fff", fontSize: 15 },
  dateButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  dateButtonText: { color: "#fff", fontSize: 15 },
  dateButtonIcon: { fontSize: 16 },
  doneBtn: { alignSelf: "flex-end", paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#27272a", borderRadius: 8, marginBottom: 12 },
  doneBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  actions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: "#27272a", alignItems: "center" },
  cancelBtnText: { color: "#71717a", fontWeight: "600" },
  submitBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: "#fff", alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#09090b", fontWeight: "700" },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 30 },
  menuContainer: { backgroundColor: "#18181b", borderRadius: 20, borderWidth: 1, borderColor: "#27272a", overflow: "hidden" },
  menuHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#27272a", backgroundColor: "#1c1c1f" },
  menuTitle: { color: "#fff", fontSize: 15, fontWeight: "700", textAlign: "center" },
  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  menuItemActive: { backgroundColor: "#27272a" },
  menuItemText: { color: "#a1a1aa", fontSize: 14, fontWeight: "500" },
  menuItemTextActive: { color: "#fff", fontWeight: "700" },
});
