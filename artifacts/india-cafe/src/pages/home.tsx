import { useListPopularItems, useListTestimonials, useListLocations } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useCart } from "@/store/cart";
import { toast } from "sonner";
import { Star, MapPin, Clock, Phone } from "lucide-react";

export default function Home() {
  const { data: popularItems } = useListPopularItems();
  const { data: testimonials } = useListTestimonials();
  const { data: locations } = useListLocations();
  const addItem = useCart(state => state.addItem);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/70 z-10" />
        <img 
          src="/images/hero.png" 
          alt="Indian feast" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="container relative z-20 text-center text-white px-4 pt-16">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block mb-4 text-sm font-bold tracking-widest uppercase text-white/80">Since 1994</span>
            <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white">
              Best Indian Takeout & Delivery in Iowa
            </h1>
            <p className="text-lg md:text-2xl mb-8 max-w-2xl mx-auto font-light text-white/90">
              Come enjoy the taste of India with our authentic cuisine. Savor authentic Indian flavors — freshly made every day.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/menu">
                <Button size="lg" className="text-lg px-8 py-6 rounded-full w-full sm:w-auto shadow-lg hover:shadow-xl transition-all">
                  Explore Our Menu
                </Button>
              </Link>
              <Link href="/menu">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-full w-full sm:w-auto bg-white/10 border-white/30 text-white hover:bg-white hover:text-black backdrop-blur-sm transition-all">
                  Order Online
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-24 bg-white">
        <div className="container px-4 mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-sans text-3xl md:text-4xl font-bold mb-6 text-foreground">Welcome to India Cafe</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              For nearly three decades, we have been crafting authentic Indian dishes using recipes passed down through generations. Our chefs blend fresh, locally-sourced ingredients with traditional spices imported directly from India to create meals that warm the soul and delight the senses.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Popular Items */}
      {Array.isArray(popularItems) && popularItems.length > 0 && (
        <section className="py-24 bg-muted/30">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-sans text-3xl md:text-4xl font-bold mb-4">Customer Favorites</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Discover the dishes our guests come back for time and time again.</p>
            </div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {popularItems.map((item) => (
                <motion.div key={item.id} variants={itemVariants} className="group h-full">
                  <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-white">
                    <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-sans text-xl font-bold">{item.name}</h3>
                        <span className="font-medium text-primary">${Number(item.price).toFixed(2)}</span>
                      </div>
                      <p className="text-muted-foreground text-sm mb-6 flex-1 line-clamp-2">{item.description}</p>
                      <Button 
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
                        className="w-full rounded-full"
                        variant="secondary"
                      >
                        Add to Order
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
            
            <div className="text-center mt-12">
              <Link href="/menu">
                <Button variant="outline" className="rounded-full px-8">View Full Menu</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Locations */}
      {Array.isArray(locations) && locations.length > 0 && (
        <section className="py-24 bg-white">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-sans text-3xl md:text-4xl font-bold mb-4">Visit Us</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Two convenient locations to serve you.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {locations.map((location) => (
                <Card key={location.id} className="border border-border/50 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-8 text-center sm:text-left">
                    <h3 className="font-sans text-2xl font-bold mb-6">{location.name}</h3>
                    <div className="space-y-4 text-muted-foreground">
                      <div className="flex items-start justify-center sm:justify-start gap-3">
                        <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span>{location.address}</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-3">
                        <Phone className="w-5 h-5 text-primary shrink-0" />
                        <span>{location.phone}</span>
                      </div>
                      <div className="flex items-start justify-center sm:justify-start gap-3">
                        <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="whitespace-pre-line">{location.hours}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {Array.isArray(testimonials) && testimonials.filter(t => t.isApproved).length > 0 && (
        <section className="py-24 bg-primary text-primary-foreground">
          <div className="container px-4 mx-auto">
            <h2 className="font-sans text-3xl md:text-4xl font-bold mb-16 text-center">What Our Guests Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.filter(t => t.isApproved).slice(0, 3).map((testimonial) => (
                <div key={testimonial.id} className="bg-white/10 p-8 rounded-2xl backdrop-blur-sm">
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < testimonial.rating ? "fill-white text-white" : "text-white/30"}`} />
                    ))}
                  </div>
                  <p className="text-lg font-light italic mb-6 leading-relaxed">"{testimonial.message}"</p>
                  <p className="font-medium">— {testimonial.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
