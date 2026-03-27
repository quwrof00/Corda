"use client";
import { useEffect } from "react";
import CreateTaskModal from "./CreateTaskModal";
import CreateTeamModal from "./CreateTeamModal";
import { useModalStore } from "@/hooks/useModalStore";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { usePersonalWorkspace } from "@/hooks/usePersonalWorkspace";

export default function GlobalModals() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { data: personalTeamId } = usePersonalWorkspace();
  const {
    isTaskModalOpen,
    isTeamModalOpen,
    initialTeamId,
    initialAssignedToId,
    initialParentId,
    isPersonalWorkspace,
    closeTaskModal,
    closeTeamModal,
    openTaskModal,
    openTeamModal
  } = useModalStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if already typing in an input
      const isInput = document.activeElement?.tagName === 'INPUT' || 
                      document.activeElement?.tagName === 'TEXTAREA' ||
                      (document.activeElement as HTMLElement)?.isContentEditable;
      
      if (isInput || e.ctrlKey || e.metaKey) return;

      if (e.key.toLowerCase() === 't') { // T for Task (User said it, dashboard had 'C' and 'N')
        e.preventDefault();
        openTaskModal();
      } else if (e.key.toLowerCase() === 'm') { // M for Team (User said n/c or standard?)
        // Wait, dashboard used 'C' for task and 'N' for team.
        // Let's stick to 'C' for Task (Create) and 'N' for Team (New).
        // Standard in many apps: 'C' or 'T' for Task.
        // Let's use 'c' for task and 'n' for team as per previous dashboard implementation.
      }
      
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        openTaskModal();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openTeamModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openTaskModal, openTeamModal]);

  return (
    <>
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={closeTaskModal}
        initialTeamId={initialTeamId || personalTeamId || ""}
        initialAssignedToId={initialAssignedToId}
        initialParentId={initialParentId}
        isPersonalWorkspace={isPersonalWorkspace || initialTeamId === personalTeamId}
        currentUserId={(session?.user as { id?: string })?.id}
        onTaskCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }}
      />
      
      <CreateTeamModal
        isOpen={isTeamModalOpen}
        onClose={closeTeamModal}
        onTeamCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["teams"] });
        }}
      />
    </>
  );
}
