export type source_type = 'facebook' | 'zalo' | 'tiktok' | 'website' | 'referral' | 'other';
export type lead_status = 'new' | 'calling' | 'no_answer' | 'closed' | 'rejected';
export type assignment_method = 'round_robin' | 'product_based' | 'manual';
export type interaction_type = 'message' | 'call' | 'email' | 'meeting' | 'note';

export interface SalesEmployee {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  phone?: string;
  user_id?: number;
  is_active?: boolean;
  round_robin_order?: number;
  daily_lead_count?: number;
  total_lead_count?: number;
  last_assigned_at?: string;
  created_at?: string;
}

export interface SalesAllocationRule {
  id: number;
  rule_code: string;
  customer_group?: string;
  product_group_ids: number[];
  assigned_sales_ids: number[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LeadSource {
  id: number;
  type: source_type;
  name: string;
  description?: string;
  api_key?: string;
  webhook_url?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface Campaign {
  id: number;
  source_id?: number;
  name: string;
  code?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  is_active?: boolean;
  created_at?: string;
  lead_sources?: {
    name: string;
    type: source_type;
  };
}

export interface ProductGroup {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface InteractionLog {
  id: number;
  lead_id?: number;
  customer_id?: number;
  type: interaction_type;
  channel?: source_type;
  direction?: string;
  content?: string;
  summary?: string;
  sales_employee_id?: number;
  occurred_at?: string;
  duration_seconds?: number;
  created_at?: string;
  sales_employees?: {
    full_name: string;
  };
}

export interface Lead {
  id: number;
  full_name: string;
  phone: string;
  email?: string;
  demand?: string;
  source_id?: number;
  campaign_id?: number;
  source_label?: string;
  status: lead_status;
  interested_product_group_id?: number;
  assigned_sales_id?: number;
  assigned_at?: string;
  assignment_method?: assignment_method;
  is_converted?: boolean;
  converted_at?: string;
  converted_customer_id?: number;
  submitted_at?: string;
  last_contacted_at?: string;
  created_at?: string;
  updated_at?: string;
  lead_sources?: {
    name: string;
    type: source_type;
  };
  campaigns?: {
    name: string;
  };
  sales_employees?: {
    full_name: string;
    employee_code: string;
  };
  product_groups?: {
    name: string;
    code: string;
  };
  interaction_logs?: InteractionLog[];
}
