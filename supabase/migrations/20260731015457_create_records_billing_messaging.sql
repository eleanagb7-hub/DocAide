/*
# Create medical_records, prescriptions, invoices, expenses, messages (step 5)

1. New Tables
- `medical_records` — clinical evolution notes per patient per doctor/appointment.
- `prescriptions` — medications prescribed by a doctor to a patient.
- `invoices` — billing: patient, doctor, appointment, amount, status.
- `expenses` — clinic expenses: doctor, amount, description, category, date.
- `messages` — secure messaging between profiles.
2. Security
- RLS enabled on all. Doctors manage their own records/prescriptions/invoices/expenses. Patients read their own. Secretaries can manage invoices. Messages: sender/recipient only.
*/

-- MEDICAL RECORDS
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  evolution text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rec_select_doctor" ON medical_records;
CREATE POLICY "rec_select_doctor" ON medical_records FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = medical_records.doctor_id)
  );

DROP POLICY IF EXISTS "rec_select_patient" ON medical_records;
CREATE POLICY "rec_select_patient" ON medical_records FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients pat WHERE pat.user_id = auth.uid() AND pat.id = medical_records.patient_id)
  );

DROP POLICY IF EXISTS "rec_insert_doctor" ON medical_records;
CREATE POLICY "rec_insert_doctor" ON medical_records FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = medical_records.doctor_id)
  );

DROP POLICY IF EXISTS "rec_update_doctor" ON medical_records;
CREATE POLICY "rec_update_doctor" ON medical_records FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = medical_records.doctor_id)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = medical_records.doctor_id)
  );

DROP POLICY IF EXISTS "rec_delete_doctor" ON medical_records;
CREATE POLICY "rec_delete_doctor" ON medical_records FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = medical_records.doctor_id)
  );

-- PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  medication text NOT NULL,
  dosage text,
  instructions text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "presc_select_doctor" ON prescriptions;
CREATE POLICY "presc_select_doctor" ON prescriptions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = prescriptions.doctor_id)
  );

DROP POLICY IF EXISTS "presc_select_patient" ON prescriptions;
CREATE POLICY "presc_select_patient" ON prescriptions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients pat WHERE pat.user_id = auth.uid() AND pat.id = prescriptions.patient_id)
  );

DROP POLICY IF EXISTS "presc_insert_doctor" ON prescriptions;
CREATE POLICY "presc_insert_doctor" ON prescriptions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = prescriptions.doctor_id)
  );

DROP POLICY IF EXISTS "presc_update_doctor" ON prescriptions;
CREATE POLICY "presc_update_doctor" ON prescriptions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = prescriptions.doctor_id)
  );

DROP POLICY IF EXISTS "presc_delete_doctor" ON prescriptions;
CREATE POLICY "presc_delete_doctor" ON prescriptions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = prescriptions.doctor_id)
  );

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  due_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inv_select_doctor" ON invoices;
CREATE POLICY "inv_select_doctor" ON invoices FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = invoices.doctor_id)
  );

DROP POLICY IF EXISTS "inv_select_patient" ON invoices;
CREATE POLICY "inv_select_patient" ON invoices FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM patients pat WHERE pat.user_id = auth.uid() AND pat.id = invoices.patient_id)
  );

DROP POLICY IF EXISTS "inv_insert_staff" ON invoices;
CREATE POLICY "inv_insert_staff" ON invoices FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'secretary')
  );

DROP POLICY IF EXISTS "inv_update_staff" ON invoices;
CREATE POLICY "inv_update_staff" ON invoices FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'secretary')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'secretary')
  );

DROP POLICY IF EXISTS "inv_delete_staff" ON invoices;
CREATE POLICY "inv_delete_staff" ON invoices FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'secretary')
  );

-- EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  description text,
  category text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exp_select_doctor" ON expenses;
CREATE POLICY "exp_select_doctor" ON expenses FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = expenses.doctor_id)
  );

DROP POLICY IF EXISTS "exp_insert_doctor" ON expenses;
CREATE POLICY "exp_insert_doctor" ON expenses FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = expenses.doctor_id)
  );

DROP POLICY IF EXISTS "exp_update_doctor" ON expenses;
CREATE POLICY "exp_update_doctor" ON expenses FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = expenses.doctor_id)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = expenses.doctor_id)
  );

DROP POLICY IF EXISTS "exp_delete_doctor" ON expenses;
CREATE POLICY "exp_delete_doctor" ON expenses FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = expenses.doctor_id)
  );

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "msg_select_participants" ON messages;
CREATE POLICY "msg_select_participants" ON messages FOR SELECT
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "msg_insert_own" ON messages;
CREATE POLICY "msg_insert_own" ON messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "msg_update_own" ON messages;
CREATE POLICY "msg_update_own" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_records_patient ON medical_records (patient_id);
CREATE INDEX IF NOT EXISTS idx_presc_patient ON prescriptions (patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices (patient_id);
CREATE INDEX IF NOT EXISTS idx_expenses_doctor ON expenses (doctor_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages (recipient_id);
