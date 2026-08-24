-- Pagina di dettaglio corso (/corsi/[slug]): serve un testo che spieghi le
-- classi/livelli (oltre all'elenco orari già in course_levels) e un elenco
-- di insegnanti con foto e bio, entrambi assenti nello schema corsi attuale
-- (courses.teachers resta la riga breve "con Pizzo & Still" mostrata su
-- Home/Corsi, non tocchiamo quel campo).
alter table public.courses
  add column if not exists classes_info text;

-- ---- course_teachers --------------------------------------------------
-- Stesso pattern 1-a-molti di course_levels: un corso ha 0..N insegnanti,
-- ciascuno con foto/nome/bio per la sezione "insegnante" della pagina di
-- dettaglio.
create table public.course_teachers (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references public.courses(id) on delete cascade,
  name          text not null,
  photo_url     text,
  bio           text,
  order_index   int not null default 0,
  updated_at    timestamptz not null default now()
);

create index idx_course_teachers_course_id on public.course_teachers(course_id);

create trigger trg_course_teachers_updated_at
  before update on public.course_teachers
  for each row execute function public.set_updated_at();

alter table public.course_teachers enable row level security;

grant select on public.course_teachers to anon, authenticated;
grant insert, update, delete on public.course_teachers to authenticated;

create policy "course_teachers_select_anon"
  on public.course_teachers for select to anon using (true);

create policy "course_teachers_select_authenticated"
  on public.course_teachers for select to authenticated using (true);

create policy "course_teachers_insert_authenticated"
  on public.course_teachers for insert to authenticated with check (true);

create policy "course_teachers_update_authenticated"
  on public.course_teachers for update to authenticated using (true) with check (true);

create policy "course_teachers_delete_authenticated"
  on public.course_teachers for delete to authenticated using (true);
