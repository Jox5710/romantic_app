-- Show SEALED time-capsule letters to the couple (not just unlocked ones).
--
-- The original capsule_read policy gated SELECT on `unlock_at <= now()`, which
-- meant a freshly written letter (the whole point of a time capsule is a FUTURE
-- unlock date) was never returned — so the list looked permanently empty and
-- couples thought their letters vanished.
--
-- This is safe: the body is client-encrypted with the couple's passphrase, and
-- the UI already renders sealed letters with a lock icon and only allows
-- decryption once `unlock_at` is in the past. The time gate is a UX gate, not a
-- cryptographic one. Idempotent.

DROP POLICY IF EXISTS "capsule_read" ON capsule_letters;

CREATE POLICY "capsule_read" ON capsule_letters FOR SELECT
  USING (couple_id = current_couple_id());
