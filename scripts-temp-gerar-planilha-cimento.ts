import * as XLSX from "xlsx";

const dados = [
  ["SKU", "Descrição", "Categoria", "Preço", "Unidade", "Estoque"],
  ["1445", "CIMENTO ITAÚ 50KG", "BÁSCIO", 64.0, "SC", 720],
];

const planilha = XLSX.utils.book_new();
const aba = XLSX.utils.aoa_to_sheet(dados);
XLSX.utils.book_append_sheet(planilha, aba, "Produtos");
XLSX.writeFile(planilha, "C:\\Users\\rtm_t\\Downloads\\teste-cimento.xlsx");
console.log("Planilha gerada em Downloads\\teste-cimento.xlsx");
