import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Public pages
import LandingPage from '../pages/public/LandingPage';
import VerifyLicensePage from '../pages/public/VerifyLicensePage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import { DesignSystem } from '../pages/DesignSystem';

// Shared
import DashboardPage from '../pages/DashboardPage';

// Driver
import ApplyLicensePage from '../pages/driver/ApplyLicensePage';
import MyLicensePage from '../pages/driver/MyLicensePage';
import MyViolationsPage from '../pages/driver/MyViolationsPage';
import MyDisputesPage from '../pages/driver/MyDisputesPage';

// Officer
import RecordViolationPage from '../pages/officer/RecordViolationPage';
import OfficerViolationsPage from '../pages/officer/OfficerViolationsPage';

// Admin
import ApplicationsPage from '../pages/admin/ApplicationsPage';
import AdminDisputesPage from '../pages/admin/AdminDisputesPage';
import AuditLogPage from '../pages/admin/AuditLogPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/verify" element={<VerifyLicensePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/design-system" element={<DesignSystem />} />

      {/* Shared Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Driver routes */}
      <Route
        path="/driver/apply"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <ApplyLicensePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/license"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <MyLicensePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/violations"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <MyViolationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/disputes"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <MyDisputesPage />
          </ProtectedRoute>
        }
      />

      {/* Officer routes */}
      <Route
        path="/officer/record"
        element={
          <ProtectedRoute allowedRoles={['officer']}>
            <RecordViolationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/officer/violations"
        element={
          <ProtectedRoute allowedRoles={['officer']}>
            <OfficerViolationsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin/applications"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ApplicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/disputes"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDisputesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AuditLogPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
