# MyFinan
MyFinan é uma aplicação web para gestão financeira pessoal, desenvolvida para ajudar utilizadores a monitorizar as suas receitas e despesas, fornecendo uma visão clara da sua saúde financeira através de um dashboard intuitivo e relatórios detalhados.

# Descrição
Esta aplicação visa simplificar o controlo financeiro diário, permitindo que os utilizadores registem transações, categorizem os seus fluxos de dinheiro e acedam a análises visuais do seu comportamento financeiro. Construída com tecnologias modernas, MyFinan oferece uma experiência de utilizador fluida e segura.

# Funcionalidades
  * Autenticação de Utilizador: Registo, login e recuperação de palavra-passe seguros via Supabase.

  * Dashboard Intuitivo: Visão geral rápida das finanças, incluindo receitas, despesas e saldo atual.

  * Gestão de Receitas: Adicione, edite e visualize todas as suas fontes de rendimento.

  * Gestão de Despesas: Registe detalhadamente os seus gastos, com categorização para melhor organização.

  * Relatórios Financeiros: Gere relatórios para analisar padrões de gastos e receitas ao longo do tempo.

  * Design Responsivo: Interface otimizada para diferentes tamanhos de ecrã (desktop e mobile).

# Tecnologias Utilizadas
  * Next.js: Framework React para construção de aplicações web de alto desempenho.

  * React: Biblioteca JavaScript para construção de interfaces de utilizador.

  * TypeScript: Superset de JavaScript que adiciona tipagem estática para maior robustez do código.

  * Tailwind CSS: Framework CSS utility-first para estilização rápida e responsiva.

  * Shadcn/ui: Componentes de UI construídos com Tailwind CSS e Radix UI, usados para a interface do utilizador.

  * Supabase: Backend-as-a-Service (BaaS) para autenticação e gestão de base de dados.

  * Zustand: Pequeno, rápido e escalável gerenciador de estado.

# Estrutura do Projeto
A estrutura principal do projeto segue as convenções do Next.js, com as seguintes pastas chave:

```
.
├── src/
│   ├── app/                    # Páginas e rotas da aplicação Next.js
│   │   ├── auth/               # Rotas e lógica de autenticação (callback, confirm, session)
│   │   ├── dashboard/          # Páginas e componentes do dashboard (overview, expense, revenue, relatorio)
│   │   ├── despesas/           # Página de gestão de despesas
│   │   ├── receita/            # Página de gestão de receitas
│   │   ├── login/              # Página de login
│   │   ├── page.tsx            # Página inicial
│   │   ├── globals.css         # Estilos globais
│   │   └── layout.tsx          # Layout principal da aplicação
│   ├── components/             # Componentes reutilizáveis da UI (formulários de autenticação, etc.)
│   │   └── ui/                 # Componentes UI de shadcn/ui
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Funções de utilidade gerais
│   └── util/
│       └── supabase/           # Configuração e clientes Supabase
├── public/                     # Ativos estáticos
├── package.json                # Dependências e scripts do projeto
├── next.config.mjs             # Configuração do Next.js
├── tailwind.config.ts          # Configuração do Tailwind CSS
├── tsconfig.json               # Configuração do TypeScript
└── biome.json                  # Configuração do Biome (linter/formatter)
```

# Como Executar Localmente
Siga os passos abaixo para configurar e executar o projeto MyFinan na sua máquina local.

# Pré-requisitos
Certifique-se de que tem o Node.js (versão 18 ou superior) e o npm (ou yarn) instalados.

**1. Clonar o Repositório**
```
git clone <URL_DO_SEU_REPOSITORIO>
cd myfinan
```

**2. Instalar Dependências**
```
npm install
# ou
yarn install
```

**3. Configurar Variáveis de Ambiente**

Crie um ficheiro ```.env.local``` na raiz do projeto e adicione as suas variáveis de ambiente do Supabase. Pode encontrar estas credenciais no painel do seu projeto Supabase.

```
NEXT_PUBLIC_SUPABASE_URL=SUA_URL_SUPABASE
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY_SUPABASE
```

**4. Executar a Aplicação**
```
npm run dev
# ou
yarn dev
```

A aplicação estará disponível em ```http://localhost:3000.```

# Scripts Disponíveis
No diretório do projeto, pode executar:

  * ```npm run dev``` ou ```yarn dev```: Inicia o servidor de desenvolvimento.

  * ```npm run build``` ou ```yarn build```: Cria a aplicação para produção.

  * ```npm run start``` ou ```yarn start```: Inicia o servidor de produção depois de construir a aplicação.

  * ```npm run lint``` ou ```yarn lint```: Executa o linter para verificar erros de código.

# Contribuição
Contribuições são bem-vindas! Se tiver sugestões ou quiser reportar problemas, por favor, abra uma issue ou envie um pull request.

# Licença
Este projeto está licenciado sob a licença MIT. Consulte o arquivo ```LICENSE``` para mais detalhes.