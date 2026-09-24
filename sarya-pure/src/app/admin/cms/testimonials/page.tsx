import { db } from "@/lib/db";
import { CmsTestimonialRow, CmsTestimonialNewForm } from "@/components/admin/cms-testimonial-panel";

export const metadata = { title: "Testimonials" };

export default async function AdminTestimonialsPage() {
  const testimonials = await db.testimonial.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">Testimonials</h1>
        <p className="mt-1 text-sm text-muted">Demo testimonials are always labelled on the storefront. Replace with real customer feedback when available.</p>
      </div>
      <CmsTestimonialNewForm />
      <div className="space-y-3">
        {testimonials.map((t) => (
          <CmsTestimonialRow key={t.id} testimonial={t} />
        ))}
      </div>
    </div>
  );
}
