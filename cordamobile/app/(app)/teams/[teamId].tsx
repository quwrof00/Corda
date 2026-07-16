import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl, ScrollView, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTeam, useTeamMembers, useRemoveMember } from "@/hooks/useTeams";
import { useInfiniteTasks, useUpdateTask, flattenInfiniteTasks, Task } from "@/hooks/useTasks";
import { formatDaysLeft } from "@/lib/utils";
import TaskCard from "@/components/ui/TaskCard";
import CreateTaskModal from "@/components/modals/CreateTaskModal";
import TaskDetailModal from "@/components/modals/TaskDetailModal";
import MemberActionModal from "@/components/modals/MemberActionModal";
import TeamSettingsModal from "@/components/modals/TeamSettingsModal";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { Member } from "@/hooks/useTeams";


type TabType = "Tasks" | "Members";

export default function TeamDetailScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("Tasks");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [defaultAssignedToId, setDefaultAssignedToId] = useState<string | undefined>();
  const { user } = useAuth();


  const teamQuery = useTeam(teamId);
  const membersQuery = useTeamMembers(teamId);
  const tasksQuery = useInfiniteTasks({ teamId, sortBy: "deadline", limit: 20 });
  const updateTask = useUpdateTask();
  const removeMember = useRemoveMember();

  const tasks = useMemo(() => flattenInfiniteTasks(tasksQuery.data), [tasksQuery.data]);
  const team = teamQuery.data;
  const members = membersQuery.data ?? [];

  if (teamQuery.isPending) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}><ActivityIndicator color="#71717a" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Teams</Text>
        </TouchableOpacity>
        <View style={s.headerRight}>
          {(team?.leaderId === user?.id || team?.leader?.id === user?.id) && (
            <TouchableOpacity style={s.settingsBtn} onPress={() => setShowSettings(true)}>
              <Text style={s.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.addBtn} onPress={() => { setDefaultAssignedToId(undefined); setShowCreateTask(true); }}>
            <Text style={s.addBtnText}>+ Task</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Team info */}
      <View style={s.teamInfo}>
        <View style={s.teamAvatar}>
          <Text style={s.teamAvatarText}>{team?.name.substring(0, 2).toUpperCase()}</Text>
        </View>
        <View style={s.teamMeta}>
          <Text style={s.teamName}>{team?.name}</Text>
          {team?.leader?.name && (
            <Text style={s.teamLeader}>Leader: {team.leader.name}</Text>
          )}
          {team?.desc && <Text style={s.teamDesc} numberOfLines={2}>{team.desc}</Text>}
        </View>
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {(["Tasks", "Members"] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === "Tasks" ? (
        tasksQuery.isPending ? (
          <View style={s.center}><ActivityIndicator color="#71717a" /></View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TaskCard
                task={item}
                onToggleComplete={() => {
                  const newStatus = item.status === "completed" ? "pending" : "completed";
                  updateTask.mutate({ id: item.id, status: newStatus });
                }}
                formatDaysLeft={formatDaysLeft}
                showStatus
                showAssignee
                onPress={() => setSelectedTask(item)}
              />


            )}
            ListEmptyComponent={
              <EmptyState
                icon="📋"
                message="No tasks in this team yet."
                actionLabel="Add Task"
                onAction={() => { setDefaultAssignedToId(undefined); setShowCreateTask(true); }}
              />
            }
            ListFooterComponent={
              tasksQuery.isFetchingNextPage
                ? <ActivityIndicator color="#71717a" style={{ marginVertical: 16 }} />
                : null
            }
            onEndReached={() => {
              if (tasksQuery.hasNextPage && !tasksQuery.isFetchingNextPage)
                void tasksQuery.fetchNextPage();
            }}
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
        )
      ) : (
        <ScrollView contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
          {members.length === 0 ? (
            <EmptyState icon="👤" message="No members found." />
          ) : (
            members.map((member: { id: string; name: string; email?: string; image?: string }) => (
              <TouchableOpacity key={member.id} style={s.memberCard} onPress={() => setSelectedMember(member as Member)}>
                <View style={s.memberAvatar}>
                  <Text style={s.memberAvatarText}>
                    {member.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={s.memberInfo}>
                  <Text style={s.memberName}>{member.name}</Text>
                  <Text style={s.memberEmail}>{member.email}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <CreateTaskModal
        visible={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        defaultTeamId={teamId}
        defaultAssignedToId={defaultAssignedToId}
      />

      <TaskDetailModal
        task={selectedTask}
        visible={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        currentUserId={user?.id}
        isLeader={team?.leaderId === user?.id || team?.leader?.id === user?.id}
        teamMembers={members}
      />

      <MemberActionModal
        member={selectedMember}
        visible={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        isLeader={team?.leaderId === user?.id || team?.leader?.id === user?.id}
        currentUserId={user?.id}
        onAssignTask={(memberId) => {
          setDefaultAssignedToId(memberId);
          setShowCreateTask(true);
        }}
        onRemoveMember={async (memberId) => {
           try {
              await removeMember.mutateAsync({ teamId, userId: memberId });
           } catch (e) {
              Alert.alert("Error", "Failed to remove member.");
           }
        }}
      />

      {team && (
        <TeamSettingsModal
          visible={showSettings}
          onClose={() => setShowSettings(false)}
          team={team}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerRight: { flexDirection: "row", gap: 10, alignItems: "center" },
  backBtn: { padding: 4 },
  backText: { color: "#71717a", fontSize: 14 },
  settingsBtn: { padding: 6, backgroundColor: "#18181b", borderRadius: 10, borderWidth: 1, borderColor: "#27272a" },
  settingsIcon: { fontSize: 16 },
  addBtn: { backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  teamInfo: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "#18181b", gap: 14 },
  teamAvatar: { width: 52, height: 52, borderRadius: 12, backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", justifyContent: "center", alignItems: "center" },
  teamAvatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  teamMeta: { flex: 1 },
  teamName: { color: "#fff", fontSize: 20, fontWeight: "700" },
  teamLeader: { color: "#52525b", fontSize: 12, marginTop: 3 },
  teamDesc: { color: "#71717a", fontSize: 13, marginTop: 6, lineHeight: 19 },
  tabBar: { flexDirection: "row", paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#27272a" },
  tabActive: { backgroundColor: "#27272a", borderColor: "#52525b" },
  tabText: { color: "#52525b", fontWeight: "600", fontSize: 13 },
  tabTextActive: { color: "#fff" },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  memberCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#111113", borderRadius: 12, borderWidth: 1, borderColor: "#27272a", padding: 14, marginBottom: 10, gap: 12 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#18181b", justifyContent: "center", alignItems: "center" },
  memberAvatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  memberInfo: { flex: 1 },
  memberName: { color: "#e4e4e7", fontSize: 15, fontWeight: "600" },
  memberEmail: { color: "#52525b", fontSize: 12, marginTop: 2 },
});
