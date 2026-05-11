import { useState, useRef } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, Upload, CheckCircle2, Loader2 } from "lucide-react";

export default function DeliveryPhotoPage() {
  const [, params] = useRoute("/delivery-photo/:orderNumber");
  const orderNumber = params?.orderNumber ?? "";

  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!preview) {
      toast.error("Please select a photo first.");
      return;
    }
    if (!orderNumber) {
      toast.error("Missing order number in URL.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `${import.meta.env.BASE_URL}api/orders/${encodeURIComponent(orderNumber)}/delivery-photo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoDataUrl: preview }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Upload failed");
      }
      setSubmitted(true);
      toast.success("Photo submitted successfully!");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit photo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!orderNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>No order number found. Please use the link provided with your delivery.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Photo Submitted!</h2>
            <p className="text-muted-foreground">
              Thank you. The delivery confirmation photo for order{" "}
              <strong>#{orderNumber}</strong> has been saved.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Delivery Photo</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            Order <strong>#{orderNumber}</strong>
          </p>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <p className="text-sm text-muted-foreground text-center">
            Please take a photo of the delivered order at the customer's door and submit it below.
          </p>

          {/* Photo preview / upload area */}
          <div
            className="relative border-2 border-dashed border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/60 transition-colors"
            style={{ minHeight: 220 }}
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img
                src={preview}
                alt="Delivery preview"
                className="w-full h-56 object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-56 gap-3 text-muted-foreground">
                <Upload className="w-10 h-10" />
                <span className="text-sm font-medium">Tap to select or take a photo</span>
                <span className="text-xs">JPG, PNG, WebP — max 5 MB</span>
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {preview && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setPreview(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              Change Photo
            </Button>
          )}

          <Button
            className="w-full rounded-full"
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || !preview}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…
              </>
            ) : (
              "Submit Delivery Photo"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
