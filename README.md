# CRM WhatsApp — Morumbi Materiais para Construção

Ferramenta interna para atender clientes pela WhatsApp Business Cloud API (oficial da Meta), com histórico de conversas, funil de vendas e lembretes de follow-up.

## Status atual: Fase 0 (esqueleto)

O que já funciona:
- Login com email/senha.
- Estrutura de páginas (Inbox, Funil, Clientes, Lembretes, Admin) — a maioria ainda são placeholders, cada uma será construída em uma fase seguinte (ver plano do projeto).
- Modelo de dados completo já criado no banco (clientes, conversas, mensagens, funil, lembretes).

O que **ainda não** funciona: receber/enviar mensagens de verdade pelo WhatsApp (isso é a Fase 1 em diante, e depende de você configurar a conta na Meta — ver `docs/meta-whatsapp-setup.md`).

## Pré-requisitos para rodar na sua máquina (Windows)

Nenhum destes está instalado ainda nesta máquina. Instale antes de continuar:

1. **Node.js** (versão LTS): baixe em https://nodejs.org e instale normalmente (clicando "Next" até o fim).
2. **Docker Desktop** (para rodar o banco de dados Postgres localmente, sem precisar instalar nada "no Windows" diretamente): baixe em https://www.docker.com/products/docker-desktop
   - Alternativa: se preferir não instalar Docker, você pode usar um banco Postgres gratuito de teste no Railway mesmo durante o desenvolvimento — nesse caso, pule o passo do `docker compose` abaixo e troque `DATABASE_URL` no `.env` pela string de conexão que o Railway fornecer.

Depois de instalar, feche e abra o terminal de novo para os comandos ficarem disponíveis.

## Como rodar pela primeira vez

Rode estes comandos, um de cada vez, dentro da pasta do projeto:

```bash
npm install
```

```bash
copy .env.example .env
```

Abra o arquivo `.env` que foi criado e ajuste os valores se quiser (os padrões já funcionam para rodar localmente).

Se for usar Docker para o banco de dados local:

```bash
docker compose up -d
```

Depois, crie as tabelas no banco e o usuário administrador inicial:

```bash
npm run prisma:migrate
```

```bash
npm run prisma:seed
```

O terminal vai mostrar o email e senha do administrador criado (definidos em `SEED_ADMIN_EMAIL` / `SEED_ADMIN_SENHA` no `.env`).

Por fim, suba o site:

```bash
npm run dev
```

Acesse http://localhost:3000 no navegador e entre com o email/senha do administrador.

## Comandos úteis do dia a dia

- `npm run dev` — sobe o site localmente.
- `npm run prisma:studio` — abre uma interface visual (tipo planilha) para ver e editar os dados do banco, sem precisar saber SQL.
- `npm run prisma:migrate` — aplica mudanças no modelo de dados (`prisma/schema.prisma`) no banco.

## Próximos passos

1. Configurar a conta no Meta for Developers (guia em `docs/meta-whatsapp-setup.md`) — necessário antes da Fase 1.
2. Publicar o projeto no Railway para ter uma URL pública com HTTPS (necessária para o webhook da Meta).
3. Seguir as fases descritas no plano do projeto (recebimento de mensagens, envio, multiusuário, funil, lembretes, mídia).
