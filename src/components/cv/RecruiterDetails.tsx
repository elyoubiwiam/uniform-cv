import { useId, useState } from "react";
import type { Template } from "@/lib/cv-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { removeLogoBackground, shouldOfferBackgroundRemoval } from "@/lib/logo-background";

export function RecruiterDetails({ template, onChange }: { template: Template; onChange: (t: Template) => void }) {
  const id = useId();
  const [pendingLogo, setPendingLogo] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const set = <K extends keyof Template>(k: K, v: Template[K]) => onChange({ ...template, [k]: v });
  const onLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    setLogoError(null);
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      if (shouldOfferBackgroundRemoval(file)) setPendingLogo(reader.result);
      else set("logoDataUrl", reader.result);
    };
    reader.onerror = () => setLogoError("This logo could not be read. Please try another image.");
    reader.readAsDataURL(file);
  };
  const keepOriginal = () => {
    if (pendingLogo) set("logoDataUrl", pendingLogo);
    setPendingLogo(null);
    setLogoError(null);
  };
  const removeBackground = async () => {
    if (!pendingLogo || removing) return;
    setRemoving(true);
    setLogoError(null);
    try {
      set("logoDataUrl", await removeLogoBackground(pendingLogo));
      setPendingLogo(null);
    } catch (error) {
      setLogoError(error instanceof Error ? error.message : "The background could not be removed. You can keep the original logo.");
    } finally { setRemoving(false); }
  };
  const field = (k: keyof Template, label: string, placeholder: string) => (
    <div className="space-y-1">
      <Label htmlFor={`${id}-${k}`}>{label}</Label>
      <Input id={`${id}-${k}`} value={template[k] as string} onChange={(e) => set(k, e.target.value as never)} placeholder={placeholder} />
    </div>
  );
  if (template.audience !== "recruiter") return null;
  return <div className="space-y-4">
              <p className="pt-2 text-xs font-semibold uppercase tracking-[0.15em] text-accent">Agency</p>
              {field("agencyName", "Agency or client name", "e.g. Northbridge Talent")}
              <div className="space-y-1">
                  <Label htmlFor={`${id}-logo`}>Recruiter logo (cover page and footer)</Label>
                  <Input id={`${id}-logo`} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { onLogo(e.target.files?.[0]); e.target.value = ""; }} />
                 {logoError && !pendingLogo && <p role="alert" className="text-sm text-destructive">{logoError}</p>}
                {template.logoDataUrl && (
                  <div className="flex items-center gap-3 pt-2">
                     <img src={template.logoDataUrl} alt="Logo" className="h-8 max-w-24 object-contain" />
                    <Button variant="ghost" size="sm" onClick={() => set("logoDataUrl", null)}>Remove</Button>
                  </div>
                )}
              </div>
              <p className="pt-2 text-xs font-semibold uppercase tracking-[0.15em] text-accent">Consultant ("Presented by")</p>
              {field("consultantName", "Consultant name", "e.g. Sarah Khan")}
              {field("consultantTitle", "Job title", "e.g. Senior Recruitment Consultant")}
              {field("consultantEmail", "Email", "sarah@northbridge.co.uk")}
              {field("consultantPhone", "Phone", "+44 20 7946 0000")}
              <p className="pt-2 text-xs font-semibold uppercase tracking-[0.15em] text-accent">Footer</p>
              {field("footerNote", "Footer note", "e.g. Confidential — Reg. no. 01234567")}
              {field("agencyAddress", "Address", "e.g. 12 King St, London EC2V 8AA")}
              {field("agencyWebsite", "Website", "northbridge.co.uk")}
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <Label>Hide candidate contact details</Label>
                  <p className="text-xs text-muted-foreground">Removes the candidate's email, phone and links from exports.</p>
                </div>
                <Switch checked={template.hideContactDetails} onCheckedChange={(v) => set("hideContactDetails", v)} />
              </div>
    <Dialog open={pendingLogo !== null} onOpenChange={(open) => { if (!open && !removing) keepOriginal(); }}>
      <DialogContent onEscapeKeyDown={(event) => { if (removing) event.preventDefault(); }} onPointerDownOutside={(event) => { if (removing) event.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>Remove the logo background?</DialogTitle>
          <DialogDescription>Save your logo with a transparent background, or keep the original.</DialogDescription>
        </DialogHeader>
        {pendingLogo && <img src={pendingLogo} alt="Uploaded recruiter logo" className="mx-auto h-24 max-w-full object-contain" />}
        {logoError && <p role="alert" className="text-sm text-destructive">{logoError}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={removing} onClick={keepOriginal}>Keep original</Button>
          <Button disabled={removing || Boolean(logoError)} onClick={removeBackground}>
            {removing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {removing ? "Removing background…" : "Yes, remove background"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
