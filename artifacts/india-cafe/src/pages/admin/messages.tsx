import { useAdminListContact } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function AdminMessages() {
  const { data: messages, isLoading } = useAdminListContact();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold">Contact Messages</h1>
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
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages?.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell className="whitespace-nowrap align-top">
                      {format(new Date(msg.createdAt), "MMM d, yyyy")}
                      <div className="text-xs text-muted-foreground">{format(new Date(msg.createdAt), "h:mm a")}</div>
                    </TableCell>
                    <TableCell className="font-medium align-top">{msg.name}</TableCell>
                    <TableCell className="align-top">
                      <div>{msg.email}</div>
                      {msg.phone && <div className="text-sm text-muted-foreground">{msg.phone}</div>}
                    </TableCell>
                    <TableCell className="max-w-md align-top">
                      <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                    </TableCell>
                  </TableRow>
                ))}
                {messages?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No messages received yet.
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
