-- ============================================================
-- CARTÃO DE CRÉDITO — Execute no Supabase SQL Editor
-- ============================================================

-- 1. Tabela de cartões
CREATE TABLE credit_card (
  id         SERIAL       PRIMARY KEY,
  user_id    UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT         NOT NULL,
  bank       TEXT         NOT NULL,
  last_digits CHAR(4)    NOT NULL,
  brand      TEXT         NOT NULL,
  due_day    INT          NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  closing_day INT         NOT NULL CHECK (closing_day >= 1 AND closing_day <= 31),
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- 2. Tabela de gastos no cartão
CREATE TABLE credit_card_expense (
  id          SERIAL       PRIMARY KEY,
  user_id     UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id     INT          NOT NULL REFERENCES credit_card(id) ON DELETE CASCADE,
  description TEXT         NOT NULL,
  value       NUMERIC      NOT NULL,
  category    TEXT         NOT NULL,
  obs         TEXT         DEFAULT '',
  created_at  TIMESTAMPTZ  NOT NULL,
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- 3. RLS
ALTER TABLE credit_card ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_expense ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cards"   ON credit_card FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cards" ON credit_card FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON credit_card FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cards" ON credit_card FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own card expenses"   ON credit_card_expense FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own card expenses" ON credit_card_expense FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own card expenses" ON credit_card_expense FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own card expenses" ON credit_card_expense FOR DELETE USING (auth.uid() = user_id);
