import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCart } from "@/store/cart";
import { useCreateOrder, useListLocations, usePaypalSetup } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle } from "lucide-react";
import { apiUrl } from "@/lib/api-url";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const checkoutSchema = z.object({
  orderType: z.enum(["pickup", "delivery"]),
  locationId: z.coerce.number().min(1, "Please select a location"),
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().min(10, "Valid phone number is required"),
  deliveryStreet: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryState: z.string().optional(),
  deliveryZip: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.orderType === "delivery") {
    if (!data.deliveryStreet?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Street address is required", path: ["deliveryStreet"] });
    }
    if (!data.deliveryCity?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "City is required", path: ["deliveryCity"] });
    }
    if (!data.deliveryState?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "State is required", path: ["deliveryState"] });
    }
    if (!data.deliveryZip?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ZIP code is required", path: ["deliveryZip"] });
    }
  }
});

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, getSubtotal, getDiscountAmount, promoCode, applyPromoCode, clearCart } = useCart();
  const { data: locations, isLoading: isLoadingLocations } = useListLocations();
  const { data: paypalSetup, isLoading: isLoadingPaypal } = usePaypalSetup();
  const createOrder = useCreateOrder();
  const { user } = useUser();

  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [tipPercentage, setTipPercentage] = useState<number>(15);
  const [promoInput, setPromoInput] = useState(promoCode || "");
  const [radiusError, setRadiusError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      orderType: "pickup",
      locationId: locations?.[0]?.id || 0,
      customerName: user?.fullName ?? "",
      customerEmail: user?.primaryEmailAddress?.emailAddress ?? "",
      customerPhone: user?.phoneNumbers?.[0]?.phoneNumber ?? "",
      deliveryStreet: "",
      deliveryCity: "",
      deliveryState: "IA",
      deliveryZip: "",
      notes: "",
    },
  });

  const orderType = form.watch("orderType");
  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = discountedSubtotal * 0.07;
  const deliveryFee = orderType === "delivery" ? 4.99 : 0;
  const tipAmount = (discountedSubtotal * tipPercentage) / 100;
  const total = discountedSubtotal + tax + deliveryFee + tipAmount;

  const handleApplyPromo = () => {
    if (promoInput.trim().toLowerCase() === "2025") {
      applyPromoCode(promoInput.trim());
      toast.success("Promo code applied!");
    } else {
      toast.error("Invalid promo code");
      applyPromoCode(null);
    }
  };

  if (items.length === 0) {
    setLocation("/cart");
    return null;
  }

  if (isLoadingLocations || isLoadingPaypal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  async function onSubmit(values: z.infer<typeof checkoutSchema>) {
    setRadiusError(null);
    try {
      const deliveryAddress = values.orderType === "delivery"
        ? `${values.deliveryStreet}, ${values.deliveryCity}, ${values.deliveryState} ${values.deliveryZip}`
        : undefined;

      const orderNotes = promoCode && promoCode.toLowerCase() === "2025"
        ? `${values.notes ? values.notes + "\n\n" : ""}[PROMO: 2025 APPLIED]`
        : values.notes;

      const order = await createOrder.mutateAsync({
        data: {
          orderType: values.orderType,
          locationId: values.locationId,
          customerName: values.customerName,
          customerEmail: values.customerEmail,
          customerPhone: values.customerPhone,
          deliveryAddress,
          notes: orderNotes,
          tipAmount: tipAmount.toFixed(2),
          items: items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            notes: i.notes || null,
          })),
        },
      });
      setCreatedOrderId(order.id);
      toast.success("Order created! Please complete payment.");
    } catch (error: any) {
      const msg = error?.response?.data?.error ?? error?.message ?? "";
      if (msg.toLowerCase().includes("radius") || msg.toLowerCase().includes("mile")) {
        setRadiusError(msg);
      } else {
        toast.error("Failed to create order. Please try again.");
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 lg:py-24 max-w-6xl">
      <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {!createdOrderId ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-serif text-xl font-bold">Order Details</h3>
                        <FormField
                          control={form.control}
                          name="orderType"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Order Type</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={(v) => { field.onChange(v); setRadiusError(null); }}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="pickup" /></FormControl>
                                    <FormLabel className="font-normal">Pickup</FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="delivery" /></FormControl>
                                    <FormLabel className="font-normal">Delivery</FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="locationId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Location</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {locations?.map((loc) => (
                                    <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4 pt-4 border-t border-border/50">
                        <h3 className="font-serif text-xl font-bold">Contact Information</h3>
                        <FormField
                          control={form.control}
                          name="customerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="customerEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="customerPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl><Input type="tel" placeholder="(555) 123-4567" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {orderType === "delivery" && (
                          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                            <h4 className="font-medium text-sm">Delivery Address</h4>
                            <p className="text-xs text-muted-foreground -mt-2">Delivery is available within 10 miles of our locations.</p>

                            {radiusError && (
                              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{radiusError}</span>
                              </div>
                            )}

                            <FormField
                              control={form.control}
                              name="deliveryStreet"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Street Address</FormLabel>
                                  <FormControl><Input placeholder="123 Main St" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="deliveryCity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>City</FormLabel>
                                    <FormControl><Input placeholder="Iowa City" {...field} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="deliveryState"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>State</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {US_STATES.map((s) => (
                                          <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={form.control}
                              name="deliveryZip"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ZIP Code</FormLabel>
                                  <FormControl><Input placeholder="52240" maxLength={10} {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Order Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Any special instructions for the kitchen or driver?" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="pt-4 border-t border-border/50">
                        <Button type="submit" className="w-full rounded-full" size="lg" disabled={createOrder.isPending}>
                          {createOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Continue to Payment
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-primary bg-primary/5">
                <CardContent className="p-8 text-center">
                  <h3 className="font-serif text-2xl font-bold mb-2">Complete Payment</h3>
                  <p className="text-muted-foreground mb-8">Please complete your payment securely with PayPal to finalize your order.</p>

                  {paypalSetup?.clientId ? (
                    <PayPalScriptProvider options={{ clientId: paypalSetup.clientId, currency: "USD", intent: "capture" }}>
                      <PayPalButtons
                        style={{ layout: "vertical", shape: "rect", color: "gold" }}
                        createOrder={async () => {
                          const r = await fetch(apiUrl("/api/paypal/create-order"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ orderId: createdOrderId }),
                          });
                          const data = await r.json();
                          return data.id;
                        }}
                        onApprove={async (data) => {
                          try {
                            const r = await fetch(apiUrl(`/api/paypal/capture-order/${data.orderID}`), { method: "POST" });
                            if (!r.ok) throw new Error("Capture failed");
                            clearCart();
                            toast.success("Payment successful!");
                            setLocation(`/order/${createdOrderId}`);
                          } catch {
                            toast.error("Failed to capture payment.");
                          }
                        }}
                        onError={() => toast.error("An error occurred during payment.")}
                      />
                    </PayPalScriptProvider>
                  ) : (
                    <p className="text-destructive">PayPal is not configured. Please contact us to complete your order.</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-24 border-primary/20 shadow-md">
            <CardContent className="p-6">
              <h2 className="font-serif text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                    <span className="font-medium">${(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {!createdOrderId && (
                <div className="mb-6 pt-4 border-t border-border/50">
                  <Label className="block mb-3">Add a Tip</Label>
                  <div className="flex flex-wrap gap-2">
                    {[0, 10, 15, 20].map((pct) => (
                      <Button
                        key={pct}
                        type="button"
                        variant={tipPercentage === pct ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTipPercentage(pct)}
                        className="rounded-full flex-1"
                      >
                        {pct}%
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {!createdOrderId && (
                <div className="mb-6 pt-4 border-t border-border/50">
                  <Label className="block mb-3">Promo code</Label>
                  <div className="flex gap-2">
                    <Input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Enter code"
                      className="bg-muted/50"
                    />
                    <Button type="button" variant="secondary" onClick={handleApplyPromo}>Apply</Button>
                  </div>
                </div>
              )}

              <div className="space-y-3 text-sm mb-6 pt-4 border-t border-border/50">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount (PROMO 2025)</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (7%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {orderType === "delivery" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {tipAmount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Tip ({tipPercentage}%)</span>
                    <span>${tipAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-border/50 pt-4">
                <div className="flex justify-between items-center font-bold text-xl">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Discount will be applied when our team confirms your order.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
