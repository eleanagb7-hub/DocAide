/*
# Create doctors table (step 2)

1. New Tables
- `doctors` — doctor-specific info: specialty, bio, consultation fee, active flag, linked to profile.
2. Security
- RLS enabled. All authenticated can read (for booking). Doctors insert/update their own.
3. Additional
- Add staff-read policy on profiles now that doctors exists.
*/

CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  specialty text NOT NULL,
  bio text,
  consultation_fee numeric(10,2) DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctors_select_all" ON doctors;
CREATE POLICY "doctors_select_all" ON doctors FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "doctors_insert_own" ON doctors;
CREATE POLICY "doctors_insert_own" ON doctors FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "doctors_update_own" ON doctors;
CREATE POLICY "doctors_update_own" ON doctors FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Now add staff-read policy on profiles
DROP POLICY IF EXISTS "profiles_select_staff" ON profiles;
CREATE POLICY "profiles_select_staff" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'secretary')
  );
