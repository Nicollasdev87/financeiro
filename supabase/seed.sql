-- ============================================================
-- SEED DE DESENVOLVIMENTO
-- Rode DEPOIS de criar sua conta pelo /login (para existir um auth.users).
-- Troque 'SEU_USER_ID' pelo id do usuário (Authentication > Users no Supabase).
-- ============================================================

do $$
declare
  v_user_id uuid := 'SEU_USER_ID'; -- <<< troque aqui
  v_household_id uuid;
  v_member1 uuid;
  v_member2 uuid;
  v_cat_salario uuid;
  v_cat_moradia uuid;
  v_cat_mercado uuid;
  v_cat_alimentacao uuid;
  v_cat_transporte uuid;
  v_cat_lazer uuid;
  v_card_id uuid;
  v_month date := date_trunc('month', now())::date;
  v_expense_id uuid;
begin
  insert into households (name, created_by) values ('Minha Família', v_user_id)
  returning id into v_household_id;

  insert into household_members (household_id, profile_id, display_name, color)
  values (v_household_id, v_user_id, 'Nicollas', '#7C5CFC')
  returning id into v_member1;

  -- segunda pessoa fictícia (sem login próprio, apenas para demonstração)
  insert into household_members (household_id, profile_id, display_name, color)
  values (v_household_id, null, 'Carol', '#3B82F6')
  returning id into v_member2;

  insert into categories (household_id, name, kind, nature, icon, color, sort_order)
  values (v_household_id, 'Salário', 'income', 'fixed', 'wallet', '#22A06B', 1)
  returning id into v_cat_salario;

  insert into categories (household_id, name, kind, nature, icon, color, sort_order) values
    (v_household_id, 'Moradia', 'expense', 'fixed', 'home', '#7C5CFC', 1) returning id into v_cat_moradia;
  insert into categories (household_id, name, kind, nature, icon, color, sort_order) values
    (v_household_id, 'Mercado', 'expense', 'variable', 'shopping-cart', '#D99A00', 2) returning id into v_cat_mercado;
  insert into categories (household_id, name, kind, nature, icon, color, sort_order) values
    (v_household_id, 'Alimentação', 'expense', 'variable', 'utensils', '#D64545', 3) returning id into v_cat_alimentacao;
  insert into categories (household_id, name, kind, nature, icon, color, sort_order) values
    (v_household_id, 'Transporte', 'expense', 'variable', 'car', '#3B82F6', 4) returning id into v_cat_transporte;
  insert into categories (household_id, name, kind, nature, icon, color, sort_order) values
    (v_household_id, 'Lazer', 'expense', 'variable', 'popcorn', '#7C5CFC', 5) returning id into v_cat_lazer;

  insert into credit_cards (household_id, name, bank, credit_limit, monthly_goal, closing_day, due_day)
  values (v_household_id, 'Nubank', 'Nubank', 5000, 2000, 28, 10)
  returning id into v_card_id;

  insert into financial_goals (household_id, credit_card_id, month, target_amount)
  values (v_household_id, v_card_id, v_month, 2000);

  -- receitas
  insert into monthly_income (household_id, month, category_id, member_id, amount)
  values
    (v_household_id, v_month, v_cat_salario, v_member1, 6500),
    (v_household_id, v_month, v_cat_salario, v_member2, 4000);

  -- despesas + divisão por forma de pagamento
  insert into monthly_expenses (household_id, month, category_id, member_id, total)
  values (v_household_id, v_month, v_cat_moradia, v_member1, 2000) returning id into v_expense_id;
  insert into monthly_expense_payments (monthly_expense_id, method, amount) values
    (v_expense_id, 'pix', 2000);

  insert into monthly_expenses (household_id, month, category_id, member_id, total)
  values (v_household_id, v_month, v_cat_mercado, v_member1, 700) returning id into v_expense_id;
  insert into monthly_expense_payments (monthly_expense_id, method, credit_card_id, amount) values
    (v_expense_id, 'credit', v_card_id, 500);
  insert into monthly_expense_payments (monthly_expense_id, method, amount) values
    (v_expense_id, 'pix', 200);

  insert into monthly_expenses (household_id, month, category_id, member_id, total)
  values (v_household_id, v_month, v_cat_mercado, v_member2, 500) returning id into v_expense_id;
  insert into monthly_expense_payments (monthly_expense_id, method, amount) values
    (v_expense_id, 'debit', 500);

  insert into monthly_expenses (household_id, month, category_id, member_id, total)
  values (v_household_id, v_month, v_cat_alimentacao, v_member1, 500) returning id into v_expense_id;
  insert into monthly_expense_payments (monthly_expense_id, method, credit_card_id, amount) values
    (v_expense_id, 'credit', v_card_id, 300);
  insert into monthly_expense_payments (monthly_expense_id, method, amount) values
    (v_expense_id, 'pix', 200);

  insert into monthly_expenses (household_id, month, category_id, member_id, total)
  values (v_household_id, v_month, v_cat_transporte, v_member2, 500) returning id into v_expense_id;
  insert into monthly_expense_payments (monthly_expense_id, method, amount) values
    (v_expense_id, 'pix', 200);
  insert into monthly_expense_payments (monthly_expense_id, method, amount) values
    (v_expense_id, 'cash', 300);

  insert into monthly_expenses (household_id, month, category_id, member_id, total)
  values (v_household_id, v_month, v_cat_lazer, v_member1, 300) returning id into v_expense_id;
  insert into monthly_expense_payments (monthly_expense_id, method, credit_card_id, amount) values
    (v_expense_id, 'credit', v_card_id, 300);

  raise notice 'Seed criado para household %', v_household_id;
end $$;
