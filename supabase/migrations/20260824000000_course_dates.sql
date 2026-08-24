-- Data di inizio/fine facoltative per un corso: alcune discipline non sono
-- un corso "sempre aperto" ma un percorso a termine (es. un ciclo di
-- lezioni stagionale). Nullable: un corso senza date resta un corso
-- ricorrente "continuo" come oggi, nessun default retroattivo sui corsi
-- già esistenti.
alter table public.courses
  add column if not exists start_date date,
  add column if not exists end_date date;
