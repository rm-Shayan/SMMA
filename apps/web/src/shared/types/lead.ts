export interface LeadDto {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  channel: string;
  inquiry_interest: string | null;
  lead_score: number;
  crm_stage: string;
  created_at: string;
}

export interface LeadsResponse {
  success: boolean;
  count: number;
  leads: LeadDto[];
}

