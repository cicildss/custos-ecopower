import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

type SeedData = {
  sb1: Record<string, unknown>[];
  sb2: Record<string, unknown>[];
  sd1: Record<string, unknown>[];
  sa1: Record<string, unknown>[];
  sa2: Record<string, unknown>[];
};

const toDate = (value: unknown) => {
  if (!value || typeof value !== "string") return null;
  return new Date(`${value}T00:00:00.000Z`);
};

const normalizeDates = (row: Record<string, unknown>, fields: string[]) =>
  Object.fromEntries(Object.entries(row).map(([key, value]) => [key, fields.includes(key) ? toDate(value) : value]));

const mapKeys = (row: Record<string, unknown>, map: Record<string, string>, dateFields: string[] = []) => {
  const normalized = normalizeDates(row, dateFields);
  return Object.fromEntries(Object.entries(normalized).map(([key, value]) => [map[key] ?? key, value]));
};

const sb1Map = {
  b1_filial: "b1Filial",
  b1_cod: "b1Cod",
  b1_desc: "b1Desc",
  b1_desc_nf: "b1DescNf",
  b1_um: "b1Um",
  b1_tipo: "b1Tipo",
  b1_grupo: "b1Grupo",
  b1_posipi: "b1Posipi",
  b1_local_pad: "b1LocalPad",
  b1_peso: "b1Peso",
  b1_pesbru: "b1Pesbru",
  b1_dtcad: "b1Dtcad",
  b1_aliq_icms: "b1AliqIcms",
  b1_aliq_ipi: "b1AliqIpi",
  b1_preco_venda: "b1PrecoVenda",
  b1_ult_preco: "b1UltPreco",
  b1_ult_compra: "b1UltCompra",
};

const sb2Map = {
  b2_filial: "b2Filial",
  b2_cod: "b2Cod",
  b2_local: "b2Local",
  b2_qatu: "b2Qatu",
  b2_cm1: "b2Cm1",
  b2_descricao: "b2Descricao",
};

const sd1Map = {
  d1_filial: "d1Filial",
  d1_item: "d1Item",
  d1_cod: "d1Cod",
  d1_um: "d1Um",
  d1_quant: "d1Quant",
  d1_local: "d1Local",
  d1_vunit: "d1Vunit",
  d1_custo: "d1Custo",
  d1_total: "d1Total",
  d1_fornece: "d1Fornece",
  d1_cliente: "d1Cliente",
  d1_loja: "d1Loja",
  d1_doc: "d1Doc",
  d1_serie: "d1Serie",
  d1_emissao: "d1Emissao",
  d1_dtdigit: "d1Dtdigit",
  d1_grupo: "d1Grupo",
  d1_tipo: "d1Tipo",
};

const sa1Map = {
  a1_cod: "a1Cod",
  a1_loja: "a1Loja",
  a1_nome: "a1Nome",
  a1_nreduz: "a1Nreduz",
  a1_tipo: "a1Tipo",
  a1_est: "a1Est",
  a1_mun: "a1Mun",
  a1_cgc: "a1Cgc",
};

const sa2Map = {
  a2_cod: "a2Cod",
  a2_loja: "a2Loja",
  a2_nome: "a2Nome",
  a2_nreduz: "a2Nreduz",
  a2_est: "a2Est",
  a2_mun: "a2Mun",
  a2_cgc: "a2Cgc",
};

async function main() {
  const file = path.join(__dirname, "seed-data", "sample.json");
  const data = JSON.parse(await fs.readFile(file, "utf8")) as SeedData;

  await prisma.sd1ItemNf.deleteMany();
  await prisma.sb2Saldo.deleteMany();
  await prisma.sb1Produto.deleteMany();
  await prisma.sa1Cliente.deleteMany();
  await prisma.sa2Fornecedor.deleteMany();

  await prisma.sb1Produto.createMany({
    data: data.sb1.map((row) => mapKeys(row, sb1Map, ["b1_dtcad", "b1_ult_compra"])) as never,
  });
  await prisma.sb2Saldo.createMany({ data: data.sb2.map((row) => mapKeys(row, sb2Map)) as never });
  await prisma.sd1ItemNf.createMany({
    data: data.sd1.map((row) => mapKeys(row, sd1Map, ["d1_emissao", "d1_dtdigit"])) as never,
  });
  await prisma.sa1Cliente.createMany({ data: data.sa1.map((row) => mapKeys(row, sa1Map)) as never });
  await prisma.sa2Fornecedor.createMany({ data: data.sa2.map((row) => mapKeys(row, sa2Map)) as never });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
