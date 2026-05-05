import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  requireReason?: boolean;
  onConfirm: (reason: string) => Promise<void> | void;
}

const ModerationActionDialog = ({ open, onOpenChange, title, requireReason, onConfirm }: Props) => {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    if (requireReason && !reason.trim()) return;
    setBusy(true);
    try { await onConfirm(reason.trim()); onOpenChange(false); setReason(""); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label>{requireReason ? "Причина (обязательно)" : "Причина (необязательно)"}</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={handle} disabled={busy || (requireReason && !reason.trim())}>Подтвердить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModerationActionDialog;
