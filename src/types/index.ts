export type UserRole = 'student' | 'parent' | 'instructor' | 'admin'

export interface Profile {
  id: string
  email: string
  role: UserRole
  full_name: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface Instructor {
  id: string
  profile_id: string
  name: string
  age?: number
  teaching_experience: string
  bio: string
  image_url?: string
  contact_info?: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface SchedulingSlot {
  id: string
  instructor_id: string
  student_id?: string
  start_time: string
  end_time: string
  status: 'available' | 'pending' | 'confirmed' | 'rejected'
  notes?: string
  created_at: string
  updated_at: string
}

export interface ContentSection {
  id: string
  page: string
  section_key: string
  content: string
  content_type: 'text' | 'html' | 'markdown'
  editable_by: UserRole[]
  created_at: string
  updated_at: string
}

export interface CampSignup {
  id: string
  student_name: string
  parent_name: string
  email: string
  phone: string
  age?: number
  additional_info?: string
  status: 'pending' | 'confirmed' | 'waitlist'
  created_at: string
}
