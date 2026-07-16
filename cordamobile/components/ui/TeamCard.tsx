import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Team } from "@/hooks/useTeams";

interface TeamCardProps {
  team: Team;
  onPress: () => void;
  compact?: boolean;
}

export default function TeamCard({ team, onPress, compact }: TeamCardProps) {
  const initials = team.name.substring(0, 2).toUpperCase();
  const memberCount = team.members?.length ?? 0;
  const unassigned = team._count?.tasks ?? 0;

  if (compact) {
    return (
      <TouchableOpacity style={s.compactCard} onPress={onPress} activeOpacity={0.75}>
        <View style={s.compactAvatar}>
          <Text style={s.compactAvatarText}>{initials}</Text>
        </View>
        <View style={s.compactContent}>
          <Text style={s.compactName}>{team.name}</Text>
          <Text style={s.compactMeta}>{memberCount} members</Text>
        </View>
        {unassigned > 0 && (
          <View style={s.alertDot} />
        )}
        <Text style={s.arrow}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.75}>
      <View style={s.cardHeader}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <View style={s.headerContent}>
          <Text style={s.name}>{team.name}</Text>
          {team.leader?.name && (
            <Text style={s.leader}>Leader: {team.leader.name}</Text>
          )}
        </View>
        {unassigned > 0 && <View style={s.alertDot} />}
      </View>

      {team.desc && (
        <Text style={s.desc} numberOfLines={2}>{team.desc}</Text>
      )}

      <View style={s.footer}>
        <Text style={s.footerText}>👥 {memberCount} members</Text>
        {unassigned > 0 && (
          <Text style={s.unassigned}>{unassigned} unassigned</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#111113",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#27272a",
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  headerContent: { flex: 1 },
  name: { color: "#fff", fontSize: 16, fontWeight: "700" },
  leader: { color: "#52525b", fontSize: 12, marginTop: 2 },
  desc: { color: "#71717a", fontSize: 13, lineHeight: 19, marginBottom: 12 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerText: { color: "#52525b", fontSize: 12 },
  unassigned: { color: "#f59e0b", fontSize: 12, fontWeight: "600" },
  alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#f59e0b" },
  // Compact
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111113",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  compactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#18181b",
    justifyContent: "center",
    alignItems: "center",
  },
  compactAvatarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  compactContent: { flex: 1 },
  compactName: { color: "#e4e4e7", fontSize: 15, fontWeight: "600" },
  compactMeta: { color: "#52525b", fontSize: 12 },
  arrow: { color: "#52525b", fontSize: 20 },
});
