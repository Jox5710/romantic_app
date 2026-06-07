export interface AdminUserRow {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  couple_id: string | null;
  couple_state: string | null;
  couple_name: string | null;
}
