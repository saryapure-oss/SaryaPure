import { requireUser } from "@/lib/auth/guards";
import { ChangePasswordForm } from "@/components/store/change-password-form";
import { ResendVerification } from "@/components/store/resend-verification";
import { UpdateProfileForm } from "@/components/store/update-profile-form";

export default async function SecurityPage() {
  const user = await requireUser("/account/security");
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl">Profile</h2>
        <div className="card mt-4 p-5">
          <UpdateProfileForm name={user.name} email={user.email} />
        </div>
      </div>

      {!user.emailVerified && (
        <div>
          <h2 className="text-2xl">Email verification</h2>
          <div className="card mt-4 space-y-3 p-5">
            <p className="text-sm text-muted">Your email address is not verified yet.</p>
            <ResendVerification />
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl">Change password</h2>
        <div className="card mt-4 p-5">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
