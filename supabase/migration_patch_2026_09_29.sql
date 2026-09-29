-- ============================================================
-- PATCH — rode este arquivo inteiro no SQL Editor do Supabase.
-- É seguro rodar mais de uma vez (idempotente).
--
-- O que ele faz: adiciona a meta mensal de gasto no cartão de crédito
-- (households.credit_card_goal), usada pelo card "Reduzir o cartão" em
-- Evolução. Sem RLS nova: a policy "households_update" já existente cobre
-- esta coluna (qualquer pessoa do planejamento pode ajustar a meta).
-- ============================================================

alter table households add column if not exists credit_card_goal numeric(12,2);

notify pgrst, 'reload schema';
