import { Palette } from "lucide-react";
import type { Template } from "@/lib/cv-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function TemplateSettings({ template, onChange }: { template: Template; onChange: (t: Template) => void }) {
  const set = <K extends keyof Template>(k: K, v: Template[K]) => onChange({ ...template, [k]: v });

  const onLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("logoDataUrl", reader.result as string);
    reader.readAsDataURL(file);
  };

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
        <div className="space-y-4 px-4">
          <div className="space-y-1">
            <Label>Agency or client name</Label>
            <Input value={template.agencyName} onChange={(e) => set("agencyName", e.target.value)} placeholder="e.g. Northbridge Talent" />
          </div>
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
          <div className="space-y-1">
            <Label>Accent colour</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={template.accentColor} onChange={(e) => set("accentColor", e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent" />
              <Input value={template.accentColor} onChange={(e) => set("accentColor", e.target.value)} className="w-32" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Footer note</Label>
            <Input value={template.footerNote} onChange={(e) => set("footerNote", e.target.value)} placeholder="e.g. Presented by Northbridge Talent — confidential" />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label>Hide contact details</Label>
              <p className="text-xs text-muted-foreground">Removes email, phone and links from exports.</p>
            </div>
            <Switch checked={template.hideContactDetails} onCheckedChange={(v) => set("hideContactDetails", v)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
