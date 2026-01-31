import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useAppStore } from "./stores/appStore";

// Pages
import { Home } from "./pages/Home";
import { PatientDashboard } from "./pages/patient/Dashboard";
import { PatientChat } from "./pages/patient/Chat";
import { ProviderDashboard } from "./pages/provider/Dashboard";
import { PatientDetail } from "./pages/provider/PatientDetail";
import { RegisterPage } from "./pages/Signup";
import { useEffect } from "react";

// Role-based route protection
function RoleRoute({
  role,
  children,
}: {
  role: "patient" | "provider";
  children: React.ReactNode;
}) {
  const { role: currentRole } = useAppStore();
  const nav = useNavigate();
  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("http://localhost:8000/auth/getuser");
      if (!res.ok) {
        nav("/");
      }
    };
    checkAuth();
  }, [nav]);

  if (currentRole !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home / Role selector */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<RegisterPage></RegisterPage>} />

        {/* Patient routes */}
        <Route
          path="/patient"
          element={
            <RoleRoute role="patient">
              <PatientDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/patient/chat"
          element={
            <RoleRoute role="patient">
              <PatientChat />
            </RoleRoute>
          }
        />

        {/* Provider routes */}
        <Route
          path="/provider"
          element={
            <RoleRoute role="provider">
              <ProviderDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/patient/:id"
          element={
            <RoleRoute role="provider">
              <PatientDetail />
            </RoleRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
