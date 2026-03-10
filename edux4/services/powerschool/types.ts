// services/powerschool/types.ts
// PowerSchool REST API response types

export interface PSStudent {
  id: number;
  local_id: string;
  student_username: string;
  name: {
    first_name: string;
    last_name: string;
    middle_name?: string;
  };
  school_enrollment: {
    school_id: number;
    entry_date: string;
    exit_date?: string;
    grade_level: number;
    enroll_status: string;
  };
  demographics?: {
    gender: string;
    birth_date: string;
    ethnicity?: string;
  };
  contact_info?: {
    email?: string;
    phone?: string;
  };
  guardian_ids?: number[];
}

export interface PSSection {
  id: number;
  school_id: number;
  course_name: string;
  course_number: string;
  section_number: string;
  teacher_id: number;
  room?: string;
  term_id: number;
  period?: string;
  expression?: string;
  enrollment_count: number;
}

export interface PSStaff {
  id: number;
  local_id: string;
  name: {
    first_name: string;
    last_name: string;
  };
  email?: string;
  school_id: number;
  title?: string;
  status: string;
}

export interface PSGradeEntry {
  student_id: number;
  section_id: number;
  assignment_name: string;
  score: number | null;
  max_score: number;
  category: string;
  date_due: string;
  comment?: string;
}

export interface PSGPA {
  student_id: number;
  gpa_type: string;
  gpa: number;
  weighted_gpa?: number;
  term_id: number;
}

export interface PSAttendance {
  student_id: number;
  date: string;
  status: 'present' | 'absent' | 'tardy' | 'excused';
  period?: string;
  comment?: string;
}

export interface PSSchool {
  id: number;
  name: string;
  school_number: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phone?: string;
  principal?: string;
}

export interface PSTerm {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  school_id: number;
}

// API response wrappers
export interface PSListResponse<T> {
  record: T[];
  '@extensions'?: string;
}

export interface PSTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Sync configuration
export interface PSSyncConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  schoolId?: number;
}
