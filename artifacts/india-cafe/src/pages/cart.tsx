import { Link } from "wouter";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, Trash2, ArrowRight, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

export default function Cart() {
  const { items, removeItem, updateQuantity, updateNotes, getSubtotal, getDiscountAmount } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-4">No products in the cart</h1>
          <p className="text-muted-foreground mb-8">
            Looks like you haven't added anything to your cart yet. Find your next favorite meal.
          </p>
          <Link href="/menu">
            <Button size="lg" className="w-full rounded-full font-bold">
              Browse the menu
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 lg:py-24 max-w-5xl">
      <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8">Your Order</h1>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <motion.div
              key={item.menuItemId}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {item.imageUrl && (
                    <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-muted hidden sm:block">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="font-serif text-lg font-bold truncate">{item.name}</h3>
                      <span className="font-medium whitespace-nowrap">${Number(item.price).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-auto">
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-medium w-4 text-center">{item.quantity}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive ml-2"
                          onClick={() => removeItem(item.menuItemId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="font-medium text-lg w-full sm:w-auto text-right">
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
                  <Input 
                    placeholder="Add special instructions (optional)..." 
                    value={item.notes || ""}
                    onChange={(e) => updateNotes(item.menuItemId, e.target.value)}
                    className="text-sm bg-muted/50 border-none h-9"
                  />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-primary/20 shadow-md">
            <CardContent className="p-6">
              <h2 className="font-serif text-xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${getSubtotal().toFixed(2)}</span>
                </div>
                {getDiscountAmount() > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount (PROMO 2025)</span>
                    <span>-${getDiscountAmount().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground text-xs italic">
                  <span>Taxes and delivery calculated at checkout</span>
                </div>
              </div>
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Estimated Total</span>
                  <span>${(getSubtotal() - getDiscountAmount()).toFixed(2)}</span>
                </div>
              </div>
              <Link href="/checkout">
                <Button className="w-full rounded-full" size="lg">
                  Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
