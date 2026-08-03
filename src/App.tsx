import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { SettingsProvider } from './lib/settings';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';

import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAgenda from './pages/doctor/DoctorAgenda';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorRecords from './pages/doctor/DoctorRecords';
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions';
import DoctorFinancial from './pages/doctor/DoctorFinancial';
import DoctorProfile from './pages/doctor/DoctorProfile';
import MessagesPage from './pages/shared/MessagesPage';

import SecretaryDashboard from './pages/secretary/SecretaryDashboard';
import SecretaryAgenda from './pages/secretary/SecretaryAgenda';
import SecretaryPatients from './pages/secretary/SecretaryPatients';
import SecretaryInvoices from './pages/secretary/SecretaryInvoices';

import PatientDashboard from './pages/patient/PatientDashboard';
import PatientAppointments from './pages/patient/PatientAppointments';
import { PatientRecords, PatientPrescriptions, PatientInvoices } from './pages/patient/PatientPages';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Routes>
        <Route path="/login" element={<AuthPage />} />

        {/* Doctor routes */}
        <Route path="/doctor" element={<ProtectedRoute roles={['doctor']}><Layout><DoctorDashboard /></Layout></ProtectedRoute>} />
        <Route path="/doctor/agenda" element={<ProtectedRoute roles={['doctor']}><Layout><DoctorAgenda /></Layout></ProtectedRoute>} />
        <Route path="/doctor/patients" element={<ProtectedRoute roles={['doctor']}><Layout><DoctorPatients /></Layout></ProtectedRoute>} />
        <Route path="/doctor/records" element={<ProtectedRoute roles={['doctor']}><Layout><DoctorRecords /></Layout></ProtectedRoute>} />
        <Route path="/doctor/prescriptions" element={<ProtectedRoute roles={['doctor']}><Layout><DoctorPrescriptions /></Layout></ProtectedRoute>} />
        <Route path="/doctor/financial" element={<ProtectedRoute roles={['doctor']}><Layout><DoctorFinancial /></Layout></ProtectedRoute>} />
        <Route path="/doctor/profile" element={<ProtectedRoute roles={['doctor']}><Layout><DoctorProfile /></Layout></ProtectedRoute>} />
        <Route path="/doctor/messages" element={<ProtectedRoute roles={['doctor']}><Layout><MessagesPage /></Layout></ProtectedRoute>} />

        {/* Secretary routes */}
        <Route path="/secretary" element={<ProtectedRoute roles={['secretary']}><Layout><SecretaryDashboard /></Layout></ProtectedRoute>} />
        <Route path="/secretary/agenda" element={<ProtectedRoute roles={['secretary']}><Layout><SecretaryAgenda /></Layout></ProtectedRoute>} />
        <Route path="/secretary/patients" element={<ProtectedRoute roles={['secretary']}><Layout><SecretaryPatients /></Layout></ProtectedRoute>} />
        <Route path="/secretary/invoices" element={<ProtectedRoute roles={['secretary']}><Layout><SecretaryInvoices /></Layout></ProtectedRoute>} />
        <Route path="/secretary/messages" element={<ProtectedRoute roles={['secretary']}><Layout><MessagesPage /></Layout></ProtectedRoute>} />

        {/* Patient routes */}
        <Route path="/patient" element={<ProtectedRoute roles={['patient']}><Layout><PatientDashboard /></Layout></ProtectedRoute>} />
        <Route path="/patient/appointments" element={<ProtectedRoute roles={['patient']}><Layout><PatientAppointments /></Layout></ProtectedRoute>} />
        <Route path="/patient/records" element={<ProtectedRoute roles={['patient']}><Layout><PatientRecords /></Layout></ProtectedRoute>} />
        <Route path="/patient/prescriptions" element={<ProtectedRoute roles={['patient']}><Layout><PatientPrescriptions /></Layout></ProtectedRoute>} />
        <Route path="/patient/invoices" element={<ProtectedRoute roles={['patient']}><Layout><PatientInvoices /></Layout></ProtectedRoute>} />
        <Route path="/patient/messages" element={<ProtectedRoute roles={['patient']}><Layout><MessagesPage /></Layout></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </SettingsProvider>
    </AuthProvider>
  );
}
