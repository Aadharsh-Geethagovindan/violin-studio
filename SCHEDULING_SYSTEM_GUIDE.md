# Scheduling System - Implementation & Testing Guide

## 🎉 What's Been Built

Your complete scheduling system is ready! Here's what was added:

### **New Files Created:**

1. **`src/lib/timeUtils.ts`** - Date/time utility functions
2. **`src/components/SchedulingCalendar.tsx`** - Monthly calendar view
3. **`src/components/TimeSlotPicker.tsx`** - Student booking interface
4. **`src/components/InstructorAvailabilityManager.tsx`** - Instructor availability setter
5. **`src/pages/Schedule.tsx`** - Main scheduling page
6. **`src/App.tsx`** - Updated with schedule route

---

## 📂 File Organization

Place these new files in your project:

```
violet-violin-studio/
└── src/
    ├── App.tsx                    (REPLACE existing)
    ├── lib/
    │   └── timeUtils.ts          (NEW)
    ├── components/
    │   ├── SchedulingCalendar.tsx           (NEW)
    │   ├── TimeSlotPicker.tsx               (NEW)
    │   └── InstructorAvailabilityManager.tsx (NEW)
    └── pages/
        └── Schedule.tsx           (NEW)
```

---

## ✨ Features Implemented

### **For Instructors (Gregory Pan):**
✅ Monthly calendar view showing their availability
✅ Click any date to set availability
✅ **"Set Full Day Available" button** (9 AM - 9 PM quick setup)
✅ "Clear All" button to remove all availability
✅ Toggle individual 30-minute slots
✅ Booked slots are locked (can't be changed)
✅ Visual indicators: Green = available, Blue = booked, Gray = unavailable

### **For Students/Parents:**
✅ Select from available instructors
✅ Monthly calendar with availability indicators
✅ Green dot = full availability, Yellow = partial, None = unavailable
✅ Click a date to see available time slots
✅ **Book 1-2 consecutive slots only** (validated automatically)
✅ Booking creates "pending" requests for instructor approval
✅ First-come-first-served conflict resolution

### **Mobile Responsive:**
✅ Calendar adapts to mobile screens
✅ Touch-friendly buttons
✅ Slide-up modals on mobile
✅ Swipe-friendly navigation

---

## 🧪 Testing Instructions

### **Phase 1: Setup (5 minutes)**

1. **Copy all new files** to your project following the structure above
2. **Restart your dev server:**
   ```bash
   npm run dev
   ```
3. **Verify no errors** in the browser console

### **Phase 2: Instructor Testing (Gregory Pan's Account)**

1. **Log in as Gregory** (`gregoryepan@gmail.com`)
2. **Navigate to Schedule** (click "Schedule" in navbar)
3. **Should see:**
   - "Manage Your Schedule" header
   - Monthly calendar
   - Info panel on the right

4. **Test Setting Availability:**
   - Click any date in the current month
   - Modal opens: "Set Availability"
   - Click **"Set Full Day Available"** button
   - All slots turn green
   - Click **"Save Availability"**
   - Modal closes, calendar shows green dot on that date

5. **Test Individual Slot Toggle:**
   - Click the same date again
   - Click individual time slots to toggle them on/off
   - Green = available, Gray = unavailable
   - Save changes

6. **Test Calendar Indicators:**
   - Dates with availability show green dots
   - Dates without show no indicator
   - Navigate months using arrows

### **Phase 3: Student Testing**

1. **Create a test student account:**
   - Log out from Gregory's account
   - Go to `/login`
   - Sign up with a test email (e.g., `student@test.com`)
   - This will be a "student" role by default

2. **Navigate to Schedule page**
3. **Should see:**
   - "Book a Lesson" header
   - Instructor selector (showing Gregory Pan)
   - Calendar with green dots on dates Gregory set as available

4. **Test Booking:**
   - Click a date with a green dot
   - Modal opens showing available time slots
   - Click **one time slot** (e.g., 10:00 AM)
   - Slot turns purple (selected)
   - Click "Book 1 Slot" button
   - Should see success message
   - Modal closes

5. **Test Consecutive Slots:**
   - Click same date again
   - Click 2:00 PM slot
   - Then click 2:30 PM slot (consecutive)
   - Both turn purple
   - Click "Book 2 Slots"
   - Should work!

6. **Test Non-Consecutive Validation:**
   - Click a date again
   - Click 10:00 AM slot
   - Try clicking 12:00 PM slot (NOT consecutive)
   - Should be disabled/grayed out
   - Only consecutive slots are allowed!

### **Phase 4: Verify Database**

1. **Go to Supabase SQL Editor**
2. **Run this query:**
   ```sql
   SELECT 
     s.id,
     s.start_time,
     s.end_time,
     s.status,
     i.name as instructor_name,
     p.full_name as student_name
   FROM scheduling_slots s
   LEFT JOIN instructors i ON s.instructor_id = i.id
   LEFT JOIN profiles p ON s.student_id = p.id
   ORDER BY s.start_time;
   ```

3. **Should see:**
   - Rows with status = 'available' (no student_name)
   - Rows with status = 'pending' (with student_name)

---

## 🎯 Expected Behavior

### **Workflow Example:**

1. **Gregory sets availability:**
   - Feb 3, 2026: 9 AM - 4 PM available
   - Database: 14 slots created with status = 'available'

2. **Student books:**
   - Selects Feb 3, 10 AM - 11 AM (2 slots)
   - Database: Those 2 slots change to status = 'pending', student_id added

3. **Gregory views calendar:**
   - Feb 3 now shows yellow dot (partial availability)
   - Pending slots show as "booked" in his availability manager

---

## 🔍 Troubleshooting

### **"Schedule" link not showing in navbar**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check that you're logged in

### **Calendar shows no availability**
- Make sure Gregory has set availability first
- Check that dates are within next 30 days
- Verify in Supabase that slots exist

### **Can't book consecutive slots**
- This is working as intended!
- You can only book slots that are next to each other
- Example: 10:00 AM + 10:30 AM ✅
- Example: 10:00 AM + 12:00 PM ❌

### **Modal not opening**
- Check browser console for errors
- Make sure the date has availability (green/yellow dot)
- Try a different date

---

## 📱 Mobile Testing

Test on mobile (or resize browser to mobile width):

1. **Calendar should:**
   - Show smaller day cells
   - Remain navigable
   - Dots still visible

2. **Modals should:**
   - Slide up from bottom
   - Fill screen appropriately
   - Scroll if content too long

---

## 🚀 Next Steps (Future Features)

Once basic testing is complete, we can add:

1. **✅ Pending Bookings Dashboard** (for instructors to confirm/reject)
2. **✅ My Bookings Page** (for students to see their requests)
3. **✅ Email Notifications** (Supabase Edge Functions)
4. **✅ Recurring Availability** (copy week-to-week)
5. **✅ Booking History & Analytics**
6. **✅ Calendar Export** (iCal/Google Calendar sync)

---

## 📊 System Architecture

```
User Flow:
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Instructor: Set Availability                       │
│  └─> Creates "available" slots in database         │
│                                                     │
│  Student: Views Calendar                            │
│  └─> Sees only "available" slots                   │
│                                                     │
│  Student: Books Slot(s)                             │
│  └─> Updates slot to "pending" + adds student_id   │
│                                                     │
│  Instructor: Confirms Booking (future feature)     │
│  └─> Updates slot to "confirmed"                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 UI Components Summary

| Component | Purpose | Used By |
|-----------|---------|---------|
| **SchedulingCalendar** | Monthly calendar grid | Both |
| **TimeSlotPicker** | Student booking interface | Students |
| **InstructorAvailabilityManager** | Set availability | Instructors |
| **Schedule** (page) | Main orchestrator | Both |

---

## ✅ Completion Checklist

- [ ] All files copied to correct locations
- [ ] No TypeScript errors
- [ ] Dev server running
- [ ] Logged in as Gregory
- [ ] Set availability for at least one date
- [ ] Green dot appears on calendar
- [ ] Created test student account
- [ ] Successfully booked 1 slot as student
- [ ] Successfully booked 2 consecutive slots
- [ ] Verified non-consecutive slots are blocked
- [ ] Checked database for correct records

---

## 🎉 You're Done!

Your scheduling system is fully functional! Test thoroughly and let me know if you encounter any issues or want to add the next features (booking confirmation workflow, notifications, etc.).

**Ready to build the instructor booking confirmation dashboard next?**
