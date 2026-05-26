-- Create admin@fromantic.com with password 'jox@12345' and register as admin.
-- Idempotent: re-running won't duplicate rows.
DO $$
DECLARE
  v_email text := 'admin@fromantic.com';
  v_pw    text := 'jox@12345';
  v_id    uuid;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE email = v_email;

  IF v_id IS NULL THEN
    v_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, is_sso_user, is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_id, 'authenticated', 'authenticated', v_email,
      crypt(v_pw, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      false, false, false
    );

    INSERT INTO auth.identities (
      provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at
    ) VALUES (
      v_id::text, v_id,
      jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
      'email', now(), now(), now()
    );
  ELSE
    -- Reset password and ensure email confirmed if user already exists
    UPDATE auth.users
       SET encrypted_password = crypt(v_pw, gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = v_id;
  END IF;

  INSERT INTO public.admins (user_id) VALUES (v_id)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'admin user_id = %', v_id;
END $$;

SELECT u.id, u.email, u.email_confirmed_at, a.added_at AS admin_since
FROM auth.users u
JOIN public.admins a ON a.user_id = u.id
WHERE u.email = 'admin@fromantic.com';
