-- ============================================================
-- Central Hub | Seed opcional (apenas dev local)
-- NÃO faz parte do setup_completo.sql. Use apenas em ambiente
-- de desenvolvimento para ter dados de exemplo.
-- ============================================================

insert into public.servidores (nome, plataforma, observacoes)
values
  ('WPLAY Principal', 'WPLAY', 'Servidor principal WPLAY'),
  ('UNITV Revenda', 'UNITV', 'Painel de revenda UNITV'),
  ('TVS Backup', 'TVS', 'Servidor reserva TVS'),
  ('P2BRAZ Premium', 'P2BRAZ', 'Plano premium P2BRAZ')
on conflict (nome) do nothing;

insert into public.clientes (nome, usuario, telefone, plano, valor_mensal, servidor_id, data_expiracao, status)
select
  'Cliente Exemplo ' || s.plataforma,
  'user_' || lower(s.plataforma),
  '11999999999',
  'Plano Mensal',
  39.90,
  s.id,
  current_date + interval '10 days',
  'Ativo'
from public.servidores s
on conflict do nothing;
