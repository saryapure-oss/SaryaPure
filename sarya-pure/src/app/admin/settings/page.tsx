import { getSettings } from "@/lib/settings";
import { requireAdminPage } from "@/lib/auth/guards";
import { SettingsSectionForm } from "@/components/admin/settings-section-form";
import { Input, Textarea, Checkbox } from "@/components/ui/field";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requireAdminPage("settings:manage");
  const s = await getSettings();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Business, legal and store-wide configuration. Fields left blank are never shown on the storefront — we never invent business details.
        </p>
      </div>

      <SettingsSectionForm sectionKey="business" title="Business details" hint="Shown in the footer, contact page and invoices.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Company name" name="companyName" defaultValue={s.business.companyName} />
          <Input label="Brand name" name="brandName" defaultValue={s.business.brandName} />
          <Input label="Phone" name="phone" defaultValue={s.business.phone} />
          <Input label="Email" name="email" defaultValue={s.business.email} />
          <Input label="WhatsApp number" name="whatsapp" defaultValue={s.business.whatsapp} />
          <Input label="Business hours" name="businessHours" defaultValue={s.business.businessHours} />
        </div>
        <Textarea label="Address" name="address" defaultValue={s.business.address} />
        <Input label="Map embed URL" name="mapEmbedUrl" defaultValue={s.business.mapEmbedUrl} />
      </SettingsSectionForm>

      <SettingsSectionForm sectionKey="legal" title="Legal &amp; registration" hint="Left blank until you provide real business registration details — never invented.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="GSTIN" name="gstin" defaultValue={s.legal.gstin} />
          <Input label="FSSAI license no." name="fssai" defaultValue={s.legal.fssai} />
          <Input label="CIN" name="cin" defaultValue={s.legal.cin} />
          <Input label="Registered office" name="registeredOffice" defaultValue={s.legal.registeredOffice} />
        </div>
        <Textarea label="Other registration details" name="registrationDetails" defaultValue={s.legal.registrationDetails} />
      </SettingsSectionForm>

      <SettingsSectionForm sectionKey="commerce" title="Commerce &amp; shipping">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Default GST rate (%)" name="defaultTaxRate" type="number" step="0.01" defaultValue={s.commerce.defaultTaxRate} />
          <Input label="Free shipping threshold (paise)" name="freeShippingThreshold" type="number" defaultValue={s.commerce.freeShippingThreshold} />
          <Input label="Flat shipping rate (paise)" name="flatShippingRate" type="number" defaultValue={s.commerce.flatShippingRate} />
          <Input label="Default ETA min (days)" name="defaultEtaMinDays" type="number" defaultValue={s.commerce.defaultEtaMinDays} />
          <Input label="Default ETA max (days)" name="defaultEtaMaxDays" type="number" defaultValue={s.commerce.defaultEtaMaxDays} />
          <Input label="COD fee (paise)" name="codFee" type="number" defaultValue={s.commerce.codFee} />
          <Input label="COD max order value (paise)" name="codMaxOrderValue" type="number" defaultValue={s.commerce.codMaxOrderValue} />
          <Input label="Reservation window (minutes)" name="reservationMinutes" type="number" defaultValue={s.commerce.reservationMinutes} />
          <Input label="Max quantity per item" name="maxQtyPerItem" type="number" defaultValue={s.commerce.maxQtyPerItem} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Checkbox label="Prices include GST" name="pricesIncludeTax" defaultChecked={s.commerce.pricesIncludeTax} />
          <Checkbox label="Serve unmatched PIN codes at flat rate" name="allowAllPincodes" defaultChecked={s.commerce.allowAllPincodes} />
          <Checkbox label="Cash on Delivery enabled" name="codEnabled" defaultChecked={s.commerce.codEnabled} />
        </div>
      </SettingsSectionForm>

      <SettingsSectionForm sectionKey="payment" title="Payment">
        <Checkbox label="Razorpay online payments enabled" name="razorpayEnabled" defaultChecked={s.payment.razorpayEnabled} />
        <Input label="Display name on checkout" name="razorpayDisplayName" defaultValue={s.payment.razorpayDisplayName} />
        <p className="text-xs text-muted">Razorpay API keys are configured via environment variables, never here.</p>
      </SettingsSectionForm>

      <SettingsSectionForm sectionKey="social" title="Social links">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Instagram URL" name="instagram" defaultValue={s.social.instagram} />
          <Input label="Facebook URL" name="facebook" defaultValue={s.social.facebook} />
          <Input label="YouTube URL" name="youtube" defaultValue={s.social.youtube} />
          <Input label="LinkedIn URL" name="linkedin" defaultValue={s.social.linkedin} />
        </div>
      </SettingsSectionForm>

      <SettingsSectionForm sectionKey="seo" title="SEO defaults">
        <Input label="Site title" name="siteTitle" defaultValue={s.seo.siteTitle} />
        <Input label="Title template" name="titleTemplate" defaultValue={s.seo.titleTemplate} hint="Use %s for the page title." />
        <Textarea label="Meta description" name="description" defaultValue={s.seo.description} />
        <Input label="Keywords (comma-separated)" name="keywords" defaultValue={s.seo.keywords} />
        <Input label="Default social share image URL" name="socialImage" defaultValue={s.seo.socialImage} />
      </SettingsSectionForm>
    </div>
  );
}
