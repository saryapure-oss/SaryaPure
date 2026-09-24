"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Stars } from "@/components/ui/stars";
import { Badge } from "@/components/ui/badge";
import { Textarea, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { submitReview } from "@/app/actions/reviews";
import { initialActionState } from "@/lib/validation/common";
import { formatDate } from "@/lib/utils";

type ReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  imageUrl: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  userName: string;
};

export function ReviewsSection({
  productId,
  avgRating,
  reviewCount,
  reviews,
  canReview,
  isLoggedIn,
  hasPurchased,
  hasReviewed,
}: {
  productId: string;
  avgRating: number;
  reviewCount: number;
  reviews: ReviewItem[];
  canReview: boolean;
  isLoggedIn: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [state, action] = useActionState(submitReview, initialActionState);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl">Customer Reviews</h2>
          {reviewCount > 0 ? (
            <div className="mt-2 flex items-center gap-2">
              <Stars rating={avgRating} size={20} />
              <span className="font-semibold">{avgRating.toFixed(1)} out of 5</span>
              <span className="text-muted">
                ({reviewCount} review{reviewCount === 1 ? "" : "s"})
              </span>
            </div>
          ) : (
            <p className="mt-2 text-muted">No reviews yet. Be the first to review this product!</p>
          )}
        </div>
        {canReview && !showForm && (
          <button type="button" onClick={() => setShowForm(true)} className="rounded-full border border-forest-900 px-5 py-2.5 text-sm font-semibold text-forest-900 hover:bg-forest-900 hover:text-cream-50">
            Write a review
          </button>
        )}
        {!isLoggedIn && (
          <Link href="/login" className="text-sm font-semibold text-forest-800 underline">
            Sign in to review
          </Link>
        )}
        {isLoggedIn && !hasPurchased && !hasReviewed && <p className="text-sm text-muted">Only customers who purchased this product can review it.</p>}
        {hasReviewed && <Badge tone="green">You&apos;ve reviewed this product</Badge>}
      </div>

      {showForm && (
        <form action={action} className="card mt-6 space-y-4 p-5">
          <input type="hidden" name="productId" value={productId} />
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Your rating</legend>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer">
                  <input type="radio" name="rating" value={n} required className="peer sr-only" defaultChecked={n === 5} />
                  <span className="block text-2xl text-beige-400 peer-checked:text-gold-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-gold-500" aria-hidden>
                    ★
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <Input label="Title (optional)" name="title" maxLength={120} error={state.fieldErrors?.title} />
          <Textarea label="Your review" name="body" required minLength={10} maxLength={2000} error={state.fieldErrors?.body} hint="Minimum 10 characters." />
          <div>
            <label htmlFor="review-image" className="block text-sm font-medium">
              Add a photo (optional)
            </label>
            <input id="review-image" type="file" name="image" accept="image/jpeg,image/png,image/webp" className="mt-1.5 block w-full text-sm" />
          </div>
          <FormMessage ok={state.ok} message={state.message} />
          <div className="flex gap-2">
            <SubmitButton pendingText="Submitting…">Submit review</SubmitButton>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full px-5 py-2.5 text-sm font-semibold text-muted hover:bg-beige-200">
              Cancel
            </button>
          </div>
        </form>
      )}

      <ul className="mt-8 space-y-6">
        {reviews.map((r) => (
          <li key={r.id} className="border-b border-beige-300 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Stars rating={r.rating} size={16} />
              {r.isVerifiedPurchase && <Badge tone="green">Verified Purchase</Badge>}
            </div>
            {r.title && <h3 className="mt-2 font-semibold">{r.title}</h3>}
            <p className="mt-1 leading-7 text-ink">{r.body}</p>
            {r.imageUrl && <Image src={r.imageUrl} alt="Photo submitted with review" width={96} height={96} className="mt-3 h-24 w-24 rounded-lg object-cover" />}
            <p className="mt-2 text-xs text-muted">
              {r.userName.split(" ")[0]} · {formatDate(r.createdAt)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
