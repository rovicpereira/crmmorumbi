# Integrações de IA — visão geral

O CRM vai usar duas IAs diferentes, cada uma para uma finalidade:

| Finalidade | Provedor | Status |
|---|---|---|
| Agente de vendas via WhatsApp (atender, negociar, fechar) | **Claude (Anthropic)** | Ainda não construído — depende da Fase 1 (conexão real com o WhatsApp), do catálogo, das diretrizes comerciais e das regras de entrega (já prontos) |
| Simulação de ambientes (aplicar piso/revestimento/tinta na foto do cliente) | **ChatGPT / OpenAI** (a princípio) | Conexão preparada (`src/lib/ia/openai.ts`), tela de uso ainda não construída |

## Simulação de ambientes (OpenAI)

### O que já está pronto

- Pacote `openai` instalado.
- `src/lib/ia/openai.ts`:
  - `getOpenAIClient()` — cria o cliente a partir de `OPENAI_API_KEY`.
  - `gerarSimulacaoAmbiente({ imagemAmbiente, descricaoProduto })` — recebe a foto do
    ambiente (ex: foto da sala enviada pelo cliente no WhatsApp) e uma descrição do
    produto (ex: "piso porcelanato acetinado bege claro, 60x60"), e retorna a imagem
    simulada usando o modelo `gpt-image-1` (edição de imagem com prompt, sem precisar
    de máscara manual).

### O que falta para ativar

1. **Conseguir a chave da OpenAI**: criar conta em platform.openai.com, gerar uma API
   key em platform.openai.com/api-keys, e colocar em `OPENAI_API_KEY` no `.env` (local)
   e nas variáveis do serviço `crmmorumbi` no Railway (produção).
2. **Decidir de onde vem a "descrição do produto"** que vira o prompt — provavelmente
   usar o nome/descrição já cadastrado no catálogo (`Produto.nome`), ou um campo próprio
   com uma descrição mais visual pensada para IA de imagem (cor, textura, acabamento).
   Vale considerar usar as fotos já cadastradas em `ImagemProduto` como referência visual
   adicional, já que o endpoint de edição de imagem também aceita mais de uma imagem de
   entrada em versões recentes da API.
3. **Construir a tela/fluxo de uso**: hoje não existe interface para isso. Precisa definir:
   - Onde o cliente/atendente envia a foto do ambiente (pelo WhatsApp na Fase 1, ou uma
     tela manual no CRM, parecida com a de orçamento).
   - Quais produtos das categorias Pisos e Revestimentos, Tintas e Complementos e
     Louças (Banheiro) ficam disponíveis para simulação.
   - Onde a imagem gerada fica salva (sugestão: mesmo padrão de `ImagemProduto`, guardando
     bytes no banco, ligada ao cliente/conversa em vez de ao produto).
4. **Custo**: geração/edição de imagem na OpenAI é cobrada por imagem — vale simular o
   custo esperado por atendimento antes de liberar em volume.

## Agente de vendas (Claude)

Ainda não há nenhum código específico para isso — é a peça que depende da Fase 1
(WhatsApp real) mais o catálogo, diretrizes comerciais e regras de entrega, que já
estão prontos. Quando for começar, o padrão esperado é:

- Pacote `@anthropic-ai/sdk` (ainda não instalado).
- Variável `ANTHROPIC_API_KEY` (já reservada no `.env.example`).
- O agente consulta `Produto`, `DiretrizComercial`/`DiretrizComercialTemporaria` e
  `RegraEntrega` para saber o que pode negociar sozinho, e usa `MensagemChat` para
  avisar a equipe (expedição, faturamento, caixa) antes de confirmar algo com o cliente.
