import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "pydeps"))

from pyxlsb import open_workbook

SOURCE = Path(r"C:\Users\eduardo.rosa\OneDrive - EcoPower Energia Solar\scavjpv0.xlsb")


def value_of(cell):
    value = cell.v
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


def to_text(value):
    if value is None:
        return None
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def to_number(value):
    if value in (None, "/  /"):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def to_date(value):
    if value in (None, "/  /"):
        return None
    if isinstance(value, (int, float)):
        return (datetime(1899, 12, 30) + timedelta(days=float(value))).date().isoformat()
    return None


def read_table(book, sheet_name, header_row):
    with book.get_sheet(sheet_name) as sheet:
        headers = None
        for idx, row in enumerate(sheet.rows(), start=1):
            values = [value_of(c) for c in row]
            if idx == header_row:
                last = max(i for i, v in enumerate(values) if v is not None)
                headers = [str(v or f"col_{i+1}") for i, v in enumerate(values[: last + 1])]
                continue
            if idx > header_row and headers:
                row_values = values[: len(headers)] + [None] * max(0, len(headers) - len(values))
                if any(v is not None for v in row_values):
                    yield dict(zip(headers, row_values))


with open_workbook(str(SOURCE)) as book:
    sb1 = []
    for row in read_table(book, "sb1", 3):
        code = to_text(row.get("Codigo"))
        desc = to_text(row.get("Descricao"))
        if code and desc and len(sb1) < 12:
            sb1.append({
                "b1_cod": code,
                "b1_desc": desc,
                "b1_desc_nf": to_text(row.get("Descricao NF")),
                "b1_tipo": to_text(row.get("Tipo")),
                "b1_um": to_text(row.get("Unidade")),
                "b1_local_pad": to_text(row.get("Armazem Pad.")),
                "b1_grupo": to_text(row.get("Grupo")),
                "b1_posipi": to_text(row.get("Pos.IPI/NCM")),
                "b1_aliq_icms": to_number(row.get("Aliq. ICMS")),
                "b1_aliq_ipi": to_number(row.get("Aliq. IPI")),
                "b1_preco_venda": to_number(row.get("Preco Venda")),
                "b1_ult_preco": to_number(row.get("Ult. Preco")),
                "b1_ult_compra": to_date(row.get("Ult. Compra")),
            })
    codes = {p["b1_cod"] for p in sb1}

    sb2 = []
    for row in read_table(book, "sb2", 3):
        code = to_text(row.get("Produto"))
        if code in codes:
            sb2.append({
                "b2_filial": to_text(row.get("Filial")),
                "b2_cod": code,
                "b2_local": to_text(row.get("Armazem")),
                "b2_qatu": to_number(row.get("Saldo Atual")) or 0,
                "b2_cm1": to_number(row.get("Vlr.Final")) or 0,
                "b2_descricao": to_text(row.get("Descrição")),
            })
        if len(sb2) >= 30:
            break

    sa2_all = {}
    for row in read_table(book, "sa2", 3):
        cod = to_text(row.get("Codigo"))
        loja = to_text(row.get("Loja"))
        if cod and loja:
            sa2_all[(cod, loja)] = {
                "a2_cod": cod,
                "a2_loja": loja,
                "a2_nome": to_text(row.get("Razao Social")),
                "a2_nfantasia": to_text(row.get("N Fantasia")),
                "a2_est": to_text(row.get("Estado")),
                "a2_mun": to_text(row.get("Municipio")),
                "a2_cgc": to_text(row.get("CNPJ/CPF")),
            }

    sd1 = []
    suppliers = set()
    for row in read_table(book, "sd1", 3):
        code = to_text(row.get("Produto"))
        if code in codes:
            supplier = to_text(row.get("Forn/Cliente"))
            store = to_text(row.get("Loja"))
            suppliers.add((supplier, store))
            sd1.append({
                "d1_filial": to_text(row.get("Filial")),
                "d1_item": to_text(row.get("Item NF")),
                "d1_cod": code,
                "d1_um": to_text(row.get("Unidade")),
                "d1_quant": to_number(row.get("Quantidade")) or 0,
                "d1_local": to_text(row.get("Armazem")),
                "d1_vunit": to_number(row.get("Vlr.Unitario")) or 0,
                "d1_custo": to_number(row.get("Custo Moeda1")) or 0,
                "d1_total": to_number(row.get("Vlr.Total")) or 0,
                "d1_fornece": supplier,
                "d1_loja": store,
                "d1_doc": to_text(row.get("Documento")),
                "d1_emissao": to_date(row.get("DT Emissao")),
                "d1_dtdigit": to_date(row.get("DT Digitacao")),
                "d1_serie": to_text(row.get("Serie")),
                "d1_grupo": to_text(row.get("Grupo")),
                "d1_tipo": to_text(row.get("Tipo Produto")),
            })
        if len(sd1) >= 40:
            break

    sa2 = [sa2_all[key] for key in sorted(suppliers) if key in sa2_all]

print(json.dumps({"sb1": sb1, "sb2": sb2, "sd1": sd1, "sa2": sa2, "sa1": []}, ensure_ascii=False, indent=2))
