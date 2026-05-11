import { useAdminListTestimonials, getAdminListTestimonialsQueryKey, useAdminUpdateTestimonial, useAdminDeleteTestimonial } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, Trash2, Star } from "lucide-react";

export default function AdminTestimonials() {
  const queryClient = useQueryClient();
  const { data: testimonials, isLoading } = useAdminListTestimonials();
  const updateTestimonial = useAdminUpdateTestimonial();
  const deleteTestimonial = useAdminDeleteTestimonial();

  const handleToggleApproval = async (id: number, isApproved: boolean) => {
    try {
      await updateTestimonial.mutateAsync({
        id,
        data: { isApproved }
      });
      toast.success(`Testimonial ${isApproved ? "approved" : "unapproved"}`);
      queryClient.invalidateQueries({ queryKey: getAdminListTestimonialsQueryKey() });
    } catch (error) {
      toast.error("Failed to update testimonial");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    try {
      await deleteTestimonial.mutateAsync({ id });
      toast.success("Testimonial deleted");
      queryClient.invalidateQueries({ queryKey: getAdminListTestimonialsQueryKey() });
    } catch (error) {
      toast.error("Failed to delete testimonial");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold">Testimonials</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-center">Approved</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testimonials?.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap align-top">
                      {format(new Date(t.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium align-top">{t.name}</TableCell>
                    <TableCell className="align-top">
                      <div className="flex text-yellow-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < t.rating ? "fill-current" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md align-top">
                      <p className="whitespace-pre-wrap text-sm italic">"{t.message}"</p>
                    </TableCell>
                    <TableCell className="text-center align-top">
                      <Switch 
                        checked={t.isApproved} 
                        onCheckedChange={(checked) => handleToggleApproval(t.id, checked)} 
                      />
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {testimonials?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No testimonials submitted yet.
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
