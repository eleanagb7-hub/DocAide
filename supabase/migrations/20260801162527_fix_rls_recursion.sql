/*
# Fix infinite RLS recursion on profiles

The `profiles_select_staff` policy (and several others) reference the `profiles` table
in their USING clause, causing infinite recursion in PostgreSQL. This makes ALL SELECT
queries on `profiles` fail — including a user reading their own profile — which blocks
login entirely.

Fix: create a SECURITY DEFINER function `is_secretary()` that reads the role from
profiles as the owner (bypassing RLS), and replace every self-referencing subquery.
*/

CREATE OR REPLACE FUNCTION public.is_secretary()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'secretary'
  );
$$;

-- Revoke EXECUTE from anon/authenticated so it can't be called via REST
REVOKE EXECUTE ON FUNCTION public.is_secretary() FROM anon, authenticated;

-- ============ Fix profiles policies ============
DROP POLICY IF EXISTS "profiles_select_staff" ON profiles;
CREATE POLICY "profiles_select_staff" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid())
    OR public.is_secretary()
  );

-- ============ Fix patients policies ============
DROP POLICY IF EXISTS "patients_select_staff" ON patients;
CREATE POLICY "patients_select_staff" ON patients FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid())
    OR public.is_secretary()
  );

DROP POLICY IF EXISTS "patients_insert_staff" ON patients;
CREATE POLICY "patients_insert_staff" ON patients FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid())
    OR public.is_secretary()
  );

DROP POLICY IF EXISTS "patients_update_staff" ON patients;
CREATE POLICY "patients_update_staff" ON patients FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid())
    OR public.is_secretary()
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid())
    OR public.is_secretary()
  );

DROP POLICY IF EXISTS "patients_delete_staff" ON patients;
CREATE POLICY "patients_delete_staff" ON patients FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors WHERE doctors.user_id = auth.uid())
    OR public.is_secretary()
  );

-- ============ Fix appointments policies ============
DROP POLICY IF EXISTS "appt_select_secretary" ON appointments;
CREATE POLICY "appt_select_secretary" ON appointments FOR SELECT
  TO authenticated USING (public.is_secretary());

DROP POLICY IF EXISTS "appt_insert_staff" ON appointments;
CREATE POLICY "appt_insert_staff" ON appointments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid())
    OR public.is_secretary()
    OR EXISTS (SELECT 1 FROM patients pat WHERE pat.user_id = auth.uid() AND pat.id = appointments.patient_id)
  );

DROP POLICY IF EXISTS "appt_update_staff" ON appointments;
CREATE POLICY "appt_update_staff" ON appointments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = appointments.doctor_id)
    OR public.is_secretary()
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid())
    OR public.is_secretary()
  );

DROP POLICY IF EXISTS "appt_delete_staff" ON appointments;
CREATE POLICY "appt_delete_staff" ON appointments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.id = appointments.doctor_id)
    OR public.is_secretary()
  );

-- ============ Fix invoices policies ============
DROP POLICY IF EXISTS "inv_insert_staff" ON invoices;
CREATE POLICY "inv_insert_staff" ON invoices FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid())
    OR public.is_secretary()
  );

DROP POLICY IF EXISTS "inv_update_staff" ON invoices;
CREATE POLICY "inv_update_staff" ON invoices FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid())
    OR public.is_secretary()
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid())
    OR public.is_secretary()
  );

DROP POLICY IF EXISTS "inv_delete_staff" ON invoices;
CREATE POLICY "inv_delete_staff" ON invoices FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid())
    OR public.is_secretary()
  );
