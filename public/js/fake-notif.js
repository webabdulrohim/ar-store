/* Fake Sales Toast Notification System */

class FakeNotifManager {
  constructor() {
    this.notifications = [];
    this.timer = null;
    this.enabled = true;
    this.interval = 10000; // 10 seconds default
  }

  init(notifications, enabled = true, intervalSeconds = 10) {
    this.notifications = notifications || [];
    this.enabled = enabled;
    this.interval = (intervalSeconds || 10) * 1000;
    
    if (this.enabled && this.notifications.length > 0) {
      this.startLoop();
    }
  }

  startLoop() {
    if (this.timer) clearInterval(this.timer);
    
    // Trigger initial toast after 3 seconds
    setTimeout(() => {
      this.showRandomToast();
    }, 3000);

    this.timer = setInterval(() => {
      this.showRandomToast();
    }, this.interval);
  }

  stopLoop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  showRandomToast() {
    if (!this.enabled || this.notifications.length === 0) return;

    const notifContainer = document.getElementById('fakeNotifContainer');
    if (!notifContainer) return;

    // Pick random notification
    const item = this.notifications[Math.floor(Math.random() * this.notifications.length)];
    const initialLetter = item.buyer_name ? item.buyer_name.charAt(0).toUpperCase() : 'A';
    
    const card = document.createElement('div');
    card.className = 'fake-toast-card';
    card.innerHTML = `
      <div class="fake-avatar" style="background: ${item.avatar_bg || '#8b5cf6'};">
        ${initialLetter}
      </div>
      <div class="fake-toast-content">
        <span class="fake-buyer">${item.buyer_name} (${item.city})</span>
        <span class="fake-item"><i class="fa-solid fa-cart-check"></i> Membeli ${item.item_name}</span>
        <span class="fake-time">${item.time_ago || 'Baru saja'}</span>
      </div>
    `;

    notifContainer.appendChild(card);

    // Animate slide in
    requestAnimationFrame(() => {
      card.classList.add('show');
    });

    // Remove toast after 4.5 seconds
    setTimeout(() => {
      card.classList.remove('show');
      setTimeout(() => {
        if (card.parentNode) {
          card.parentNode.removeChild(card);
        }
      }, 400);
    }, 4500);
  }
}

const fakeNotifManager = new FakeNotifManager();
