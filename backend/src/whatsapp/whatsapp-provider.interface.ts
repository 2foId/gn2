// Kontrak yang harus dipenuhi provider WhatsApp apa pun (Meta Cloud API, Fonnte, Twilio, dll).
// AuthService hanya bergantung pada interface ini, bukan implementasi spesifik provider —
// jadi mengganti provider cukup dengan mengganti binding di WhatsappModule.
export interface WhatsappProvider {
  sendOtp(nomorHp: string, code: string): Promise<void>;
}

export const WHATSAPP_PROVIDER = 'WHATSAPP_PROVIDER';
