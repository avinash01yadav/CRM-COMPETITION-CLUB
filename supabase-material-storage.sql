insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'competition-club-materials',
  'competition-club-materials',
  true,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Allow public read materials" on storage.objects;
drop policy if exists "Allow public upload materials" on storage.objects;
drop policy if exists "Allow public update materials" on storage.objects;
drop policy if exists "Allow public delete materials" on storage.objects;

create policy "Allow public read materials"
on storage.objects
for select
using (bucket_id = 'competition-club-materials');

create policy "Allow public upload materials"
on storage.objects
for insert
with check (bucket_id = 'competition-club-materials');

create policy "Allow public update materials"
on storage.objects
for update
using (bucket_id = 'competition-club-materials')
with check (bucket_id = 'competition-club-materials');

create policy "Allow public delete materials"
on storage.objects
for delete
using (bucket_id = 'competition-club-materials');
