import crypto from "crypto";

// erzeugt Signatur für Upload in Unterordner avatars/<userId>/[subfolder]
export function generateCloudinarySignature(userId, subfolder = "") {
  const timestamp = Math.floor(Date.now() / 1000);
  const base = `avatars/${userId}`;
  const folder = subfolder ? `${base}/${subfolder}` : base;

  // nur die nötigen Params signieren (alphabetisch): folder & timestamp
  const toSign = `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  return {
    timestamp,
    folder,
    signature,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  };
}
