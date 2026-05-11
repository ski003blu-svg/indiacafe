import { Link } from "wouter";
import {
  LayoutDashboard,
  ShoppingCart,
  MenuSquare,
  Tags,
  MessageSquare,
  MessageCircle,
  LogOut
} from "lucide-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export function AdminSidebar() {
  const handleLogout = () => {
    localStorage.removeItem("india_cafe_admin_token");
    window.location.href = "/admin";
  };

  return (
    <div className="w-64 bg-sidebar border-r min-h-screen flex flex-col">
      <div className="p-6">
        <h2 className="font-serif text-xl font-bold text-sidebar-foreground">India Cafe Admin</h2>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground">
          <LayoutDashboard size={18} /> Dashboard
        </Link>
        <Link href="/admin/orders" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground">
          <ShoppingCart size={18} /> Orders
        </Link>
        <Link href="/admin/menu" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground">
          <MenuSquare size={18} /> Menu Items
        </Link>
        <Link href="/admin/categories" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground">
          <Tags size={18} /> Categories
        </Link>
        <Link href="/admin/messages" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground">
          <MessageSquare size={18} /> Messages
        </Link>
        <Link href="/admin/testimonials" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground">
          <MessageCircle size={18} /> Testimonials
        </Link>
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
