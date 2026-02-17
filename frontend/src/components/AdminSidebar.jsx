import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  LogOut,
  Shield,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminSidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const menuItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
    { path: "/admin/lojas", icon: Store, label: "Lojas" },
    { path: "/admin/usuarios", icon: Users, label: "Usuários" },
    { path: "/admin/importar", icon: Upload, label: "Importar Dados" },
  ];

  return (
    <aside 
      className="fixed left-0 top-0 h-screen w-64 bg-[#0F0F0F] border-r border-white/5 flex flex-col z-50"
      data-testid="admin-sidebar"
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-['Outfit']">CellControl</h1>
            <p className="text-xs text-purple-400">Super Admin</p>
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
            data-testid={`admin-sidebar-link-${item.path.split('/').pop() || "dashboard"}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-purple-600/10 text-purple-400 border-l-[3px] border-purple-500"
                  : "text-gray-400 hover:text-purple-400 hover:bg-purple-600/5"
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
            <p className="text-xs text-gray-500 uppercase tracking-wider">Super Admin</p>
            <p className="text-sm text-gray-300 truncate">{user.user_email}</p>
          </div>
        )}
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-400 hover:text-red-400 hover:bg-red-400/10"
          data-testid="admin-logout-button"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </Button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
