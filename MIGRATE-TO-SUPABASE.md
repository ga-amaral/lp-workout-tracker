# 🚀 Migração para Supabase - Guia Completo

## 📋 Pré-requisitos

1. **Conta Supabase**: Crie uma conta em [supabase.com](https://supabase.com)
2. **Projeto Supabase**: Crie um novo projeto
3. **Credenciais**: Tenha em mãos as credenciais do seu projeto

## 🔧 Passo 1: Configurar o Schema no Supabase

### Execute o Schema SQL

1. Acesse o [painel do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral
4. Clique em **New query**
5. Copie todo o conteúdo do arquivo `supabase-schema.sql`
6. Cole no editor e clique em **Run**

### Verifique a Criação das Tabelas

Após executar o script, você deverá ver as seguintes tabelas:
- `users`
- `workouts`

## 🔧 Passo 2: Instalar Dependências Supabase

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

## 🔧 Passo 3: Atualizar Variáveis de Ambiente

Substitua o conteúdo do seu arquivo `.env`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production

# Encryption key for API keys
ENCRYPTION_KEY=your-encryption-key-here-change-this-in-production
```

**Onde encontrar as credenciais:**
1. No painel Supabase → Settings → API
2. Copie a **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copie a **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copie a **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## 🔧 Passo 4: Atualizar Cliente de Banco de Dados

Crie um novo arquivo `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Para operações administrativas (server-side)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

## 🔧 Passo 5: Atualizar Arquivos de Autenticação

### Substituir `lib/auth.ts`

```typescript
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { supabaseAdmin } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single()

        if (error || !user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup"
  }
}
```

### Atualizar `api/auth/register/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Verificar se usuário já existe
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        name,
        password: hashedPassword
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

## 🔧 Passo 6: Atualizar APIs de Treinos

### Atualizar `api/workouts/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: workouts, error } = await supabaseAdmin
      .from('workouts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ workouts: workouts || [] })
  } catch (error) {
    console.error("Error fetching workouts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { name, workoutJson } = await request.json()

    if (!name || !workoutJson) {
      return NextResponse.json(
        { error: "Name and workout data are required" },
        { status: 400 }
      )
    }

    // Desativar todos os outros treinos do usuário
    await supabaseAdmin
      .from('workouts')
      .update({ is_active: false })
      .eq('user_id', session.user.id)

    const { data: workout, error } = await supabaseAdmin
      .from('workouts')
      .insert({
        user_id: session.user.id,
        name,
        workout_json: workoutJson,
        is_active: true,
        completion_percentage: 0
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ workout })
  } catch (error) {
    console.error("Error creating workout:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

## 🔧 Passo 7: Atualizar APIs de Usuário

### Atualizar `api/user/settings/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import CryptoJS from 'crypto-js'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, selected_model, openai_key')
      .eq('id', session.user.id)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Não enviar a chave criptografada para o frontend
    const { openai_key, ...userWithoutKey } = user
    const hasOpenAIKey = !!openai_key

    return NextResponse.json({ 
      user: { ...userWithoutKey, hasOpenAIKey }
    })
  } catch (error) {
    console.error("Error fetching user settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { openaiKey, selectedModel } = await request.json()

    const updateData: any = {}

    if (selectedModel) {
      updateData.selected_model = selectedModel
    }

    if (openaiKey) {
      // Criptografar a chave API
      const encryptedKey = CryptoJS.AES.encrypt(openaiKey, process.env.ENCRYPTION_KEY!).toString()
      updateData.openai_key = encryptedKey
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', session.user.id)
      .select('id, email, name, selected_model')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error updating user settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

## 🔧 Passo 8: Remover Arquivos Antigos

```bash
# Remover arquivos do Prisma (opcional)
rm -rf prisma/
rm lib/db.ts

# Ou mantenha para backup
mv prisma prisma_backup
mv lib/db.ts lib/db_backup.ts
```

## 🔧 Passo 9: Atualizar `package.json`

Remova dependências do Prisma se não for mais usá-las:

```bash
npm uninstall prisma @prisma/client
```

## 🔧 Passo 10: Testar a Aplicação

1. **Reinicie o servidor**:
   ```bash
   npm run dev
   ```

2. **Teste o registro**: Crie uma nova conta

3. **Teste o login**: Faça login com a nova conta

4. **Configure OpenAI**: Adicione sua chave API

5. **Crie um treino**: Teste a geração com IA

## 🚨 Troubleshooting

### Erro Comum: "Invalid API key"
- Verifique se as credenciais no `.env` estão corretas
- Confirme se você está usando as chaves do projeto certo

### Erro Comum: "Row level security violation"
- Verifique se as políticas RLS foram criadas corretamente
- Confirme se o usuário está autenticado

### Erro Comum: "Connection refused"
- Verifique se o URL do Supabase está correto
- Confirme se o projeto Supabase está ativo

## 📁 Arquivos Modificados

- ✅ `.env` - Variáveis de ambiente
- ✅ `lib/supabase.ts` - Cliente Supabase
- ✅ `lib/auth.ts` - Autenticação com Supabase
- ✅ `api/auth/register/route.ts` - Registro de usuários
- ✅ `api/workouts/route.ts` - CRUD de treinos
- ✅ `api/user/settings/route.ts` - Configurações do usuário
- ✅ `supabase-schema.sql` - Schema do banco

## 🎉 Pronto!

Sua aplicação agora está usando o Supabase como banco de dados! 
Você terá:
- ✅ Banco de dados PostgreSQL em nuvem
- ✅ Autenticação segura com RLS
- ✅ Performance superior ao SQLite
- ✅ Escalabilidade para produção
- ✅ Backup automático dos dados

Para implantar em produção, não se esqueça de:
1. Usar variáveis de ambiente de produção
2. Configurar domínios customizados
3. Ativar SSL
4. Configurar rate limiting