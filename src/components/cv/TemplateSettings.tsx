import { Palette } from "lucide-react";
import type { Template } from "@/lib/cv-schema";
import { StylePicker } from "./StylePicker";
import { AudiencePicker } from "./AudiencePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function TemplateSettings({ template, onChange }: { template: Template; onChange: (t: Template) => void }) {
  const set = <K extends keyof Template>(k: K, v: Template[K]) => onChange({ ...template, [k]: v });
  const recruiter = template.audience === "recruiter";

  const onLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("logoDataUrl", reader.result as string);
    reader.readAsDataURL(file);
  };

  const field = (k: keyof Template, label: string, placeholder: string) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={template[k] as string} onChange={(e) => set(k, e.target.value as never)} placeholder={placeholder} />
    </div>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette className="h-4 w-4" /> Template
        </Button>
      </SheetTrigger>
      <SheetContent className="space-y-5 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Your template</SheetTitle>
          <SheetDescription>Every CV is exported in this layout. Saved in this browser.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-8">
          <div className="space-y-2">
            <Label>Who's using Uniform?</Label>
            <AudiencePicker template={template} onChange={onChange} />
          </div>
          <div className="space-y-2">
            <Label>Style inspiration</Label>
            <StylePicker template={template} onChange={onChange} />
          </div>
          <div className="space-y-1">
            <Label>Accent colour</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={template.accentColor} onChange={(e) => set("accentColor", e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent" />
              <Input value={template.accentColor} onChange={(e) => set("accentColor", e.target.value)} className="w-32" />
            </div>
          </div>
          {recruiter && (
            <>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <Label>Anonymise candidates</Label>
                  <p className="text-xs text-muted-foreground">Initials instead of name; removes contact details, address, birth date and other personal data. AI may edit text to do this. Applies to CVs read after switching on.</p>
                </div>
                <Switch checked={template.anonymise} onCheckedChange={(v) => set("anonymise", v)} />
              </div>
              <p className="pt-2 text-xs font-semibold uppercase tracking-[0.15em] text-accent">Agency</p>
              {field("agencyName", "Agency or client name", "e.g. Northbridge Talent")}
              <div className="space-y-1">
                <Label>Logo (PNG or JPG)</Label>
                <Input type="file" accept="image/png,image/jpeg" onChange={(e) => onLogo(e.target.files?.[0])} />
                {template.logoDataUrl && (
                  <div className="flex items-center gap-3 pt-2">
                    <img src={template.logoDataUrl} alt="Logo" className="h-8 w-auto" />
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
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
