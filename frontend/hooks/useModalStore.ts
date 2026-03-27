import { create } from 'zustand';

interface ModalState {
  isTaskModalOpen: boolean;
  isTeamModalOpen: boolean;
  initialTeamId?: string;
  initialAssignedToId?: string;
  initialParentId?: string;
  isPersonalWorkspace?: boolean;

  openTaskModal: (options?: { 
    teamId?: string; 
    assignedToId?: string; 
    parentId?: string; 
    isPersonalWorkspace?: boolean 
  }) => void;
  closeTaskModal: () => void;
  
  openTeamModal: () => void;
  closeTeamModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isTaskModalOpen: false,
  isTeamModalOpen: false,
  initialTeamId: undefined,
  initialAssignedToId: undefined,
  initialParentId: undefined,
  isPersonalWorkspace: false,

  openTaskModal: (options) => set({ 
    isTaskModalOpen: true, 
    initialTeamId: options?.teamId,
    initialAssignedToId: options?.assignedToId,
    initialParentId: options?.parentId,
    isPersonalWorkspace: options?.isPersonalWorkspace ?? false
  }),
  closeTaskModal: () => set({ 
    isTaskModalOpen: false,
    initialTeamId: undefined,
    initialAssignedToId: undefined,
    initialParentId: undefined
  }),
  
  openTeamModal: () => set({ isTeamModalOpen: true }),
  closeTeamModal: () => set({ isTeamModalOpen: false }),
}));
