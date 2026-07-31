/*
# Drop old schema tables

The old schema had `doctors` (with name/phone/email columns) and `appointments` (with patient_name/patient_phone).
These are incompatible with the new multi-role schema. Both tables have 0 rows.
*/

DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
