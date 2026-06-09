import json
import sys
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


result = {}
with open_workbook(str(SOURCE)) as book:
    for sheet_name in ["sd1", "sb1"]:
        rows = []
        with book.get_sheet(sheet_name) as sheet:
            for idx, row in enumerate(sheet.rows(), start=1):
                vals = [value_of(c) for c in row]
                compact = [(i + 1, v) for i, v in enumerate(vals) if v is not None]
                if compact:
                    rows.append({
                        "row": idx,
                        "count": len(compact),
                        "first": compact[:80],
                    })
                if len(rows) >= 10:
                    break
        result[sheet_name] = rows

print(json.dumps(result, ensure_ascii=False, indent=2))
