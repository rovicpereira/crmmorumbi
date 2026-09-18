import OpenAI from "openai";
import { db } from "@/lib/db";

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

// Só simulamos produtos dessas categorias — nunca gastamos uma chamada da
// OpenAI para algo que não vendemos. O nome precisa bater exatamente com o
// cadastrado em CategoriaProduto (ver prisma/seed.ts).
const CATEGORIAS_SIMULAVEIS = ["Pisos e Revestimentos", "Tintas e Complementos"] as const;

type CategoriaSimulavel = (typeof CATEGORIAS_SIMULAVEIS)[number];

function montarPrompt(categoria: CategoriaSimulavel, nomeProduto: string): string {
  const superficie = categoria === "Tintas e Complementos" ? "a cor das paredes" : "o piso/chão";
  const materialTermo = categoria === "Tintas e Complementos" ? "a tinta" : "o material de piso";

  return [
    `Substitua APENAS ${superficie} desta foto de ambiente por ${materialTermo}: ${nomeProduto}.`,
    "Mantenha exatamente iguais e sem nenhuma alteração: todos os outros elementos da cena — móveis, objetos, pessoas, paredes (quando não for o alvo), teto, iluminação, sombras, perspectiva e enquadramento.",
    "Não adicione nenhum elemento novo. Não remova nenhum elemento existente. Não altere nada além da superfície indicada.",
  ].join(" ");
}

export type SimulacaoAmbienteInput = {
  /** Foto do ambiente enviada pelo cliente (ex: foto da sala/banheiro). */
  imagemAmbiente: Buffer;
  /** ID de um Produto já cadastrado no catálogo (categoria Pisos e Revestimentos ou Tintas e Complementos). */
  produtoId: string;
};

/**
 * Gera uma simulação de um produto do catálogo (piso/revestimento ou tinta)
 * aplicado no ambiente enviado pelo cliente.
 *
 * Restrito de propósito: só aceita produtos das categorias simuláveis, para
 * nunca gastar chamadas da OpenAI com algo fora do nosso mix. O prompt pede
 * explicitamente para não alterar mais nada na imagem além da superfície
 * (piso ou parede) — sem adicionar nem remover elementos.
 *
 * Ainda não usado em produção — preparado para quando a tela de simulação
 * (escolher produto + foto do ambiente) for construída.
 */
export async function gerarSimulacaoAmbiente({
  imagemAmbiente,
  produtoId,
}: SimulacaoAmbienteInput): Promise<Buffer> {
  const produto = await db.produto.findUnique({
    where: { id: produtoId },
    include: { categoria: true },
  });

  if (!produto || !produto.ativo) {
    throw new Error("Produto não encontrado ou inativo no catálogo.");
  }

  const nomeCategoria = produto.categoria?.nome;

  if (!nomeCategoria || !CATEGORIAS_SIMULAVEIS.includes(nomeCategoria as CategoriaSimulavel)) {
    throw new Error(
      `Simulação disponível apenas para produtos das categorias ${CATEGORIAS_SIMULAVEIS.join(
        " e "
      )}. "${produto.nome}" não está nesse grupo.`
    );
  }

  const client = getOpenAIClient();
  const prompt = montarPrompt(nomeCategoria as CategoriaSimulavel, produto.nome);

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
