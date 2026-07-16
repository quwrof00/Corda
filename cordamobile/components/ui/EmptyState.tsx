import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface EmptyStateProps {
  icon: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={s.container}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.message}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={s.btn} onPress={onAction} activeOpacity={0.8}>
          <Text style={s.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 },
  icon: { fontSize: 36, marginBottom: 12 },
  message: { color: "#52525b", fontSize: 14, textAlign: "center", lineHeight: 21, marginBottom: 20 },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "#18181b",
  },
  btnText: { color: "#d4d4d8", fontSize: 13, fontWeight: "600" },
});
