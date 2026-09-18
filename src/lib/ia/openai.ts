import OpenAI from "openai";

let cliente: OpenAI | null = null;

/**
 * Cliente da OpenAI, usado hoje só para a simulação de ambientes
 * (aplicar piso/revestimento/tinta em uma foto do cômodo do cliente).
 * O agente de vendas por IA é outro projeto, baseado em Claude (Anthropic).
 */
export function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY não configurada. Adicione a chave da OpenAI nas variáveis de ambiente antes de usar a simulação de ambientes."
    );
  }

  if (!cliente) {
    cliente = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return cliente;
}

export type SimulacaoAmbienteInput = {
  /** Foto do ambiente enviada pelo cliente (ex: foto da sala/banheiro). */
  imagemAmbiente: Buffer;
  /** Descrição do que aplicar na imagem (ex: "piso porcelanato acetinado bege claro, 60x60"). */
  descricaoProduto: string;
};

/**
 * Gera uma simulação do produto aplicado no ambiente enviado pelo cliente.
 *
 * Ainda não usado em produção — preparado para quando a tela de simulação
 * (escolher produto + foto do ambiente) for construída. Usa o endpoint de
 * edição de imagens da OpenAI (gpt-image-1): recebe a foto original e um
 * prompt descrevendo a alteração, sem precisar de uma máscara manual.
 */
export async function gerarSimulacaoAmbiente({
  imagemAmbiente,
  descricaoProduto,
}: SimulacaoAmbienteInput): Promise<Buffer> {
  const client = getOpenAIClient();

  const prompt = `Aplique de forma realista o seguinte material na área correspondente desta foto de ambiente, mantendo iluminação, perspectiva e móveis originais: ${descricaoProduto}.`;

  const resposta = await client.images.edit({
    model: "gpt-image-1",
    image: await OpenAI.toFile(imagemAmbiente, "ambiente.png", { type: "image/png" }),
    prompt,
  });

  const imagemBase64 = resposta.data?.[0]?.b64_json;

  if (!imagemBase64) {
    throw new Error("A OpenAI não retornou uma imagem para esta simulação.");
  }

  return Buffer.from(imagemBase64, "base64");
}
