/*
# Create appointments table (step 4)

1. New Tables
- `appointments` — scheduled visits: doctor, patient, creator, datetime, status, type (in-person/teleconsult), reason, notes, teleconsult link.
2. Security
- RLS enabled. Doctors see their own appointments. Secretaries see all. Patients see their own. Staff can insert/update/delete. Patients can update (cancel) their own.
*/

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  type text NOT NULL DEFAULT 'in_person' CHECK (type IN ('in_person', 'teleconsult')),
  reason text,
  notes text,
  teleconsult_link text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appt_select_doctor" ON appointments;
CREATE POLICY "appt_select_doctor" ON appointments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = appointments.doctor_id)
  );

DROP POLICY IF EXISTS "appt_select_secretary" ON appointments;
CREATE POLICY "appt_select_secretary" ON appointments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'secretary')
  );

DROP POLICY IF EXISTS "appt_select_patient" ON appointments;
CREATE POLICY "appt_select_patient" ON appointments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients pat WHERE pat.user_id = auth.uid() AND pat.id = appointments.patient_id)
  );

DROP POLICY IF EXISTS "appt_insert_staff" ON appointments;
CREATE POLICY "appt_insert_staff" ON appointments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'secretary')
    OR EXISTS (SELECT 1 FROM patients pat WHERE pat.user_id = auth.uid() AND pat.id = appointments.patient_id)
  );

DROP POLICY IF EXISTS "appt_update_staff" ON appointments;
CREATE POLICY "appt_update_staff" ON appointments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = appointments.doctor_id)
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'secretary')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'secretary')
  );

DROP POLICY IF EXISTS "appt_update_patient" ON appointments;
CREATE POLICY "appt_update_patient" ON appointments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients pat WHERE pat.user_id = auth.uid() AND pat.id = appointments.patient_id)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM patients pat WHERE pat.user_id = auth.uid() AND pat.id = appointments.patient_id)
  );

DROP POLICY IF EXISTS "appt_delete_staff" ON appointments;
CREATE POLICY "appt_delete_staff" ON appointments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = appointments.doctor_id)
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'secretary')
  );

CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments (doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments (scheduled_at);
