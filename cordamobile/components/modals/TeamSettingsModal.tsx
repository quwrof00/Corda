import React, { useState, useEffect } from "react";
import {
  Modal, View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Switch
} from "react-native";
import { useUpdateTeam, useDeleteTeam, Team } from "@/hooks/useTeams";
import { api } from "@/lib/api";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface TeamSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  team: Team;
}

export default function TeamSettingsModal({ visible, onClose, team }: TeamSettingsModalProps) {
  const router = useRouter();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [enableAll, setEnableAll] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (visible && team) {
      setName(team.name);
      setDesc(team.desc || "");
      setEnableAll(team.enableAll || false);
    }
  }, [visible, team]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Team name is required.");
      return;
    }

    if (team.name === "Personal" && name !== "Personal") {
      Alert.alert("Error", "Cannot rename your personal workspace.");
      return;
    }

    if (name.trim().toLowerCase() === "personal" && team.name !== "Personal") {
      Alert.alert("Error", "The name 'Personal' is reserved.");
      return;
    }

    setIsUpdating(true);
    try {
      await updateTeam.mutateAsync({
        id: team.id,
        name: name.trim(),
        description: desc.trim(),
        enableAll,
      });
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.error || "Failed to update team.";
      Alert.alert("Error", msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    if (team.name === "Personal") {
      Alert.alert("Error", "Cannot delete your personal workspace.");
      return;
    }

    Alert.alert(
      "Delete Team",
      "Are you sure you want to delete this team? This action cannot be undone and all data will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteTeam.mutateAsync(team.id);
              onClose();
              router.replace("/(app)/teams");
            } catch (e: any) {
              Alert.alert("Error", "Failed to delete team.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleAllocate = () => {
    Alert.alert(
      "Auto-Allocate Tasks",
      "This will automatically assign unassigned tasks to the most suitable members based on skills and workload. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: async () => {
            setIsAllocating(true);
            try {
              await api.post(`/allocator/${team.id}`);
              Alert.alert("Success", "Allocation process completed.");
              onClose();
            } catch (e) {
              Alert.alert("Error", "Allocation failed.");
            } finally {
              setIsAllocating(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={s.sheet}>
          <View style={s.handle} />
          
          <View style={s.header}>
            <Text style={s.sheetTitle}>Team Settings</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={24} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Edit Team Details */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Edit Details</Text>
              
              <Text style={s.label}>Team Name *</Text>
              <TextInput
                style={s.input}
                placeholder="Marketing Team"
                placeholderTextColor="#52525b"
                value={name}
                onChangeText={setName}
                editable={team?.name !== "Personal"}
              />

              <Text style={s.label}>Description</Text>
              <TextInput
                style={[s.input, s.multiline]}
                placeholder="What does this team do?"
                placeholderTextColor="#52525b"
                value={desc}
                onChangeText={setDesc}
                multiline
                numberOfLines={3}
              />

              <View style={s.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.switchLabel}>Enable open allocation</Text>
                  <Text style={s.switchDesc}>Allow anyone in the team to allocate tasks</Text>
                </View>
                <Switch
                  value={enableAll}
                  onValueChange={setEnableAll}
                  trackColor={{ false: "#27272a", true: "#a78bfa" }}
                  thumbColor="#fff"
                />
              </View>

              <TouchableOpacity
                style={[s.submitBtn, isUpdating && s.btnDisabled]}
                onPress={handleSave}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#09090b" size="small" />
                ) : (
                  <Text style={s.submitBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={s.divider} />

            {/* Actions */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Actions</Text>
              
              <TouchableOpacity style={s.actionBtn} onPress={handleAllocate} disabled={isAllocating}>
                <View style={[s.actionIcon, { backgroundColor: "#a78bfa22" }]}>
                  <MaterialIcons name="auto-awesome" size={20} color="#a78bfa" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.actionTitle}>Auto-Allocate Tasks</Text>
                  <Text style={s.actionDesc}>Distribute unassigned tasks automatically</Text>
                </View>
                {isAllocating && <ActivityIndicator color="#a78bfa" size="small" />}
              </TouchableOpacity>

              <TouchableOpacity style={[s.actionBtn, { marginTop: 12 }]} onPress={handleDelete} disabled={isDeleting || team.name === "Personal"}>
                <View style={[s.actionIcon, { backgroundColor: "#ef444422" }]}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.actionTitle, { color: "#ef4444" }]}>Delete Team</Text>
                  <Text style={s.actionDesc}>Permanently delete this workspace</Text>
                </View>
                {isDeleting && <ActivityIndicator color="#ef4444" size="small" />}
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#111113", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderTopColor: "#27272a", maxHeight: "90%" },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#27272a", alignSelf: "center", marginBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  sheetTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  closeBtn: { padding: 4 },
  section: { marginBottom: 8 },
  sectionTitle: { color: "#e4e4e7", fontSize: 16, fontWeight: "700", marginBottom: 16 },
  label: { color: "#a1a1aa", fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  input: { backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: "#fff", fontSize: 15, marginBottom: 16 },
  multiline: { height: 80, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24, padding: 16, backgroundColor: "#18181b", borderRadius: 12, borderWidth: 1, borderColor: "#27272a" },
  switchLabel: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 4 },
  switchDesc: { color: "#71717a", fontSize: 13 },
  submitBtn: { paddingVertical: 14, borderRadius: 10, backgroundColor: "#fff", alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#09090b", fontWeight: "700", fontSize: 15 },
  divider: { height: 1, backgroundColor: "#18181b", marginVertical: 24 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16, backgroundColor: "#18181b", borderRadius: 12, borderWidth: 1, borderColor: "#27272a" },
  actionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  actionTitle: { color: "#e4e4e7", fontSize: 15, fontWeight: "600", marginBottom: 2 },
  actionDesc: { color: "#71717a", fontSize: 13 },
});
