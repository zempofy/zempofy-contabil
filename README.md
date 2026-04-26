# 📊 Controle Contábil

Sistema web para gerenciamento de extratos e fechamentos contábeis por escritório.

---

## Estrutura do projeto

```
contabil-app/
├── backend/        → Node.js + Express + MongoDB
└── frontend/       → React + Vite
```

---

## 1. Pré-requisitos (instalar uma vez)

- [Node.js 20+](https://nodejs.org) — baixe o instalador LTS
- Conta gratuita no [MongoDB Atlas](https://cloud.mongodb.com)
- Conta gratuita no [Render](https://render.com) (para o backend)
- Conta gratuita no [Vercel](https://vercel.com) (para o frontend)

---

## 2. Configurar o MongoDB Atlas

1. Crie uma conta em cloud.mongodb.com
2. Crie um cluster gratuito (M0)
3. Em **Database Access**: crie um usuário com senha
4. Em **Network Access**: adicione `0.0.0.0/0` (libera qualquer IP)
5. Em **Connect > Drivers**: copie a string de conexão, ficará assim:
   ```
   mongodb+srv://USUARIO:SENHA@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Troque `?` por `/contabil?` para definir o banco:
   ```
   mongodb+srv://USUARIO:SENHA@cluster0.xxxxx.mongodb.net/contabil?retryWrites=true&w=majority
   ```

---

## 3. Rodar localmente

### Backend

```bash
cd backend
cp .env.example .env
# Edite o .env com sua MONGODB_URI e um JWT_SECRET qualquer
npm install
npm run dev
# Rodando em http://localhost:3001
```

### Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL já está como /api (proxy do Vite cuida disso localmente)
npm install
npm run dev
# Rodando em http://localhost:5173
```

---

## 4. Deploy do Backend no Render

1. Suba o projeto para um repositório no GitHub
2. Entre em render.com → **New Web Service**
3. Conecte o repositório, configurações:
   - **Root directory**: `backend`
   - **Build command**: `npm install`
   - **Start command**: `npm start`
   - **Environment**: Node
4. Em **Environment Variables**, adicione:
   ```
   MONGODB_URI = (sua string do Atlas)
   JWT_SECRET  = (qualquer texto longo e aleatório, ex: minha-chave-super-secreta-2026)
   NODE_ENV    = production
   FRONTEND_URL = https://SEU-APP.vercel.app
   ```
5. Clique em **Deploy** — Render dará uma URL tipo `https://contabil-backend.onrender.com`

---

## 5. Deploy do Frontend no Vercel

1. Entre em vercel.com → **New Project**
2. Conecte o repositório, configurações:
   - **Root directory**: `frontend`
   - **Framework**: Vite
3. Em **Environment Variables**, adicione:
   ```
   VITE_API_URL = https://contabil-backend.onrender.com/api
   ```
4. Clique em **Deploy** — Vercel dará uma URL tipo `https://contabil-app.vercel.app`
5. Volte no Render e atualize `FRONTEND_URL` com a URL do Vercel

---

## 6. Primeiro uso

1. Acesse o link do Vercel
2. Clique em **Cadastre-se** e crie sua conta
3. Crie seu escritório (ex: "Silva Contabilidade")
4. Anote o **slug** gerado (ex: `silva-contabilidade`) — é o código para convidar a equipe
5. Comece a adicionar empresas!

---

## Convidar membros da equipe

Cada membro deve:
1. Acessar o sistema e criar uma conta
2. Na tela de escritório, clicar em **Entrar em um**
3. Digitar o slug do escritório (você fornece esse código)
4. Pronto — todos veem as mesmas empresas e dados

---

## Variáveis de ambiente resumidas

| Arquivo | Variável | Descrição |
|---|---|---|
| `backend/.env` | `MONGODB_URI` | String de conexão do MongoDB Atlas |
| `backend/.env` | `JWT_SECRET` | Chave secreta para autenticação |
| `backend/.env` | `FRONTEND_URL` | URL do frontend (para CORS) |
| `frontend/.env` | `VITE_API_URL` | URL base da API do backend |
