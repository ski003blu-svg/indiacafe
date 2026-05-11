import { useState } from "react";
import { useListCategories, useListMenuItems } from "@workspace/api-client-react";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Search, Plus, Leaf, WheatOff, Flame } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Menu() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  // Dietary filters
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isVegan, setIsVegan] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);

  const { data: categories } = useListCategories();
  const { data: menuItems, isLoading } = useListMenuItems({ 
    search: search || undefined,
    categoryId: selectedCategory || undefined
  });
  
  const addItem = useCart(state => state.addItem);

  // Filter items by dietary preferences locally (since API might not have these params directly in list)
  const filteredItems = menuItems?.filter(item => {
    if (isVegetarian && !item.isVegetarian) return false;
    if (isVegan && !item.isVegan) return false;
    if (isGlutenFree && !item.isGlutenFree) return false;
    return true;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8">
      {/* Sidebar Filters */}
      <div className="w-full lg:w-64 shrink-0 space-y-8">
        <div className="sticky top-24 space-y-8">
          <div>
            <h2 className="font-serif text-2xl font-bold mb-4">Our Menu</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search dishes..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3 text-sm uppercase tracking-wider text-muted-foreground">Categories</h3>
            <ScrollArea className="w-full lg:w-auto whitespace-nowrap lg:whitespace-normal pb-4 lg:pb-0">
              <div className="flex lg:flex-col gap-2">
                <Button 
                  variant={selectedCategory === null ? "default" : "ghost"}
                  className="justify-start rounded-full lg:rounded-md"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Items
                </Button>
                {categories?.map((cat) => (
                  <Button 
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "ghost"}
                    className="justify-start rounded-full lg:rounded-md"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="lg:hidden" />
            </ScrollArea>
          </div>

          <div className="hidden lg:block">
            <h3 className="font-medium mb-3 text-sm uppercase tracking-wider text-muted-foreground">Dietary</h3>
            <div className="space-y-2">
              <Button 
                variant={isVegetarian ? "secondary" : "ghost"} 
                size="sm" 
                className="w-full justify-start gap-2"
                onClick={() => setIsVegetarian(!isVegetarian)}
              >
                <Leaf className="w-4 h-4" /> Vegetarian
              </Button>
              <Button 
                variant={isVegan ? "secondary" : "ghost"} 
                size="sm" 
                className="w-full justify-start gap-2"
                onClick={() => setIsVegan(!isVegan)}
              >
                <Leaf className="w-4 h-4" /> Vegan
              </Button>
              <Button 
                variant={isGlutenFree ? "secondary" : "ghost"} 
                size="sm" 
                className="w-full justify-start gap-2"
                onClick={() => setIsGlutenFree(!isGlutenFree)}
              >
                <WheatOff className="w-4 h-4" /> Gluten-Free
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Mobile Dietary Filters */}
        <div className="flex lg:hidden flex-wrap gap-2 mb-6">
          <Badge 
            variant={isVegetarian ? "default" : "outline"} 
            className="cursor-pointer py-1.5 px-3"
            onClick={() => setIsVegetarian(!isVegetarian)}
          >
            <Leaf className="w-3 h-3 mr-1" /> Vegetarian
          </Badge>
          <Badge 
            variant={isVegan ? "default" : "outline"} 
            className="cursor-pointer py-1.5 px-3"
            onClick={() => setIsVegan(!isVegan)}
          >
            <Leaf className="w-3 h-3 mr-1" /> Vegan
          </Badge>
          <Badge 
            variant={isGlutenFree ? "default" : "outline"} 
            className="cursor-pointer py-1.5 px-3"
            onClick={() => setIsGlutenFree(!isGlutenFree)}
          >
            <WheatOff className="w-3 h-3 mr-1" /> Gluten-Free
          </Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse border-none shadow-sm">
                <div className="aspect-video bg-muted" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-5 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-4/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredItems?.length === 0 ? (
          <div className="text-center py-24 bg-muted/30 rounded-2xl">
            <h3 className="text-xl font-medium mb-2">No items found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
            <Button 
              variant="outline" 
              className="mt-6"
              onClick={() => {
                setSearch("");
                setSelectedCategory(null);
                setIsVegetarian(false);
                setIsVegan(false);
                setIsGlutenFree(false);
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredItems?.map((item) => (
              <motion.div key={item.id} variants={itemVariants} className="h-full">
                <Card className="h-full flex flex-col border-border/50 hover:shadow-md transition-shadow overflow-hidden group">
                  {item.imageUrl && (
                    <div className="aspect-video overflow-hidden bg-muted">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <h4 className="font-serif font-bold text-lg leading-tight">{item.name}</h4>
                      <span className="font-medium text-primary shrink-0">${Number(item.price).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.spiceLevel > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-orange-200 text-orange-600 bg-orange-50">
                          {Array.from({ length: item.spiceLevel }).map((_, i) => (
                            <Flame key={i} className="w-3 h-3 inline" />
                          ))}
                        </Badge>
                      )}
                      {item.isVegetarian && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">V</Badge>}
                      {item.isVegan && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">VG</Badge>}
                      {item.isGlutenFree && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">GF</Badge>}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-6 flex-1 line-clamp-3">
                      {item.description}
                    </p>
                    
                    <Button 
                      className="w-full rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      variant="outline"
                      disabled={!item.isAvailable}
                      onClick={() => {
                        addItem({
                          menuItemId: item.id,
                          name: item.name,
                          price: item.price,
                          imageUrl: item.imageUrl ?? null,
                          quantity: 1,
                        });
                        toast.success(`${item.name} added to cart`);
                      }}
                    >
                      {item.isAvailable ? (
                        <>
                          <Plus className="w-4 h-4 mr-2" /> Add
                        </>
                      ) : (
                        "Sold Out"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
