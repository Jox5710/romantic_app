-- Bilingual couple display names.
-- The UI shows name_a_ar / name_b_ar when locale = ar, falling back to the
-- Latin name_a / name_b when the Arabic value is NULL. Idempotent.

ALTER TABLE couples ADD COLUMN IF NOT EXISTS name_a_ar text;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS name_b_ar text;

COMMENT ON COLUMN couples.name_a_ar IS 'Arabic display name for partner A; UI falls back to name_a if NULL';
COMMENT ON COLUMN couples.name_b_ar IS 'Arabic display name for partner B; UI falls back to name_b if NULL';
