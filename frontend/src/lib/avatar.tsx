import http from "../api/http"; // Axios-Instanz mit baseURL = BFF

export type CloudSig = {
  timestamp: number;
  folder: string;
  signature: string;
  api_key: string;
  cloud_name: string;
};

export async function getAvatarSign(sub?: string): Promise<CloudSig> {
  const qs = sub ? `?sub=${encodeURIComponent(sub)}` : "";
  const { data } = await http.post(`http://localhost:3010/api/profile/avatar/sign${qs}`);
  return data as CloudSig;
}

export async function uploadToCloudinary(file: File, sig: CloudSig) {
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.api_key);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed");
  return await res.json(); // { secure_url, public_id, ... }
}
