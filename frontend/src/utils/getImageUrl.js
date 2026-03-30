export function getImageUrl(path) {
  if (!path || typeof path !== "string") return "";

  // ✅ Only allow Cloudinary / external URLs
  if (path.startsWith("http")) return path;

  // ❌ If it's not a Cloudinary URL, ignore it
  return "";
}
