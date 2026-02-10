import { useEffect, useState, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Modelos from "@/pages/Modelos";
import ModeloForm from "@/pages/ModeloForm";
import ModeloDetail from "@/pages/ModeloDetail";
import Produtos from "@/pages/Produtos";
import ProdutoForm from "@/pages/ProdutoForm";
import Clientes from "@/pages/Clientes";
import ClienteForm from "@/pages/ClienteForm";
import PontoVenda from "@/pages/PontoVenda";
import Vendas from "@/pages/Vendas";
import VendaDetail from "@/pages/VendaDetail";

// Components
import Sidebar from "@/components/Sidebar";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-[#D4AF37] text-lg">Carregando...</div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Layout with Sidebar
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-6 md:p-8 lg:p-12">
        {children}
      </main>
    </div>
  );
};

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/modelos"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Modelos />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/modelos/novo"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ModeloForm />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/modelos/editar/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ModeloForm />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/modelos/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ModeloDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/produtos"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Produtos />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/produtos/novo"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProdutoForm />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/produtos/editar/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProdutoForm />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Clientes />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes/novo"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ClienteForm />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes/editar/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ClienteForm />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ponto-venda"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PontoVenda />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendas"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Vendas />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendas/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <VendaDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Error parsing stored user:", e);
        }
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  // Axios interceptor for auth
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
          toast.error("Sessão expirada. Faça login novamente.");
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      <div className="App">
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
        <Toaster 
          position="top-right" 
          richColors 
          theme="dark"
          toastOptions={{
            style: {
              background: '#141414',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
            },
          }}
        />
      </div>
    </AuthContext.Provider>
  );
}

export default App;
