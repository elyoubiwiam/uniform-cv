import { useId } from "react";
import type { Template } from "@/lib/cv-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function RecruiterDetails({ template, onChange }: { template: Template; onChange: (t: Template) => void }) {
  const id = useId();
  const set = <K extends keyof Template>(k: K, v: Template[K]) => onChange({ ...template, [k]: v });
  const onLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") set("logoDataUrl", reader.result); };
    reader.readAsDataURL(file);
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
                 <Label htmlFor={`${id}-logo`}>Footer logo (PNG or JPG)</Label>
                 <Input id={`${id}-logo`} type="file" accept="image/png,image/jpeg" onChange={(e) => onLogo(e.target.files?.[0])} />
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
  </div>;
}
