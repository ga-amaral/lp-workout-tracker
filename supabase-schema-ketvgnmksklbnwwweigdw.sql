-- Schema para Workout Tracker no Supabase
-- Projeto: ketvgnmksklbnwwweigdw

-- Execute este script no SQL Editor do seu projeto Supabase
-- Acesse: https://ketvgnmksklbnwwweigdw.supabase.co

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    openai_key TEXT,
    selected_model VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Treinos
CREATE TABLE IF NOT EXISTS workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    workout_json JSONB NOT NULL,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_is_active ON workouts(is_active);
CREATE INDEX IF NOT EXISTS idx_workouts_user_active ON workouts(user_id, is_active);

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para timestamps automáticos
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para a tabela users
CREATE POLICY "Users podem ver próprio perfil" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users podem atualizar próprio perfil" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users podem inserir próprio perfil" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Políticas de segurança para a tabela workouts
CREATE POLICY "Usuários podem ver próprios treinos" ON workouts
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem inserir próprios treinos" ON workouts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem atualizar próprios treinos" ON workouts
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem deletar próprios treinos" ON workouts
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Constraints de validação
ALTER TABLE users ADD CONSTRAINT check_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE workouts ADD CONSTRAINT check_completion_range 
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

ALTER TABLE workouts ADD CONSTRAINT check_name_not_empty 
    CHECK (LENGTH(TRIM(name)) > 0);

-- Comentários para documentação
COMMENT ON TABLE users IS 'Tabela de usuários do Workout Tracker';
COMMENT ON TABLE workouts IS 'Tabela de treinos dos usuários com estrutura JSON';
COMMENT ON COLUMN users.openai_key IS 'Chave API da OpenAI armazenada de forma criptografada';
COMMENT ON COLUMN users.selected_model IS 'Modelo OpenAI selecionado pelo usuário';
COMMENT ON COLUMN workouts.workout_json IS 'Estrutura JSON contendo splits e exercícios do treino';
COMMENT ON COLUMN workouts.completion_percentage IS 'Porcentagem de conclusão do treino (0-100)';
COMMENT ON COLUMN workouts.is_active IS 'Indica se este é o treino atualmente ativo do usuário';

-- Estrutura esperada do workout_json:
-- {
--   "splits": [
--     {
--       "name": "A",
--       "exercises": [
--         {
--           "main": "Supino Reto",
--           "substitutions": ["Supino Inclinado", "Crucifixo", "Flexão de Braço"]
--         }
--       ]
--     }
--   ]
-- }