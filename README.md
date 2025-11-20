# Workout Tracker - Monitoramento de Treinos de Academia

Aplicativo completo de monitoramento de treinos de academia com geração de planos personalizados usando IA.

## 🚀 Funcionalidades

### ✅ Autenticação e Cadastro
- Sistema de registro e login com email e senha
- Armazenamento seguro de senhas com bcrypt
- Sessões gerenciadas com NextAuth.js

### 🏋️ Dashboard Principal
- Visualização de todos os treinos salvos
- Indicadores de progresso
- Acesso rápido ao treino atual
- Interface intuitiva e responsiva

### 🤖 Geração de Treinos com IA
- Integração com OpenAI para criar planos personalizados
- Formulário detalhado com preferências do usuário
- Geração de exercícios com alternativas
- Suporte para diferentes modelos (GPT-3.5, GPT-4)

### 📊 Monitoramento de Progresso
- Sistema de checkboxes para marcar exercícios concluídos
- Cálculo automático de porcentagem de conclusão
- Atualização em tempo real do progresso
- Histórico de treinos

### 🔐 Segurança
- Armazenamento criptografado de chaves API
- Validação de inputs em frontend e backend
- Proteção contra acessos não autorizados

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 15** com App Router
- **TypeScript** para type safety
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes UI
- **Lucide React** para ícones

### Backend
- **Next.js API Routes**
- **Prisma ORM** com SQLite
- **NextAuth.js** para autenticação
- **bcryptjs** para hash de senhas
- **crypto-js** para criptografia
- **z-ai-web-dev-sdk** para integração com OpenAI

## 📋 Estrutura do Projeto

```
src/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/              # Autenticação
│   │   ├── workouts/          # Gerenciamento de treinos
│   │   ├── openai/            # Integração com IA
│   │   └── user/              # Configurações do usuário
│   ├── auth/                  # Páginas de autenticação
│   ├── workout/               # Páginas de treinos
│   ├── settings/              # Página de configurações
│   ├── layout.tsx             # Layout principal
│   └── page.tsx               # Dashboard
├── components/
│   ├── ui/                    # Componentes shadcn/ui
│   └── providers.tsx           # SessionProvider
├── lib/
│   ├── auth.ts                # Configuração NextAuth
│   └── db.ts                  # Cliente Prisma
└── hooks/
    └── use-toast.ts           # Hook para notificações
```

## 🚀 Como Usar

### 1. Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Iniciar o banco de dados
npm run db:push

# Iniciar o servidor de desenvolvimento
npm run dev
```

### 2. Configuração do Ambiente

Edite o arquivo `.env` com as seguintes variáveis:

```env
# Database
DATABASE_URL=file:./dev.db

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-chave-secreta-aqui

# Criptografia
ENCRYPTION_KEY=sua-chave-de-criptografia-aqui
```

### 3. Usando a Aplicação

1. **Criar Conta**: Acesse `/auth/signup` para criar uma nova conta
2. **Configurar OpenAI**: Vá para `/settings` e adicione sua chave API da OpenAI
3. **Criar Treino**: Clique em "Criar Novo Treino" no dashboard
4. **Preencher Formulário**: Responda às perguntas sobre suas preferências
5. **Gerar Plano**: A IA criará um plano personalizado para você
6. **Salvar e Treinar**: Salve o plano e comece a monitorar seu progresso

## 📝 Fluxo de Usuário

### Novo Usuário
1. Registro na plataforma
2. Configuração da chave API da OpenAI
3. Criação do primeiro treino personalizado
4. Início do monitoramento

### Usuário Existente
1. Login na plataforma
2. Acesso ao dashboard com treinos salvos
3. Continuação do treino ativo ou criação de novo plano
4. Monitoramento do progresso

## 🔧 Configuração da OpenAI

Para usar a geração de treinos, você precisa:

1. Obter uma chave API da OpenAI em [platform.openai.com](https://platform.openai.com)
2. Adicionar a chave nas configurações do usuário
3. Escolher o modelo preferido (GPT-3.5 Turbo ou GPT-4)

## 📊 Estrutura de Dados

### Usuário
```typescript
interface User {
  id: string
  email: string
  name?: string
  openaiKey?: string    // Criptografada
  selectedModel: string // Modelo OpenAI preferido
}
```

### Treino
```typescript
interface Workout {
  id: string
  userId: string
  name: string
  workoutJson: {
    splits: Array<{
      name: string
      exercises: Array<{
        main: string
        substitutions: string[]
      }>
    }>
  }
  completionPercentage: number
  isActive: boolean
}
```

## 🚀 Deploy

### Para Produção

1. **Variáveis de Ambiente**: Configure todas as variáveis necessárias
2. **Banco de Dados**: Use um banco de dados production-ready
3. **Segurança**: Use chaves fortes e HTTPS
4. **Domínio**: Configure NEXTAUTH_URL com seu domínio

### Exemplo de Configuração Production

```env
DATABASE_URL=postgresql://user:password@localhost:5432/workoutdb
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=chave-secreta-muito-forte
ENCRYPTION_KEY=chave-de-criptografia-muito-forte
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver sugestões:

1. Verifique os [issues](https://github.com/seu-usuario/workout-tracker/issues)
2. Crie um novo issue descrevendo o problema
3. Contribua com melhorias através de Pull Requests

---

**Desenvolvido com ❤️ usando Next.js, TypeScript e IA**