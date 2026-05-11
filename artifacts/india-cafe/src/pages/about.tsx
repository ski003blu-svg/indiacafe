import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img 
          src="/images/about.png" 
          alt="Chef cooking" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="container relative z-20 text-center text-white px-4">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6">Our Story</h1>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container px-4 mx-auto max-w-3xl">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="prose prose-lg mx-auto"
          >
            <p className="text-xl leading-relaxed text-muted-foreground font-light mb-8">
              Founded in 1994, India Cafe began with a simple mission: to bring the authentic, rich flavors of Indian cuisine to the heart of Iowa. For nearly three decades, we have remained a family-owned establishment dedicated to the art of traditional cooking.
            </p>
            <p className="text-lg leading-relaxed text-muted-foreground font-light mb-8">
              Our recipes are heirlooms, passed down through generations. We believe that great food starts with great ingredients, which is why we source our produce locally whenever possible, while importing our spices directly from India to ensure uncompromising authenticity.
            </p>
            <p className="text-lg leading-relaxed text-muted-foreground font-light mb-8">
              Whether you are dining in with family or taking comfort food home, we strive to make every meal a celebration. From our signature tandoori dishes baked in traditional clay ovens to our slow-simmered curries and fresh-baked breads, every item on our menu is crafted with passion and precision.
            </p>
            <p className="text-lg leading-relaxed text-muted-foreground font-light">
              Thank you for letting us share our heritage with you. We look forward to serving you for many more years to come.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
