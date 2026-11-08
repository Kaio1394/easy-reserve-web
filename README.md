# 🏛️ Easy Reserve Web — Reserva Fácil (SIGEA)

> **Interface Web Institucional** para Gestão e Agendamento de Ambientes, Salas e Recursos, inspirada na identidade visual sóbria do padrão SEI (Sistema Eletrônico de Informações).

---

## 📌 Visão Geral

O **Easy Reserve Web** é o frontend oficial do ecossistema de reservas institucionais. Criado com **React 19**, **TypeScript** e **Tailwind CSS**, o sistema oferece uma experiência visual limpa, acessível e focada em produtividade.

Destaques da interface:
- 📅 **Planner & Calendário Visual:** Visualização mensal e semanal interativa de todas as reservas do workspace.
- ⚡ **Reserva Direta por Clique:** Clique em qualquer dia ou slot no calendário para abrir o modal de pré-reserva já preenchido.
- 🤖 **Assistente Inteligente de Alocação:** Sugere a sala ideal para a reunião/aula com base na capacidade de pessoas, recursos necessários e pesos de relevância ajustados pelo próprio usuário.
- 👤 **Meu Perfil & Configurações (`MOD-07`):** Edição rápida de nome, e-mail, telefone, CPF e alteração de senha do usuário logado.
- 🏢 **Gestão de Espaços e Chaves:** Painel administrativo completo para controle de salas, equipamentos, chaveiros e permissões de usuários.

---

## 🚀 Tecnologias Utilizadas

- **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Linguagem:** TypeScript
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Gerenciamento de Estado & Autenticação:** React Context API + LocalStorage JWT
- **Containerização:** Docker + Nginx Alpine

---

## 💻 Como Executar Localmente

### Pré-Requisitos:
- **Node.js 18+** e **npm** instalados.
- Instância da API rodando localmente na porta 9011 (ou apontada para o servidor remoto).

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie ou edite o arquivo `.env`:
```env
VITE_API_URL=http://localhost:9011/api/v1
```

### 3. Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```

Acesse no navegador:
`http://localhost:5173`

---

## 🐳 Executando com Docker

Para rodar em ambiente de contêiner de produção com Nginx otimizado:

```bash
# 1. Gerar o build de produção
npm run build

# 2. Construir a imagem Docker
docker build -t easy-reserve-web:latest .

# 3. Executar o container
docker run -d --name easy-reserve-web -p 9012:80 easy-reserve-web:latest
```

---

## 🌐 Produção

- **Aplicação Web:** `https://easy-reserve.72-60-158-216.sslip.io`
- **Backend Integrado:** `https://easy-reserve-api.72-60-158-216.sslip.io/api/v1`
