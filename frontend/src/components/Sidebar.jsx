import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { 
  LayoutDashboard, 
  Smartphone, 
  Package, 
  Users, 
  ShoppingCart, 
  Receipt, 
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { path: "/", icon: LayoutDashboard, label: "Início" },
    { path: "/modelos", icon: Smartphone, label: "Modelos" },
    { path: "/produtos", icon: Package, label: "Produtos" },
    { path: "/clientes", icon: Users, label: "Clientes" },
    { path: "/ponto-venda", icon: ShoppingCart, label: "Ponto de Venda" },
    { path: "/vendas", icon: Receipt, label: "Vendas" },
  ];

  return (
    <aside 
      className="fixed left-0 top-0 h-screen w-64 bg-[#0F0F0F] border-r border-white/5 flex flex-col z-50"
      data-testid="sidebar"
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37] flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-['Outfit']">Isaac Imports</h1>
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
            end={item.path === "/"}
            data-testid={`sidebar-link-${item.path.replace("/", "") || "home"}`}
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
