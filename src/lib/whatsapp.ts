// Monta um link do WhatsApp no formato https://wa.me/55DDDNUMERO?text=...
// `numero` deve conter apenas dígitos (ex.: "5563999999999").
export function whatsappLink(numero: string, mensagem: string): string {
  const digits = (numero || '').replace(/\D/g, '');
  const text = encodeURIComponent(mensagem || '');
  return `https://wa.me/${digits}?text=${text}`;
}
