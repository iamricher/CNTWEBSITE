-- Insights / Blog module
-- A lightweight, manageable blog: staff author posts in Content Studio,
-- the public reads only published ones. Mirrors the events table pattern.

create table if not exists public.posts (
  id          bigint generated always as identity primary key,
  title       text not null,
  slug        text,
  category    text,
  excerpt     text,
  body        text,
  cover_image text,
  author      text,
  published   boolean not null default false,
  publish_at  timestamptz,
  images      jsonb not null default '[]'::jsonb,
  view_count  bigint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists posts_created_idx   on public.posts (created_at desc);
create index if not exists posts_published_idx on public.posts (published, publish_at);

alter table public.posts enable row level security;

-- Public + everyone: read posts that are published and past their publish time.
drop policy if exists "posts read published" on public.posts;
create policy "posts read published" on public.posts
  for select to anon, authenticated
  using (published = true and (publish_at is null or publish_at <= now()));

-- Staff can read everything (drafts + scheduled) in Content Studio.
drop policy if exists "posts read staff" on public.posts;
create policy "posts read staff" on public.posts
  for select to authenticated
  using (public.cnt_is_staff());

-- Only super admins may create / edit / delete.
drop policy if exists "posts write super" on public.posts;
create policy "posts write super" on public.posts
  for all to authenticated
  using (public.cnt_is_super_admin())
  with check (public.cnt_is_super_admin());

-- Keep updated_at fresh on edits.
create or replace function public.cnt_posts_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.cnt_posts_touch();

-- View counter: anon-safe, only bumps published posts, ignores everything else.
create or replace function public.cnt_increment_post_view(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.posts
     set view_count = view_count + 1
   where id = p_id
     and published = true
     and (publish_at is null or publish_at <= now());
end $$;

grant execute on function public.cnt_increment_post_view(bigint) to anon, authenticated;
