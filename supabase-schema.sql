-- ========================================
-- Workout Tracker - Schema Supabase
-- ========================================

-- Habilitar extensão UUID se não estiver ativa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- Tabela de Usuários
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    openai_key TEXT, -- Chave API da OpenAI criptografada
    selected_model VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- Tabela de Treinos
-- ========================================
CREATE TABLE IF NOT EXISTS workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    workout_json JSONB NOT NULL, -- Estrutura JSON com splits e exercícios
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- Índices para Performance
-- ========================================

-- Índices para tabela users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Índices para tabela workouts
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_is_active ON workouts(is_active);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON workouts(created_at);
CREATE INDEX IF NOT EXISTS idx_workouts_user_active ON workouts(user_id, is_active);

-- Índice GIN para JSONB (para buscas no workout_json)
CREATE INDEX IF NOT EXISTS idx_workouts_json_gin ON workouts USING GIN(workout_json);

-- ========================================
-- Triggers para updated_at automático
-- ========================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para users
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para workouts
CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Row Level Security (RLS)
-- ========================================

-- Habilitar RLS nas tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para users
CREATE POLICY "Users podem ver próprio perfil" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users podem atualizar próprio perfil" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users podem inserir próprio perfil" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Políticas de segurança para workouts
CREATE POLICY "Usuários podem ver próprios treinos" ON workouts
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem inserir próprios treinos" ON workouts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem atualizar próprios treinos" ON workouts
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem deletar próprios treinos" ON workouts
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- ========================================
-- Funções Auxiliares
-- ========================================

-- Função para desativar todos os treinos de um usuário exceto um específico
CREATE OR REPLACE FUNCTION deactivate_other_workouts(
    p_user_id UUID,
    p_active_workout_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE workouts 
    SET is_active = false 
    WHERE user_id = p_user_id 
    AND id != p_active_workout_id;
END;
$$ LANGUAGE plpgsql;

-- Função para obter treino ativo de um usuário
CREATE OR REPLACE FUNCTION get_active_workout(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    workout_json JSONB,
    completion_percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.name,
        w.workout_json,
        w.completion_percentage,
        w.created_at
    FROM workouts w
    WHERE w.user_id = p_user_id 
    AND w.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Views Úteis
-- ========================================

-- View para estatísticas de treinos do usuário
CREATE OR REPLACE VIEW user_workout_stats AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email,
    COUNT(w.id) as total_workouts,
    COUNT(CASE WHEN w.is_active THEN 1 END) as active_workouts,
    ROUND(AVG(w.completion_percentage), 2) as avg_completion,
    MAX(w.created_at) as last_workout_date
FROM users u
LEFT JOIN workouts w ON u.id = w.user_id
GROUP BY u.id, u.name, u.email;

-- ========================================
-- Dados de Exemplo (Opcional)
-- ========================================

-- Inserir um usuário de exemplo (comente em produção)
-- INSERT INTO users (id, email, name, password, selected_model)
-- VALUES (
--     uuid_generate_v4(),
--     'exemplo@email.com',
--     'Usuário Teste',
--     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.F5e', -- senha: 123456
--     'gpt-3.5-turbo'
-- );

-- ========================================
-- Validações e Constraints
-- ========================================

-- Adicionar check constraints
ALTER TABLE users ADD CONSTRAINT check_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE workouts ADD CONSTRAINT check_completion_range 
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

ALTER TABLE workouts ADD CONSTRAINT check_name_not_empty 
    CHECK (LENGTH(TRIM(name)) > 0);

-- ========================================
-- Comentários para Documentação
-- ========================================

COMMENT ON TABLE users IS 'Tabela de usuários do Workout Tracker';
COMMENT ON TABLE workouts IS 'Tabela de treinos dos usuários com estrutura JSON';

COMMENT ON COLUMN users.openai_key IS 'Chave API da OpenAI armazenada de forma criptografada';
COMMENT ON COLUMN users.selected_model IS 'Modelo OpenAI selecionado pelo usuário (gpt-3.5-turbo, gpt-4, etc.)';
COMMENT ON COLUMN workouts.workout_json IS 'Estrutura JSON contendo splits e exercícios do treino';
COMMENT ON COLUMN workouts.completion_percentage IS 'Porcentagem de conclusão do treino (0-100)';
COMMENT ON COLUMN workouts.is_active IS 'Indica se este é o treino atualmente ativo do usuário';

-- ========================================
-- Instruções de Uso
-- ========================================

/*
Para usar este schema no Supabase:

1. Copie todo o conteúdo deste arquivo
2. Acesse o painel do Supabase
3. Vá para "SQL Editor"
4. Cole e execute este script

Após executar, você precisará:

1. Ativar a autenticação do Supabase em Authentication > Settings
2. Configurar as variáveis de ambiente no seu projeto Next.js:
   - NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   - NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   - SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

3. Atualizar o arquivo .env com as credenciais do Supabase

4. Modificar o arquivo lib/db.ts para usar o cliente Supabase

Estrutura esperada do workout_json:
{
  "splits": [
    {
      "name": "A",
      "exercises": [
        {
          "main": "Supino Reto",
          "substitutions": ["Supino Inclinado", "Crucifixo", "Flexão de Braço"]
        }
      ]
    }
  ]
}
*/