import csv
import io
import logging
import uuid
from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.limiter import limiter
from app.models.user import User
from app.schemas.transaction import (
    ImportConfirmOut,
    ImportMapping,
    ImportPreviewOut,
    TransactionCreate,
    TransactionList,
    TransactionOut,
    TransactionUpdate,
)
from app.services import budget_service, import_service, pdf_service, transaction_service
from app.services.category_service import create as create_category
from app.services.category_service import get_all as get_all_categories

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/export/csv")
async def export_csv(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await transaction_service.export_all(
        user_id=current_user.id,
        db=db,
        date_from=date_from,
        date_to=date_to,
    )
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Date", "Category", "Type", "Amount", "Note"])
    for r in rows:
        writer.writerow([
            r.tx_date.isoformat(),
            r.category_name or "",
            r.category_type or "",
            f"{r.amount_cents / 100:.2f}",
            r.note or "",
        ])
    buf.seek(0)
    df = date_from.isoformat() if date_from else "all"
    dt = date_to.isoformat() if date_to else "all"
    filename = f"transactions_{df}_{dt}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


_MAX_CSV_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/import/preview", response_model=ImportPreviewOut)
async def import_preview(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    if len(content) > _MAX_CSV_BYTES:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="File too large (max 5 MB)")
    return import_service.parse_csv_preview(content)


@router.post("/import/confirm", response_model=ImportConfirmOut)
async def import_confirm(
    file: UploadFile = File(...),
    mapping: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    if len(content) > _MAX_CSV_BYTES:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="File too large (max 5 MB)")
    try:
        m = ImportMapping.model_validate_json(mapping)
    except Exception:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid column mapping")
    categories = await get_all_categories(current_user.id, db)

    rows, skipped, new_cats = import_service.parse_csv_rows(
        content,
        date_col=m.date_col,
        amount_col=m.amount_col,
        category_col=m.category_col,
        type_col=m.type_col,
        note_col=m.note_col,
        categories=categories,
    )

    # Auto-create any categories from CSV that don't exist yet
    import_colors = [
        "#E52B50", "#64A0FF", "#AA40FF", "#E8A020", "#10b981",
        "#2060D0", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4",
    ]
    color_idx = 0
    for lname, info in new_cats.items():
        try:
            cat = await create_category(
                user_id=current_user.id,
                name=info["display_name"],
                color=import_colors[color_idx % len(import_colors)],
                type_=info["type"],
                db=db,
            )
            categories.append(cat)
        except Exception:
            pass
        color_idx += 1

    # Build name→id map from updated categories list
    cat_by_name = {c.name.lower(): c.id for c in categories}
    resolved_rows = import_service.resolve_category_ids(rows, cat_by_name)

    created = await transaction_service.bulk_create(current_user.id, resolved_rows, db)
    return ImportConfirmOut(created=created, skipped=skipped)


@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("300/minute")
async def create_transaction(
    body: TransactionCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tx = await transaction_service.create(
        user_id=current_user.id,
        amount_cents=body.amount_cents,
        category_id=body.category_id,
        tx_date=body.tx_date,
        note=body.note,
        db=db,
    )
    await budget_service.check_and_alert(
        user_id=current_user.id,
        telegram_id=current_user.telegram_id,
        category_id=body.category_id,
        month=body.tx_date.strftime("%Y-%m"),
        db=db,
    )
    return tx


@router.get("", response_model=TransactionList)
@limiter.limit("300/minute")
async def list_transactions(
    request: Request,
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    category_id: uuid.UUID | None = Query(None),
    type: Literal["income", "expense"] | None = Query(None),
    search: str | None = Query(None, min_length=3, max_length=200),
    cursor: uuid.UUID | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items, next_cursor = await transaction_service.list_transactions(
        user_id=current_user.id,
        db=db,
        date_from=date_from,
        date_to=date_to,
        category_id=category_id,
        type_filter=type,
        search=search,
        cursor=cursor,
        limit=limit,
    )
    return TransactionList(items=items, next_cursor=next_cursor)


@router.patch("/{tx_id}", response_model=TransactionOut)
@limiter.limit("300/minute")
async def update_transaction(
    tx_id: uuid.UUID,
    body: TransactionUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tx = await transaction_service.update(
        tx_id=tx_id,
        user_id=current_user.id,
        db=db,
        amount_cents=body.amount_cents,
        category_id=body.category_id,
        tx_date=body.tx_date,
        note=body.note,
    )
    await budget_service.check_and_alert(
        user_id=current_user.id,
        telegram_id=current_user.telegram_id,
        category_id=tx.category_id,
        month=tx.tx_date.strftime("%Y-%m"),
        db=db,
    )
    return tx


@router.post("/import/pdf-preview")
@limiter.limit("10/minute")
async def import_pdf_preview(
    file: UploadFile = File(...),
    request: Request = ...,
    current_user: User = Depends(get_current_user),
):
    """Preview transactions parsed from PDF bank statement."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        return {"error": "File must be a PDF"}
    if file.size and file.size > 5 * 1024 * 1024:
        return {"error": "File must be smaller than 5 MB"}

    content = await file.read()
    result = pdf_service.parse_bank_statement(content)

    if result.get("error"):
        return {"error": result["error"]}

    return {
        "transactions": [
            {
                "date": tx["date"].isoformat(),
                "amount": tx["amount"],
                "description": tx["description"],
            }
            for tx in result.get("transactions", [])
        ],
        "parse_errors": result.get("parse_errors", 0),
        "total_rows": len(result.get("transactions", [])),
    }


@router.post("/import/pdf-confirm")
@limiter.limit("5/minute")
async def import_pdf_confirm(
    file: UploadFile = File(...),
    category_id: uuid.UUID | None = Form(None),
    request: Request = ...,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Import transactions from PDF bank statement."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        return {"error": "File must be a PDF"}
    if file.size and file.size > 5 * 1024 * 1024:
        return {"error": "File must be smaller than 5 MB"}

    content = await file.read()
    result = pdf_service.parse_bank_statement(content)

    if result.get("error"):
        return {"error": result["error"]}

    transactions = result.get("transactions", [])
    created = 0

    for tx in transactions:
        try:
            await transaction_service.create(
                user_id=current_user.id,
                tx_date=tx["date"],
                amount_cents=int(round(tx["amount"] * 100)),
                category_id=category_id,
                note=tx["description"] or None,
                db=db,
            )
            created += 1
        except Exception as e:
            logger.warning(f"Failed to create tx from PDF: {e}")
            continue

    await db.commit()
    return {
        "ok": True,
        "created": created,
        "skipped": len(transactions) - created,
    }


@router.delete("/all")
@limiter.limit("5/minute")
async def delete_all_transactions(
    request: Request,
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count = await transaction_service.delete_all(
        user_id=current_user.id, db=db, date_from=date_from, date_to=date_to
    )
    return {"ok": True, "deleted": count}


@router.delete("/{tx_id}")
@limiter.limit("300/minute")
async def delete_transaction(
    tx_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await transaction_service.soft_delete(
        tx_id=tx_id,
        user_id=current_user.id,
        db=db,
    )
    return {"ok": True}
