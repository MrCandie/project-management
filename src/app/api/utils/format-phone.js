export const normalizeNigerianPhone = (phone = "") => {
  const cleaned = phone.replace(/\s+/g, "");

  if (cleaned.startsWith("+234")) return cleaned.slice(1);
  if (cleaned.startsWith("234")) return cleaned;
  if (cleaned.startsWith("0")) return `234${cleaned.slice(1)}`;

  return `234${cleaned}`;
};

export const isValidNigerianPhone = (phone = "") => {
  return /^234[789][01]\d{8}$/.test(normalizeNigerianPhone(phone));
};
