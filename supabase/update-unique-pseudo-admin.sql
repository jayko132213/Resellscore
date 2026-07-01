alter table public.profiles
add column if not exists pseudo text;

alter table public.profiles
add column if not exists avatar_url text;

alter table public.profiles
add column if not exists manual_expires_at timestamptz;

create unique index if not exists profiles_pseudo_unique_idx
on public.profiles (lower(trim(pseudo)))
where pseudo is not null and length(trim(pseudo)) > 0;

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

drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);
