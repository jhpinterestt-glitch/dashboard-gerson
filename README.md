# Gerson Gomes Advocacia — Sistema de Gestão Jurídica

**Gerson Gomes Advocacia** é um sistema de **Gestão Jurídica e Financeira** desenvolvido para uso interno e controle de processos, fluxo de caixa, prazos e agenda — tudo em uma interface minimalista, sofisticada e otimizada para uso desktop.

> Desenhado para produtividade: clareza visual, dados sempre atualizados e relatórios prontos em um clique.

---

## ✨ Principais Funcionalidades

- 📊 **Dashboard Executivo** com métricas em tempo real (Honorários do mês, Saldo em Conta, Processos Ativos, Prazos Próximos)
- 📁 **Gestão de Processos** (CRUD completo com cliente, número, tribunal e valor da causa)
- 💰 **Fluxo de Caixa** (receitas e despesas categorizadas)
- 📅 **Agenda Dinâmica** com calendário interativo e marcadores de eventos
- ⚠️ **Prazos Urgentes** filtrados automaticamente para os próximos 5 dias
- 🔎 **Busca em tempo real** no feed de atividades
- 📤 **Exportação para Excel (.xlsx)** com 3 abas (Processos, Financeiro, Prazos)

---

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado em sua máquina:

- **[Node.js](https://nodejs.org/)** versão **18 ou superior**
- **npm** (já incluso com o Node.js) ou **bun**
- **[Git](https://git-scm.com/)** (opcional, recomendado para clonar o repositório)
- Editor de código — recomendamos o **[Visual Studio Code](https://code.visualstudio.com/)**

Para verificar sua versão do Node.js:

```bash
node --version
```

---

## 🚀 Instalação no VS Code (Passo a Passo)

### 1. Obter o código-fonte

**Opção A — Clonar via Git** (recomendado):

```bash
git clone <URL-DO-REPOSITORIO>
cd dashboardaa
```

**Opção B — Download manual:**

1. Baixe o arquivo `.zip` do projeto
2. Extraia em uma pasta de sua preferência
3. Abra a pasta no VS Code (`File → Open Folder...`)

### 2. Abrir o terminal integrado

No VS Code, abra o terminal com:

- **Windows/Linux:** `Ctrl + '`
- **Mac:** `Cmd + '`

### 3. Instalar as dependências

```bash
npm install
```

> Esse comando baixa todos os pacotes necessários (React, Vite, Tailwind, etc.) na pasta `node_modules`. Pode levar de 1 a 3 minutos.

---

## ▶️ Como Rodar o Projeto

### Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

### Abrir no navegador

Após iniciar, o terminal exibirá uma mensagem semelhante a:

```
  VITE v5.x.x  ready in 432 ms

  ➜  Local:   http://localhost:5173/
```

Acesse o endereço:

👉 **[http://localhost:5173](http://localhost:5173)**

A aplicação será carregada automaticamente. Qualquer alteração no código será refletida em tempo real (Hot Reload).

### Outros comandos úteis

```bash
npm run build      # Gera a versão de produção em /dist
npm run preview    # Pré-visualiza o build de produção localmente
npm run lint       # Executa o linter para verificar a qualidade do código
```

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Função |
|------------|--------|
| **[React 18](https://react.dev/)** | Biblioteca de interface |
| **[Vite 5](https://vitejs.dev/)** | Bundler e servidor de desenvolvimento |
| **[TypeScript](https://www.typescriptlang.org/)** | Tipagem estática |
| **[Tailwind CSS](https://tailwindcss.com/)** | Estilização utilitária com design system semântico |
| **[Lucide React](https://lucide.dev/)** | Conjunto de ícones |
| **[shadcn/ui](https://ui.shadcn.com/)** | Componentes acessíveis e customizáveis |
| **[date-fns](https://date-fns.org/)** | Manipulação de datas |
| **[Recharts](https://recharts.org/)** | Gráficos do dashboard |
| **[xlsx](https://www.npmjs.com/package/xlsx)** | Exportação de relatórios em Excel |

---

## 💾 Notas de Persistência

> ⚠️ **Importante:** O projeto utiliza o **LocalStorage** do navegador para persistir os dados.

Isso significa que:

- ✅ Os dados (processos, lançamentos financeiros, prazos) ficam salvos **localmente no navegador do usuário**
- ✅ Eles **persistem** entre fechamentos do navegador e reinicializações do computador
- ❌ Os dados **não são sincronizados** entre dispositivos ou navegadores diferentes
- ❌ Limpar o cache/dados do navegador **apaga todas as informações cadastradas**

### 🔐 Recomendação

Use o botão **"Exportar Relatório"** no cabeçalho regularmente para gerar um backup `.xlsx` de todos os seus dados. Esse arquivo serve como cópia de segurança e pode ser usado para auditoria contábil.

Caso precise sincronizar os dados na nuvem entre múltiplos dispositivos, o projeto pode ser integrado a um banco de dados em nuvem.

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── dashboard/       # Cards, gráficos, prazos, atividades
│   ├── ui/              # Componentes shadcn (Button, Dialog, etc.)
│   ├── AppLayout.tsx    # Shell principal (sidebar + topbar)
│   ├── AppSidebar.tsx   # Navegação lateral
│   └── TopBar.tsx       # Barra superior (busca + exportação)
├── lib/
│   ├── store.ts         # Camada de persistência LocalStorage
│   └── exportExcel.ts   # Geração de relatórios .xlsx
├── pages/
│   ├── Dashboard.tsx    # Visão geral
│   ├── Processos.tsx    # CRUD de processos
│   ├── Financeiro.tsx   # Fluxo de caixa
│   └── Agenda.tsx       # Calendário e prazos
└── index.css            # Tokens de design (cores, fontes)
```

---

## 🎨 Identidade Visual

- **Paleta:** Tons sóbrios (índigo profundo + dourado champanhe)
- **Tipografia:** Serif elegante para títulos, sans-serif refinada para corpo
- **Filosofia:** Minimalismo sofisticado, focado em clareza e produtividade

---

## 📝 Licença

Projeto privado — © Gerson Gomes Advocacia.

---

**Pronto!** Em menos de 5 minutos você terá o sistema rodando em sua máquina. 🚀
