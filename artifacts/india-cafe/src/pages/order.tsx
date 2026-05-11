import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, Printer, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function OrderDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const { data: order, isLoading, error } = useGetOrder(id, { 
    query: { enabled: !!id, queryKey: getGetOrderQueryKey(id) } 
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-bold mb-4">Order Not Found</h1>
        <p className="text-muted-foreground">We couldn't find an order with that ID.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_payment": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Payment</Badge>;
      case "paid": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Paid & Confirmed</Badge>;
      case "preparing": return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Preparing</Badge>;
      case "ready": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ready for {order.orderType === 'pickup' ? 'Pickup' : 'Delivery'}</Badge>;
      case "completed": return <Badge variant="default">Completed</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 lg:py-24 max-w-4xl">
      <div className="flex justify-between items-center mb-8 no-print">
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Order Details</h1>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" /> Print Invoice
        </Button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border print:shadow-none print:border-none">
        {/* Invoice Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-8 mb-8">
          <div>
            <h2 className="font-serif text-2xl font-bold text-primary mb-1">India Cafe</h2>
            <p className="text-sm text-muted-foreground">Authentic Indian Cuisine Since 1994</p>
          </div>
          <div className="mt-4 md:mt-0 text-left md:text-right">
            <p className="font-bold text-xl mb-1">Order #{order.orderNumber}</p>
            <p className="text-sm text-muted-foreground">{format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
            <div className="mt-2">{getStatusBadge(order.status)}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Customer Info */}
          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Customer</h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-base">{order.customerName}</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> {order.customerEmail}</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> {order.customerPhone}</p>
            </div>
          </div>

          {/* Order Info */}
          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Order Info</h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-start gap-2">
                <span className="font-medium w-24">Type:</span> 
                <span className="capitalize">{order.orderType}</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-medium w-24">Location:</span> 
                <span>{order.locationName}</span>
              </p>
              {order.orderType === "delivery" && order.deliveryAddress && (
                <p className="flex items-start gap-2">
                  <span className="font-medium w-24 shrink-0">Delivery To:</span> 
                  <span>{order.deliveryAddress}</span>
                </p>
              )}
              {order.notes && (
                <p className="flex items-start gap-2">
                  <span className="font-medium w-24 shrink-0">Notes:</span> 
                  <span className="italic text-muted-foreground">{order.notes}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mb-8">
          <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Items</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Item</th>
                  <th className="text-center p-3 font-medium">Qty</th>
                  <th className="text-right p-3 font-medium">Price</th>
                  <th className="text-right p-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3">
                      <p className="font-medium">{item.name}</p>
                      {item.notes && <p className="text-xs text-muted-foreground italic mt-1">{item.notes}</p>}
                    </td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right">${Number(item.price).toFixed(2)}</td>
                    <td className="p-3 text-right font-medium">${(Number(item.price) * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full md:w-1/2 lg:w-1/3 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            {order.notes?.includes("[PROMO: 2025 APPLIED]") && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Discount (PROMO 2025)</span>
                <span>-${(Number(order.subtotal) * 0.1).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>${Number(order.tax).toFixed(2)}</span>
            </div>
            {Number(order.deliveryFee) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>${Number(order.deliveryFee).toFixed(2)}</span>
              </div>
            )}
            {Number(order.tipAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tip</span>
                <span>${Number(order.tipAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center font-bold text-lg pt-3 border-t">
              <span>Total</span>
              <span>
                ${order.notes?.includes("[PROMO: 2025 APPLIED]") 
                  ? (Number(order.total) - (Number(order.subtotal) * 0.1)).toFixed(2)
                  : Number(order.total).toFixed(2)}
              </span>
            </div>
            {order.notes?.includes("[PROMO: 2025 APPLIED]") && (
              <p className="text-xs text-muted-foreground text-right italic pt-1">
                Discount will be applied when our team confirms your order.
              </p>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>Thank you for choosing India Cafe!</p>
          <p>If you have any questions about your order, please contact us.</p>
        </div>
      </div>
    </div>
  );
}
