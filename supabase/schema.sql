-- =============================================================
-- GeekStack — Schéma MVP (volet Films)
-- À exécuter dans Supabase → SQL Editor
-- =============================================================

-- -------------------------------------------------------------
-- 1. Profiles : étend auth.users
-- -------------------------------------------------------------
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null check (char_length(username) between 3 and 24
                                       and username ~ '^[a-zA-Z0-9_]+$'),
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- Lecture publique du profil (username, display_name) → permet d'afficher une page profil partagée
create policy "profiles_select_public" on profiles for select using (true);

-- Écriture restreinte au propriétaire
create policy "profiles_insert_self" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_self" on profiles for update using (auth.uid() = id);


-- -------------------------------------------------------------
-- 2. Movies : cache partagé des fiches TMDB
-- -------------------------------------------------------------
create table movies (
  id bigint primary key, -- ID TMDB
  title text not null,
  release_year int,
  poster_path text,
  genres text[] default '{}',
  synopsis text,
  cached_at timestamptz default now()
);

alter table movies enable row level security;

-- Lecture publique (cache non sensible)
create policy "movies_select_public" on movies for select using (true);

-- Insertion via API serveur uniquement (utilisateur authentifié peut écrire pour faire grossir le cache)
create policy "movies_insert_auth" on movies for insert to authenticated with check (true);
create policy "movies_update_auth" on movies for update to authenticated using (true);


-- -------------------------------------------------------------
-- 3. Library entries : relation utilisateur ↔ film
-- -------------------------------------------------------------
create table library_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  movie_id bigint references movies(id) on delete restrict not null,
  status text not null default 'a_voir'
    check (status in ('a_voir', 'vu', 'abandonne')),
  rating int check (rating between 1 and 10),
  added_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, movie_id)
);

create index library_entries_user_idx on library_entries (user_id, added_at desc);
create index library_entries_rating_idx on library_entries (user_id, rating)
  where rating is not null;

alter table library_entries enable row level security;

create policy "library_select_self" on library_entries for select using (auth.uid() = user_id);
create policy "library_insert_self" on library_entries for insert with check (auth.uid() = user_id);
create policy "library_update_self" on library_entries for update using (auth.uid() = user_id);
create policy "library_delete_self" on library_entries for delete using (auth.uid() = user_id);

-- Trigger : maintient updated_at
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger library_entries_updated_at
  before update on library_entries
  for each row execute function set_updated_at();


-- -------------------------------------------------------------
-- 4. Events : instrumentation (4 events MVP)
-- -------------------------------------------------------------
create table events (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete cascade,
  type text not null check (type in (
    'movie_added',        -- ajout d'un film à la bibliothèque
    'session_return',     -- ouverture de l'app après >1h sans activité
    'dna_share_clicked',  -- clic sur "Partager mon ADN Geek"
    'dna_regenerated'     -- ADN recalculé suite à une nouvelle notation
  )),
  payload jsonb default '{}'::jsonb,
  occurred_at timestamptz default now()
);

create index events_user_type_time_idx on events (user_id, type, occurred_at desc);
create index events_type_time_idx on events (type, occurred_at desc);

alter table events enable row level security;

-- L'utilisateur ne lit/écrit que ses propres events
create policy "events_select_self" on events for select using (auth.uid() = user_id);
create policy "events_insert_self" on events for insert with check (auth.uid() = user_id);


-- -------------------------------------------------------------
-- 5. Vue ADN Geek : % par genre, films notés ≥ 7
-- -------------------------------------------------------------
create or replace view user_genre_dna as
select
  le.user_id,
  genre,
  count(*)::int as genre_count,
  round(100.0 * count(*) / sum(count(*)) over (partition by le.user_id), 1) as percentage
from library_entries le
join movies m on m.id = le.movie_id
cross join lateral unnest(m.genres) as genre
where le.rating >= 7
group by le.user_id, genre;


-- -------------------------------------------------------------
-- 6. Trigger : auto-création d'un profil au signup
--    L'utilisateur devra ensuite compléter son username via /onboarding
--    On insère un username temporaire basé sur l'id pour éviter le NULL.
-- -------------------------------------------------------------
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    'user_' || substring(new.id::text from 1 for 8),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
