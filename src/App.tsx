import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminRoute, MemberRoute } from './components/auth/ProtectedRoute';
import { GymDataProvider } from './context/GymDataProvider';

import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

import HomePage from './pages/public/HomePage';
import OwnerPage from './pages/public/OwnerPage';
import LegalPage from './pages/public/LegalPage';
import MemberLoginPage from './pages/public/MemberLoginPage';

import AdminLoginPage from './pages/admin/AdminLoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import MembersPage from './pages/admin/MembersPage';
import PlansPage from './pages/admin/PlansPage';
import PaymentsPage from './pages/admin/PaymentsPage';
import ExpensesPage from './pages/admin/ExpensesPage';
import AttendancePage from './pages/admin/AttendancePage';
import LeadsPage from './pages/admin/LeadsPage';
import WebsitePage from './pages/admin/WebsitePage';
import MessagesPage from './pages/admin/MessagesPage';
import TeamPage from './pages/admin/TeamPage';
import ProfilePage from './pages/admin/ProfilePage';

import MemberAppPage from './pages/member/MemberAppPage';
import CheckInPage from './pages/checkin/CheckInPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="register" element={<Navigate to="/" replace />} />
          <Route path="login" element={<MemberLoginPage />} />
          <Route path="owner" element={<OwnerPage />} />
          <Route path="legal/:page" element={<LegalPage />} />
        </Route>

        <Route path="member" element={<MemberRoute><MemberAppPage /></MemberRoute>} />
        <Route path="checkin" element={<CheckInPage />} />

        <Route path="admin/login" element={<AdminLoginPage />} />

        <Route
          path="admin"
          element={
            <AdminRoute>
              <GymDataProvider>
                <AdminLayout />
              </GymDataProvider>
            </AdminRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="website" element={<WebsitePage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
