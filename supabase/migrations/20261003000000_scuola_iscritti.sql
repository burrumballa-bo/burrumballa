-- =====================================================================
--  SCUOLA DI DANZA — Iscritti, assegnazione alle classi, abbonamenti
--
--  - school_students: anagrafica di chi frequenta la scuola.
--  - school_student_classes: un iscritto puo' frequentare 0..N classi
--    (course_levels). Il "corso" dell'iscritto e' derivato dalla classe.
--  - school_subscriptions: abbonamenti con descrizione e periodo
--    (start_date/end_date, estremi inclusi). Stato corrente/futuro/scaduto
--    calcolato lato applicazione in base alla data odierna.
--
--  Dati personali: accesso riservato agli utenti autenticati (admin),
--  nessun accesso anon.
-- =====================================================================

create table public.school_students (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null,
  last_name   text not null,
  email       text,
  phone       text,
  birth_date  date,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_school_students_updated_at
  before update on public.school_students
  for each row execute function public.set_updated_at();

create table public.school_student_classes (
  student_id      uuid not null references public.school_students(id) on delete cascade,
  course_level_id uuid not null references public.course_levels(id) on delete cascade,
  primary key (student_id, course_level_id)
);

create index idx_school_student_classes_level on public.school_student_classes(course_level_id);

create table public.school_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.school_students(id) on delete cascade,
  description text not null,
  start_date  date not null,
  end_date    date not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (end_date >= start_date)
);

create index idx_school_subscriptions_student on public.school_subscriptions(student_id);

create trigger trg_school_subscriptions_updated_at
  before update on public.school_subscriptions
  for each row execute function public.set_updated_at();

alter table public.school_students enable row level security;
alter table public.school_student_classes enable row level security;
alter table public.school_subscriptions enable row level security;

grant select, insert, update, delete on public.school_students to authenticated;
grant select, insert, update, delete on public.school_student_classes to authenticated;
grant select, insert, update, delete on public.school_subscriptions to authenticated;

create policy "school_students_all_authenticated"
  on public.school_students for all to authenticated using (true) with check (true);

create policy "school_student_classes_all_authenticated"
  on public.school_student_classes for all to authenticated using (true) with check (true);

create policy "school_subscriptions_all_authenticated"
  on public.school_subscriptions for all to authenticated using (true) with check (true);
