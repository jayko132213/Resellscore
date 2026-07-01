create extension if not exists "pgcrypto";

create type public.plan_type as enum ('free', 'starter', 'pro', 'elite');
create type public.subscription_status as enum ('inactive', 'active', 'past_due', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  pseudo text,
  avatar_url text,
  plan public.plan_type not null default 'free',
  subscription_status public.subscription_status not null default 'inactive',
  paypal_subscription_id text,
  manual_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  seller_price numeric(10,2) not null check (seller_price > 0),
  brand text,
  size text,
  condition text,
  vinted_url text,
  photo_urls text[] not null default '{}',
  result jsonb not null,
  created_at timestamptz not null default now()
);

create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete set null,
  plan public.plan_type not null,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'paypal',
  plan public.plan_type not null,
  status text not null,
  paypal_subscription_id text unique,
  raw_event jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index analyses_user_created_idx on public.analyses(user_id, created_at desc);
create index usage_logs_user_created_idx on public.usage_logs(user_id, created_at desc);
create index subscriptions_user_idx on public.subscriptions(user_id);
create unique index profiles_pseudo_unique_idx
on public.profiles (lower(trim(pseudo)))
where pseudo is not null and length(trim(pseudo)) > 0;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, pseudo)
  values (new.id, new.email, nullif(trim(new.raw_user_meta_data->>'pseudo'), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.usage_logs enable row level security;
alter table public.subscriptions enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "analyses_select_own"
on public.analyses for select
using (auth.uid() = user_id);

create policy "analyses_delete_own"
on public.analyses for delete
using (auth.uid() = user_id);

create policy "usage_logs_select_own"
on public.usage_logs for select
using (auth.uid() = user_id);

create policy "subscriptions_select_own"
on public.subscriptions for select
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('analysis-images', 'analysis-images', true)
on conflict (id) do nothing;

create policy "analysis_images_select_public"
on storage.objects for select
using (bucket_id = 'analysis-images');

create policy "analysis_images_insert_own_folder"
on storage.objects for insert
with check (
  bucket_id = 'analysis-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "analysis_images_delete_own_folder"
on storage.objects for delete
using (
  bucket_id = 'analysis-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
