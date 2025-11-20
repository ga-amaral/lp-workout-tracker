-- Schema Simplificado para Workout Tracker no Supabase
-- Execute este script no SQL Editor do seu projeto Supabase

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

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_is_active ON workouts(is_active);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users podem ver próprio perfil" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users podem atualizar próprio perfil" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users podem inserir próprio perfil" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Usuários podem ver próprios treinos" ON workouts
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem inserir próprios treinos" ON workouts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem atualizar próprios treinos" ON workouts
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem deletar próprios treinos" ON workouts
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Constraints
ALTER TABLE users ADD CONSTRAINT check_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE workouts ADD CONSTRAINT check_completion_range 
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

ALTER TABLE workouts ADD CONSTRAINT check_name_not_empty 
    CHECK (LENGTH(TRIM(name)) > 0);