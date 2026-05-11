import { useState } from "react";
import { useListTestimonials, useCreateTestimonial } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  rating: z.number().min(1).max(5),
  message: z.string().min(10, "Message must be at least 10 characters").max(500),
});

export default function Testimonials() {
  const { data: testimonials, isLoading } = useListTestimonials();
  const createTestimonial = useCreateTestimonial();
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      rating: 5,
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createTestimonial.mutateAsync({ data: values });
      toast.success("Thank you! Your review will appear after approval.");
      form.reset({ name: "", rating: 5, message: "" });
    } catch (error) {
      toast.error("Failed to submit testimonial. Please try again.");
    }
  }

  const approvedTestimonials = testimonials?.filter(t => t.isApproved) || [];

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      {/* Hero Strip */}
      <section className="py-20 bg-primary text-[#383E56]">
        <div className="container px-4 mx-auto text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              What our guests are saying
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto font-medium opacity-90">
              Discover why our community has made India Cafe a local favorite since 1994.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        {/* Testimonials Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : approvedTestimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24 max-w-6xl mx-auto">
            {approvedTestimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-full"
              >
                <Card className="h-full border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className="flex gap-1 mb-6">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-5 h-5 ${i < testimonial.rating ? "fill-primary text-primary" : "text-muted"}`} 
                        />
                      ))}
                    </div>
                    <p className="text-lg font-light italic mb-6 leading-relaxed flex-1 text-muted-foreground">
                      "{testimonial.message}"
                    </p>
                    <p className="font-sans font-bold text-[#383E56]">
                      — {testimonial.name}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 mb-24">
            <p className="text-muted-foreground text-lg">No reviews yet. Be the first to share your experience!</p>
          </div>
        )}

        {/* Share Experience Form */}
        <div className="max-w-2xl mx-auto">
          <Card className="border-none shadow-lg overflow-hidden">
            <div className="bg-[#383E56] text-white p-8 text-center">
              <h2 className="font-serif text-3xl font-bold mb-2">Share Your Experience</h2>
              <p className="text-white/80">We'd love to hear about your visit.</p>
            </div>
            <CardContent className="p-8 md:p-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-center">
                        <FormLabel className="text-base font-medium mb-2">How was your meal?</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            {Array.from({ length: 5 }).map((_, i) => {
                              const starValue = i + 1;
                              return (
                                <button
                                  type="button"
                                  key={i}
                                  className="focus:outline-none transition-transform hover:scale-110"
                                  onMouseEnter={() => setHoveredStar(starValue)}
                                  onMouseLeave={() => setHoveredStar(0)}
                                  onClick={() => field.onChange(starValue)}
                                >
                                  <Star 
                                    className={`w-8 h-8 md:w-10 md:h-10 ${
                                      starValue <= (hoveredStar || field.value)
                                        ? "fill-primary text-primary"
                                        : "text-muted hover:text-primary/50"
                                    } transition-colors`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" className="bg-muted/30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Review</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us what you loved about your visit..." 
                            className="min-h-[120px] bg-muted/30 resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full rounded-full h-12 text-base font-bold" 
                    disabled={createTestimonial.isPending}
                  >
                    {createTestimonial.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Review"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}