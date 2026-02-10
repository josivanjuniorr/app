import { useEffect, useState, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Home & Auth Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";

// Store Pages
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

// Admin Pages
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminLojas from "@/pages/admin/AdminLojas";
import AdminLojaForm from "@/pages/admin/AdminLojaForm";
import AdminUsuarios from "@/pages/admin/AdminUsuarios";
import AdminUsuarioForm from "@/pages/admin/AdminUsuarioForm";

// Components
import Sidebar from "@/components/Sidebar";
import AdminSidebar from "@/components/AdminSidebar";

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

// Protected Route for Store
const ProtectedStoreRoute = ({ children }) => {
  const { token, user, loading } = useAuth();
  const location = useLocation();
  const slug = location.pathname.split('/')[1];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-[#D4AF37] text-lg">Carregando...</div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to={`/${slug}/login`} state={{ from: location }} replace />;
  }

  if (user.role === "super_admin") {
    return <Navigate to="/admin" replace />;
  }

  // Verify user has access to this store
  if (user.loja_slug !== slug) {
    return <Navigate to={`/${user.loja_slug}`} replace />;
  }

  return children;
};

// Protected Route for Admin
const ProtectedAdminRoute = ({ children }) => {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-[#D4AF37] text-lg">Carregando...</div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (user.role !== "super_admin") {
    return <Navigate to={`/${user.loja_slug}`} replace />;
  }

  return children;
};

// Store Layout with Sidebar
const StoreLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const slug = location.pathname.split('/')[1];
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <Sidebar lojaSlug={slug} lojaNome={user?.loja_nome} />
      <main className="flex-1 ml-64 p-6 md:p-8 lg:p-12">
        {children}
      </main>
    </div>
  );
};

// Admin Layout with Sidebar
const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-6 md:p-8 lg:p-12">
        {children}
      </main>
    </div>
  );
};

function AppContent() {
  return (
    <Routes>
      {/* Home - Store Domain Entry */}
      <Route path="/" element={<Home />} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={
        <ProtectedAdminRoute>
          <AdminLayout><AdminDashboard /></AdminLayout>
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/lojas" element={
        <ProtectedAdminRoute>
          <AdminLayout><AdminLojas /></AdminLayout>
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/lojas/nova" element={
        <ProtectedAdminRoute>
          <AdminLayout><AdminLojaForm /></AdminLayout>
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/lojas/editar/:id" element={
        <ProtectedAdminRoute>
          <AdminLayout><AdminLojaForm /></AdminLayout>
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/usuarios" element={
        <ProtectedAdminRoute>
          <AdminLayout><AdminUsuarios /></AdminLayout>
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/usuarios/novo" element={
        <ProtectedAdminRoute>
          <AdminLayout><AdminUsuarioForm /></AdminLayout>
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/usuarios/editar/:id" element={
        <ProtectedAdminRoute>
          <AdminLayout><AdminUsuarioForm /></AdminLayout>
        </ProtectedAdminRoute>
      } />
      
      {/* Store Login Route */}
      <Route path="/:slug/login" element={<Login />} />
      
      {/* Store Routes - Dynamic slug */}
      <Route path="/:slug" element={
        <ProtectedStoreRoute>
          <StoreLayout><Dashboard /></StoreLayout>
        </ProtectedStoreRoute>
      } />
      <Route path="/:slug/modelos" element={
        <ProtectedStoreRoute>
          <StoreLayout><Modelos /></StoreLayout>
        </ProtectedStoreRoute>
      } />
      <Route path="/:slug/modelos/novo" element={
        <ProtectedStoreRoute>
          <StoreLayout><ModeloForm /></StoreLayout>
        </ProtectedStoreRoute>
      } />
      <Route path="/:slug/modelos/editar/:id" element={
        <ProtectedStoreRoute>
          <StoreLayout><ModeloForm /></StoreLayout>
        </ProtectedStoreRoute>
      } />
      <Route path="/:slug/modelos/:id" element={
        <ProtectedStoreRoute>
          <StoreLayout><ModeloDetail /></StoreLayout>
        </ProtectedStoreRoute>
      } />
      <Route path="/:slug/produtos" element={
        <ProtectedStoreRoute>
          <StoreLayout><Produtos /></StoreLayout>
        </ProtectedStoreRoute>
      } />
      <Route path="/:slug/produtos/novo" element={
        <ProtectedStoreRoute>
          <StoreLayout><ProdutoForm /></StoreLayout>
        </ProtectedStoreRoute>
      } />
      <Route path="/:slug/produtos/editar/:id" element={
        <ProtectedStoreRoute>
          <StoreLayout><ProdutoForm /></StoreLayout>
        </ProtectedStoreRoute>
      } />
      <Route path="/:slug/clientes" element={
        <ProtectedStoreRoute>
          <StoreLayout><Clientes /></StoreLayout>
        </ProtectedStoreRoute>
      } />
      <Route path="/:slug/clientes/novo" element={
        <ProtectedStoreRoute>
          <StoreLayout><ClienteForm /></StoreLayout>
        </ProtectedStoreRoute>
      } />
      <Route path="/:slug/clientes/editar/:id" element={
        <ProtectedStoreRoute>
          <StoreLayout><ClienteForm /></StoreLayout>
        </ProtectedStoreRoute>
      } />
      <Route path="/:slug/ponto-venda" element={
        <ProtectedStoreRoute>
          <StoreLayout><PontoVenda /></StoreLayout>
        </ProtectedStoreRoute>
      } />
      <Route path="/:slug/vendas" element={
        <ProtectedStoreRoute>
          <StoreLayout><Vendas /></StoreLayout>
        </ProtectedStoreRoute>
      } />
      <Route path="/:slug/vendas/:id" element={
        <ProtectedStoreRoute>
          <StoreLayout><VendaDetail /></StoreLayout>
        </ProtectedStoreRoute>
      } />
      
      {/* Fallback */}
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
