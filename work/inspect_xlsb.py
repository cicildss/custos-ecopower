import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "pydeps"))

from pyxlsb import open_workbook


SOURCE = Path(r"C:\Users\eduardo.rosa\OneDrive - EcoPower Energia Solar\scavjpv0.xlsb")
TARGETS = {"sa1", "sa2", "sb1", "sb2", "sd1"}


def value_of(cell):
    value = cell.v
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


def normalize_row(row):
    return [value_of(cell) for cell in row]


def non_empty(row):
    return sum(1 for value in row if value is not None)


result = {"sheets": [], "tables": {}}

with open_workbook(str(SOURCE)) as book:
    result["sheets"] = list(book.sheets)
    for sheet_name in book.sheets:
        if sheet_name.lower() not in TARGETS:
            continue
        with book.get_sheet(sheet_name) as sheet:
            rows = []
            for index, row in enumerate(sheet.rows(), start=1):
                normalized = normalize_row(row)
                if non_empty(normalized):
                    rows.append((index, normalized))
                if len(rows) >= 8:
                    break

        header_index, header = max(rows[:4], key=lambda item: non_empty(item[1]))
        last_col = max(i for i, value in enumerate(header) if value is not None)
        headers = [str(value) if value is not None else f"col_{i + 1}" for i, value in enumerate(header[: last_col + 1])]
        samples = []
        for row_index, row in rows:
            if row_index <= header_index:
                continue
            values = row[: len(headers)] + [None] * max(0, len(headers) - len(row))
            if non_empty(values):
                samples.append(dict(zip(headers, values)))

        result["tables"][sheet_name.upper()] = {
            "sheet": sheet_name,
            "header_row": header_index,
            "columns": headers,
            "sample": samples[:4],
        }

print(json.dumps(result, ensure_ascii=False, indent=2))
