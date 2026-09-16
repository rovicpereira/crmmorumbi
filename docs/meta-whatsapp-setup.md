# Configurando o WhatsApp Business Cloud API (Meta)

Guia passo a passo para conseguir as credenciais necessárias para o CRM conversar com o WhatsApp da loja. Isso é feito uma vez (com alguns ajustes quando o número final da loja for verificado).

## O que você vai conseguir ao final

Quatro valores para colocar no arquivo `.env` do projeto:

- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_APP_SECRET`

E você mesma escolhe um quinto valor:

- `WHATSAPP_VERIFY_TOKEN` — uma frase secreta inventada por você (ex.: `morumbi-webhook-2026`), só para o CRM confirmar para a Meta que o webhook é legítimo.

## Passo 1 — Criar conta no Meta for Developers

1. Acesse https://developers.facebook.com e entre com uma conta do Facebook (recomendo criar uma conta específica da empresa, não a pessoal, se ainda não tiver uma).
2. Clique em "Meus Apps" → "Criar App".
3. Escolha o tipo de app **"Empresa"** (Business).
4. Dê um nome ao app, ex.: "Morumbi CRM".

## Passo 2 — Adicionar o produto WhatsApp

1. Dentro do app criado, na lista de produtos, adicione **WhatsApp**.
2. A Meta cria automaticamente uma conta do WhatsApp Business (WABA) de teste e **um número de telefone de teste**, que você pode usar para testar sem precisar do número real da loja ainda.
3. Na tela do produto WhatsApp → "Introdução" (Getting Started), você já vê:
   - **Phone number ID** → é o `WHATSAPP_PHONE_NUMBER_ID`.
   - **WhatsApp Business Account ID** → é o `WHATSAPP_BUSINESS_ACCOUNT_ID`.
   - Um **token de acesso temporário** (válido por 24h) — bom só para teste inicial, não usar em produção.

## Passo 3 — Gerar um Access Token permanente

O token temporário do Passo 2 expira em 24h. Para o CRM funcionar de verdade, é preciso um token de longa duração (ou permanente):

1. Vá em "Configurações do App" → "Básico" e copie o **App Secret** → é o `WHATSAPP_APP_SECRET`.
2. Crie um **usuário de sistema** (System User) em Meta Business Suite → Configurações do Negócio → Usuários → Usuários do sistema:
   - Crie um usuário do tipo "Admin".
   - Atribua a ele o app do WhatsApp e a permissão `whatsapp_business_messaging` (e `whatsapp_business_management`).
   - Gere um token para esse usuário do sistema, marcando as mesmas permissões, sem data de expiração.
3. Esse token gerado é o `WHATSAPP_ACCESS_TOKEN` definitivo.

*(A Meta às vezes reorganiza esses menus — se os nomes estiverem um pouco diferentes, procure por "Usuários do sistema" ou "System Users" dentro de business.facebook.com/settings.)*

## Passo 4 — Testar o envio com o número de teste

Antes de mexer no número real da loja, teste com o número de teste da Meta:

1. Na tela "Introdução" do produto WhatsApp, adicione seu próprio celular pessoal como "número de destino de teste" (ele te manda um código de verificação por WhatsApp).
2. Use o botão de "Enviar mensagem de teste" da própria interface da Meta para confirmar que as credenciais funcionam antes de integrar com o CRM.

## Passo 5 — Configurar o Webhook (feito depois que o CRM estiver publicado)

Isso só é feito depois que o CRM estiver rodando com uma URL pública (ex. no Railway), pois a Meta exige uma URL HTTPS real para o webhook — não funciona com `localhost`.

1. No produto WhatsApp → "Configuração" → "Webhooks", clique em "Editar".
2. **URL de retorno de chamada**: `https://SEU-DOMINIO-NO-RAILWAY/api/webhooks/whatsapp`
3. **Token de verificação**: o mesmo valor que você colocou em `WHATSAPP_VERIFY_TOKEN` no `.env` do projeto publicado.
4. Clique em "Verificar e salvar".
5. Na lista de campos do webhook, marque a assinatura de **`messages`** (é o que importa para receber mensagens e status de entrega).

## Passo 6 — Verificar o número real da loja (quando for para produção)

Enquanto estiver testando, use o número de teste da Meta (só funciona com números que você cadastrou manualmente como destinatários de teste). Quando o CRM estiver pronto para uso real:

1. Em "Números de telefone" do produto WhatsApp, adicione o número real da loja.
2. A Meta envia um código de verificação para esse número (por SMS ou ligação) — informe o código na interface.
3. Depois de verificado, o `WHATSAPP_PHONE_NUMBER_ID` do número real substitui o do número de teste no `.env` de produção.
4. **Atenção**: se esse número já é usado no WhatsApp normal (app do celular) da loja, ele precisa ser "migrado" para a Cloud API — isso desconecta o app comum do WhatsApp Business nesse número. Se a loja quiser manter o app comum funcionando em paralelo em outro aparelho, é preciso um número de telefone diferente para a Cloud API.

## Passo 7 — Criar templates de mensagem (necessário para responder após 24h)

A Cloud API só permite mandar texto livre nas primeiras 24h depois que o cliente mandar uma mensagem. Depois disso, é preciso usar um **template pré-aprovado** pela Meta (ex.: "Olá {{1}}, seu orçamento na Morumbi está pronto, posso te ajudar?").

1. Em Meta Business Suite → "Modelos de mensagem" (Message Templates), crie os templates que a loja mais vai precisar (ex.: retomar contato, avisar que o pedido chegou).
2. A aprovação da Meta pode levar de minutos a 1-2 dias.
3. Depois de aprovado, cadastre o nome do template na tabela `TemplateWhatsapp` do CRM (via Prisma Studio, ou pela tela de administração quando ela existir) para poder usá-lo no envio.

## Custos

- Mensagens dentro da janela de 24h iniciada pelo cliente: **gratuitas** (dentro de uma cota mensal generosa para o volume de uma loja pequena).
- Mensagens de template iniciadas pela empresa fora da janela: cobradas por mensagem, valor varia por país/categoria — consulte a página oficial de preços do WhatsApp Business Platform antes de usar templates em volume.
