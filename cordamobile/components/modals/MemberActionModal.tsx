import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Member } from "@/hooks/useTeams";

interface MemberActionModalProps {
  member: Member | null;
  visible: boolean;
  onClose: () => void;
  isLeader: boolean;
  currentUserId?: string;
  onAssignTask: (memberId: string) => void;
  onRemoveMember: (memberId: string) => void;
}

export default function MemberActionModal({
  member,
  visible,
  onClose,
  isLeader,
  currentUserId,
  onAssignTask,
  onRemoveMember,
}: MemberActionModalProps) {
  if (!member) return null;

  const isSelf = currentUserId === member.id;

  const handleRemove = () => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${member.name} from the team?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            onRemoveMember(member.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity style={s.overlayTouch} activeOpacity={1} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.handle} />

          {/* Member Info */}
          <View style={s.memberInfo}>
            <View style={s.memberAvatar}>
              <Text style={s.memberAvatarText}>
                {member.name.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={s.memberName}>{member.name}</Text>
              {member.email && <Text style={s.memberEmail}>{member.email}</Text>}
            </View>
          </View>

          {/* Actions */}
          <View style={s.actionsContainer}>
            <TouchableOpacity
              style={s.actionBtn}
              onPress={() => {
                onClose();
                onAssignTask(member.id);
              }}
            >
              <View style={[s.actionIcon, { backgroundColor: "#a78bfa22" }]}>
                <MaterialIcons name="assignment-add" size={20} color="#a78bfa" />
              </View>
              <View>
                <Text style={s.actionTitle}>Assign New Task</Text>
                <Text style={s.actionDesc}>Create a task specifically for {member.name.split(" ")[0]}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={s.actionBtn} onPress={() => { Alert.alert("Coming soon", "View workload feature is coming soon!"); onClose() }}>
              <View style={[s.actionIcon, { backgroundColor: "#60a5fa22" }]}>
                <MaterialIcons name="bar-chart" size={20} color="#60a5fa" />
              </View>
              <View>
                <Text style={s.actionTitle}>View Workload</Text>
                <Text style={s.actionDesc}>See tasks assigned to {member.name.split(" ")[0]}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={s.actionBtn} onPress={() => { Alert.alert("Coming soon", "View skills feature is coming soon!"); onClose() }}>
              <View style={[s.actionIcon, { backgroundColor: "#34d39922" }]}>
                <MaterialIcons name="build" size={20} color="#34d399" />
              </View>
              <View>
                <Text style={s.actionTitle}>View Skills</Text>
                <Text style={s.actionDesc}>See {member.name.split(" ")[0]}&apos;s technical skills</Text>
              </View>
            </TouchableOpacity>

            {isLeader && !isSelf && (
              <>
                <View style={s.divider} />
                <TouchableOpacity style={s.actionBtn} onPress={handleRemove}>
                  <View style={[s.actionIcon, { backgroundColor: "#ef444422" }]}>
                    <MaterialIcons name="person-remove" size={20} color="#ef4444" />
                  </View>
                  <View>
                    <Text style={[s.actionTitle, { color: "#ef4444" }]}>Remove from Team</Text>
                    <Text style={s.actionDesc}>Revoke access to this workspace</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  overlayTouch: { flex: 1, width: "100%" },
  sheet: {
    backgroundColor: "#111113",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: "#27272a",
    maxHeight: "85%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#27272a",
    alignSelf: "center",
    marginBottom: 20,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#18181b",
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarText: { color: "#fff", fontWeight: "700", fontSize: 20 },
  memberName: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  memberEmail: { color: "#71717a", fontSize: 14 },
  actionsContainer: { gap: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 16 },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  actionTitle: { color: "#e4e4e7", fontSize: 15, fontWeight: "600", marginBottom: 2 },
  actionDesc: { color: "#71717a", fontSize: 13 },
  divider: { height: 1, backgroundColor: "#18181b", marginVertical: 8 },
});
