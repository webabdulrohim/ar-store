/* WhatsApp Order & Message Builder Module */

const WA = {
  formatPhoneNumber: function(phone) {
    if (!phone) return "6281214932916";
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }
    return cleaned;
  },

  buildProductMessage: function({ storeName, product, userFields, note, paymentMethod }) {
    let msg = ` Halo Admin *${storeName}*,\nSaya ingin order produk digital berikut:\n\n`;
    msg += ` *Produk:* ${product.name}\n`;
    msg += ` *Kategori:* ${product.category}\n`;
    msg += ` *Harga:* Rp ${product.price.toLocaleString('id-ID')}\n`;
    msg += ` *Metode Bayar:* ${paymentMethod}\n\n`;
    
    msg += ` *DATA PELANGGAN / AKUN:*\n`;
    for (const key in userFields) {
      if (userFields[key]) {
        msg += `• ${key}: *${userFields[key]}*\n`;
      }
    }

    if (note && note.trim() !== '') {
      msg += `\n *Catatan:* ${note}\n`;
    }

    msg += `\n Mohon segera dihitung total & diproses ya Admin. Terima kasih!`;
    return encodeURIComponent(msg);
  },

  buildServiceMessage: function({ storeName, service, customerName, customerPhone, address, issue, date }) {
    let msg = ` Halo Admin CS *${storeName}*,\nSaya mau booking *${service.category}* berikut:\n\n`;
    msg += ` *Layanan Jasa:* ${service.name}\n`;
    msg += ` *Kategori:* ${service.category}\n`;
    msg += ` *Estimasi Harga:* ${service.price_range}\n\n`;
    
    msg += ` *DATA PEMESAN SERVICE:*\n`;
    msg += `• Nama Pemesan: *${customerName}*\n`;
    msg += `• No. WhatsApp: *${customerPhone}*\n`;
    msg += `• Alamat Lokasi: *${address}*\n`;
    msg += `• Keluhan / Kerusakan: *${issue}*\n`;
    
    if (date) {
      msg += `• Tanggal Layanan: *${date}*\n`;
    }

    msg += `\n Mohon konfirmasi jadwal & estimasi kedatangan teknisi. Terima kasih!`;
    return encodeURIComponent(msg);
  },

  sendToWhatsApp: function(waNumber, encodedMsg) {
    const formatted = this.formatPhoneNumber(waNumber);
    const url = `https://wa.me/${formatted}?text=${encodedMsg}`;
    window.open(url, '_blank');
  }
};
