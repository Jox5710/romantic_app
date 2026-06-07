-- Create two couples (idempotent):
--   Couple 1: jox@forever.com  (initiator)  +  nour@forever.com  (partner)
--   Couple 2: mohamedfarid@forever.com (initiator) + hagar@forever.com (partner)

DO $$
DECLARE
  -- Couple 1
  v_jox_email    text := 'jox@forever.com';
  v_jox_pw       text := 'jox@12345';
  v_nour_email   text := 'nour@forever.com';
  v_nour_pw      text := 'nour@12345';

  -- Couple 2
  v_farid_email  text := 'mohamedfarid@forever.com';
  v_farid_pw     text := 'm_ali@hagar123';
  v_hagar_email  text := 'hagar@forever.com';
  v_hagar_pw     text := 'hagar@m_ali123';

  v_jox_id       uuid;
  v_nour_id      uuid;
  v_farid_id     uuid;
  v_hagar_id     uuid;
  v_couple1_id   uuid;
  v_couple2_id   uuid;
BEGIN

  -- ─── Helper: upsert a single auth user ───────────────────────────────────
  -- (inline PL/pgSQL block per user so we can reuse the pattern cleanly)

  -- 1) jox@forever.com
  SELECT id INTO v_jox_id FROM auth.users WHERE email = v_jox_email;
  IF v_jox_id IS NULL THEN
    v_jox_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, is_sso_user, is_anonymous,
      confirmation_token, recovery_token,
      email_change_token_new, email_change,
      phone_change_token, email_change_token_current, reauthentication_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_jox_id, 'authenticated', 'authenticated', v_jox_email,
      crypt(v_jox_pw, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      false, false, false, '', '', '', '', '', '', ''
    );
    INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
    VALUES (v_jox_id::text, v_jox_id,
      jsonb_build_object('sub', v_jox_id::text, 'email', v_jox_email, 'email_verified', true, 'phone_verified', false),
      'email', now(), now(), now());
  ELSE
    UPDATE auth.users SET encrypted_password = crypt(v_jox_pw, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now()
    WHERE id = v_jox_id;
  END IF;

  -- 2) nour@forever.com
  SELECT id INTO v_nour_id FROM auth.users WHERE email = v_nour_email;
  IF v_nour_id IS NULL THEN
    v_nour_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, is_sso_user, is_anonymous,
      confirmation_token, recovery_token,
      email_change_token_new, email_change,
      phone_change_token, email_change_token_current, reauthentication_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_nour_id, 'authenticated', 'authenticated', v_nour_email,
      crypt(v_nour_pw, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      false, false, false, '', '', '', '', '', '', ''
    );
    INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
    VALUES (v_nour_id::text, v_nour_id,
      jsonb_build_object('sub', v_nour_id::text, 'email', v_nour_email, 'email_verified', true, 'phone_verified', false),
      'email', now(), now(), now());
  ELSE
    UPDATE auth.users SET encrypted_password = crypt(v_nour_pw, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now()
    WHERE id = v_nour_id;
  END IF;

  -- 3) mohamedfarid@forever.com
  SELECT id INTO v_farid_id FROM auth.users WHERE email = v_farid_email;
  IF v_farid_id IS NULL THEN
    v_farid_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, is_sso_user, is_anonymous,
      confirmation_token, recovery_token,
      email_change_token_new, email_change,
      phone_change_token, email_change_token_current, reauthentication_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_farid_id, 'authenticated', 'authenticated', v_farid_email,
      crypt(v_farid_pw, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      false, false, false, '', '', '', '', '', '', ''
    );
    INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
    VALUES (v_farid_id::text, v_farid_id,
      jsonb_build_object('sub', v_farid_id::text, 'email', v_farid_email, 'email_verified', true, 'phone_verified', false),
      'email', now(), now(), now());
  ELSE
    UPDATE auth.users SET encrypted_password = crypt(v_farid_pw, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now()
    WHERE id = v_farid_id;
  END IF;

  -- 4) hagar@forever.com
  SELECT id INTO v_hagar_id FROM auth.users WHERE email = v_hagar_email;
  IF v_hagar_id IS NULL THEN
    v_hagar_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, is_sso_user, is_anonymous,
      confirmation_token, recovery_token,
      email_change_token_new, email_change,
      phone_change_token, email_change_token_current, reauthentication_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_hagar_id, 'authenticated', 'authenticated', v_hagar_email,
      crypt(v_hagar_pw, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      false, false, false, '', '', '', '', '', '', ''
    );
    INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
    VALUES (v_hagar_id::text, v_hagar_id,
      jsonb_build_object('sub', v_hagar_id::text, 'email', v_hagar_email, 'email_verified', true, 'phone_verified', false),
      'email', now(), now(), now());
  ELSE
    UPDATE auth.users SET encrypted_password = crypt(v_hagar_pw, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now()
    WHERE id = v_hagar_id;
  END IF;

  -- ─── Couple 1: jox + nour ────────────────────────────────────────────────
  SELECT couple_id INTO v_couple1_id FROM public.couple_members WHERE user_id = v_jox_id;
  IF v_couple1_id IS NULL THEN
    SELECT couple_id INTO v_couple1_id FROM public.couple_members WHERE user_id = v_nour_id;
  END IF;
  IF v_couple1_id IS NULL THEN
    v_couple1_id := gen_random_uuid();
    INSERT INTO public.couples (
      id, state, name_a, name_b, name_a_ar, name_b_ar,
      initiator_id, partner_id, approved_at, approved_by, created_at
    ) VALUES (
      v_couple1_id, 'approved', 'Jox', 'Nour', 'جوكس', 'نور',
      v_jox_id, v_nour_id, now(), v_jox_id, now()
    );
  ELSE
    UPDATE public.couples SET
      state = 'approved', initiator_id = v_jox_id, partner_id = v_nour_id,
      name_a = COALESCE(name_a, 'Jox'), name_b = COALESCE(name_b, 'Nour'),
      name_a_ar = COALESCE(name_a_ar, 'جوكس'), name_b_ar = COALESCE(name_b_ar, 'نور'),
      approved_at = COALESCE(approved_at, now()), approved_by = COALESCE(approved_by, v_jox_id)
    WHERE id = v_couple1_id;
  END IF;

  INSERT INTO public.couple_members (user_id, couple_id, role, display_name, confirmed_at)
  VALUES (v_jox_id, v_couple1_id, 'initiator', 'Jox', now())
  ON CONFLICT (user_id) DO UPDATE SET
    couple_id = EXCLUDED.couple_id, role = 'initiator',
    confirmed_at = COALESCE(public.couple_members.confirmed_at, now());

  INSERT INTO public.couple_members (user_id, couple_id, role, display_name, confirmed_at)
  VALUES (v_nour_id, v_couple1_id, 'partner', 'Nour', now())
  ON CONFLICT (user_id) DO UPDATE SET
    couple_id = EXCLUDED.couple_id, role = 'partner',
    confirmed_at = COALESCE(public.couple_members.confirmed_at, now());

  -- ─── Couple 2: mohamedfarid + hagar ─────────────────────────────────────
  SELECT couple_id INTO v_couple2_id FROM public.couple_members WHERE user_id = v_farid_id;
  IF v_couple2_id IS NULL THEN
    SELECT couple_id INTO v_couple2_id FROM public.couple_members WHERE user_id = v_hagar_id;
  END IF;
  IF v_couple2_id IS NULL THEN
    v_couple2_id := gen_random_uuid();
    INSERT INTO public.couples (
      id, state, name_a, name_b, name_a_ar, name_b_ar,
      initiator_id, partner_id, approved_at, approved_by, created_at
    ) VALUES (
      v_couple2_id, 'approved', 'Mohamed Farid', 'Hagar', 'محمد فريد', 'هاجر',
      v_farid_id, v_hagar_id, now(), v_farid_id, now()
    );
  ELSE
    UPDATE public.couples SET
      state = 'approved', initiator_id = v_farid_id, partner_id = v_hagar_id,
      name_a = COALESCE(name_a, 'Mohamed Farid'), name_b = COALESCE(name_b, 'Hagar'),
      name_a_ar = COALESCE(name_a_ar, 'محمد فريد'), name_b_ar = COALESCE(name_b_ar, 'هاجر'),
      approved_at = COALESCE(approved_at, now()), approved_by = COALESCE(approved_by, v_farid_id)
    WHERE id = v_couple2_id;
  END IF;

  INSERT INTO public.couple_members (user_id, couple_id, role, display_name, confirmed_at)
  VALUES (v_farid_id, v_couple2_id, 'initiator', 'Mohamed Farid', now())
  ON CONFLICT (user_id) DO UPDATE SET
    couple_id = EXCLUDED.couple_id, role = 'initiator',
    confirmed_at = COALESCE(public.couple_members.confirmed_at, now());

  INSERT INTO public.couple_members (user_id, couple_id, role, display_name, confirmed_at)
  VALUES (v_hagar_id, v_couple2_id, 'partner', 'Hagar', now())
  ON CONFLICT (user_id) DO UPDATE SET
    couple_id = EXCLUDED.couple_id, role = 'partner',
    confirmed_at = COALESCE(public.couple_members.confirmed_at, now());

  RAISE NOTICE 'Couple 1 — jox_id=% nour_id=% couple_id=%', v_jox_id, v_nour_id, v_couple1_id;
  RAISE NOTICE 'Couple 2 — farid_id=% hagar_id=% couple_id=%', v_farid_id, v_hagar_id, v_couple2_id;
END $$;

-- Verification
SELECT cm.role, u.email, u.email_confirmed_at IS NOT NULL AS confirmed, c.state AS couple_state
FROM public.couple_members cm
JOIN auth.users u ON u.id = cm.user_id
JOIN public.couples c ON c.id = cm.couple_id
WHERE u.email IN (
  'jox@forever.com','nour@forever.com',
  'mohamedfarid@forever.com','hagar@forever.com'
)
ORDER BY c.id, cm.role;
