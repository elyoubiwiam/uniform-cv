import { Palette } from "lucide-react";
import type { Template } from "@/lib/cv-schema";
import { StylePicker } from "./StylePicker";
import { RecruiterDetails } from "./RecruiterDetails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function TemplateSettings({ template, onChange }: { template: Template; onChange: (t: Template) => void }) {
  const set = <K extends keyof Template>(k: K, v: Template[K]) => onChange({ ...template, [k]: v });
  const recruiter = true;


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
              <RecruiterDetails template={template} onChange={onChange} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
