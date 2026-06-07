-- Fix 1: Extend couples SELECT policy so the initiator can read their newly
--         created couple row before couple_members is populated.
--         Without this, INSERT ... RETURNING was blocked by the SELECT RLS policy
--         (user has no couple_members row yet at that point).
DROP POLICY IF EXISTS "members_read_own_couple" ON couples;
CREATE POLICY "members_read_own_couple" ON couples FOR SELECT USING (
  id = current_couple_id()
  OR initiator_id = auth.uid()
  OR is_admin(auth.uid())
);

-- Fix 2: Convert auth.uid() / auth.role() / auth.email() from LANGUAGE sql to
--         LANGUAGE plpgsql VOLATILE. PostgreSQL's query planner can inline and
--         cache LANGUAGE sql functions at plan time; VOLATILE plpgsql prevents
--         that, ensuring current_setting('request.jwt.claims') is re-evaluated
--         on every call so RLS checks always see the current JWT.
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE plpgsql VOLATILE
AS $$
BEGIN
  RETURN coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid;
END;
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE plpgsql VOLATILE
AS $$
BEGIN
  RETURN coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text;
END;
$$;

CREATE OR REPLACE FUNCTION auth.email()
RETURNS text
LANGUAGE plpgsql VOLATILE
AS $$
BEGIN
  RETURN coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text;
END;
$$;
