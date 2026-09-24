#  Frontend-Parahybaja

PWA em **React + TypeScript + Vite + Tailwind CSS** para a equipe acompanhar meta,
presença, calendário e histórico das vendas de água aos sábados.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- vite-plugin-pwa

---

## 1. Pré-requisitos

- [Node.js 18+](https://nodejs.org/) (recomendado: LTS mais recente)
- O [backend](#) rodando (localmente em `http://localhost:8080` ou publicado em outro endereço)

Confirme a instalação no terminal:

```bash
node -version
npm -version
```

## 2. Clonar e instalar

```bash
git clone <url-deste-repositorio>
cd <pasta-do-repositorio>
npm install
```

## 4. Rodar em desenvolvimento

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`. Faça login com o usuário administrador padrão
criado pelo backend na primeira execução:

```
E-mail: admin@vendaagua.com
Senha:  admin123
```


## Perfis de usuário

- **Administrador**: gerencia membros, meta semanal, taxa de ausência, marca datas
  no calendário, marca presença/ausência da equipe, lança fechamento de caixa,
  aportes e gastos.
- **Membro**: acompanha o dashboard, vê o calendário e o histórico, e justifica a
  própria ausência quando necessário.

## Estrutura de pastas

```
src/
  api/         -> cliente axios e chamadas à API
  components/  -> componentes reutilizáveis (Navbar, Card, ProgressBar...)
  context/     -> autenticação (JWT em localStorage)
  pages/       -> telas (Dashboard, Presença, Calendário, Histórico, Admin)
  types/       -> tipos TypeScript compartilhados
```
