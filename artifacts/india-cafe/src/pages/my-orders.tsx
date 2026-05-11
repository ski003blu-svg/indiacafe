import { useUser } from "@clerk/react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Clock, CheckCircle, XCircle, ChefHat, Bike } from "lucide-react";
import { apiUrl } from "@/lib/api-url";
import { motion } from "framer-motion";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_payment: { label: "Awaiting Payment", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3 h-3" /> },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-3 h-3" /> },
  preparing: { label: "Preparing", color: "bg-orange-100 text-orange-800", icon: <ChefHat className="w-3 h-3" /> },
  out_for_delivery: { label: "Out for Delivery", color: "bg-purple-100 text-purple-800", icon: <Bike className="w-3 h-3" /> },
  ready: { label: "Ready for Pickup", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: <XCircle className="w-3 h-3" /> },
};

type Order = {
  id: number;
  orderNumber: string;
  status: string;
  orderType: string;
  total: string;
  createdAt: string;
  items: { name: string; quantity: number }[];
};

export default function MyOrders() {
  const { user, isLoaded } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setLoading(false);
      return;
    }
    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) {
      setLoading(false);
      return;
    }
    fetch(apiUrl(`/api/orders/by-email?email=${encodeURIComponent(email)}`))

      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
        else setError("Failed to load orders.");
      })
      .catch(() => setError("Failed to load orders."))
      .finally(() => setLoading(false));
  }, [user, isLoaded]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-md">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
        <h1 className="font-serif text-3xl font-bold mb-4">My Orders</h1>
        <p className="text-muted-foreground mb-8">Sign in to view your past orders.</p>
        <Link href="/sign-in">
          <Button size="lg" className="rounded-full">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8">My Orders</h1>

      {error && (
        <div className="text-destructive text-center py-8">{error}</div>
      )}

      {!error && orders.length === 0 && (
        <div className="text-center py-24 bg-muted/30 rounded-2xl">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No orders yet</h3>
          <p className="text-muted-foreground mb-6">Place your first order and it will appear here.</p>
          <Link href="/menu">
            <Button className="rounded-full">Browse Menu</Button>
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order, i) => {
          const statusCfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: "bg-muted text-muted-foreground", icon: null };
          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono font-bold text-sm">#{order.orderNumber}</span>
                        <Badge className={`text-xs gap-1 ${statusCfg.color} border-0`}>
                          {statusCfg.icon} {statusCfg.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric", month: "long", day: "numeric",
                        })} · {order.orderType === "delivery" ? "Delivery" : "Pickup"}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {order.items?.map((it: any) => `${it.quantity}x ${it.name}`).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${Number(order.total).toFixed(2)}</p>
                      <Link href={`/order/${order.id}`}>
                        <Button variant="outline" size="sm" className="mt-2 rounded-full text-xs">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
