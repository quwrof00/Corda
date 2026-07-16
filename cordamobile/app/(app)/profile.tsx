import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useUser, useUpdateUser } from "@/hooks/useUser";

const SKILL_CATEGORIES = {
  "Frontend": ["React", "Vue", "Angular", "Next.js", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind", "SCSS", "Redux", "Svelte"],
  "Backend": ["Node.js", "Python", "Java", "Go", "Ruby", "PHP", "C#", ".NET", "Express", "Django", "Flask", "Spring"],
  "Database": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "SQL", "NoSQL", "Firebase", "Supabase", "DynamoDB"],
  "DevOps": ["Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Jenkins", "GitHub Actions", "Terraform"],
  "Mobile": ["React Native", "Flutter", "Swift", "Kotlin", "iOS", "Android"],
  "Other": [] as string[]
};

const categorizeSkills = (skills: string[]) => {
  const categorized: Record<string, string[]> = {
    "Frontend": [], "Backend": [], "Database": [], "DevOps": [], "Mobile": [], "Other": []
  };

  skills.forEach(skill => {
    let placed = false;
    for (const [category, keywords] of Object.entries(SKILL_CATEGORIES)) {
      if (keywords.some(keyword => skill.toLowerCase().includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(skill.toLowerCase()))) {
        categorized[category].push(skill);
        placed = true;
        break;
      }
    }
    if (!placed) {
      categorized["Other"].push(skill);
    }
  });

  return Object.fromEntries(
    Object.entries(categorized).filter(([, skills]) => skills.length > 0)
  );
};

export default function ProfileScreen() {
  const { user: authUser, logout } = useAuth();
  const userId = authUser?.id;

  const { data: dbUser } = useUser(userId ?? "", { enabled: !!userId });
  const updateUser = useUpdateUser();

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    if (dbUser) {
      const initialSkills = (dbUser.skills || []).filter((s: string, i: number, arr: string[]) => 
        arr.findIndex(v => v.toLowerCase() === s.toLowerCase()) === i
      );
      setSkills(initialSkills);
    }
  }, [dbUser]);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => void logout() },
    ]);
  };

  const saveSkills = (updatedSkills: string[]) => {
    if (!userId) return;
    updateUser.mutate({ id: userId, data: { skills: updatedSkills } });
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      const updatedSkills = [...skills, trimmed];
      setSkills(updatedSkills);
      setNewSkill("");
      saveSkills(updatedSkills);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    Alert.alert("Remove Skill", `Remove ${skillToRemove}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => {
        const updatedSkills = skills.filter(s => s !== skillToRemove);
        setSkills(updatedSkills);
        saveSkills(updatedSkills);
      }}
    ]);
  };

  const initials = dbUser?.name || authUser?.name
    ? (dbUser?.name || authUser?.name)?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const categorizedSkills = categorizeSkills(skills);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Profile</Text>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.name}>{dbUser?.name || authUser?.name || "Unknown"}</Text>
          <Text style={s.email}>{dbUser?.email || authUser?.email || ""}</Text>
        </View>

        {/* Info rows */}
        <View style={s.card}>
          <View style={s.row}>
            <Ionicons name="person-outline" size={18} color="#71717a" />
            <View style={s.rowContent}>
              <Text style={s.rowLabel}>Name</Text>
              <Text style={s.rowValue}>{dbUser?.name || authUser?.name || "—"}</Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Ionicons name="mail-outline" size={18} color="#71717a" />
            <View style={s.rowContent}>
              <Text style={s.rowLabel}>Email</Text>
              <Text style={s.rowValue}>{dbUser?.email || authUser?.email || "—"}</Text>
            </View>
          </View>
        </View>

        {/* Skills Section */}
        <View style={s.card}>
          <View style={[s.row, { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#18181b" }]}>
            <Ionicons name="code-slash-outline" size={18} color="#71717a" />
            <Text style={[s.rowLabel, { marginBottom: 0, marginLeft: 14, fontSize: 13, color: '#e4e4e7' }]}>Skills & Expertise</Text>
          </View>
          
          <View style={{ padding: 16 }}>
            <View style={s.skillInputContainer}>
              <TextInput
                style={s.skillInput}
                placeholder="Add a new skill..."
                placeholderTextColor="#52525b"
                value={newSkill}
                onChangeText={setNewSkill}
                onSubmitEditing={handleAddSkill}
                returnKeyType="done"
              />
              <TouchableOpacity style={s.skillAddBtn} onPress={handleAddSkill}>
                <Text style={s.skillAddBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {skills.length === 0 ? (
              <View style={s.emptySkills}>
                <Text style={s.emptySkillsText}>No skills added</Text>
              </View>
            ) : (
              <View style={s.categoriesContainer}>
                {Object.entries(categorizedSkills).map(([category, categorySkills]) => (
                  <View key={category} style={s.categoryBlock}>
                    <Text style={s.categoryTitle}>{category}</Text>
                    <View style={s.skillChips}>
                      {categorySkills.map((skill) => (
                        <TouchableOpacity key={skill} style={s.skillChip} onPress={() => handleRemoveSkill(skill)}>
                          <Text style={s.skillChipText}>{skill}</Text>
                          <Ionicons name="close" size={12} color="#a1a1aa" style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  scroll: { padding: 20, paddingBottom: 120 },
  pageTitle: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 28 },
  avatarSection: { alignItems: "center", marginBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#18181b", borderWidth: 2, borderColor: "#27272a", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  name: { color: "#fff", fontSize: 20, fontWeight: "700" },
  email: { color: "#52525b", fontSize: 13, marginTop: 4 },
  card: { backgroundColor: "#111113", borderRadius: 16, borderWidth: 1, borderColor: "#27272a", marginBottom: 24, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  rowContent: { flex: 1 },
  rowLabel: { color: "#52525b", fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  rowValue: { color: "#d4d4d8", fontSize: 15 },
  divider: { height: 1, backgroundColor: "#18181b", marginHorizontal: 16 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#27272a", backgroundColor: "#18181b" },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: 15 },
  skillInputContainer: { flexDirection: "row", gap: 8, marginBottom: 16 },
  skillInput: { flex: 1, backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: "#fff", fontSize: 14 },
  skillAddBtn: { backgroundColor: "#27272a", justifyContent: "center", paddingHorizontal: 16, borderRadius: 8 },
  skillAddBtnText: { color: "#fff", fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  emptySkills: { paddingVertical: 20, alignItems: "center", borderWidth: 1, borderColor: "#27272a", borderStyle: "dashed", borderRadius: 8 },
  emptySkillsText: { color: "#52525b", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  categoriesContainer: { gap: 16 },
  categoryBlock: { gap: 8 },
  categoryTitle: { color: "#71717a", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  skillChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#18181b", borderWidth: 1, borderColor: "#27272a", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  skillChipText: { color: "#d4d4d8", fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
});
