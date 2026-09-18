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
  - `gerarSimulacaoAmbiente({ imagemAmbiente, produtoId })` — recebe a foto do ambiente
    (ex: foto da sala enviada pelo cliente no WhatsApp) e o **ID de um produto já
    cadastrado no catálogo**, e retorna a imagem simulada usando o modelo `gpt-image-1`
    (edição de imagem com prompt, sem precisar de máscara manual).

### Restrições já aplicadas (de propósito, por decisão da Victória)

- **Só aceita produtos das categorias `Pisos e Revestimentos` e `Tintas e Complementos`**
  — qualquer outro produto é rejeitado *antes* de chamar a OpenAI, pra nunca gastar
  tokens com algo fora do mix da loja. Testado com um produto de Ferragens: rejeitado
  corretamente com uma mensagem clara.
- **O prompt instrui explicitamente a não alterar mais nada na imagem** além da
  superfície-alvo (piso ou parede da tinta) — sem adicionar ou remover móveis, objetos,
  pessoas, ou mudar iluminação/perspectiva. Isso ainda depende do modelo da OpenAI
  seguir a instrução corretamente; vale validar visualmente os primeiros resultados
  reais antes de liberar para uso com clientes.

### O que falta para ativar

1. **Conseguir a chave da OpenAI**: criar conta em platform.openai.com, gerar uma API
   key em platform.openai.com/api-keys, e colocar em `OPENAI_API_KEY` no `.env` (local)
   e nas variáveis do serviço `crmmorumbi` no Railway (produção).
2. **Construir a tela/fluxo de uso**: hoje não existe interface para isso. Precisa definir:
   - Onde o cliente/atendente envia a foto do ambiente (pelo WhatsApp na Fase 1, ou uma
     tela manual no CRM, parecida com a de orçamento).
   - Um seletor de produto que já filtra só pelas categorias simuláveis.
   - Onde a imagem gerada fica salva (sugestão: mesmo padrão de `ImagemProduto`, guardando
     bytes no banco, ligada ao cliente/conversa em vez de ao produto).
3. **Custo**: geração/edição de imagem na OpenAI é cobrada por imagem — vale simular o
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
