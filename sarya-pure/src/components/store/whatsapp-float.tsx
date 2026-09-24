import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/utils";
import { WhatsAppIcon } from "./whatsapp-icon";

export async function WhatsAppFloat() {
  const { business } = await getSettings();
  const href = whatsappLink(business.whatsapp, "Hello Sarya Pure!");
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Sarya Pure on WhatsApp"
      className="no-print fixed bottom-5 right-5 z-30 inline-flex h-13 w-13 items-center justify-center rounded-full bg-[#1f7a4d] text-white shadow-lg hover:bg-[#186540] md:h-14 md:w-14"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
