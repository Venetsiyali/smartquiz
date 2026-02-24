-- Zukkoo Subscription Schema (Supabase / PostgreSQL)
-- Run this in Supabase SQL Editor after enabling auth.users extension

-- ─── Users (extends Supabase auth.users) ───────────────────────────────────
create table if not exists public.user_plans (
  id           uuid primary key references auth.users(id) on delete cascade,
  nickname     text,
  plan         text not null default 'free'
                check (plan in ('free', 'pro', 'edu')),
  plan_expires_at  timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Enable RLS
alter table public.user_plans enable row level security;

create policy "Users can read their own plan"
  on public.user_plans for select
  using (auth.uid() = id);

create policy "Users can update their own plan"
  on public.user_plans for update
  using (auth.uid() = id);

-- ─── Subscriptions ──────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  plan             text not null check (plan in ('pro', 'edu')),
  billing_cycle    text not null check (billing_cycle in ('monthly', 'yearly')),
  amount_uzs       integer not null,          -- e.g. 10000, 100000
  payment_provider text                       -- 'click' | 'payme' | 'uzum'
                   check (payment_provider in ('click', 'payme', 'uzum')),
  transaction_id   text,                      -- provider's transaction ID
  status           text not null default 'pending'
                   check (status in ('pending', 'active', 'cancelled', 'expired')),
  starts_at        timestamptz default now(),
  ends_at          timestamptz,               -- null = lifetime or calculated
  created_at       timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can read their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create index on public.subscriptions(user_id, status);
create index on public.subscriptions(ends_at);

-- ─── Function: get current plan ─────────────────────────────────────────────
create or replace function public.get_user_plan(uid uuid)
returns text language sql stable as $$
  select plan from public.user_plans where id = uid;
$$;

-- ─── Trigger: update plan on subscription activation ────────────────────────
create or replace function public.sync_plan_on_subscription()
returns trigger language plpgsql as $$
begin
  if NEW.status = 'active' then
    insert into public.user_plans (id, plan, plan_expires_at)
    values (NEW.user_id, NEW.plan, NEW.ends_at)
    on conflict (id) do update
      set plan = NEW.plan,
          plan_expires_at = NEW.ends_at,
          updated_at = now();
  end if;
  return NEW;
end;
$$;

create trigger on_subscription_activated
  after insert or update on public.subscriptions
  for each row execute procedure public.sync_plan_on_subscription();

-- ─── Example seed data (for testing) ────────────────────────────────────────
-- insert into public.subscriptions (user_id, plan, billing_cycle, amount_uzs, payment_provider, status, ends_at)
-- values ('<your-auth-user-uuid>', 'pro', 'monthly', 10000, 'click', 'active', now() + interval '30 days');
