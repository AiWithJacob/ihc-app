-- Trigger: logowanie rejestracji (INSERT do app_users) do audit_logs
-- + RLS: umożliwienie odczytu wpisów app_users w audit_logs (chiropractor=NULL)

CREATE OR REPLACE FUNCTION log_app_user_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name, record_id, action, new_data,
    user_login, user_email, chiropractor, metadata
  ) VALUES (
    'app_users', NEW.id, 'INSERT',
    jsonb_build_object('id', NEW.id, 'login', NEW.login, 'email', NEW.email, 'created_at', NEW.created_at),
    NEW.login, NEW.email, NULL,
    '{"source":"register"}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS app_users_audit_trigger ON app_users;
CREATE TRIGGER app_users_audit_trigger
  AFTER INSERT ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION log_app_user_insert();

-- RLS: odczyt wpisów rejestracji (table_name=app_users, chiropractor IS NULL) w audit_logs
DROP POLICY IF EXISTS "Allow anon read app_users audit" ON audit_logs;
CREATE POLICY "Allow anon read app_users audit"
  ON audit_logs FOR SELECT
  USING (table_name = 'app_users');

COMMENT ON FUNCTION log_app_user_insert IS 'Zapisuje rejestrację (INSERT app_users) do audit_logs; new_data bez password_hash.';
