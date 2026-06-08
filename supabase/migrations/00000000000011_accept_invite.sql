-- Partner-confirmation flow: the invited partner accepts via a single
-- security-definer RPC that joins the couple AND auto-approves it (no admin
-- step). Running as definer lets the invited partner perform the
-- invited -> approved transition without opening a broad RLS UPDATE policy on
-- `couples` (the existing policies only let the INITIATOR mutate drafted/invited
-- rows — see 00000000000000_init.sql / 00000000000004).
--
-- The caller is the authenticated partner (auth.uid()). We verify the code maps
-- to a couple still awaiting a partner (state 'invited') and that the caller is
-- not already its initiator, then atomically: insert their membership and flip
-- the couple to 'approved'. Returns the couple id.

create or replace function accept_invite(
  p_code text,
  p_name_b text default null,
  p_name_b_ar text default null
) returns uuid as $$
declare
  v_uid uuid := auth.uid();
  v_couple couples%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- Lock the target couple so two clicks can't both win the partner slot.
  select * into v_couple
  from couples
  where invite_code = upper(p_code)
    and state = 'invited'
  for update;

  if not found then
    raise exception 'invite not found or already used';
  end if;

  if v_couple.initiator_id = v_uid then
    raise exception 'cannot accept your own invitation';
  end if;

  -- Join as the partner. If this user somehow already has a membership the
  -- primary key (user_id) will conflict and abort — intended.
  insert into couple_members (user_id, couple_id, role, display_name, confirmed_at)
  values (v_uid, v_couple.id, 'partner', nullif(trim(p_name_b), ''), now());

  -- Auto-approve: partner confirmation is the gate (no pending_admin).
  update couples
  set partner_id = v_uid,
      name_b     = nullif(trim(p_name_b), ''),
      name_b_ar  = nullif(trim(p_name_b_ar), ''),
      state      = 'approved',
      approved_at = now()
  where id = v_couple.id;

  return v_couple.id;
end;
$$ language plpgsql volatile security definer;

-- Authenticated users invoke it; the body enforces who may accept what.
grant execute on function accept_invite(text, text, text) to authenticated;
