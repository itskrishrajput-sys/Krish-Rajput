import { Sale, Customer, ShopSettings } from '../types/erp';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateOnly(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function generateUpiUrl(upiId: string, payeeName: string = '', amount?: number, billNo?: string): string {
  const cleanUpi = encodeURIComponent(upiId.trim());
  const cleanName = encodeURIComponent(payeeName.trim() || 'Merchant');
  let url = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&cu=INR`;
  if (typeof amount === 'number' && amount > 0) {
    url += `&am=${amount.toFixed(2)}`;
  }
  if (billNo) {
    url += `&tn=${encodeURIComponent(`Bill ${billNo}`)}`;
  }
  return url;
}

export function generateBillWhatsAppText(sale: Sale, settings: ShopSettings): string {
  const dateStr = formatDateTime(sale.timestamp);
  const itemsText = sale.items
    .map((item, idx) => `${idx + 1}. ${item.name} (${item.qty} ${item.unit || 'pcs'} x ₹${item.rate}) = ₹${item.amount}`)
    .join('\n');

  let paymentStatus = '';
  if (sale.paymentMode === 'Udhar') {
    paymentStatus = `⚠️ भुगतान स्थिति: उधार (बाकी ₹${sale.grandTotal})`;
  } else {
    paymentStatus = `✅ भुगतान स्थिति: पूर्ण चुकता (${sale.paymentMode})`;
  }

  const text = `*${settings.shopName.toUpperCase()}*\n` +
    `${settings.address ? `📍 ${settings.address}\n` : ''}` +
    `${settings.phone ? `📞 फोन: ${settings.phone}\n` : ''}` +
    `--------------------------------\n` +
    `🧾 *बिल सं.*: #${sale.billNo}\n` +
    `📅 *दिनांक*: ${dateStr}\n` +
    `${sale.customerName ? `👤 *ग्राहक*: ${sale.customerName}\n` : ''}` +
    `--------------------------------\n` +
    `*सामान का विवरण:*\n` +
    `${itemsText}\n` +
    `--------------------------------\n` +
    `${sale.discountAmount > 0 ? `छूट (Discount): -₹${sale.discountAmount}\n` : ''}` +
    `*कुल रकम (Total Amount): ₹${sale.grandTotal}*\n` +
    `${paymentStatus}\n` +
    `--------------------------------\n` +
    `${settings.receiptFooterNote || 'दुकान साथी से खरीदारी के लिए धन्यवाद! फिर पधारें।'}\n` +
    `${settings.upiId ? `📲 UPI ID: ${settings.upiId}` : ''}`;

  return encodeURIComponent(text);
}

export function generateKhataReminderWhatsAppText(customer: Customer, settings: ShopSettings): string {
  const text = `नमस्ते ${customer.name} जी,\n\n` +
    `*${settings.shopName}* से यह एक विनम्र सूचना है कि आपका *₹${customer.totalUdhar}* का पिछला उधार बकाया है।\n\n` +
    `कृपया सुविधानुसार इसका शीघ्र भुगतान करें।\n` +
    `${settings.upiId ? `📲 आप हमारे UPI ID पर भी भेज सकते हैं: *${settings.upiId}*\n\n` : '\n'}` +
    `फोन नंबर: ${settings.phone || ''}\n` +
    `धन्यवाद एवं आभार!\n` +
    `*${settings.shopName}*`;

  return encodeURIComponent(text);
}
