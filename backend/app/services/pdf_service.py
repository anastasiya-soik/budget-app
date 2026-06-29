import io
import re
from datetime import datetime
from typing import Optional

import pdfplumber


def _parse_date(date_str: str) -> Optional[datetime]:
    """Try parsing common date formats."""
    if not date_str or not isinstance(date_str, str):
        return None
    date_str = date_str.strip()
    formats = [
        "%Y-%m-%d", "%d.%m.%Y", "%d/%m/%Y", "%m/%d/%Y",
        "%Y/%m/%d", "%d-%m-%Y", "%m-%d-%Y",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            pass
    return None


def _parse_amount(amount_str: str) -> Optional[float]:
    """Parse amount, handling comma/dot as decimal separator."""
    if not amount_str or not isinstance(amount_str, str):
        return None
    amount_str = amount_str.strip().replace(" ", "").replace(",", ".")
    try:
        return float(amount_str)
    except ValueError:
        return None


def parse_bank_statement(file_content: bytes) -> dict:
    """Extract transactions from bank PDF statement (universal format).

    Looks for tables with columns containing date, amount, description.
    Returns {
        "transactions": [
            {"date": date, "amount": float, "description": str},
            ...
        ],
        "parse_errors": int,
    }
    """
    transactions = []
    parse_errors = 0

    try:
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            for page_idx, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                if not tables:
                    continue

                for table in tables:
                    if not table or len(table) < 2:
                        continue

                    # Find header row (usually first row with column names)
                    header = table[0]
                    if not header:
                        continue

                    # Normalize header for matching
                    header_lower = [str(h).lower() if h else "" for h in header]

                    # Find column indices by keyword matching
                    date_col = None
                    amount_col = None
                    desc_col = None

                    date_keywords = ["date", "дата", "день", "when"]
                    amount_keywords = ["amount", "sum", "сумма", "сумме", "debit", "credit"]
                    desc_keywords = ["description", "desc", "detail", "memo", "описание", "назначение"]

                    for idx, col in enumerate(header_lower):
                        for kw in date_keywords:
                            if kw in col:
                                date_col = idx
                                break
                        for kw in amount_keywords:
                            if kw in col:
                                amount_col = idx
                                break
                        for kw in desc_keywords:
                            if kw in col:
                                desc_col = idx
                                break

                    # If we found date and amount, process rows
                    if date_col is not None and amount_col is not None:
                        for row in table[1:]:
                            if not row:
                                continue
                            try:
                                date_val = row[date_col] if date_col < len(row) else None
                                amount_val = row[amount_col] if amount_col < len(row) else None
                                desc_val = row[desc_col] if desc_col and desc_col < len(row) else None

                                parsed_date = _parse_date(str(date_val))
                                parsed_amount = _parse_amount(str(amount_val))

                                if parsed_date and parsed_amount and parsed_amount != 0:
                                    transactions.append({
                                        "date": parsed_date,
                                        "amount": abs(parsed_amount),
                                        "description": str(desc_val).strip() if desc_val else "",
                                    })
                            except (IndexError, TypeError, ValueError):
                                parse_errors += 1
                                continue

    except Exception as e:
        return {
            "transactions": [],
            "parse_errors": 1,
            "error": f"PDF parsing failed: {str(e)}",
        }

    return {
        "transactions": transactions,
        "parse_errors": parse_errors,
    }
