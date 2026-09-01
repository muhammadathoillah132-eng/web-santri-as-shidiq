import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "sonner";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import Layout from "@/pages/Layout";
import Dashboard from "@/pages/Dashboard";
import Santri from "@/pages/Santri";
import SantriDetail from "@/pages/SantriDetail";
import Pembayaran from "@/pages/Pembayaran";
import Tagihan from "@/pages/Tagihan";
import Laporan from "@/pages/Laporan";
import MasterData from "@/pages/MasterData";
import ManajemenAdmin from "@/pages/ManajemenAdmin";
import Aktivitas from "@/pages/Aktivitas";
import Pengaturan from "@/pages/Pengaturan";

function Protected({ children, requireSuper }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-emerald-800">Memuat…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireSuper && user.role !== "super_admin") return <Navigate to="/" replace />;
  return children;
}

function AppRouter() {
  const location = useLocation();
  // Detect OAuth callback in URL hash before any protected route runs
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="santri" element={<Santri />} />
        <Route path="santri/:id" element={<SantriDetail />} />
        <Route path="pembayaran" element={<Pembayaran />} />
        <Route path="tagihan" element={<Tagihan />} />
        <Route path="laporan" element={<Laporan />} />
        <Route path="master-data" element={<MasterData />} />
        <Route path="admin" element={<Protected requireSuper><ManajemenAdmin /></Protected>} />
        <Route path="aktivitas" element={<Protected requireSuper><Aktivitas /></Protected>} />
        <Route path="pengaturan" element={<Pengaturan />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}
