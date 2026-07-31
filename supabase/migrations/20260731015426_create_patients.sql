/*
# Create patients table (step 3)

1. New Tables
- `patients` — patient records: optional user link, name, DOB, phone, email, address, emergency contact, inactive flag, primary doctor.
2. Security
- RLS enabled. Doctors/secretaries read/create/update/delete all patients. Patients read their own record.
*/

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  date_of_birth date,
  phone text,
  email text,
  address text,
  emergency_contact text,
  inactive boolean NOT NULL DEFAULT false,
  primary_doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patients_select_staff" ON patients;
CREATE POLICY "patients_select_staff" ON patients FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'secretary')
  );

DROP POLICY IF EXISTS "patients_select_own" ON patients;
CREATE POLICY "patients_select_own" ON patients FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "patients_insert_staff" ON patients;
CREATE POLICY "patients_insert_staff" ON patients FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'secretary')
  );

DROP POLICY IF EXISTS "patients_update_staff" ON patients;
CREATE POLICY "patients_update_staff" ON patients FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'secretary')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'secretary')
  );

DROP POLICY IF EXISTS "patients_delete_staff" ON patients;
CREATE POLICY "patients_delete_staff" ON patients FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'secretary')
  );
