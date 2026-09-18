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

// Todo <div> com mais de um filho precisa de display "flex" explícito (exigência do Satori,
// o motor que renderiza esta JSX como imagem). Por segurança, todo container abaixo declara
// display "flex", mesmo quando hoje só tem um filho — evita esse erro caso o conteúdo mude.

function Rotulo({ texto, valor }: { texto: string; valor: string | number }) {
  return (
    <div style={{ display: "flex", flexDirection: "row", gap: 4 }}>
      <div style={{ display: "flex", fontWeight: 700 }}>{texto}</div>
      <div style={{ display: "flex" }}>{String(valor)}</div>
    </div>
  );
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
        <div style={{ display: "flex", fontSize: 11, color: CORES.cinza }}>
          DOCUMENTO AUXILIAR DE VENDA — ORÇAMENTO
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 10,
            color: CORES.cinza,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
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
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: CORES.indigo, letterSpacing: 1 }}>
            MORUMBI
          </div>
          <div style={{ display: "flex", fontSize: 13, fontWeight: 600, color: CORES.azulMarinho }}>
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
          <div style={{ display: "flex" }}>Av. 30 de Junho — Presidente Médici/RO</div>
          <div style={{ display: "flex" }}>Telefone: (69) 3471-2800</div>
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
        <Rotulo texto="Orçamento nº:" valor={dados.numero} />
        <Rotulo texto="Emissão:" valor={formatarData(dados.criadoEm)} />
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
        <Rotulo texto="Cliente:" valor={dados.clienteNome} />
        {(dados.clienteTelefone || dados.clienteDocumento) && (
          <div style={{ display: "flex", flexDirection: "row", gap: 16 }}>
            {dados.clienteTelefone && <Rotulo texto="Telefone:" valor={dados.clienteTelefone} />}
            {dados.clienteDocumento && <Rotulo texto="CPF/CNPJ:" valor={dados.clienteDocumento} />}
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
        <div style={{ display: "flex", width: 55 }}>Código</div>
        <div style={{ display: "flex", width: detalhado ? 300 : 470 }}>Descrição</div>
        <div style={{ display: "flex", width: 40 }}>UN</div>
        {detalhado ? (
          <div style={{ display: "flex", flexDirection: "row" }}>
            <div style={{ display: "flex", width: 45, justifyContent: "flex-end" }}>Qtde</div>
            <div style={{ display: "flex", width: 75, justifyContent: "flex-end" }}>Vlr. Unit.</div>
            <div style={{ display: "flex", width: 85, justifyContent: "flex-end" }}>Vlr. Un. Desc.</div>
            <div style={{ display: "flex", width: 80, justifyContent: "flex-end" }}>Vlr. Total</div>
          </div>
        ) : (
          <div style={{ display: "flex", width: 90, justifyContent: "flex-end" }}>Quantidade</div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
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
            <div style={{ display: "flex", width: 55 }}>{item.sku}</div>
            <div style={{ display: "flex", width: detalhado ? 300 : 470 }}>{item.nome}</div>
            <div style={{ display: "flex", width: 40 }}>{item.unidade}</div>
            {detalhado ? (
              <div style={{ display: "flex", flexDirection: "row" }}>
                <div style={{ display: "flex", width: 45, justifyContent: "flex-end" }}>
                  {String(item.quantidade)}
                </div>
                <div style={{ display: "flex", width: 75, justifyContent: "flex-end" }}>
                  {formatarMoeda(item.valorUnitario)}
                </div>
                <div style={{ display: "flex", width: 85, justifyContent: "flex-end" }}>
                  {formatarMoeda(item.valorUnitarioDesconto)}
                </div>
                <div style={{ display: "flex", width: 80, justifyContent: "flex-end" }}>
                  {formatarMoeda(item.valorUnitarioDesconto * item.quantidade)}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", width: 90, justifyContent: "flex-end" }}>
                {String(item.quantidade)}
              </div>
            )}
          </div>
        ))}
      </div>

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
        <Rotulo texto="Volumes:" valor={String(volumes)} />
        <Rotulo texto="Valor Total Produtos:" valor={formatarMoeda(valorTotalProdutos)} />
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
        <Rotulo texto="(+) Taxa de Entrega:" valor={formatarMoeda(dados.taxaEntrega)} />
        <Rotulo texto="(+) Taxa Financeira:" valor={formatarMoeda(dados.taxaFinanceira)} />
        <Rotulo texto="(-) Desconto:" valor={formatarMoeda(descontoTotal)} />
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
          <div style={{ display: "flex" }}>(=) Total Orçamento:</div>
          <div style={{ display: "flex" }}>{`R$ ${formatarMoeda(totalOrcamento)}`}</div>
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
          {dados.formaPagamento && <Rotulo texto="Forma de Pagamento:" valor={dados.formaPagamento} />}
          {dados.parcelamento && <Rotulo texto="Parcelamento:" valor={dados.parcelamento} />}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", marginTop: 14, fontSize: 11, gap: 3 }}>
        {dados.vendedorNome && <Rotulo texto="Vendedor:" valor={dados.vendedorNome} />}
        <div style={{ display: "flex", color: CORES.cinza }}>Orçamento válido por 30 dias</div>
        {dados.observacoes && <Rotulo texto="Obs:" valor={dados.observacoes} />}
      </div>
    </div>
  );
}
