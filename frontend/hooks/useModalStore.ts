import { create } from 'zustand';

export interface OpenTaskModalOptions {
  teamId?: string;
  assignedToId?: string;
  parentId?: string;
  isPersonalWorkspace?: boolean;
  initialDeadline?: string;
}

interface ModalState {
  isTaskModalOpen: boolean;
  isTeamModalOpen: boolean;
  initialTeamId?: string;
  initialAssignedToId?: string;
  initialParentId?: string;
  isPersonalWorkspace?: boolean;
  initialDeadline?: string;

  // Page-level context: set by each page on mount so the global 'C' shortcut
  // automatically carries the right team/workspace context.
  pageContext: OpenTaskModalOptions;
  setPageContext: (ctx: OpenTaskModalOptions) => void;

  // openTaskModal merges caller options ON TOP of pageContext, so explicit
  // args always win but pageContext fills in the blanks.
  openTaskModal: (options?: OpenTaskModalOptions) => void;
  closeTaskModal: () => void;

  openTeamModal: () => void;
  closeTeamModal: () => void;
}

export const useModalStore = create<ModalState>((set, get) => ({
  isTaskModalOpen: false,
  isTeamModalOpen: false,
  initialTeamId: undefined,
  initialAssignedToId: undefined,
  initialParentId: undefined,
  isPersonalWorkspace: false,
  initialDeadline: undefined,
  pageContext: {},

  setPageContext: (ctx) => set({ pageContext: ctx }),

  openTaskModal: (options) => {
    const merged = { ...get().pageContext, ...options };
    set({
      isTaskModalOpen: true,
      initialTeamId: merged.teamId,
      initialAssignedToId: merged.assignedToId,
      initialParentId: merged.parentId,
      isPersonalWorkspace: merged.isPersonalWorkspace ?? false,
      initialDeadline: merged.initialDeadline,
    });
  },

  closeTaskModal: () =>
    set({
      isTaskModalOpen: false,
      initialTeamId: undefined,
      initialAssignedToId: undefined,
      initialParentId: undefined,
      initialDeadline: undefined,
    }),

  openTeamModal: () => set({ isTeamModalOpen: true }),
  closeTeamModal: () => set({ isTeamModalOpen: false }),
}));
