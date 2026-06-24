export type Employee = {
  id: string;
  user_id?: string | null;
  branch_id: string | null;
  full_name: string;
  role: string;
  is_active: boolean;
};

export type Service = {
  id: string;
  branch_id: string | null;
  name: string;
  price: number;
  cost: number;
};

export type Customer = {
  id: string;
  uid?: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
  total_spent: number;
  total_visits: number;
};

export type CustomerResult = {
  id: string;
  uid?: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  total_spent: number;
  total_visits: number;
};

export type SaleEmployee = {
  id: string;
  sale_id: string;
  employee_id: string;
};

export type Sale = {
  id: string;
  branch_id: string;
  service_id: string;
  customer_id: string | null;
  sale_amount: number;
  discount_amount: number;
  created_at: string;
  assigned_employees: SaleEmployee[];
};

export type CostEntry = {
  id: string;
  branch_id: string;
  cost_type: string;
  amount: number;
  note: string | null;
  created_at: string;
};

export type RevenueEntry = {
  id: string;
  branch_id: string;
  source: string;
  amount: number;
  created_at: string;
};

export type PayrollRun = {
  id: string;
  branch_id: string;
  month: string;
  salary_total: number;
  bonus_total: number;
  commission_total: number;
  created_at: string;
};

export type BranchTarget = {
  id: string;
  branch_id: string;
  month: string;
  target_amount: number;
  created_at: string;
};

export type Branch = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  phone: string | null;
  opening_hours: string | null;
  is_active: boolean;
};
