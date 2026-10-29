/* ============================================================
   郑家匠 · 数据层（购物车 / 用户 / 地址 / 订单 / 评论）
   ------------------------------------------------------------
   - 购物车、地址、评论：本地 localStorage
   - 订单：优先提交到后端 API（Cloudflare Worker），失败时本地兜底
   - 商家端：通过商家口令从后端拉取全部订单
   ============================================================ */

const STORAGE_KEYS = {
  cart: 'zjj_cart_v1',
  user: 'zjj_user_v1',
  orders: 'zjj_orders_v1',
  address: 'zjj_address_v1',
  reviews: 'zjj_reviews_v1',
};

/* 读取配置（config.js 中定义），未定义时走本地兜底 */
const API_BASE = (typeof ZJJ_CONFIG !== 'undefined' && ZJJ_CONFIG.API_BASE) || '';
const MERCHANT_TOKEN = (typeof ZJJ_CONFIG !== 'undefined' && ZJJ_CONFIG.MERCHANT_TOKEN) || '';

const Store = {
  /* ============================================================
     工具：是否在微信环境
     ============================================================ */
  isWeChat() {
    return /MicroMessenger/i.test(navigator.userAgent);
  },

  apiUrl(path) {
    return (API_BASE || '') + path;
  },

  /* ============================================================
     购物车
     ============================================================ */
  getCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.cart)) || [];
    } catch (e) { return []; }
  },

  saveCart(cart) {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  },

  addToCart(productId, spec, qty = 1) {
    const cart = this.getCart();
    const key = `${productId}_${spec}`;
    const existing = cart.find(i => i.key === key);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ key, productId, spec, qty, checked: true });
    }
    this.saveCart(cart);
    return cart;
  },

  setQty(productId, spec, qty) {
    const cart = this.getCart();
    const key = `${productId}_${spec}`;
    const item = cart.find(i => i.key === key);
    if (item) {
      item.qty = Math.max(1, qty);
      this.saveCart(cart);
    }
    return cart;
  },

  toggleChecked(productId, spec) {
    const cart = this.getCart();
    const key = `${productId}_${spec}`;
    const item = cart.find(i => i.key === key);
    if (item) {
      item.checked = !item.checked;
      this.saveCart(cart);
    }
    return cart;
  },

  toggleAllChecked(checked) {
    const cart = this.getCart();
    cart.forEach(i => i.checked = checked);
    this.saveCart(cart);
    return cart;
  },

  removeItem(productId, spec) {
    let cart = this.getCart();
    const key = `${productId}_${spec}`;
    cart = cart.filter(i => i.key !== key);
    this.saveCart(cart);
    return cart;
  },

  removeChecked() {
    let cart = this.getCart();
    cart = cart.filter(i => !i.checked);
    this.saveCart(cart);
    return cart;
  },

  getCartCount() {
    return this.getCart().reduce((sum, i) => sum + i.qty, 0);
  },

  getCheckedItems() {
    const cart = this.getCart();
    return cart.filter(i => i.checked).map(i => {
      const p = getProductById(i.productId);
      return p ? { ...i, product: p } : null;
    }).filter(Boolean);
  },

  isAllChecked() {
    const cart = this.getCart();
    return cart.length > 0 && cart.every(i => i.checked);
  },

  /* ============================================================
     用户
     ============================================================ */
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.user)) || {
        name: '郑小匠',
        level: '食友 · Lv.2',
        avatar: './assets/images/avatar.png',
      };
    } catch (e) {
      return { name: '郑小匠', level: '食友 · Lv.2', avatar: './assets/images/avatar.png' };
    }
  },

  /* ============================================================
     收货地址
     ============================================================ */
  getAddress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.address)) || {
        name: '',
        phone: '',
        detail: '',
      };
    } catch (e) {
      return { name: '', phone: '', detail: '' };
    }
  },

  saveAddress(addr) {
    localStorage.setItem(STORAGE_KEYS.address, JSON.stringify({
      name: addr.name || '',
      phone: addr.phone || '',
      detail: addr.detail || '',
    }));
  },

  /* ============================================================
     订单
     ============================================================ */

  /** 本地兜底：把订单存入 localStorage */
  _saveOrderLocal(order) {
    const orders = this.getOrders();
    orders.unshift(order);
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
  },

  /** 从本地获取订单列表 */
  getOrders() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.orders)) || [];
    } catch (e) { return []; }
  },

  getOrderById(id) {
    return this.getOrders().find(o => o.id === id) || null;
  },

  /**
   * 提交订单到后端 API
   * @param {Array} items   结算商品 [{ productId, product, spec, qty }]
   * @param {Object} address { name, phone, detail }
   * @param {string} payMethod 'cod' | 'wxpay'
   * @returns {Promise<{ok:boolean, order?:Object, error?:string}>}
   */
  async submitOrder(items, address, payMethod = 'cod') {
    const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
    const cfg = typeof ZJJ_CONFIG !== 'undefined' ? ZJJ_CONFIG : {};
    const shipCfg = cfg.SHIPPING || { fee: 8, freeThreshold: 99 };
    const discCfg = cfg.DISCOUNT || { amount: 10, threshold: 200 };
    const shipping = subtotal >= shipCfg.freeThreshold ? 0 : shipCfg.fee;
    const discount = subtotal >= discCfg.threshold ? discCfg.amount : 0;
    const total = subtotal + shipping - discount;

    const payload = {
      items: items.map(i => ({
        productId: i.productId,
        name: i.product.name,
        cover: i.product.cover,
        spec: i.spec,
        price: i.product.price,
        qty: i.qty,
      })),
      address,
      payMethod,
      subtotal,
      shipping,
      discount,
      total,
      remark: '',
    };

    // 尝试提交到后端（带超时，避免占位地址长时间等待）
    if (API_BASE && !/your-worker|localhost\/$/.test(API_BASE)) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(this.apiUrl('/api/orders'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timer);
        const data = await res.json();
        if (data.ok && data.order) {
          this._saveOrderLocal(data.order);
          return { ok: true, order: data.order };
        }
        // 后端返回错误
        return { ok: false, error: data.error || '下单失败' };
      } catch (e) {
        // 网络失败，走本地兜底
        console.warn('订单提交后端失败，使用本地兜底：', e.message || e);
      }
    }

    // 本地兜底创建
    const order = {
      id: 'ZJJ' + Date.now(),
      items: payload.items.map(i => ({ ...i, reviewed: false })),
      address,
      payMethod,
      subtotal,
      shipping,
      discount,
      total,
      status: payMethod === 'cod' ? 'paid' : 'pending',
      createdAt: new Date().toISOString(),
      paidAt: payMethod === 'cod' ? new Date().toISOString() : null,
      shippedAt: null,
      _local: true, // 标记为本地订单
    };
    this._saveOrderLocal(order);
    return { ok: true, order };
  },

  /**
   * 微信支付：调用后端预下单并调起微信支付
   * @param {string} orderId
   * @returns {Promise<{ok:boolean}>}
   */
  async payWithWeChat(orderId) {
    if (!API_BASE) return { ok: false, error: '未配置后端' };
    try {
      const res = await fetch(this.apiUrl('/api/wxpay/prepay'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!data.ok) return { ok: false, error: data.error || '支付失败' };

      // 未配置真实微信支付时，后端返回 mock=true，直接成功
      if (data.mock) {
        await this._updateLocalOrderStatus(orderId, 'paid');
        return { ok: true, mock: true };
      }

      // 真实微信支付：调起 WeixinJSBridge
      return await new Promise(resolve => {
        const p = data.prepay;
        if (typeof WeixinJSBridge === 'undefined') {
          resolve({ ok: false, error: '请在微信中打开支付' });
          return;
        }
        WeixinJSBridge.invoke('getBrandWCPayRequest', {
          appId: p.appId,
          timeStamp: p.timeStamp,
          nonceStr: p.nonceStr,
          package: p.package,
          signType: p.signType,
          paySign: p.paySign,
        }, async (res) => {
          if (res.err_msg === 'get_brand_wcpay_request:ok') {
            await this._updateLocalOrderStatus(orderId, 'paid');
            resolve({ ok: true });
          } else {
            resolve({ ok: false, error: '支付未完成' });
          }
        });
      });
    } catch (e) {
      return { ok: false, error: '网络异常' };
    }
  },

  _updateLocalOrderStatus(orderId, status) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      if (status === 'paid') order.paidAt = order.paidAt || new Date().toISOString();
      if (status === 'shipped') order.shippedAt = order.shippedAt || new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
    }
  },

  /* 标记订单项已评价 */
  markItemReviewed(orderId, productId) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const item = order.items.find(i => i.productId === productId);
      if (item) item.reviewed = true;
      localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
    }
  },

  /* ============================================================
     商家端：从后端拉取全部订单
     ============================================================ */
  async fetchMerchantOrders(token) {
    if (!API_BASE || /your-worker/.test(API_BASE)) return { ok: false, error: '请先在 config.js 配置后端 API_BASE' };
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(this.apiUrl('/api/orders?token=' + encodeURIComponent(token)), { signal: controller.signal });
      clearTimeout(timer);
      const data = await res.json();
      return data;
    } catch (e) {
      return { ok: false, error: '网络异常：' + (e.message || e) };
    }
  },

  /** 商家发货 */
  async shipOrder(orderId, token) {
    if (!API_BASE || /your-worker/.test(API_BASE)) return { ok: false, error: '请先在 config.js 配置后端 API_BASE' };
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(this.apiUrl('/api/orders/' + orderId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json();
      if (data.ok) {
        this._updateLocalOrderStatus(orderId, 'shipped');
      }
      return data;
    } catch (e) {
      return { ok: false, error: '网络异常' };
    }
  },

  /* ============================================================
     评论
     ============================================================ */
  getReviews() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews)) || [];
    } catch (e) { return []; }
  },

  saveReviews(reviews) {
    localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews));
  },

  addReview({ productId, orderId, rating, content }) {
    const reviews = this.getReviews();
    const user = this.getUser();
    const review = {
      id: 'r_' + Date.now(),
      productId,
      orderId,
      rating: Math.max(1, Math.min(5, rating)),
      content: content || '',
      userName: user.name,
      createdAt: new Date().toISOString(),
    };
    reviews.unshift(review);
    this.saveReviews(reviews);
    this.markItemReviewed(orderId, productId);
    return review;
  },

  getReviewsByProduct(productId) {
    return this.getReviews().filter(r => r.productId === productId);
  },

  deleteReview(reviewId) {
    let reviews = this.getReviews();
    reviews = reviews.filter(r => r.id !== reviewId);
    this.saveReviews(reviews);
  },
};
