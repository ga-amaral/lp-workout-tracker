# 🔧 CORREÇÃO DO ERRO "fetch failed"

## 🚨 Problema Identificado

O erro "fetch failed" está acontecendo porque:

1. **Schema não foi executado no Supabase** - As tabelas não existem
2. **Chaves podem estar incorretas** - Precisamos verificar
3. **CORS não configurado** - O Supabase pode estar bloqueando requisições

## ✅ SOLUÇÃO PASSO A PASSO

### 1️⃣ Execute o Schema no Supabase (IMPORTANTE!)

1. Acesse: https://b6otrpmzhqhnsdodgdywegwrhd.supabase.co
2. Faça login
3. Vá para **SQL Editor** no menu lateral
4. Copie e cole TODO este código:

```sql
-- Schema para Workout Tracker
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
```

5. Clique em **Run** para executar

### 2️⃣ Configure CORS no Supabase

1. No painel do Supabase, vá para **Settings** → **API**
2. Na seção **CORS**, adicione: `http://localhost:3000`
3. Clique em **Save**

### 3️⃣ Verifique as Chaves

No painel Supabase → Settings → API, verifique se as chaves estão corretas:

- **URL**: `https://b6otrpmzhqhnsdodgdywegwrhd.supabase.co`
- **Anon Key**: Deve começar com `eyJhbGciOiJIUzI1NiIs...`
- **Service Role Key**: Deve começar com `eyJhbGciOiJIUzI1NiIs...`

### 4️⃣ Teste a Conexão

1. Reinicie o servidor:
   ```bash
   npm run dev
   ```

2. Acesse: http://localhost:3000/test-supabase

3. Clique em "Test Connection"

### 5️⃣ Se Ainda Der Erro

Tente usar o SQLite temporariamente:

1. **Volte para o SQLite** (comente as linhas do Supabase no .env):
   ```env
   # NEXT_PUBLIC_SUPABASE_URL=...
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   DATABASE_URL=file:/home/z/my-project/db/custom.db
   ```

2. **Volte o Prisma**:
   ```bash
   npm install prisma @prisma/client
   ```

3. **Use o arquivo original** `src/lib/db.ts`

## 🎯 SOLUÇÃO MAIS PROVÁVEL

O problema mais provável é que **você não executou o schema SQL no Supabase**. Sem as tabelas criadas, todas as requisições falham.

## 📞 Se Precisar de Ajuda

1. Execute o schema SQL primeiro
2. Configure o CORS
3. Teste novamente
4. Me diga qual erro aparece

**IMPORTANTE**: O schema SQL é OBRIGATÓRIO para o Supabase funcionar!