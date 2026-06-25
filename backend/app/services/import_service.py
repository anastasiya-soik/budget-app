import csv
import io
import uuid
from datetime import date

from app.models.category import Category

_SKIP_TYPES = {"transfer_out", "transfer_internal", "transfer"}
_VALID_TYPES = {"income", "expense"}
_IMPORT_COLORS = [
    "#E52B50", "#64A0FF", "#AA40FF", "#E8A020", "#10b981",
    "#2060D0", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4",
]


def parse_csv_preview(content: bytes) -> dict:
    text = content.decode("utf-8-sig")
    reader = csv.reader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        return {"headers": [], "rows": [], "total_rows": 0}
    headers = rows[0]
    data_rows = rows[1:]
    return {
        "headers": headers,
        "rows": [r for r in data_rows[:5]],
        "total_rows": len(data_rows),
    }


def collect_new_categories(
    content: bytes,
    category_col: int,
    type_col: int,
    existing: list[Category],
) -> list[dict]:
    """Return [{name, type}] for categories present in CSV but missing from existing list."""
    existing_lower = {c.name.lower() for c in existing}
    text = content.decode("utf-8-sig")
    reader = csv.reader(io.StringIO(text))
    all_rows = list(reader)
    data_rows = all_rows[1:] if all_rows else []

    seen: dict[str, dict] = {}  # lower_name -> {name, type}
    for row in data_rows:
        try:
            if category_col >= len(row) or type_col >= len(row):
                continue
            name = row[category_col].strip()
            type_ = row[type_col].strip().lower()
            if not name or type_ not in _VALID_TYPES:
                continue
            key = name.lower()
            if key not in existing_lower and key not in seen:
                seen[key] = {"name": name, "type": type_}
        except (IndexError, ValueError):
            continue

    return list(seen.values())


def parse_csv_rows(
    content: bytes,
    date_col: int,
    amount_col: int,
    category_col: int | None,
    type_col: int | None,
    note_col: int | None,
    categories: list[Category],
) -> tuple[list[dict], int, dict[str, str]]:
    """Returns (valid_rows, skipped_count, new_categories).

    valid_rows have: tx_date, amount_cents, category_name (str|None), category_type (str|None), note
    new_categories: {name: type} for categories not yet in DB (caller should create them)
    """
    cat_by_name: dict[str, uuid.UUID] = {c.name.lower(): c.id for c in categories}

    text = content.decode("utf-8-sig")
    reader = csv.reader(io.StringIO(text))
    all_rows = list(reader)
    data_rows = all_rows[1:] if all_rows else []

    valid: list[dict] = []
    skipped = 0
    new_categories: dict[str, str] = {}  # name → type (lowercased name)

    for row in data_rows:
        try:
            tx_date = date.fromisoformat(row[date_col].strip())
            amount_str = row[amount_col].strip().replace(",", ".").lstrip("+-")
            amount_cents = round(float(amount_str) * 100)
            if amount_cents <= 0:
                skipped += 1
                continue

            # Read type column if provided
            row_type: str | None = None
            if type_col is not None and type_col < len(row):
                row_type = row[type_col].strip().lower()

            # Skip transfer rows entirely
            if row_type in _SKIP_TYPES:
                skipped += 1
                continue

            # Normalise type: only income/expense are valid category types
            cat_type = row_type if row_type in _VALID_TYPES else None

            # Category lookup
            cat_name: str | None = None
            if category_col is not None and category_col < len(row):
                raw_name = row[category_col].strip()
                if raw_name:
                    cat_name = raw_name

            # Track new categories to create (keyed by lowercase name)
            if cat_name and cat_name.lower() not in cat_by_name:
                lname = cat_name.lower()
                if lname not in new_categories:
                    new_categories[lname] = {
                        "display_name": cat_name,
                        "type": cat_type or "expense",
                    }

            note: str | None = None
            if note_col is not None and note_col < len(row):
                raw = row[note_col].strip()
                if raw:
                    note = raw[:500]

            valid.append({
                "tx_date": tx_date,
                "amount_cents": amount_cents,
                "category_name": cat_name,
                "note": note,
            })
        except (IndexError, ValueError, OverflowError):
            skipped += 1

    return valid, skipped, new_categories


def resolve_category_ids(
    rows: list[dict],
    cat_by_name: dict[str, uuid.UUID],
) -> list[dict]:
    """Replace category_name with category_id in each row."""
    result = []
    for row in rows:
        cat_name = row.get("category_name")
        category_id: uuid.UUID | None = None
        if cat_name:
            category_id = cat_by_name.get(cat_name.lower())
        result.append({
            "tx_date": row["tx_date"],
            "amount_cents": row["amount_cents"],
            "category_id": category_id,
            "note": row["note"],
        })
    return result
