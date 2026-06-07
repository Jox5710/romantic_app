-- Allow an APPROVED couple's members to edit their own display fields
-- (name_a/name_b/name_a_ar/name_b_ar/wedding_date) from the account page.
--
-- The original policy (members_update_draft_invited) only permitted updates
-- while a couple was 'drafted'/'invited', or by an admin — so once a couple was
-- approved, name edits silently affected 0 rows (RLS blocked them, no error
-- returned). This adds a second permissive UPDATE policy scoped to the caller's
-- own approved couple.
--
-- The WITH CHECK (state = 'approved') clause prevents a member from using this
-- policy to change `state` (e.g. self-approving or un-rejecting) — the row must
-- remain 'approved' both before and after the update. Idempotent.

DROP POLICY IF EXISTS members_update_approved ON public.couples;

CREATE POLICY members_update_approved ON public.couples
  FOR UPDATE
  USING (id = current_couple_id() AND state = 'approved')
  WITH CHECK (id = current_couple_id() AND state = 'approved');
