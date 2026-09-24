import { getSettings } from "@/lib/settings";
import { requireAdminPage } from "@/lib/auth/guards";
import { SettingsSectionForm } from "@/components/admin/settings-section-form";
import { Input, Textarea, Checkbox } from "@/components/ui/field";
import { CmsListLinks } from "@/components/admin/cms-list-links";

export const metadata = { title: "Site Content" };

export default async function AdminCmsPage() {
  await requireAdminPage("cms:manage");
  const s = await getSettings();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">Site Content</h1>
        <p className="mt-1 text-sm text-muted">Homepage messaging, hero banner and about page copy.</p>
      </div>

      <SettingsSectionForm sectionKey="announcement" title="Announcement bar">
        <Checkbox label="Show announcement bar" name="enabled" defaultChecked={s.announcement.enabled} />
        <Input label="Text" name="text" defaultValue={s.announcement.text} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Link label" name="linkLabel" defaultValue={s.announcement.linkLabel} />
          <Input label="Link URL" name="linkHref" defaultValue={s.announcement.linkHref} />
        </div>
      </SettingsSectionForm>

      <SettingsSectionForm sectionKey="hero" title="Homepage hero">
        <Input label="Eyebrow" name="eyebrow" defaultValue={s.hero.eyebrow} />
        <Input label="Headline" name="headline" defaultValue={s.hero.headline} />
        <Textarea label="Description" name="description" defaultValue={s.hero.description} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Primary CTA label" name="primaryCta.label" defaultValue={s.hero.primaryCta.label} />
          <Input label="Primary CTA link" name="primaryCta.href" defaultValue={s.hero.primaryCta.href} />
          <Input label="Secondary CTA label" name="secondaryCta.label" defaultValue={s.hero.secondaryCta.label} />
          <Input label="Secondary CTA link" name="secondaryCta.href" defaultValue={s.hero.secondaryCta.href} />
        </div>
      </SettingsSectionForm>

      <SettingsSectionForm sectionKey="about" title="About page">
        <Input label="Title" name="title" defaultValue={s.about.title} />
        <Input label="Intro line" name="intro" defaultValue={s.about.intro} />
        <Textarea label="Body (use blank lines for paragraphs)" name="body" rows={8} defaultValue={s.about.body} />
      </SettingsSectionForm>

      <SettingsSectionForm sectionKey="footer" title="Footer">
        <Textarea label="About blurb" name="about" defaultValue={s.footer.about} />
        <Input label="Copyright line" name="copyright" defaultValue={s.footer.copyright} />
      </SettingsSectionForm>

      <CmsListLinks />
    </div>
  );
}
