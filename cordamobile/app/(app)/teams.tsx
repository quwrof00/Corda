import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl, Modal, TextInput, Alert,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteTeams, useCreateTeam, flattenInfiniteTeams, Team } from "@/hooks/useTeams";
import TeamCard from "@/components/ui/TeamCard";
import EmptyState from "@/components/ui/EmptyState";
import { useRouter } from "expo-router";

export default function TeamsScreen() {
  const router = useRouter();
  const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage, refetch, isRefetching } =
    useInfiniteTeams({ limit: 12 });
  const teams = useMemo(
    () => flattenInfiniteTeams(data).filter((t: Team) => t.name !== "Personal"),
    [data]
  );
  const createTeam = useCreateTeam();
  const [showModal, setShowModal] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!teamName.trim()) { Alert.alert("Error", "Please enter a team name."); return; }
    setIsCreating(true);
    try {
      await createTeam.mutateAsync({ name: teamName.trim(), desc: teamDesc.trim() });
      setShowModal(false); setTeamName(""); setTeamDesc("");
    } catch { Alert.alert("Error", "Failed to create team."); }
    finally { setIsCreating(false); }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Teams</Text>
          <Text style={s.subtitle}>Manage your teams and members</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
          <Text style={s.addBtnText}>+ Team</Text>
        </TouchableOpacity>
      </View>

      {isPending ? <View style={s.center}><ActivityIndicator color="#71717a" /></View> : (
        <FlatList
          data={teams}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TeamCard team={item} onPress={() => router.push(`/(app)/teams/${item.id}`)} />
          )}
          ListEmptyComponent={<EmptyState icon="👥" message="No teams yet." actionLabel="Create Team" onAction={() => setShowModal(true)} />}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color="#71717a" style={{ marginVertical: 16 }} /> : null}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) void fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor="#52525b" />}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Create Team</Text>
            <Text style={s.label}>Team Name</Text>
            <TextInput style={s.input} placeholder="e.g. Design Team" placeholderTextColor="#52525b" value={teamName} onChangeText={setTeamName} autoFocus />
            <Text style={s.label}>Description (optional)</Text>
            <TextInput style={[s.input, s.inputMultiline]} placeholder="What does this team work on?" placeholderTextColor="#52525b" value={teamDesc} onChangeText={setTeamDesc} multiline numberOfLines={3} />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}><Text style={s.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[s.createBtn, isCreating && s.btnDisabled]} onPress={handleCreate} disabled={isCreating}>
                {isCreating ? <ActivityIndicator color="#09090b" size="small" /> : <Text style={s.createBtnText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "#18181b" },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#52525b", fontSize: 13, marginTop: 2 },
  addBtn: { backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 20, paddingBottom: 120 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#111113", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderTopWidth: 1, borderTopColor: "#27272a" },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 20 },
  label: { color: "#a1a1aa", fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  input: { backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: "#fff", fontSize: 15, marginBottom: 16 },
  inputMultiline: { height: 80, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: "#27272a", alignItems: "center" },
  cancelBtnText: { color: "#71717a", fontWeight: "600" },
  createBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: "#fff", alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  createBtnText: { color: "#09090b", fontWeight: "700" },
});
