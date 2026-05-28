-- Create nourhansamy@fromantic.com (role: regular user) and pair her with
-- admin@fromantic.com as an approved couple. Idempotent.

DO $$
DECLARE
  v_admin_email   text := 'admin@fromantic.com';
  v_partner_email text := 'nourhansamy@fromantic.com';
  v_partner_pw    text := 'nourhan@youssef';
  v_admin_id      uuid;
  v_partner_id    uuid;
  v_couple_id     uuid;
BEGIN
  -- 1) Admin must already exist
  SELECT id INTO v_admin_id FROM auth.users WHERE email = v_admin_email;
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'admin user % not found — run seed-admin.sql first', v_admin_email;
  END IF;

  -- 2) Create / refresh the partner user
  SELECT id INTO v_partner_id FROM auth.users WHERE email = v_partner_email;

  IF v_partner_id IS NULL THEN
    v_partner_id := gen_random_uuid();

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
      v_partner_id, 'authenticated', 'authenticated', v_partner_email,
      crypt(v_partner_pw, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      false, false, false,
      '', '', '', '', '', '', ''
    );

    INSERT INTO auth.identities (
      provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at
    ) VALUES (
      v_partner_id::text, v_partner_id,
      jsonb_build_object('sub', v_partner_id::text, 'email', v_partner_email, 'email_verified', true, 'phone_verified', false),
      'email', now(), now(), now()
    );
  ELSE
    UPDATE auth.users
       SET encrypted_password = crypt(v_partner_pw, gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = v_partner_id;
  END IF;

  -- Make sure she is NOT in admins (role: regular user)
  DELETE FROM public.admins WHERE user_id = v_partner_id;

  -- 3) Find or create the couple linking them
  SELECT couple_id INTO v_couple_id FROM public.couple_members WHERE user_id = v_admin_id;

  IF v_couple_id IS NULL THEN
    SELECT couple_id INTO v_couple_id FROM public.couple_members WHERE user_id = v_partner_id;
  END IF;

  IF v_couple_id IS NULL THEN
    v_couple_id := gen_random_uuid();
    INSERT INTO public.couples (
      id, state, name_a, name_b, name_a_ar, name_b_ar,
      initiator_id, partner_id, approved_at, approved_by, created_at
    ) VALUES (
      v_couple_id, 'approved', 'Youssef', 'Nourhan', 'يوسف', 'نورهان',
      v_admin_id, v_partner_id, now(), v_admin_id, now()
    );
  ELSE
    UPDATE public.couples
       SET state = 'approved',
           initiator_id = v_admin_id,
           partner_id = v_partner_id,
           name_a = COALESCE(name_a, 'Youssef'),
           name_b = COALESCE(name_b, 'Nourhan'),
           name_a_ar = COALESCE(name_a_ar, 'يوسف'),
           name_b_ar = COALESCE(name_b_ar, 'نورهان'),
           approved_at = COALESCE(approved_at, now()),
           approved_by = COALESCE(approved_by, v_admin_id)
     WHERE id = v_couple_id;
  END IF;

  -- 4) couple_members — one row per user (primary key is user_id)
  INSERT INTO public.couple_members (user_id, couple_id, role, display_name, confirmed_at)
  VALUES (v_admin_id, v_couple_id, 'initiator', 'Youssef', now())
  ON CONFLICT (user_id) DO UPDATE
    SET couple_id    = EXCLUDED.couple_id,
        role         = 'initiator',
        confirmed_at = COALESCE(public.couple_members.confirmed_at, now());

  INSERT INTO public.couple_members (user_id, couple_id, role, display_name, confirmed_at)
  VALUES (v_partner_id, v_couple_id, 'partner', 'Nourhan', now())
  ON CONFLICT (user_id) DO UPDATE
    SET couple_id    = EXCLUDED.couple_id,
        role         = 'partner',
        confirmed_at = COALESCE(public.couple_members.confirmed_at, now());

  RAISE NOTICE 'admin   = % (initiator)', v_admin_id;
  RAISE NOTICE 'partner = % (partner)', v_partner_id;
  RAISE NOTICE 'couple  = % (approved)', v_couple_id;
END $$;

SELECT
  cm.role,
  u.email,
  u.email_confirmed_at IS NOT NULL AS confirmed,
  EXISTS(SELECT 1 FROM public.admins a WHERE a.user_id = u.id) AS is_admin,
  c.state AS couple_state
FROM public.couple_members cm
JOIN auth.users u ON u.id = cm.user_id
JOIN public.couples c ON c.id = cm.couple_id
WHERE u.email IN ('admin@fromantic.com', 'nourhansamy@fromantic.com')
ORDER BY cm.role;
