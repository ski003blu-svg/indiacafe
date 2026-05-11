import { useListLocations } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Clock } from "lucide-react";
import { motion } from "framer-motion";

const LOCATION_IMAGES: Record<string, string> = {
  "Iowa City": "/images/location-iowa-city.png",
  "Fairfield": "/images/location-interior.png",
};

export default function Locations() {
  const { data: locations, isLoading } = useListLocations();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="animate-pulse space-y-8 max-w-4xl mx-auto">
          <div className="h-12 bg-muted rounded w-1/3 mx-auto" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-64 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <section className="py-24 bg-primary text-primary-foreground text-center">
        <div className="container px-4 mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">Our Locations</h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto font-light">
              Two convenient locations to serve you the best authentic Indian cuisine in Iowa.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="container px-4 mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8">
            {locations?.map((location, index) => {
              const imgSrc = Object.entries(LOCATION_IMAGES).find(([key]) =>
                location.name.toLowerCase().includes(key.toLowerCase())
              )?.[1] ?? "/images/location-interior.png";

              return (
                <motion.div
                  key={location.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full border-none shadow-lg overflow-hidden bg-white hover:shadow-xl transition-shadow duration-300">
                    <div className="h-56 relative overflow-hidden">
                      <img
                        src={imgSrc}
                        alt={location.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                    <CardContent className="p-8">
                      <h2 className="font-serif text-3xl font-bold mb-6">{location.name}</h2>
                      <div className="space-y-6 text-muted-foreground">
                        <div className="flex items-start gap-4">
                          <MapPin className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground mb-1">Address</p>
                            <p>{location.address}</p>
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent(location.address)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline text-sm inline-block mt-2 font-medium"
                            >
                              Get Directions &rarr;
                            </a>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <Phone className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground mb-1">Phone</p>
                            <p>{location.phone}</p>
                            <a
                              href={`tel:${location.phone.replace(/[^0-9+]/g, "")}`}
                              className="text-primary hover:underline text-sm inline-block mt-2 font-medium"
                            >
                              Call Now &rarr;
                            </a>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <Clock className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground mb-1">Hours</p>
                            <p className="whitespace-pre-line">{location.hours}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interior Photo */}
      <section className="pb-24">
        <div className="container px-4 mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl overflow-hidden shadow-xl relative"
          >
            <img
              src="/images/location-interior.png"
              alt="India Cafe Interior"
              className="w-full h-80 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
              <div className="text-white">
                <h3 className="font-serif text-3xl font-bold mb-2">A Warm Welcome Awaits</h3>
                <p className="text-white/80">Experience authentic Indian hospitality in our welcoming dining room.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
