# Enhancement: Personal Task Editing and Landing Page Simplification

## Personal Task Editing
The `TaskDetailDrawer` has been updated to allow users to edit task details directly from the drawer, specifically for tasks within the "Personal" workspace.

### Changes
- **Edit Mode**: Added an editing state that transforms display fields into input fields.
- **Editable Fields**: Users can now modify:
    - **Title**: Via a text input.
    - **Priority**: Via a dropdown (Low, Medium, High).
    - **Due Date**: Via a date picker.
    - **Description**: Via a textarea.
- **Access Control**: The edit button (`Edit2` icon) only appears if the task belongs to the "Personal" team.
- **Persistence**: Changes are saved using the existing `updateTaskMutation`.

## Landing Page Simplification
The Landing Page (`frontend/app/page.tsx`) copy has been revised to be more accessible and less abstract/military-themed, addressing user feedback about clarity.

### Changes
- **Hero Section**:
    - Changed "COMMAND YOUR UNITS" to "ORCHESTRATE YOUR TEAM".
    - Updated description to clearly mention "intelligent task management", "AI", and "engineering team" instead of "task allocation protocol" and "squads".
    - Changed "Get Started" to "Start Free" and "System Login" to "Log In".
    - Updated "System Operational" to "Live & Operational".
- **Features Section**:
    - Relabeled "Auto-Allocation" to "Smart Assignment" with clearer explanation.
    - Relabeled "Secure Protocols" to "Roles & Permissions".
    - Simplified "Load Balancing" description to mention preventing burnout.
