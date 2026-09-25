import { Routes, Route } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute, PublicOnlyRoute } from "@/routes/ProtectedRoute";

import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";

import DashboardPage from "@/pages/DashboardPage";
import ServidoresPage from "@/pages/ServidoresPage";
import ServidorDetailPage from "@/pages/ServidorDetailPage";
import ClientesPage from "@/pages/ClientesPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/cadastro" element={<SignupPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      </Route>

      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/servidores" element={<ServidoresPage />} />
          <Route path="/servidores/:id" element={<ServidorDetailPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
