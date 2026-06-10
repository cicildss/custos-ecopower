import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const produtosRouter = Router();

const deletedFilter = Prisma.sql`COALESCE(d_e_l_e_t_, '') <> '*'`;

const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return 0;
  return Number(value);
};

const unitCost = (total: unknown, quantity: unknown) => {
  const q = toNumber(quantity);
  if (!Number.isFinite(q) || q === 0) return null;
  return toNumber(total) / q;
};

produtosRouter.get("/busca", async (req, res, next) => {
  try {
    const query = z.object({ q: z.string().trim().min(1) }).parse(req.query);
    const term = `%${query.q}%`;
    const rows = await prisma.$queryRaw<Array<{ codigo: string; descricao: string }>>`
      SELECT b1_cod AS codigo, b1_desc AS descricao
      FROM sb1_produtos
      WHERE ${deletedFilter}
        AND (
          TRIM(b1_cod) ILIKE ${term}
          OR TRIM(b1_desc) ILIKE ${term}
          OR COALESCE(TRIM(b1_desc_nf), '') ILIKE ${term}
          OR COALESCE(TRIM(b1_grupo), '') ILIKE ${term}
          OR COALESCE(TRIM(b1_tipo), '') ILIKE ${term}
        )
      ORDER BY b1_cod
      LIMIT 50
    `;

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

produtosRouter.get("/:codigo", async (req, res, next) => {
  try {
    const params = z.object({ codigo: z.string().trim().min(1) }).parse(req.params);
    const query = z
      .object({
        filial: z.string().trim().optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
      })
      .parse(req.query);

    const filialWhere = query.filial ? Prisma.sql`AND b2_filial = ${query.filial}` : Prisma.empty;
    const filialWhereSd1 = query.filial ? Prisma.sql`AND d1.d1_filial = ${query.filial}` : Prisma.empty;
    const offset = (query.page - 1) * query.pageSize;

    const [product] = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT *
      FROM sb1_produtos
      WHERE ${deletedFilter}
        AND TRIM(b1_cod) = ${params.codigo}
      LIMIT 1
    `;

    if (!product) {
      res.status(404).json({ message: "Produto não encontrado" });
      return;
    }

    const stockRows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT b2_filial, b2_cod, b2_local, b2_qatu, b2_cm1, b2_descricao
      FROM sb2_saldos
      WHERE ${deletedFilter}
        AND TRIM(b2_cod) = ${params.codigo}
        ${filialWhere}
      ORDER BY b2_filial, b2_local
    `;

    const stock = stockRows.map((row) => ({
      ...row,
      custo_unitario: unitCost(row.b2_cm1, row.b2_qatu),
    }));

    const totalQuantidade = stockRows.reduce((sum, row) => sum + toNumber(row.b2_qatu), 0);
    const totalCusto = stockRows.reduce((sum, row) => sum + toNumber(row.b2_cm1), 0);

    const [{ total }] = await prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*)::bigint AS total
      FROM sd1_itens_nf d1
      WHERE COALESCE(d1.d_e_l_e_t_, '') <> '*'
        AND TRIM(d1.d1_cod) = ${params.codigo}
        ${filialWhereSd1}
    `;

    const invoicesRows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        d1.d1_doc,
        d1.d1_serie,
        d1.d1_emissao,
        d1.d1_dtdigit,
        d1.d1_fornece,
        d1.d1_loja,
        a2.a2_nome,
        a2.a2_cgc,
        d1.d1_quant,
        d1.d1_vunit,
        d1.d1_total
      FROM sd1_itens_nf d1
      LEFT JOIN sa2_fornecedores a2
        ON TRIM(d1.d1_fornece) = TRIM(a2.a2_cod)
       AND TRIM(d1.d1_loja) = TRIM(a2.a2_loja)
       AND COALESCE(a2.d_e_l_e_t_, '') <> '*'
      WHERE COALESCE(d1.d_e_l_e_t_, '') <> '*'
        AND TRIM(d1.d1_cod) = ${params.codigo}
        ${filialWhereSd1}
      ORDER BY d1.d1_dtdigit DESC NULLS LAST, d1.id DESC
      LIMIT ${query.pageSize}
      OFFSET ${offset}
    `;

    const invoices = invoicesRows.map((row) => ({
      ...row,
      fornecedor: {
        codigo: row.d1_fornece,
        loja: row.d1_loja,
        nome: row.a2_nome,
        cnpj: row.a2_cgc,
      },
      custo_unitario: unitCost(row.d1_total, row.d1_quant),
    }));

    res.json({
      sb1: product,
      sb2: {
        rows: stock,
        total: {
          quantidade: totalQuantidade,
          custo_total: totalCusto,
          custo_unitario: unitCost(totalCusto, totalQuantidade),
        },
      },
      sd1: {
        rows: invoices,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total: Number(total),
          totalPages: Math.ceil(Number(total) / query.pageSize),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});
