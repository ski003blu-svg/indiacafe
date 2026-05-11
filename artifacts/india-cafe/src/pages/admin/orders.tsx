import { useState } from "react";
import { useAdminListOrders, getAdminListOrdersQueryKey, useAdminUpdateOrder } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { toast } from "sonner";
import { Printer, Eye, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useAdminListOrders({
    status: statusFilter !== "all" ? statusFilter : undefined,
    orderType: typeFilter !== "all" ? typeFilter : undefined,
  });

  const updateOrder = useAdminUpdateOrder();

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await updateOrder.mutateAsync({
        id,
        data: { status }
      });
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: getAdminListOrdersQueryKey() });
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_payment": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>;
      case "paid": return <Badge variant="outline" className="bg-blue-50 text-blue-700">Paid</Badge>;
      case "preparing": return <Badge variant="outline" className="bg-orange-50 text-orange-700">Preparing</Badge>;
      case "ready": return <Badge variant="outline" className="bg-green-50 text-green-700">Ready</Badge>;
      case "completed": return <Badge variant="default">Completed</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold">Orders</h1>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_payment">Pending Payment</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{format(new Date(order.createdAt), "MMM d, h:mm a")}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell className="capitalize">{order.orderType}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">${Number(order.total).toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedOrderId(order.id)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex justify-between items-center">
                              <span>Order #{order.orderNumber}</span>
                              <Button variant="outline" size="sm" onClick={() => window.print()} className="no-print">
                                <Printer className="w-4 h-4 mr-2" /> Print
                              </Button>
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-6 print:space-y-4">
                            <div className="flex justify-between items-center border-b pb-4 no-print">
                              <div className="flex items-center gap-4">
                                <span className="font-medium">Update Status:</span>
                                <Select 
                                  defaultValue={order.status} 
                                  onValueChange={(val) => handleStatusUpdate(order.id, val)}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending_payment">Pending Payment</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="preparing">Preparing</SelectItem>
                                    <SelectItem value="ready">Ready</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase">Customer Details</h4>
                                <p className="font-medium mt-1">{order.customerName}</p>
                                <p className="text-sm">{order.customerEmail}</p>
                                <p className="text-sm">{order.customerPhone}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase">Order Details</h4>
                                <p className="mt-1 text-sm"><span className="font-medium">Type:</span> {order.orderType}</p>
                                <p className="text-sm"><span className="font-medium">Location:</span> {order.locationName}</p>
                                {order.deliveryAddress && (
                                  <p className="text-sm"><span className="font-medium">Address:</span> {order.deliveryAddress}</p>
                                )}
                                {order.notes && (
                                  <p className="text-sm"><span className="font-medium">Notes:</span> {order.notes}</p>
                                )}
                              </div>
                            </div>

                            {/* Delivery photo submission link */}
                            {order.orderType === "delivery" && (
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2">Delivery Photo</h4>
                                {(order as any).deliveryPhotoUrl ? (
                                  <div className="space-y-2">
                                    <img
                                      src={(order as any).deliveryPhotoUrl}
                                      alt="Delivery confirmation"
                                      className="rounded-lg max-h-48 object-cover border border-border"
                                    />
                                    <p className="text-xs text-muted-foreground">Delivery confirmed by photo</p>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">No photo submitted yet.</p>
                                    <p className="text-xs text-muted-foreground">
                                      Share this link with the delivery person:{" "}
                                      <a
                                        href={`/delivery-photo/${order.orderNumber}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary underline break-all"
                                      >
                                        /delivery-photo/{order.orderNumber}
                                      </a>
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            <div>
                              <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2">Items</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {order.items.map(item => (
                                    <TableRow key={item.id}>
                                      <TableCell>
                                        <p className="font-medium">{item.name}</p>
                                        {item.notes && <p className="text-xs text-muted-foreground italic">{item.notes}</p>}
                                      </TableCell>
                                      <TableCell className="text-center">{item.quantity}</TableCell>
                                      <TableCell className="text-right">${(Number(item.price) * item.quantity).toFixed(2)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>

                            <div className="flex justify-end">
                              <div className="w-64 space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Subtotal</span>
                                  <span>${Number(order.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Tax</span>
                                  <span>${Number(order.tax).toFixed(2)}</span>
                                </div>
                                {Number(order.deliveryFee) > 0 && (
                                  <div className="flex justify-between">
                                    <span>Delivery Fee</span>
                                    <span>${Number(order.deliveryFee).toFixed(2)}</span>
                                  </div>
                                )}
                                {Number(order.tipAmount) > 0 && (
                                  <div className="flex justify-between">
                                    <span>Tip</span>
                                    <span>${Number(order.tipAmount).toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                  <span>Total</span>
                                  <span>${Number(order.total).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
                {orders?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No orders found matching the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
