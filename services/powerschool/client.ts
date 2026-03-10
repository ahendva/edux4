// services/powerschool/client.ts
// PowerSchool REST API client with OAuth 2.0 token management

import {
  PSTokenResponse,
  PSSyncConfig,
  PSListResponse,
  PSStudent,
  PSSection,
  PSStaff,
  PSAttendance,
  PSGPA,
  PSSchool,
} from './types';

class PowerSchoolClient {
  private config: PSSyncConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: PSSyncConfig) {
    this.config = config;
  }

  // ─── Auth ────────────────────────────────────────────────────────────────────

  private async authenticate(): Promise<void> {
    if (this.accessToken && Date.now() < this.tokenExpiry) return;

    const credentials = btoa(`${this.config.clientId}:${this.config.clientSecret}`);
    const response = await fetch(`${this.config.baseUrl}/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`PowerSchool auth failed: ${response.status} ${response.statusText}`);
    }

    const data: PSTokenResponse = await response.json();
    this.accessToken = data.access_token;
    // Expire 60s early to avoid edge cases
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.authenticate();

    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, retry once
      this.accessToken = null;
      await this.authenticate();
      const retry = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      if (!retry.ok) throw new Error(`PowerSchool API error: ${retry.status}`);
      return retry.json();
    }

    if (!response.ok) {
      throw new Error(`PowerSchool API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ─── Students ──────────────────────────────────────────────────────────────

  async getStudents(schoolId?: number): Promise<PSStudent[]> {
    const sid = schoolId || this.config.schoolId;
    const data = await this.request<PSListResponse<PSStudent>>(
      `/ws/v1/school/${sid}/student?q=school_enrollment.enroll_status==0`
    );
    return data.record || [];
  }

  async getStudent(studentId: number): Promise<PSStudent> {
    return this.request<PSStudent>(`/ws/v1/student/${studentId}`);
  }

  async getSectionStudents(sectionId: number): Promise<PSStudent[]> {
    const data = await this.request<PSListResponse<PSStudent>>(
      `/ws/v1/section/${sectionId}/student`
    );
    return data.record || [];
  }

  // ─── Sections (Classes) ────────────────────────────────────────────────────

  async getSections(schoolId?: number): Promise<PSSection[]> {
    const sid = schoolId || this.config.schoolId;
    const data = await this.request<PSListResponse<PSSection>>(
      `/ws/v1/school/${sid}/section`
    );
    return data.record || [];
  }

  async getSection(sectionId: number): Promise<PSSection> {
    return this.request<PSSection>(`/ws/v1/section/${sectionId}`);
  }

  // ─── Staff ─────────────────────────────────────────────────────────────────

  async getStaff(staffId: number): Promise<PSStaff> {
    return this.request<PSStaff>(`/ws/v1/staff/${staffId}`);
  }

  // ─── Grades & GPA ─────────────────────────────────────────────────────────

  async getStudentGPA(studentId: number): Promise<PSGPA[]> {
    const data = await this.request<PSListResponse<PSGPA>>(
      `/ws/v1/student/${studentId}/gpa`
    );
    return data.record || [];
  }

  // ─── Attendance ────────────────────────────────────────────────────────────

  async getStudentAttendance(studentId: number): Promise<PSAttendance[]> {
    const data = await this.request<PSListResponse<PSAttendance>>(
      `/ws/v1/student/${studentId}/attendance`
    );
    return data.record || [];
  }

  // ─── School ────────────────────────────────────────────────────────────────

  async getSchool(schoolId: number): Promise<PSSchool> {
    return this.request<PSSchool>(`/ws/v1/school/${schoolId}`);
  }
}

// Singleton instance
let client: PowerSchoolClient | null = null;

export const getPowerSchoolClient = (): PowerSchoolClient => {
  if (!client) {
    const baseUrl = process.env.EXPO_PUBLIC_PS_BASE_URL;
    const clientId = process.env.PS_CLIENT_ID;
    const clientSecret = process.env.PS_CLIENT_SECRET;

    if (!baseUrl || !clientId || !clientSecret) {
      throw new Error('PowerSchool configuration missing. Set EXPO_PUBLIC_PS_BASE_URL, PS_CLIENT_ID, PS_CLIENT_SECRET in .env');
    }

    client = new PowerSchoolClient({ baseUrl, clientId, clientSecret });
  }
  return client;
};

export { PowerSchoolClient };
