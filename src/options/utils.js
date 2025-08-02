export function normalizeUrl(url) {
  const trimmed = url.trim().toLowerCase();
  if (!trimmed) return "";

  try {
    const parsed = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
    );
    return parsed.hostname;
  } catch {
    return "";
  }
}
