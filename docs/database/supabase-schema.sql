-- Beauty Intelligent Wellness Supabase schema draft

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete set null,
  full_name text not null,
  role text not null,
  salary numeric(12,2) not null default 0,
  bonus_rate numeric(6,2) not null default 0,
  commission_rate numeric(6,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  name text not null,
  price numeric(12,2) not null,
  cost numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists service_assignments (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) on delete cascade,
  employee_id uuid references employees(id) on delete cascade,
  bonus_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  employee_id uuid references employees(id) on delete set null,
  sale_amount numeric(12,2) not null,
  discount_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists revenue_entries (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete set null,
  source text not null,
  amount numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists cost_entries (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete set null,
  cost_type text not null,
  amount numeric(12,2) not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists payroll_runs (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete set null,
  month text not null,
  salary_total numeric(12,2) not null default 0,
  bonus_total numeric(12,2) not null default 0,
  commission_total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
