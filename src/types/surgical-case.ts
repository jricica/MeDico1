// src/types/surgical-case.ts

export type PatientGender = 'M' | 'F' | 'O';

export type CaseStatus = 
  | 'scheduled' 
  | 'completed' 
  | 'billed' 
  | 'paid' 
  | 'cancelled';

// Tipo para las estadísticas del dashboard
export interface CaseStats {
  total_cases: number;
  total_procedures: number;
  total_value: number;
  cases_by_status: {
    [key: string]: {
      count: number;
      total_value: number;
    };
  };
  cases_by_specialty: {
    [key: string]: {
      count: number;
      total_value: number;
    };
  };
  recent_cases: SurgicalCase[];
}

export interface Procedure {
  id?: number;
  surgery_code: string;
  surgery_name: string;
  specialty: string;
  grupo?: string;
  rvu: number;
  hospital_factor?: number;
  calculated_value?: number;
  notes?: string;
  order?: number;
}

export interface SurgicalCase {
  id: number;
  patient_name: string;
  patient_id?: string;
  patient_age?: number;
  patient_gender?: PatientGender;
  hospital: number;
  hospital_name?: string;
  surgery_date: string;
  surgery_time?: string;
  diagnosis?: string;
  notes?: string;
  status: CaseStatus;
  
  // Campos de estado
  is_operated?: boolean;
  is_billed?: boolean;
  is_paid?: boolean;
  
  // Campos de médico ayudante
  assistant_doctor?: number | null;
  assistant_doctor_name?: string | null;
  assistant_display_name?: string;
  
  procedure_count?: number;
  total_rvu?: number;
  total_value?: number;
  primary_specialty?: string;
  procedures?: Procedure[];
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface CreateCaseData {
  patient_name: string;
  patient_id?: string;
  patient_age?: number;
  patient_gender?: PatientGender;
  hospital: number;
  surgery_date: string;
  surgery_time?: string;
  diagnosis?: string;
  notes?: string;
  procedures: Omit<Procedure, 'id'>[];
  
  // Campos de médico ayudante
  assistant_doctor?: number | null;
  assistant_doctor_name?: string | null;
}

export interface UpdateCaseData extends Partial<CreateCaseData> {
  status?: CaseStatus;
  is_operated?: boolean;
  is_billed?: boolean;
  is_paid?: boolean;
}