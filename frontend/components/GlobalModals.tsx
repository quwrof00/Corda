"use client";
import { useEffect } from "react";
import CreateTaskModal from "./CreateTaskModal";
import CreateTeamModal from "./CreateTeamModal";
import InvitesModal from "./teams/InvitesModal";
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
    initialDeadline,
    isPersonalWorkspace,
    closeTaskModal,
    closeTeamModal,
    openTaskModal,
    openTeamModal,
    openInvitesModal,
  } = useModalStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if already typing in an input / textarea / contenteditable
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (isEditable || e.ctrlKey || e.metaKey) return;

      if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        openTaskModal(); // auto-focuses title field via CreateTaskModal's useEffect
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        openTeamModal();
      } else if (e.key.toLowerCase() === "i") {
        e.preventDefault();
        openInvitesModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openTaskModal, openTeamModal, openInvitesModal]);

  return (
    <>
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={closeTaskModal}
        initialTeamId={initialTeamId || personalTeamId || ""}
        initialAssignedToId={initialAssignedToId}
        initialParentId={initialParentId}
        initialDeadline={initialDeadline}
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

      <InvitesModal />
    </>
  );
}
