-- Configurable refusal reasons (Odoo parity). Reuse the taxonomy table with a
-- new kind = 'refuse_reason'. This widens the kind CHECK constraint to allow it;
-- everything else (RLS, the cnt_taxonomy_options RPC) already covers the table.
-- Idempotent and non-destructive.

alter table public.taxonomy drop constraint if exists taxonomy_kind_check;
alter table public.taxonomy add constraint taxonomy_kind_check
  check (kind = any (array['client','position','location','refuse_reason']));

-- verify
select conname, pg_get_constraintdef(oid) as def
from pg_constraint where conname='taxonomy_kind_check';
