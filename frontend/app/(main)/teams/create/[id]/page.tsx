"use client";

import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useTeam, useTeamMembers, useTeamTasks } from "@/hooks/useTeams";
import { api } from "@/lib/api";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface TeamTask {
  id: string;
  title: string;
  desc?: string;
  status: string;
  priority: string;
}

export default function TeamDetailPage() {
  const { id } = useParams();
  const { data: team, isLoading: teamLoading } = useTeam(id as string);
  const { data: members, isLoading: membersLoading, refetch: refetchMembers } = useTeamMembers(id as string);
  const { data: tasks, isLoading: tasksLoading } = useTeamTasks(id as string);

  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    setAdding(true);
    setMessage("");
    try {
      await api.post(`/teams/${id}/members`, { email: newMemberEmail });
      setMessage("Member added successfully!");
      setNewMemberEmail("");
      refetchMembers();
    } catch (err: unknown) {
      // @ts-expect-error: response property check
      setMessage(err.response?.data?.message || "Error adding member");
    } finally {
      setAdding(false);
    }
  };

  const shouldShowSkeleton = teamLoading || membersLoading || tasksLoading;

  if (!team && !shouldShowSkeleton) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Team not found.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-semibold mb-4">{team?.name || "Team Workspace"}</h1>
        <p className="text-gray-600 mb-6">{team?.desc || "Loading team details and member roster."}</p>

        {/* Leader */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Team Leader</h2>
          {shouldShowSkeleton ? (
            <SkeletonLoader rows={1} className="space-y-0" />
          ) : (
            <div className="border p-3 rounded-md bg-gray-50">
              <p className="font-medium">{team.leader?.name || "Unknown"}</p>
              <p className="text-sm text-gray-500">{team.leader?.email}</p>
            </div>
          )}
        </section>

        {/* Members */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Members</h2>
          {shouldShowSkeleton ? (
            <SkeletonLoader rows={3} />
          ) : members?.length ? (
            <ul className="space-y-2">
              {(members as TeamMember[]).map((m) => (
                <li
                  key={m.id}
                  className="flex justify-between items-center border rounded-md p-3"
                >
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-gray-500">{m.email}</p>
                  </div>
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {m.role || "Member"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 text-sm">No members yet.</p>
          )}

          <form onSubmit={handleAddMember} className="mt-4 flex gap-2">
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="Enter member email"
              required
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
            />
            <button
              type="submit"
              disabled={adding}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-60"
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </form>

          {message && (
            <p
              className={`mt-2 text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"
                }`}
            >
              {message}
            </p>
          )}
        </section>

        {/* Tasks */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Team Tasks</h2>
          {shouldShowSkeleton ? (
            <SkeletonLoader rows={4} />
          ) : tasks?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(tasks as TeamTask[]).map((task) => (
                <div
                  key={task.id}
                  className="p-4 border rounded-md bg-gray-50 hover:bg-gray-100 transition"
                >
                  <h3 className="font-medium">{task.title}</h3>
                  <p className="text-sm text-gray-600">{task.desc}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Status: {task.status} | Priority: {task.priority}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">No tasks assigned yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
