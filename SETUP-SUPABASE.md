# 🚀 Configuração Rápida do Supabase

## 1️⃣ Execute o Schema no Supabase

1. Acesse: https://b6otrpmzhqhnsdodgdywegwrhd.supabase.co
2. Vá para **SQL Editor** no menu lateral
3. Copie todo o conteúdo do arquivo `supabase-setup.sql`
4. Cole no editor e clique em **Run**

## 2️⃣ Configuração Já Feita ✅

Seu arquivo `.env` já está configurado com:
- URL: https://b6otrpmzhqhnsdodgdywegwrhd.supabase.co
- Chave Pública: sb_publishable_B6oTRPMzHqhnSDOdgdyweg_WRhBdb0-
- Chave Service: sb_secret_NqSw3yJcqeX-9rNOvt1MBw_ZNPchn1o

## 3️⃣ Teste a Aplicação

1. **Reinicie o servidor** (se necessário):
   ```bash
   npm run dev
   ```

2. **Acesse**: http://localhost:3000

3. **Crie uma conta de teste**

4. **Configure a OpenAI** nas configurações

5. **Crie seu primeiro treino**

## 🔧 Arquivos Atualizados

✅ `.env` - Configurado com suas chaves Supabase
✅ `src/lib/supabase.ts` - Cliente Supabase
✅ `src/lib/auth.ts` - Autenticação com Supabase
✅ `src/app/api/auth/register/route.ts` - Registro
✅ `src/app/api/workouts/route.ts` - Treinos CRUD
✅ `src/app/api/workouts/[id]/route.ts` - Treino específico
✅ `src/app/api/user/settings/route.ts` - Configurações
✅ `src/app/api/openai/generate/route.ts` - Geração IA

## 🎯 Pronto para Usar!

Sua aplicação agora está conectada ao Supabase! Você terá:
- ✅ Banco PostgreSQL em nuvem
- ✅ Dados persistentes
- ✅ Segurança com Row Level Security
- ✅ Performance superior ao SQLite

## 🆘 Se Der Erro

1. **Verifique o schema**: Execute o SQL novamente
2. **Verifique as chaves**: Confirme que são do projeto certo
3. **Reinicie o servidor**: `npm run dev`
4. **Verifique o console**: F12 para ver erros de rede

A aplicação está pronta para produção! 🚀