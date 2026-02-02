# Corda - Keyboard Shortcuts & Interaction Guide

## 🎯 Quick Reference

### Global Shortcuts (Work Anywhere)

| Key | Action | Context |
|-----|--------|---------|
| `C` or `N` | Create new task/team | When not typing in a field |
| `Esc` | Close modal/drawer/menu | When overlay is open |

### Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move to next interactive element |
| `Shift + Tab` | Move to previous element |
| `Enter` or `Space` | Activate focused element |

### Task Cards (Dashboard & Tasks Page)

| Interaction | Action |
|-------------|--------|
| **Click card** | Open task details |
| **Click checkbox** | Quick complete/uncomplete |
| **Hover** | Reveal quick actions |
| **Enter/Space** | Open task (when focused) |

### Task Detail Drawer

| Key/Action | Result |
|------------|--------|
| `Esc` | Close drawer |
| **Edit button** | Enable editing (Personal tasks only) |
| **Start Task** | Change status to "In Progress" |
| **Pause Task** | Change status back to "Active" |
| **Complete** | Mark as completed |

### Modals (Create Task/Team)

| Key | Action |
|-----|--------|
| `Esc` | Close modal |
| `Enter` | Submit form (when valid) |
| `Tab` | Navigate between fields |

---

## 💡 Pro Tips

### Efficiency Hacks

1. **Rapid Task Creation**
   - Press `C` → Type title → `Tab` → Fill details → `Enter`
   - No mouse needed!

2. **Quick Complete**
   - Hover over task card → Click the circle checkbox
   - Completes task without opening drawer

3. **Keyboard Navigation**
   - Use `Tab` to navigate, `Enter` to activate
   - All interactive elements are keyboard-accessible

### Visual Cues

- **White buttons** = Primary actions (Create Task, Start Task)
- **Zinc buttons** = Secondary actions (Cancel, Close)
- **Animated spinners** = System is processing
- **Pulsing red dot** = High priority task
- **Emerald glow** = Active/online status

### Empty States

When you see "No tasks found":
- Look for the **[+ Create Task]** button
- Click it or press `C` to add your first task

---

## ♿ Accessibility Features

### Keyboard Navigation
- All features accessible without a mouse
- Logical tab order throughout the app
- Visual focus indicators on all interactive elements

### Screen Reader Support
- ARIA labels on all buttons and controls
- Semantic HTML structure
- Descriptive alt text for icons

### Focus Management
- Modals auto-focus first input field
- Focus returns to trigger element when closing
- Escape key always closes overlays

---

## 🎨 Design Language

### Color Meanings

| Color | Meaning |
|-------|---------|
| **White/Zinc-100** | Primary actions, active text |
| **Emerald-500** | Success, completed tasks |
| **Red-500** | High priority, blocked tasks |
| **Blue-500** | In-progress tasks |
| **Amber-500** | Medium priority, warnings |
| **Zinc-500** | Secondary text, inactive states |

### Status Indicators

| Visual | Status |
|--------|--------|
| Vertical emerald bar | Completed |
| Vertical blue bar | In Progress |
| Vertical red bar | Blocked |
| Vertical zinc bar | Pending/Active |

---

## 📱 Mobile Differences

### Mobile Menu
- Tap hamburger icon (☰) to open menu
- Tap X or press `Esc` to close
- Swipe gestures not yet implemented

### Touch Interactions
- Tap card to open details
- Long-press not yet implemented
- Keyboard shortcuts work on mobile keyboards

---

## 🔧 Troubleshooting

### "Keyboard shortcuts not working"
- Make sure you're not typing in an input field
- Check that no modal is already open
- Try clicking outside any focused element first

### "Can't close modal with Esc"
- Make sure the modal is fully loaded
- Try clicking the X button instead
- Refresh the page if issue persists

### "Auto-focus not working in modals"
- This is a timing issue - wait 100ms after modal opens
- Click into the field manually as fallback

---

## 🚀 Power User Workflow

### Morning Routine (Example)
1. Open Corda → Dashboard loads
2. Review "Today" section
3. Press `C` to create new task
4. Fill form → `Enter` to submit
5. `Tab` through task cards
6. `Enter` to open task details
7. Click "Start Task" to begin work
8. `Esc` to close drawer

**Total time:** ~30 seconds (vs. 2+ minutes with mouse-only)

---

## 📚 Learning Path

### Beginner (Week 1)
- Learn to create tasks with `C`
- Practice closing modals with `Esc`
- Use mouse for everything else

### Intermediate (Week 2-3)
- Start using `Tab` for navigation
- Try quick-complete checkbox
- Explore keyboard shortcuts in drawers

### Advanced (Week 4+)
- Full keyboard workflow
- Muscle memory for all shortcuts
- Rarely touch the mouse

---

## 🎓 HCI Principles in Action

This app follows:
- **Shneiderman's 8 Golden Rules** (consistency, shortcuts, feedback, etc.)
- **Don Norman's Design Principles** (visibility, affordances, signifiers, etc.)
- **WCAG 2.1 Accessibility Guidelines** (keyboard access, ARIA labels, etc.)

**Result:** An app that's fast, intuitive, and accessible to everyone.

---

**Last Updated:** February 2, 2026  
**Version:** 2.0 (Post-HCI Audit)
