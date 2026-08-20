import QRCode from "qrcode";

export function buildCertificateProfileUrl(origin: string, profileId: number) {
  return `${origin.replace(/\/$/, "")}/profile/${profileId}`;
}

export async function createCertificateProfileQrDataUrl(profileUrl: string) {
  return QRCode.toDataURL(profileUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 240,
    color: { dark: "#17152c", light: "#ffffff" },
  });
}
