import { useState, useEffect } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { 
  LayoutDashboard, 
  Smartphone, 
  Package, 
  Users, 
  ShoppingCart, 
  Receipt, 
  LogOut,
  Store
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Sidebar = ({ lojaSlug, lojaNome }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams();
  const currentSlug = lojaSlug || slug || user?.loja_slug;
  
  const [lojaInfo, setLojaInfo] = useState({ nome: lojaNome, logo_url: null });

  useEffect(() => {
    if (currentSlug) {
      fetchLojaInfo();
    }
  }, [currentSlug]);

  const fetchLojaInfo = async () => {
    try {
      const response = await axios.get(`${API}/loja/${currentSlug}/verify`);
      setLojaInfo({
        nome: response.data.nome,
        logo_url: response.data.logo_url
      });
    } catch (error) {
      console.error("Error fetching store info:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const basePath = `/${currentSlug}`;

  const menuItems = [
    { path: basePath, icon: LayoutDashboard, label: "Início", end: true },
    { path: `${basePath}/modelos`, icon: Smartphone, label: "Modelos" },
    { path: `${basePath}/produtos`, icon: Package, label: "Produtos" },
    { path: `${basePath}/clientes`, icon: Users, label: "Clientes" },
    { path: `${basePath}/ponto-venda`, icon: ShoppingCart, label: "Ponto de Venda" },
    { path: `${basePath}/vendas`, icon: Receipt, label: "Vendas" },
  ];

  return (
    <aside 
      className="fixed left-0 top-0 h-screen w-64 bg-[#0F0F0F] border-r border-white/5 flex flex-col z-50"
      data-testid="sidebar"
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          {lojaInfo.logo_url ? (
            <img 
              src={lojaInfo.logo_url} 
              alt={lojaInfo.nome || "Logo"} 
              className="w-10 h-10 rounded-lg object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-10 h-10 rounded-lg bg-[#D4AF37] items-center justify-center ${lojaInfo.logo_url ? 'hidden' : 'flex'}`}
          >
            <Store className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-['Outfit']">{lojaInfo.nome || lojaNome || "CellControl"}</h1>
            <p className="text-xs text-gray-500">Controle de Celulares</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            data-testid={`sidebar-link-${item.path.split('/').pop() || "home"}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-[#D4AF37]/10 text-[#D4AF37] border-l-[3px] border-[#D4AF37]"
                  : "text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-white/5">
        {user && (
          <div className="mb-3 px-4 py-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Logado como</p>
            <p className="text-sm text-gray-300 truncate">{user.user_email}</p>
          </div>
        )}
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-400 hover:text-red-400 hover:bg-red-400/10"
          data-testid="logout-button"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
