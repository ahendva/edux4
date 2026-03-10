// services/powerschool/client.ts
// PowerSchool REST API client with OAuth 2.0, pagination, retry/backoff, and PowerQuery.

import {
  PSTokenResponse,
  PSSyncConfig,
  PSListResponse,
  PSStudent,
  PSSection,
  PSStaff,
  PSAttendance,
  PSGPA,
  PSStoredGrade,
  PSGuardian,
  PSSchool,
  PSTerm,
  PSPowerQueryResponse,
} from './types';

const RETRY_DELAYS_MS = [2000, 4000, 8000, 16000];

class PowerSchoolClient {
  private config: PSSyncConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: PSSyncConfig) {
    this.config = config;
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  private async authenticate(): Promise<void> {
    if (this.accessToken && Date.now() < this.tokenExpiry) return;

    const credentials = btoa(`${this.config.clientId}:${this.config.clientSecret}`);
    const response = await fetch(`${this.config.baseUrl}/oauth/access_token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`PowerSchool auth failed: ${response.status} ${response.statusText}`);
    }

    const data: PSTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  }

  // ─── Core Request (with retry + 401 token refresh) ─────────────────────────

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.authenticate();

    const url = `${this.config.baseUrl}${endpoint}`;
    const makeHeaders = (): Record<string, string> => ({
      Authorization: `Bearer ${this.accessToken!}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    });

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      const response = await fetch(url, { ...options, headers: makeHeaders() });

      if (response.status === 401) {
        this.accessToken = null;
        await this.authenticate();
        const retry = await fetch(url, { ...options, headers: makeHeaders() });
        if (!retry.ok) throw new Error(`PowerSchool API error: ${retry.status}`);
        return retry.json() as Promise<T>;
      }

      if (response.status === 429 || response.status >= 500) {
        if (attempt < RETRY_DELAYS_MS.length) {
          await new Promise(res => setTimeout(res, RETRY_DELAYS_MS[attempt]));
          continue;
        }
        throw new Error(`PowerSchool API error after retries: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`PowerSchool API error: ${response.status} ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    }

    throw new Error('PowerSchool request failed after all retries');
  }

  // ─── Pagination Helper ─────────────────────────────────────────────────────

  private async fetchAllPages<T>(endpoint: string): Promise<T[]> {
    const all: T[] = [];
    let page = 1;
    const pagesize = 100;

    while (true) {
      const sep = endpoint.includes('?') ? '&' : '?';
      const data = await this.request<PSListResponse<T>>(
        `${endpoint}${sep}page=${page}&pagesize=${pagesize}`,
      );

      const records = data.record || [];
      all.push(...records);

      const pageCount = data.pagecount ?? 1;
      if (page >= pageCount || records.length < pagesize) break;
      page++;
    }

    return all;
  }

  // ─── Students ──────────────────────────────────────────────────────────────

  async getStudents(schoolId?: number): Promise<PSStudent[]> {
    const sid = schoolId ?? this.config.schoolId;
    return this.fetchAllPages<PSStudent>(
      `/ws/v1/school/${sid}/student?expansions=contact_info,demographics,school_enrollment&q=school_enrollment.enroll_status==0`,
    );
  }

  async getStudent(studentId: number): Promise<PSStudent> {
    return this.request<PSStudent>(
      `/ws/v1/student/${studentId}?expansions=contact_info,demographics,school_enrollment`,
    );
  }

  async getSectionStudents(sectionId: number): Promise<PSStudent[]> {
    return this.fetchAllPages<PSStudent>(`/ws/v1/section/${sectionId}/student`);
  }

  // ─── Sections ──────────────────────────────────────────────────────────────

  async getSections(schoolId?: number): Promise<PSSection[]> {
    const sid = schoolId ?? this.config.schoolId;
    return this.fetchAllPages<PSSection>(`/ws/v1/school/${sid}/section`);
  }

  async getSection(sectionId: number): Promise<PSSection> {
    return this.request<PSSection>(`/ws/v1/section/${sectionId}`);
  }

  // ─── Staff ─────────────────────────────────────────────────────────────────

  async getSchoolStaff(schoolId?: number): Promise<PSStaff[]> {
    const sid = schoolId ?? this.config.schoolId;
    return this.fetchAllPages<PSStaff>(`/ws/v1/school/${sid}/staff`);
  }

  async getStaff(staffId: number): Promise<PSStaff> {
    return this.request<PSStaff>(`/ws/v1/staff/${staffId}`);
  }

  // ─── Terms ─────────────────────────────────────────────────────────────────

  async getTerms(schoolId?: number): Promise<PSTerm[]> {
    const sid = schoolId ?? this.config.schoolId;
    return this.fetchAllPages<PSTerm>(`/ws/v1/school/${sid}/term`);
  }

  // ─── GPA ───────────────────────────────────────────────────────────────────

  async getStudentGPA(studentId: number): Promise<PSGPA[]> {
    const data = await this.request<PSListResponse<PSGPA>>(
      `/ws/v1/student/${studentId}/gpa`,
    );
    return data.record || [];
  }

  // ─── Stored Grades ─────────────────────────────────────────────────────────

  async getStoredGrades(studentId: number): Promise<PSStoredGrade[]> {
    try {
      const data = await this.request<PSListResponse<PSStoredGrade>>(
        `/ws/v1/student/${studentId}/storedgrades`,
      );
      return data.record || [];
    } catch {
      return [];
    }
  }

  // ─── Attendance ────────────────────────────────────────────────────────────

  async getStudentAttendance(studentId: number): Promise<PSAttendance[]> {
    try {
      const data = await this.request<PSListResponse<PSAttendance>>(
        `/ws/v1/student/${studentId}/attendance`,
      );
      return data.record || [];
    } catch {
      return [];
    }
  }

  // ─── Guardians (via PowerQuery) ────────────────────────────────────────────

  async runPowerQuery<T>(
    queryKey: string,
    args: Record<string, unknown> = {},
  ): Promise<T[]> {
    try {
      const data = await this.request<PSPowerQueryResponse<T>>(
        `/ws/v1/powerquery/${queryKey}`,
        { method: 'POST', body: JSON.stringify({ args }) },
      );
      return data.record || [];
    } catch (error) {
      console.warn(`PowerQuery ${queryKey} failed:`, error);
      return [];
    }
  }

  async getStudentGuardians(studentId: number): Promise<PSGuardian[]> {
    return this.runPowerQuery<PSGuardian>(
      'com.pearson.core.guardian.student_guardian_detail',
      { student_id: studentId },
    );
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
      throw new Error(
        'PowerSchool configuration missing. Set EXPO_PUBLIC_PS_BASE_URL, PS_CLIENT_ID, PS_CLIENT_SECRET in .env',
      );
    }

    client = new PowerSchoolClient({ baseUrl, clientId, clientSecret });
  }
  return client;
};

export { PowerSchoolClient };
