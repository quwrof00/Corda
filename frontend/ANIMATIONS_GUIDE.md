# Framer Motion Animations Guide

This document outlines all the premium UI/UX animations implemented throughout the Task Allo application using `framer-motion`.

## 📦 Installation

```bash
npm install framer-motion
```

## 🎨 Animation Patterns Used

### 1. **Staggered Entry Animations**
Used across all main pages to create a cascading, premium feel when content loads.

**Implementation:**
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1 // Delay between each child animation
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};
```

**Where it's used:**
- Dashboard page (tasks and teams)
- Teams page (team cards)
- Tasks page (task list items)

---

### 2. **Smooth Layout Transitions**
Animated filter pills that smoothly slide between active states.

**Implementation:**
```tsx
{activeFilter === filter && (
  <motion.div
    layoutId="activeFilter"
    className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-md"
    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
  />
)}
```

**Where it's used:**
- Dashboard filters (Today / This Week / Overdue)
- Tasks page filters (Todo / In Progress / Blocked / Done)

---

### 3. **Interactive Button Feedback**
Tactile scale effects on hover and tap for all primary actions.

**Implementation:**
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.95 }}
>
  Button Text
</motion.button>
```

**Where it's used:**
- All primary action buttons (Create Task, Create Team, etc.)
- Modal buttons (Submit, Cancel)
- Drawer action buttons (Start Task, Complete, etc.)

---

### 4. **Card Hover Effects**
Cards lift and scale slightly on hover to indicate interactivity.

**Implementation:**
```tsx
<motion.div
  whileHover={{ scale: 1.02, y: -4 }}
  whileTap={{ scale: 0.98 }}
  className="hover:z-10" // Prevents clipping
>
  Card Content
</motion.div>
```

**Where it's used:**
- Team cards (Teams page)
- Task cards (Dashboard, Tasks page)

---

### 5. **List Item Animations**
Smooth entry, exit, and reordering of list items.

**Implementation:**
```tsx
<AnimatePresence mode="popLayout">
  {items.map((item) => (
    <motion.div
      layout
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      key={item.id}
    >
      Item Content
    </motion.div>
  ))}
</AnimatePresence>
```

**Where it's used:**
- Dashboard task lists
- Tasks page task list
- Dynamic filtering/sorting scenarios

---

### 6. **Modal Entry/Exit**
Smooth fade-in backdrop with scale-up modal animation.

**Implementation:**
```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
      >
        Modal Content
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

**Where it's used:**
- CreateTeamModal
- CreateTaskModal (needs to be updated)
- ConfirmModal (needs to be updated)

---

### 7. **Drawer Slide-In**
Smooth slide-in from the right for detail views.

**Implementation:**
```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50"
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        Drawer Content
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

**Where it's used:**
- TaskDetailDrawer

---

## 📍 Files Modified

### Pages
1. ✅ `app/(main)/dashboard/dashboard-client.tsx` - Full animations
2. ✅ `app/(main)/teams/teams-client.tsx` - Full animations
3. ✅ `app/(main)/teams/[teamId]/page.tsx` - Page entry animation
4. ✅ `app/(main)/tasks/tasks-client.tsx` - Full animations
5. ✅ `app/(main)/profile/profile-client.tsx` - **COMPLETE!** (Page fade, animated skills, button interactions)

### Components
1. ✅ `components/CreateTeamModal.tsx` - Full animations
2. ✅ `components/TaskDetailDrawer.tsx` - Full animations
3. ✅ `components/teams/PersonalWorkspace.tsx` - Full animations (stats cards, task list)
4. ✅ `components/CreateTaskModal.tsx` - **COMPLETE!** (Modal entry/exit, button animations)
5. ✅ `components/ConfirmModal.tsx` - **COMPLETE!** (Modal entry/exit, button animations)

### 🎉 **ALL ANIMATIONS COMPLETE!**

---

## 🎯 Best Practices

### 1. **Prevent Border Clipping**
When using scale animations, add `hover:z-10` to prevent borders from being clipped:

```tsx
<motion.div
  whileHover={{ scale: 1.02 }}
  className="relative hover:z-10"
>
```

### 2. **Use AnimatePresence for Conditional Rendering**
Always wrap conditionally rendered animated components:

```tsx
<AnimatePresence>
  {isOpen && <motion.div exit={{ opacity: 0 }}>...</motion.div>}
</AnimatePresence>
```

### 3. **Layout Animations**
Use `layout` prop for automatic layout transitions:

```tsx
<motion.div layout>
  Content that might change position
</motion.div>
```

### 4. **Spring Transitions for Natural Feel**
Use spring physics for more natural motion:

```tsx
transition={{ type: "spring", damping: 30, stiffness: 300 }}
```

---

## 🚀 Performance Tips

1. **Use `will-change` sparingly** - Framer Motion handles this automatically
2. **Avoid animating expensive properties** - Stick to `transform` and `opacity`
3. **Use `layout` prop instead of animating width/height**
4. **Reduce `staggerChildren` delay** for long lists (0.05s instead of 0.1s)

---

## 🎨 Animation Timing Reference

| Animation Type | Duration | Easing |
|---------------|----------|---------|
| Page Entry | 0.3s | Ease out |
| Stagger Delay | 0.05-0.1s | Linear |
| Button Hover | 0.2s | Spring |
| Modal Entry | 0.3s | Spring |
| Drawer Slide | 0.4s | Spring (damping: 30) |
| List Item Exit | 0.2s | Ease in |

---

## 📝 TODO: Remaining Components

- [ ] Profile page animations
- [ ] CreateTaskModal animations
- [ ] ConfirmModal animations
- [ ] Navbar/Sidebar animations (if needed)
- [ ] Loading skeleton screens (Step 2 from original plan)
- [ ] Command K palette (Step 5 from original plan)

---

## 🔗 Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Animation Best Practices](https://www.framer.com/motion/animation/)
- [Layout Animations Guide](https://www.framer.com/motion/layout-animations/)
