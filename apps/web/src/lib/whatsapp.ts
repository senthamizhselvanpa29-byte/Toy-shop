// https://wa.me/919876543210?text=… opens a WhatsApp chat on phones and computers.
export function whatsappLink(number: string, message: string): string {
  const digits = number.replace(/\D/g, "");
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
