const CORES = {
  indigo: "#1800AB",
  azulMarinho: "#002E9F",
  azulClaroFundo: "#F2F6FF",
  tinta: "#14161C",
  corpo: "#3D434F",
  cinza: "#999999",
  borda: "#D8DBE2",
};

export type ItemOrcamentoImagem = {
  sku: string;
  nome: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorUnitarioDesconto: number;
};

export type DadosOrcamentoImagem = {
  numero: number;
  criadoEm: Date;
  clienteNome: string;
  clienteTelefone?: string | null;
  clienteDocumento?: string | null;
  vendedorNome?: string | null;
  taxaEntrega: number;
  taxaFinanceira: number;
  formaPagamento?: string | null;
  parcelamento?: string | null;
  observacoes?: string | null;
  itens: ItemOrcamentoImagem[];
};

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarData(data: Date): string {
  return data.toLocaleDateString("pt-BR");
}

const LARGURA = 800;

export function calcularAlturaImagem(quantidadeItens: number, formato: "simples" | "detalhado"): number {
  const alturaBase = formato === "detalhado" ? 470 : 450;
  const alturaPorLinha = formato === "detalhado" ? 26 : 24;
  return alturaBase + quantidadeItens * alturaPorLinha;
}

export function montarElementoOrcamento(dados: DadosOrcamentoImagem, formato: "simples" | "detalhado") {
  const valorTotalProdutos = dados.itens.reduce((soma, item) => soma + item.valorUnitario * item.quantidade, 0);
  const descontoTotal = dados.itens.reduce(
    (soma, item) => soma + (item.valorUnitario - item.valorUnitarioDesconto) * item.quantidade,
    0
  );
  const volumes = dados.itens.reduce((soma, item) => soma + item.quantidade, 0);
  const totalOrcamento = valorTotalProdutos - descontoTotal + dados.taxaEntrega + dados.taxaFinanceira;

  const detalhado = formato === "detalhado";

  return (
    <div
      style={{
        width: LARGURA,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        fontFamily: "sans-serif",
        padding: "32px 40px",
        color: CORES.corpo,
        fontSize: 13,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingBottom: 12,
          borderBottom: `1px solid ${CORES.borda}`,
          gap: 3,
        }}
      >
        <div style={{ fontSize: 11, color: CORES.cinza }}>DOCUMENTO AUXILIAR DE VENDA — ORÇAMENTO</div>
        <div style={{ fontSize: 10, color: CORES.cinza, fontWeight: 700, textAlign: "center" }}>
          NÃO É DOCUMENTO FISCAL — NÃO É VÁLIDO COMO RECIBO E NÃO COMPROVA PAGAMENTO
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 18,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: CORES.indigo, letterSpacing: 1 }}>MORUMBI</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: CORES.azulMarinho }}>
            MATERIAIS PARA CONSTRUÇÃO
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            fontSize: 11,
            color: CORES.corpo,
            gap: 2,
          }}
        >
          <div>Av. 30 de Junho — Presidente Médici/RO</div>
          <div>Telefone: (69) 3471-2800</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          fontSize: 12,
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", gap: 4 }}>
          <div style={{ fontWeight: 700 }}>Orçamento nº:</div>
          <div>{dados.numero}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "row", gap: 4 }}>
          <div style={{ fontWeight: 700 }}>Emissão:</div>
          <div>{formatarData(dados.criadoEm)}</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          fontSize: 12,
          paddingBottom: 10,
          marginBottom: 12,
          borderBottom: `1px solid ${CORES.borda}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", gap: 4 }}>
          <div style={{ fontWeight: 700 }}>Cliente:</div>
          <div>{dados.clienteNome}</div>
        </div>
        {(dados.clienteTelefone || dados.clienteDocumento) && (
          <div style={{ display: "flex", flexDirection: "row", gap: 16 }}>
            {dados.clienteTelefone && (
              <div style={{ display: "flex", flexDirection: "row", gap: 4 }}>
                <div style={{ fontWeight: 700 }}>Telefone:</div>
                <div>{dados.clienteTelefone}</div>
              </div>
            )}
            {dados.clienteDocumento && (
              <div style={{ display: "flex", flexDirection: "row", gap: 4 }}>
                <div style={{ fontWeight: 700 }}>CPF/CNPJ:</div>
                <div>{dados.clienteDocumento}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          backgroundColor: CORES.azulMarinho,
          color: "#ffffff",
          fontSize: 11,
          fontWeight: 700,
          padding: "6px 4px",
        }}
      >
        <div style={{ width: 55 }}>Código</div>
        <div style={{ width: detalhado ? 300 : 470 }}>Descrição</div>
        <div style={{ width: 40 }}>UN</div>
        {detalhado ? (
          <>
            <div style={{ width: 45, textAlign: "right" }}>Qtde</div>
            <div style={{ width: 75, textAlign: "right" }}>Vlr. Unit.</div>
            <div style={{ width: 85, textAlign: "right" }}>Vlr. Un. Desc.</div>
            <div style={{ width: 80, textAlign: "right" }}>Vlr. Total</div>
          </>
        ) : (
          <div style={{ width: 90, textAlign: "right" }}>Quantidade</div>
        )}
      </div>

      {dados.itens.map((item, indice) => (
        <div
          key={indice}
          style={{
            display: "flex",
            flexDirection: "row",
            fontSize: 11,
            padding: "5px 4px",
            borderBottom: `1px solid #EEF0F4`,
            backgroundColor: indice % 2 === 0 ? "#ffffff" : CORES.azulClaroFundo,
          }}
        >
          <div style={{ width: 55 }}>{item.sku}</div>
          <div style={{ width: detalhado ? 300 : 470 }}>{item.nome}</div>
          <div style={{ width: 40 }}>{item.unidade}</div>
          {detalhado ? (
            <>
              <div style={{ width: 45, textAlign: "right" }}>{item.quantidade}</div>
              <div style={{ width: 75, textAlign: "right" }}>{formatarMoeda(item.valorUnitario)}</div>
              <div style={{ width: 85, textAlign: "right" }}>
                {formatarMoeda(item.valorUnitarioDesconto)}
              </div>
              <div style={{ width: 80, textAlign: "right" }}>
                {formatarMoeda(item.valorUnitarioDesconto * item.quantidade)}
              </div>
            </>
          ) : (
            <div style={{ width: 90, textAlign: "right" }}>{item.quantidade}</div>
          )}
        </div>
      ))}

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          fontSize: 12,
          marginTop: 12,
          paddingTop: 8,
          borderTop: `1px solid ${CORES.borda}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", gap: 4 }}>
          <div style={{ fontWeight: 700 }}>Volumes:</div>
          <div>{volumes}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "row", gap: 4 }}>
          <div style={{ fontWeight: 700 }}>Valor Total Produtos:</div>
          <div>{formatarMoeda(valorTotalProdutos)}</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          fontSize: 12,
          marginTop: 6,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", gap: 4 }}>
          <div style={{ fontWeight: 700 }}>(+) Taxa de Entrega:</div>
          <div>{formatarMoeda(dados.taxaEntrega)}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "row", gap: 4 }}>
          <div style={{ fontWeight: 700 }}>(+) Taxa Financeira:</div>
          <div>{formatarMoeda(dados.taxaFinanceira)}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "row", gap: 4 }}>
          <div style={{ fontWeight: 700 }}>(-) Desconto:</div>
          <div>{formatarMoeda(descontoTotal)}</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          fontSize: 16,
          fontWeight: 800,
          color: CORES.indigo,
          marginTop: 10,
          paddingTop: 8,
          borderTop: `2px solid ${CORES.indigo}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", gap: 6 }}>
          <div>(=) Total Orçamento:</div>
          <div>{`R$ ${formatarMoeda(totalOrcamento)}`}</div>
        </div>
      </div>

      {(dados.formaPagamento || dados.parcelamento) && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 24,
            fontSize: 11,
            marginTop: 14,
            color: CORES.corpo,
          }}
        >
          {dados.formaPagamento && (
            <div style={{ display: "flex", flexDirection: "row", gap: 4 }}>
              <div style={{ fontWeight: 700 }}>Forma de Pagamento:</div>
              <div>{dados.formaPagamento}</div>
            </div>
          )}
          {dados.parcelamento && (
            <div style={{ display: "flex", flexDirection: "row", gap: 4 }}>
              <div style={{ fontWeight: 700 }}>Parcelamento:</div>
              <div>{dados.parcelamento}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", marginTop: 14, fontSize: 11, gap: 3 }}>
        {dados.vendedorNome && (
          <div style={{ display: "flex", flexDirection: "row", gap: 4 }}>
            <div style={{ fontWeight: 700 }}>Vendedor:</div>
            <div>{dados.vendedorNome}</div>
          </div>
        )}
        <div style={{ color: CORES.cinza }}>Orçamento válido por 30 dias</div>
        {dados.observacoes && (
          <div style={{ display: "flex", flexDirection: "row", gap: 4 }}>
            <div style={{ fontWeight: 700 }}>Obs:</div>
            <div>{dados.observacoes}</div>
          </div>
        )}
      </div>
    </div>
  );
}
