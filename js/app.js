/* ============================================================
   郑家匠 · 应用主逻辑
   负责视图渲染、路由切换、交互事件
   ============================================================ */

const App = {
  currentTab: 'home',
  currentCategory: 'all',
  detailProduct: null,
  editingProduct: null,
  reviewContext: null,
  specSheet: null, // { productId, spec, qty, action: 'cart'|'buy' }

  init() {
    this.bindTabbar();
    this.render('home');
    this.updateCartBadge();
  },

  /* ---------- 路由 ---------- */
  render(view) {
    const viewEl = document.getElementById('view');
    const topbarTitle = document.getElementById('topbarTitle');
    viewEl.scrollTop = 0;

    switch (view) {
      case 'home':
        topbarTitle.textContent = '郑家匠';
        viewEl.innerHTML = this.renderHome();
        this.bindHomeEvents();
        this.currentTab = 'home';
        break;
      case 'category':
        topbarTitle.textContent = '分类';
        viewEl.innerHTML = this.renderCategory();
        this.bindCategoryEvents();
        this.currentTab = 'category';
        break;
      case 'cart':
        topbarTitle.textContent = '购物袋';
        viewEl.innerHTML = this.renderCart();
        this.bindCartEvents();
        this.currentTab = 'cart';
        break;
      case 'mine':
        topbarTitle.textContent = '我的';
        viewEl.innerHTML = this.renderMine();
        this.bindMineEvents();
        this.currentTab = 'mine';
        break;
      case 'detail':
        topbarTitle.textContent = '商品详情';
        viewEl.innerHTML = this.renderDetail();
        this.bindDetailEvents();
        break;
      case 'checkout':
        topbarTitle.textContent = '确认订单';
        viewEl.innerHTML = this.renderCheckout();
        this.bindCheckoutEvents();
        break;
      case 'merchant':
        topbarTitle.textContent = '商家工作台';
        viewEl.innerHTML = this.renderMerchant();
        this.bindMerchantEvents();
        break;
      case 'product-edit':
        topbarTitle.textContent = this.editingProduct ? '编辑商品' : '新增商品';
        viewEl.innerHTML = this.renderProductEdit();
        this.bindProductEditEvents();
        break;
      case 'category-manage':
        topbarTitle.textContent = '分类管理';
        viewEl.innerHTML = this.renderCategoryManage();
        this.bindCategoryManageEvents();
        break;
      case 'address-edit':
        topbarTitle.textContent = '收货地址';
        viewEl.innerHTML = this.renderAddressEdit();
        this.bindAddressEditEvents();
        break;
      case 'pay':
        topbarTitle.textContent = '订单支付';
        viewEl.innerHTML = this.renderPay();
        this.bindPayEvents();
        break;
      case 'order-detail':
        topbarTitle.textContent = '订单详情';
        viewEl.innerHTML = this.renderOrderDetail();
        this.bindOrderDetailEvents();
        break;
      case 'merchant-orders':
        topbarTitle.textContent = '订单管理';
        viewEl.innerHTML = this.renderMerchantOrders();
        this.bindMerchantOrdersEvents();
        break;
    }
    this.updateTabbarActive();
  },

  /* ---------- TabBar ---------- */
  bindTabbar() {
    document.querySelectorAll('.tb-item').forEach(el => {
      el.addEventListener('click', () => {
        const tab = el.dataset.tab;
        this.render(tab);
      });
    });
  },

  updateTabbarActive() {
    document.querySelectorAll('.tb-item').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === this.currentTab);
    });
  },

  updateCartBadge() {
    const count = Store.getCartCount();
    const badge = document.getElementById('cartBadge');
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  },

  /* ---------- Toast ---------- */
  toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  },

  /* ============================================================
     首页
     ============================================================ */
  renderHome() {
    const featured = PRODUCTS.filter(p => p.tag).slice(0, 4);
    const picked = PRODUCTS.slice(0, 8);

    const catsHtml = CATEGORIES.slice(0, 6).map(c => `
      <div class="cat-q-item" data-cat="${c.id}">
        <div class="cat-q-circle">${c.char}</div>
        <div class="cat-q-name">${c.name}</div>
      </div>
    `).join('');

    const featuredHtml = featured.map(p => this.productCard(p)).join('');
    const pickedHtml = picked.map(p => this.productCard(p)).join('');

    return `
      <div class="hero">
        <img class="hero-img" src="./assets/images/sausage-rice.jpg" alt="" />
        <div class="hero-overlay">
          <div class="t serif">手作的温度，<br/>在一饭一蔬。</div>
          <div class="s">东方手作 · 古法美食 · 产地直供</div>
        </div>
      </div>
      <div class="service-bar">
        <div><b>手作</b>古法工艺</div>
        <div><b>严选</b>产地食材</div>
        <div><b>速达</b>48h发货</div>
        <div><b>安心</b>七天退换</div>
      </div>
      <div class="section">
        <div class="cat-quick">${catsHtml}</div>
      </div>
      <div class="flash-bar">
        <div>
          <div class="fl">🔥 今日手作</div>
          <div class="ft">匠人现制 · 当日鲜发</div>
        </div>
        <div class="timer">距结束 <b>02</b>:<b>34</b>:<b>18</b></div>
      </div>
      <div class="section">
        <div class="section-title">
          <span><span class="t">腊味招牌</span><span class="en">SIGNATURE</span></span>
          <span class="more" data-action="cat-cured">查看全部 ›</span>
        </div>
        <div class="grid2">${featuredHtml}</div>
      </div>
      <div class="section">
        <div class="section-title">
          <span><span class="t">手作甄选</span><span class="en">PICKED</span></span>
        </div>
        <div class="grid2">${pickedHtml}</div>
      </div>
      <div class="story">
        <img src="./assets/images/craft.jpg" alt="" />
        <h3>手作的味道</h3>
        <p>郑家匠始于金华，三代人守着一间晒场、一口老卤。我们相信，美食的温度来自手作——选料、切配、腌制、风干，每一步都由匠人亲手完成，让每一口都吃得到时间与用心。</p>
      </div>
    `;
  },

  productCard(p) {
    const origin = p.originPrice ? `<span class="g-origin">¥${p.originPrice}</span>` : '';
    const tag = p.tag ? `<span class="g-tag">${p.tag}</span>` : '';
    return `
      <div class="g-card" data-pid="${p.id}">
        <div style="position:relative;">
          <img class="g-img" src="${p.cover}" alt="${p.name}" />
          ${tag}
        </div>
        <div class="g-info">
          <div class="g-name">${p.name}</div>
          <div class="g-sub">${p.sub}</div>
          <div class="g-bottom">
            <span class="g-price price"><span class="rmb">¥</span>${p.price}${origin}</span>
          </div>
        </div>
      </div>
    `;
  },

  bindHomeEvents() {
    document.querySelectorAll('.cat-q-item').forEach(el => {
      el.addEventListener('click', () => {
        this.currentCategory = el.dataset.cat;
        this.render('category');
      });
    });
    document.querySelectorAll('.g-card').forEach(el => {
      el.addEventListener('click', () => {
        this.detailProduct = getProductById(el.dataset.pid);
        this.render('detail');
      });
    });
    const more = document.querySelector('[data-action="cat-cured"]');
    if (more) more.addEventListener('click', () => {
      this.currentCategory = 'cured';
      this.render('category');
    });
  },

  /* ============================================================
     分类页
     ============================================================ */
  renderCategory() {
    const cat = this.currentCategory;
    const sideHtml = CATEGORIES.map(c => `
      <div class="ci ${c.id === cat ? 'on' : ''}" data-cat="${c.id}">${c.name}</div>
    `).join('');

    const products = getProductsByCategory(cat);
    const catName = getCategoryName(cat);
    const gridHtml = products.map(p => this.productCard(p)).join('');

    return `
      <div class="cat-page">
        <div class="cat-side">${sideHtml}</div>
        <div class="cat-main">
          <div class="search">🔍 搜索美食、风味、产地</div>
          <div class="cm-title">${catName} · 手作精选</div>
          <div class="cm-sub">古法工艺 · 产地直供 · 安心食材</div>
          <div class="grid2">${gridHtml}</div>
        </div>
      </div>
    `;
  },

  bindCategoryEvents() {
    document.querySelectorAll('.cat-side .ci').forEach(el => {
      el.addEventListener('click', () => {
        this.currentCategory = el.dataset.cat;
        this.render('category');
      });
    });
    document.querySelectorAll('.g-card').forEach(el => {
      el.addEventListener('click', () => {
        this.detailProduct = getProductById(el.dataset.pid);
        this.render('detail');
      });
    });
  },

  /* ============================================================
     商品详情页
     ============================================================ */
  renderDetail() {
    const p = this.detailProduct;
    if (!p) return '<div class="empty"><div class="ico">😢</div><div class="t">商品不存在</div></div>';

    const tagsHtml = p.tags.map((t, i) => {
      const green = i === p.tags.length - 1 ? 'green' : '';
      return `<span class="det-tag ${green}">${t}</span>`;
    }).join('');

    const paramsHtml = Object.entries(p.params).map(([k, v]) => `
      <div class="param"><span class="k">${k}</span><span class="v">${v}</span></div>
    `).join('');

    const descHtml = p.desc.map(d => `<p class="detail-p">${d}</p>`).join('');
    const detailImg = p.detailImage ? `<img class="det-detail-img" src="${p.detailImage}" alt="" />` : '';
    const origin = p.originPrice ? `<span class="det-origin">¥${p.originPrice}</span>` : '';

    return `
      <div class="detail">
        <div class="det-img-wrap">
          <img class="det-img" src="${p.cover}" alt="${p.name}" />
          <div class="det-dots">1 / 5</div>
        </div>
        <div class="det-body">
          <div class="det-price-wrap">
            <span class="det-price price"><span class="rmb">¥</span>${p.price}</span>
            ${origin}
            <span class="det-sales">已售 ${p.sales}</span>
          </div>
          <div class="det-name">${p.name}</div>
          <div class="det-sub">${p.sub}</div>
          <div class="det-tags">${tagsHtml}</div>
          <div class="params">${paramsHtml}</div>
          <div class="quote-box">
            <div class="q">「${p.quote}」</div>
            <div class="by">—— ${p.quoteBy}</div>
          </div>
          <div class="detail-h">食用方式</div>
          ${descHtml}
          ${detailImg}
          ${this.renderReviewsSection(p.id)}
        </div>
        <div class="det-dock">
          <div class="dock-ico" id="favBtn">
            <img src="./assets/icons/star.png" alt="" />
            <span>收藏</span>
          </div>
          <div class="dock-ico" data-action="go-cart">
            <img src="./assets/icons/cart.png" alt="" />
            <span>购物袋</span>
          </div>
          <div class="btn-group">
            <div class="btn-cart" id="addCartBtn">加入购物袋</div>
            <div class="btn-buy" id="buyNowBtn">立即购买</div>
          </div>
        </div>
      </div>
    `;
  },

  bindDetailEvents() {
    const p = this.detailProduct;
    if (!p) return;

    document.getElementById('addCartBtn').addEventListener('click', () => {
      this.openSpecSheet(p, 'cart');
    });
    document.getElementById('buyNowBtn').addEventListener('click', () => {
      this.openSpecSheet(p, 'buy');
    });
    document.querySelector('[data-action="go-cart"]').addEventListener('click', () => {
      this.render('cart');
    });
    document.getElementById('favBtn').addEventListener('click', () => {
      this.toast('已加入收藏');
    });
  },

  openSpecSheet(product, action) {
    this.specSheet = { productId: product.id, spec: product.specs[0], qty: 1, action };
    this.renderSpecSheet();
  },

  renderSpecSheet() {
    const s = this.specSheet;
    const p = getProductById(s.productId);
    const optsHtml = p.specs.map(sp => `
      <div class="spec-opt ${sp === s.spec ? 'on' : ''}" data-spec="${sp}">${sp}</div>
    `).join('');

    document.getElementById('specSheet').innerHTML = `
      <div class="spec-head">
        <img src="${p.cover}" alt="" />
        <div class="spec-info">
          <div class="p">${p.name}</div>
          <div class="pr price"><span class="rmb">¥</span>${p.price}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px;">已选：${s.spec}</div>
        </div>
      </div>
      <div class="spec-row">
        <div class="label">规格</div>
        <div class="spec-opts">${optsHtml}</div>
      </div>
      <div class="qty-row">
        <span class="label">数量</span>
        <div class="stepper">
          <div class="st-btn" id="qtyMinus">−</div>
          <div class="st-val">${s.qty}</div>
          <div class="st-btn" id="qtyPlus">+</div>
        </div>
      </div>
      <button class="btn-primary spec-confirm" id="specConfirm">
        ${s.action === 'cart' ? '加入购物袋' : '立即购买'}
      </button>
    `;
    document.getElementById('specMask').classList.add('show');
    document.getElementById('specSheet').classList.add('show');

    document.getElementById('specMask').onclick = () => this.closeSpecSheet();
    document.querySelectorAll('.spec-opt').forEach(el => {
      el.onclick = () => {
        this.specSheet.spec = el.dataset.spec;
        this.renderSpecSheet();
      };
    });
    document.getElementById('qtyMinus').onclick = () => {
      this.specSheet.qty = Math.max(1, this.specSheet.qty - 1);
      this.renderSpecSheet();
    };
    document.getElementById('qtyPlus').onclick = () => {
      this.specSheet.qty += 1;
      this.renderSpecSheet();
    };
    document.getElementById('specConfirm').onclick = () => {
      this.confirmSpec();
    };
  },

  closeSpecSheet() {
    const mask = document.getElementById('specMask');
    const sheet = document.getElementById('specSheet');
    if (mask) mask.classList.remove('show');
    if (sheet) sheet.classList.remove('show');
    this.specSheet = null;
  },

  /* ============================================================
     评价弹窗
     ============================================================ */
  openReviewModal() {
    const ctx = this.reviewContext;
    if (!ctx) return;
    this._reviewRating = 5;
    document.getElementById('reviewSheet').innerHTML = `
      <div class="rv-title">评价商品</div>
      <div class="rv-product">${ctx.productName}</div>
      <div class="rv-label">评分</div>
      <div class="rv-stars" id="rvStars">
        ${[1,2,3,4,5].map(i => `<span class="rv-star on" data-v="${i}">★</span>`).join('')}
      </div>
      <div class="rv-label">评价内容</div>
      <textarea class="rv-text" id="rvText" rows="4" placeholder="分享你的食用感受（选填）"></textarea>
      <div class="rv-actions">
        <button class="btn-ghost" id="rvCancel">取消</button>
        <button class="btn-primary" id="rvSubmit">提交评价</button>
      </div>
    `;
    document.getElementById('reviewMask').classList.add('show');
    document.getElementById('reviewSheet').classList.add('show');

    document.getElementById('reviewMask').onclick = () => this.closeReviewModal();
    document.getElementById('rvCancel').onclick = () => this.closeReviewModal();
    document.querySelectorAll('#rvStars .rv-star').forEach(el => {
      el.onclick = () => {
        this._reviewRating = parseInt(el.dataset.v);
        document.querySelectorAll('#rvStars .rv-star').forEach(s => {
          s.classList.toggle('on', parseInt(s.dataset.v) <= this._reviewRating);
        });
      };
    });
    document.getElementById('rvSubmit').onclick = () => {
      const content = document.getElementById('rvText').value.trim();
      Store.addReview({
        productId: ctx.productId,
        orderId: ctx.orderId,
        rating: this._reviewRating,
        content,
      });
      this.toast('评价提交成功');
      this.closeReviewModal();
      this.reviewContext = null;
      this.render('mine');
    };
  },

  closeReviewModal() {
    document.getElementById('reviewMask').classList.remove('show');
    document.getElementById('reviewSheet').classList.remove('show');
  },

  /* 商品详情页的评论区 */
  renderReviewsSection(productId) {
    const reviews = Store.getReviewsByProduct(productId);
    if (reviews.length === 0) {
      return `
        <div class="detail-h">用户评价</div>
        <div class="rv-empty">暂无评价，购买后快来分享你的感受吧～</div>
      `;
    }
    const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
    const listHtml = reviews.slice(0, 10).map(r => {
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      const date = new Date(r.createdAt).toLocaleDateString('zh-CN');
      return `
        <div class="rv-item">
          <div class="rv-item-top">
            <span class="rv-user">${r.userName}</span>
            <span class="rv-item-stars">${stars}</span>
          </div>
          ${r.content ? `<div class="rv-content">${r.content}</div>` : '<div class="rv-content" style="color:var(--muted-2);">此用户未填写评价内容</div>'}
          <div class="rv-date">${date}</div>
        </div>
      `;
    }).join('');
    return `
      <div class="detail-h">用户评价 <span class="rv-avg">${avg} 分 · ${reviews.length} 条</span></div>
      <div class="rv-list">${listHtml}</div>
    `;
  },

  confirmSpec() {
    const s = this.specSheet;
    if (s.action === 'cart') {
      Store.addToCart(s.productId, s.spec, s.qty);
      this.updateCartBadge();
      this.toast('已加入购物袋');
    } else {
      // 立即购买：临时放入购物车并跳转结算
      Store.addToCart(s.productId, s.spec, s.qty);
      this.updateCartBadge();
      // 只结算当前商品
      this.buyNowItems = [{ productId: s.productId, spec: s.spec, qty: s.qty }];
      this.render('checkout');
    }
    this.closeSpecSheet();
  },

  /* ============================================================
     购物车
     ============================================================ */
  renderCart() {
    const cart = Store.getCart();
    if (cart.length === 0) {
      return `
        <div class="empty">
          <div class="ico">🛒</div>
          <div class="t">购物袋空空如也</div>
          <button class="btn-primary" onclick="App.render('home')">去逛逛</button>
        </div>
      `;
    }

    const items = cart.map(i => {
      const p = getProductById(i.productId);
      if (!p) return '';
      return `
        <div class="cart-item">
          <div class="check ${i.checked ? 'on' : ''}" data-key="${i.key}">${i.checked ? '✓' : ''}</div>
          <img class="ci-img" src="${p.cover}" alt="" />
          <div class="ci-info">
            <div class="ci-name">${p.name}</div>
            <div class="ci-spec">${i.spec}</div>
            <div class="ci-bottom">
              <span class="ci-price price"><span class="rmb">¥</span>${p.price}</span>
              <div class="stepper">
                <div class="st-btn" data-action="minus" data-key="${i.key}">−</div>
                <div class="st-val">${i.qty}</div>
                <div class="st-btn" data-action="plus" data-key="${i.key}">+</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const checked = Store.getCheckedItems();
    const total = checked.reduce((s, i) => s + i.product.price * i.qty, 0);
    const allChecked = Store.isAllChecked();

    return `
      <div class="cart-head">
        <h2>购物袋</h2>
        <span class="m" id="cartManage">管理</span>
      </div>
      ${items}
      <div class="cart-bar">
        <div class="check ${allChecked ? 'on' : ''}" id="checkAll">${allChecked ? '✓' : ''}</div>
        <span style="font-size:12px;">全选</span>
        <div class="tot">合计：<span class="p price"><span class="rmb">¥</span>${total.toFixed(2)}</span></div>
        <div class="pay-btn" id="checkoutBtn">去结算(${checked.length})</div>
      </div>
    `;
  },

  bindCartEvents() {
    document.querySelectorAll('.check[data-key]').forEach(el => {
      el.addEventListener('click', () => {
        const [pid, spec] = el.dataset.key.split('_');
        Store.toggleChecked(pid, spec);
        this.render('cart');
      });
    });
    document.querySelectorAll('.st-btn').forEach(el => {
      el.addEventListener('click', () => {
        const [pid, spec] = el.dataset.key.split('_');
        const item = Store.getCart().find(i => i.key === el.dataset.key);
        if (!item) return;
        if (el.dataset.action === 'plus') {
          Store.setQty(pid, spec, item.qty + 1);
        } else {
          if (item.qty <= 1) {
            Store.removeItem(pid, spec);
            this.toast('已移除商品');
          } else {
            Store.setQty(pid, spec, item.qty - 1);
          }
        }
        this.updateCartBadge();
        this.render('cart');
      });
    });
    document.getElementById('checkAll').addEventListener('click', () => {
      Store.toggleAllChecked(!Store.isAllChecked());
      this.render('cart');
    });
    document.getElementById('checkoutBtn').addEventListener('click', () => {
      const checked = Store.getCheckedItems();
      if (checked.length === 0) {
        this.toast('请选择商品');
        return;
      }
      this.buyNowItems = null; // 使用购物车选中项
      this.render('checkout');
    });
    const manage = document.getElementById('cartManage');
    if (manage) manage.addEventListener('click', () => {
      Store.removeChecked();
      this.updateCartBadge();
      this.render('cart');
      this.toast('已清除选中商品');
    });
  },

  /* ============================================================
     确认订单
     ============================================================ */
  renderCheckout() {
    const items = this.buyNowItems
      ? this.buyNowItems.map(i => ({ ...i, product: getProductById(i.productId) }))
      : Store.getCheckedItems();

    if (items.length === 0) {
      return '<div class="empty"><div class="ico">😢</div><div class="t">没有可结算的商品</div></div>';
    }

    const addr = Store.getAddress();
    const hasAddr = addr.name && addr.phone && addr.detail;
    const itemsHtml = items.map(i => `
      <div class="oi">
        <img src="${i.product.cover}" alt="" />
        <div class="oi-info"><div class="n">${i.product.name}</div><div class="sp">${i.spec}</div></div>
        <div style="text-align:right;"><div class="pr price">¥${i.product.price}</div><div class="q">×${i.qty}</div></div>
      </div>
    `).join('');

    const cfg = typeof ZJJ_CONFIG !== 'undefined' ? ZJJ_CONFIG : {};
    const shipCfg = cfg.SHIPPING || { fee: 8, freeThreshold: 99 };
    const discCfg = cfg.DISCOUNT || { amount: 10, threshold: 200 };
    const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
    const shipping = subtotal >= shipCfg.freeThreshold ? 0 : shipCfg.fee;
    const discount = subtotal >= discCfg.threshold ? discCfg.amount : 0;
    const total = subtotal + shipping - discount;
    const inWeChat = Store.isWeChat();

    return `
      <div class="checkout" style="padding-bottom:80px;">
        <div class="addr" id="addrEntry">
          <div class="loc">📍</div>
          <div class="a-info">
            ${hasAddr
              ? `<div class="a-top"><b>${addr.name}</b>&nbsp;&nbsp;${addr.phone}</div><div class="a-det">${addr.detail}</div>`
              : `<div class="a-top" style="color:var(--muted);">请添加收货地址</div><div class="a-det" style="color:var(--muted-2);">点击填写姓名、电话、详细地址</div>`
            }
          </div>
          <span style="color:var(--muted-2);">›</span>
        </div>
        <div class="order-items">${itemsHtml}</div>
        <div class="payway">
          <div class="rw"><span>商品金额</span><span>¥${subtotal.toFixed(2)}</span></div>
          <div class="rw"><span>运费</span><span style="color:var(--green);">${shipping === 0 ? '免运费' : '¥' + shipping.toFixed(2)}</span></div>
          ${discount > 0 ? `<div class="rw"><span>优惠</span><span style="color:var(--primary);">-¥${discount.toFixed(2)}</span></div>` : ''}
          <div class="hr" style="margin:8px 0;"></div>
          <div class="rw"><span>实付款</span><span class="v">¥${total.toFixed(2)}</span></div>
        </div>
        <div class="pay-methods">
          <div class="pm-title">支付方式</div>
          <label class="pm-item">
            <input type="radio" name="payMethod" value="cod" checked />
            <span class="pm-ico">💰</span>
            <div class="pm-info"><div class="n">货到付款</div><div class="s">收货时支付现金给快递员</div></div>
          </label>
          ${inWeChat ? `
          <label class="pm-item">
            <input type="radio" name="payMethod" value="wxpay" />
            <span class="pm-ico" style="background:#07C160;color:#fff;">微</span>
            <div class="pm-info"><div class="n">微信支付</div><div class="s">${(cfg.WX_PAY && cfg.WX_PAY.enabled) ? '推荐使用' : '需商家开通微信支付'}</div></div>
          </label>` : ''}
        </div>
        <div class="checkout-dock">
          <div class="tot">实付：<span class="p price">¥${total.toFixed(2)}</span></div>
          <button class="btn-primary" id="submitOrder">提交订单</button>
        </div>
      </div>
    `;
  },

  bindCheckoutEvents() {
    // 点击地址 → 地址编辑
    document.getElementById('addrEntry').addEventListener('click', () => {
      this._returnView = 'checkout';
      this.render('address-edit');
    });

    document.getElementById('submitOrder').addEventListener('click', async () => {
      const items = this.buyNowItems
        ? this.buyNowItems.map(i => ({ ...i, product: getProductById(i.productId) }))
        : Store.getCheckedItems();
      const addr = Store.getAddress();
      if (!addr.name || !addr.phone || !addr.detail) {
        this.toast('请先填写收货地址');
        this.render('address-edit');
        return;
      }
      const payMethod = document.querySelector('input[name="payMethod"]:checked')?.value || 'cod';
      const btn = document.getElementById('submitOrder');
      btn.disabled = true;
      btn.textContent = '提交中...';

      const result = await Store.submitOrder(items, addr, payMethod);
      if (result.ok) {
        const order = result.order;
        // 清除已结算商品
        if (this.buyNowItems) {
          this.buyNowItems.forEach(i => Store.removeItem(i.productId, i.spec));
          this.buyNowItems = null;
        } else {
          Store.removeChecked();
        }
        this.updateCartBadge();
        this.pendingOrder = order;
        // 货到付款直接完成；微信支付跳支付页
        if (payMethod === 'wxpay' && order.status === 'pending') {
          this.render('pay');
        } else {
          this.toast('下单成功！');
          setTimeout(() => this.render('order-detail'), 800);
        }
      } else {
        btn.disabled = false;
        btn.textContent = '提交订单';
        this.toast(result.error || '下单失败');
      }
    });
  },

  /* ============================================================
     收货地址编辑
     ============================================================ */
  renderAddressEdit() {
    const addr = Store.getAddress();
    return `
      <div class="addr-edit">
        <div class="form-row">
          <label>收货人</label>
          <input type="text" id="addrName" placeholder="请输入姓名" value="${addr.name || ''}" />
        </div>
        <div class="form-row">
          <label>手机号</label>
          <input type="tel" id="addrPhone" placeholder="请输入手机号" maxlength="11" value="${addr.phone || ''}" />
        </div>
        <div class="form-row">
          <label>所在地区</label>
          <input type="text" id="addrRegion" placeholder="如：浙江省杭州市西湖区" value="${(addr.detail || '').split(' ')[0] || ''}" />
        </div>
        <div class="form-row">
          <label>详细地址</label>
          <textarea id="addrDetail" placeholder="街道、门牌号、楼层等" rows="3">${(addr.detail || '').split(' ').slice(1).join(' ') || ''}</textarea>
        </div>
        <button class="btn-primary addr-save" id="addrSaveBtn">保存地址</button>
      </div>
    `;
  },

  bindAddressEditEvents() {
    document.getElementById('addrSaveBtn').addEventListener('click', () => {
      const name = document.getElementById('addrName').value.trim();
      const phone = document.getElementById('addrPhone').value.trim();
      const region = document.getElementById('addrRegion').value.trim();
      const detail = document.getElementById('addrDetail').value.trim();
      if (!name) return this.toast('请填写收货人');
      if (!/^1\d{10}$/.test(phone)) return this.toast('请填写正确的手机号');
      if (!region || !detail) return this.toast('请填写完整地址');
      Store.saveAddress({ name, phone, detail: `${region} ${detail}` });
      this.toast('地址已保存');
      const back = this._returnView || 'checkout';
      this._returnView = null;
      this.render(back);
    });
  },

  /* ============================================================
     订单支付页
     ============================================================ */
  renderPay() {
    const order = this.pendingOrder;
    if (!order) {
      return '<div class="empty"><div class="ico">😢</div><div class="t">订单不存在</div></div>';
    }
    return `
      <div class="pay-page">
        <div class="pay-amount">
          <div class="l">支付金额</div>
          <div class="amt price">¥${(order.total || 0).toFixed(2)}</div>
        </div>
        <div class="pay-qr">
          <div class="qr-tip">
            <div class="qr-ico">💚</div>
            <div>微信支付</div>
          </div>
          <div class="qr-desc">请在微信中完成支付</div>
          <button class="btn-primary pay-now" id="payNowBtn">立即支付 ¥${(order.total || 0).toFixed(2)}</button>
          <div class="pay-skip" id="paySkip">稍后支付（货到付款）</div>
        </div>
        <div class="pay-remark">订单号：${order.id}</div>
      </div>
    `;
  },

  bindPayEvents() {
    const order = this.pendingOrder;
    document.getElementById('payNowBtn').addEventListener('click', async () => {
      const btn = document.getElementById('payNowBtn');
      btn.disabled = true;
      btn.textContent = '支付中...';
      const res = await Store.payWithWeChat(order.id);
      if (res.ok) {
        if (res.mock) this.toast('支付成功（模拟）');
        else this.toast('支付成功');
        this.pendingOrder = Store.getOrderById(order.id) || order;
        this.render('order-detail');
      } else {
        btn.disabled = false;
        btn.textContent = `立即支付 ¥${(order.total || 0).toFixed(2)}`;
        this.toast(res.error || '支付失败');
      }
    });
    document.getElementById('paySkip').addEventListener('click', () => {
      this.toast('已暂存订单，可在"我的订单"中继续支付');
      this.render('mine');
    });
  },

  /* ============================================================
     订单详情
     ============================================================ */
  renderOrderDetail() {
    const order = this.pendingOrder || (this._selectedOrderId && Store.getOrderById(this._selectedOrderId));
    if (!order) return '<div class="empty"><div class="ico">😢</div><div class="t">订单不存在</div></div>';

    const statusMap = {
      pending: { text: '待支付', color: 'var(--primary)' },
      paid: { text: '待发货', color: 'var(--accent)' },
      shipped: { text: '配送中', color: '#2b7cff' },
      done: { text: '已完成', color: 'var(--green)' },
      canceled: { text: '已取消', color: 'var(--muted)' },
    };
    const st = statusMap[order.status] || statusMap.pending;
    const date = new Date(order.createdAt).toLocaleString('zh-CN');

    const itemsHtml = order.items.map(it => `
      <div class="oi">
        <img src="${it.cover}" alt="" />
        <div class="oi-info"><div class="n">${it.name}</div><div class="sp">${it.spec}</div></div>
        <div style="text-align:right;"><div class="pr price">¥${it.price}</div><div class="q">×${it.qty}</div></div>
      </div>
    `).join('');

    return `
      <div class="order-detail" style="padding-bottom:80px;">
        <div class="od-status" style="background:${st.color};">
          <div class="ods-t">${st.text}</div>
          <div class="ods-s">${order.status === 'pending' ? '请尽快完成支付' : order.status === 'paid' ? '商家正在备货，请耐心等待' : order.status === 'shipped' ? '商品已发出，请注意查收' : '感谢您的支持'}</div>
        </div>
        <div class="addr">
          <div class="loc">📍</div>
          <div class="a-info">
            <div class="a-top"><b>${order.address.name}</b>&nbsp;&nbsp;${order.address.phone}</div>
            <div class="a-det">${order.address.detail}</div>
          </div>
        </div>
        <div class="order-items">${itemsHtml}</div>
        <div class="payway">
          <div class="rw"><span>商品金额</span><span>¥${(order.subtotal || 0).toFixed(2)}</span></div>
          <div class="rw"><span>运费</span><span>${order.shipping === 0 ? '免运费' : '¥' + (order.shipping || 0).toFixed(2)}</span></div>
          ${order.discount > 0 ? `<div class="rw"><span>优惠</span><span style="color:var(--primary);">-¥${order.discount.toFixed(2)}</span></div>` : ''}
          <div class="hr" style="margin:8px 0;"></div>
          <div class="rw"><span>实付款</span><span class="v">¥${(order.total || 0).toFixed(2)}</span></div>
          <div class="rw"><span>支付方式</span><span>${order.payMethod === 'wxpay' ? '微信支付' : '货到付款'}</span></div>
        </div>
        <div class="od-info">
          <div class="rw"><span>订单编号</span><span>${order.id}</span></div>
          <div class="rw"><span>下单时间</span><span>${date}</span></div>
          ${order.shippedAt ? `<div class="rw"><span>发货时间</span><span>${new Date(order.shippedAt).toLocaleString('zh-CN')}</span></div>` : ''}
        </div>
        <div class="od-dock">
          ${order.status === 'pending' ? `<button class="btn-primary" id="odPayBtn">立即支付</button>` : ''}
          ${order.status === 'shipped' ? `<button class="btn-primary" id="odConfirmBtn">确认收货</button>` : ''}
          <button class="btn-ghost" id="odBackBtn">返回</button>
        </div>
      </div>
    `;
  },

  bindOrderDetailEvents() {
    const order = this.pendingOrder || (this._selectedOrderId && Store.getOrderById(this._selectedOrderId));
    const payBtn = document.getElementById('odPayBtn');
    if (payBtn) {
      payBtn.addEventListener('click', () => {
        this.pendingOrder = order;
        this.render('pay');
      });
    }
    const confirmBtn = document.getElementById('odConfirmBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (confirm('确认已收到商品？')) {
          Store._updateLocalOrderStatus(order.id, 'done');
          this.toast('已确认收货');
          this.pendingOrder = Store.getOrderById(order.id);
          this.render('order-detail');
        }
      });
    }
    const backBtn = document.getElementById('odBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.render('mine'));
    }
  },

  /* ============================================================
     商家订单管理
     ============================================================ */
  renderMerchantOrders() {
    const orders = this._merchantOrders || [];
    if (orders.length === 0) {
      return `
        <div class="mo-empty">
          <div class="ico">📋</div>
          <div class="t">${this._merchantOrders ? '暂无订单' : '点击下方按钮加载订单'}</div>
          <button class="btn-primary" id="moLoadBtn" style="margin-top:16px;">${this._merchantOrders ? '刷新' : '加载全部订单'}</button>
        </div>
      `;
    }
    const statusMap = {
      pending: '待支付', paid: '待发货', shipped: '配送中', done: '已完成', canceled: '已取消',
    };
    const listHtml = orders.map(o => {
      const itemsHtml = o.items.map(it => `
        <div class="ord-item">
          <img class="ord-img" src="${it.cover}" alt="" />
          <div class="ord-info">
            <div class="ord-name">${it.name}</div>
            <div class="ord-meta">${it.spec} · ×${it.qty}</div>
          </div>
          <div class="ord-right"><div class="ord-price">¥${it.price}</div></div>
        </div>
      `).join('');
      const date = new Date(o.createdAt).toLocaleString('zh-CN');
      return `
        <div class="ord-card mo-card">
          <div class="ord-head">
            <span class="ord-no">${o.id}</span>
            <span class="ord-date">${date}</span>
          </div>
          <div class="mo-addr">
            <b>${o.address.name}</b> ${o.address.phone}<br/>
            <span style="color:var(--muted);">${o.address.detail}</span>
          </div>
          ${itemsHtml}
          <div class="ord-foot">
            <span>实付 <b class="price">¥${(o.total || 0).toFixed(2)}</b></span>
            <span class="mo-st st-${o.status}">${statusMap[o.status] || o.status}</span>
          </div>
          ${o.status === 'paid' ? `<div class="mo-actions"><button class="btn-primary mo-ship" data-oid="${o.id}">确认发货</button></div>` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="mo-page">
        <div class="mo-toolbar">
          <button class="btn-primary" id="moLoadBtn">刷新订单</button>
          <span class="mo-count">共 ${orders.length} 单</span>
        </div>
        ${listHtml}
      </div>
    `;
  },

  bindMerchantOrdersEvents() {
    const loadBtn = document.getElementById('moLoadBtn');
    if (loadBtn) {
      loadBtn.addEventListener('click', async () => {
        loadBtn.disabled = true;
        loadBtn.textContent = '加载中...';
        const token = MERCHANT_TOKEN || (typeof ZJJ_CONFIG !== 'undefined' ? ZJJ_CONFIG.MERCHANT_TOKEN : '');
        const res = await Store.fetchMerchantOrders(token);
        if (res.ok) {
          this._merchantOrders = res.orders;
          this.render('merchant-orders');
        } else {
          loadBtn.disabled = false;
          loadBtn.textContent = '刷新订单';
          this.toast(res.error || '加载失败');
        }
      });
    }
    document.querySelectorAll('.mo-ship').forEach(el => {
      el.addEventListener('click', async () => {
        const oid = el.dataset.oid;
        if (!confirm('确认已发货？')) return;
        const token = MERCHANT_TOKEN || (typeof ZJJ_CONFIG !== 'undefined' ? ZJJ_CONFIG.MERCHANT_TOKEN : '');
        el.disabled = true;
        el.textContent = '处理中...';
        const res = await Store.shipOrder(oid, token);
        if (res.ok) {
          this.toast('已标记发货');
          this._merchantOrders = (this._merchantOrders || []).map(o => o.id === oid ? res.order : o);
          this.render('merchant-orders');
        } else {
          el.disabled = false;
          el.textContent = '确认发货';
          this.toast(res.error || '操作失败');
        }
      });
    });
  },

  /* ============================================================
     我的
     ============================================================ */
  renderMine() {
    const user = Store.getUser();
    const orders = Store.getOrders();
    const stats = { fav: 18, done: orders.length || 42, coupon: 3 };

    return `
      <div class="mbg">
        <div class="mrow">
          <img class="avatar" src="${user.avatar}" alt="" />
          <div class="minfo">
            <div class="n">${user.name}</div>
            <div class="lv">${user.level}</div>
          </div>
        </div>
        <div class="mstats">
          <div class="mstat"><div class="n">${stats.fav}</div><div class="l">收藏</div></div>
          <div class="mstat"><div class="n">${stats.done}</div><div class="l">已完成</div></div>
          <div class="mstat"><div class="n">${stats.coupon}</div><div class="l">优惠券</div></div>
        </div>
      </div>
      <div class="mcard">
        <div class="t">我的订单</div>
        <div class="shortcuts">
          <div class="sc" data-oc="unpaid"><div class="mk">付</div><div class="sl">待付款</div></div>
          <div class="sc" data-oc="paid"><div class="mk">发</div><div class="sl">待发货</div></div>
          <div class="sc" data-oc="shipped"><div class="mk">收</div><div class="sl">待收货</div></div>
          <div class="sc" data-oc="done"><div class="mk">完</div><div class="sl">已完成</div></div>
        </div>
      </div>
      <div class="m-entry" data-entry="merchant">
        <div class="ico">🏪</div>
        <div class="t"><div class="n">商家工作台</div><div class="s">上架手作新品，管理美食货架</div></div>
        <span style="color:var(--muted-2);">›</span>
      </div>
      <div class="orders-section">
        <div class="section-title" style="padding: 0 4px 12px;">
          <span class="t">我的订单</span>
        </div>
        ${orders.length === 0 ? '<div class="empty" style="padding:30px 12px;"><div class="ico">📦</div><div class="t">暂无订单</div></div>' : orders.slice(0, 5).map(o => {
          const itemsHtml = o.items.map(it => `
            <div class="ord-item">
              <img class="ord-img" src="${it.cover}" alt="" />
              <div class="ord-info">
                <div class="ord-name">${it.name}</div>
                <div class="ord-meta">${it.spec} · ×${it.qty}</div>
              </div>
              <div class="ord-right">
                <div class="ord-price">¥${it.price}</div>
                ${it.reviewed
                  ? '<span class="ord-reviewed">已评价</span>'
                  : `<div class="ord-review-btn" data-oid="${o.id}" data-pid="${it.productId}" data-pname="${it.name}">评价</div>`}
              </div>
            </div>
          `).join('');
          const date = new Date(o.createdAt).toLocaleDateString('zh-CN');
          const statusMap = { pending: '待支付', paid: '待发货', shipped: '配送中', done: '已完成', canceled: '已取消' };
          return `
            <div class="ord-card ord-clickable" data-oid="${o.id}">
              <div class="ord-head">
                <span class="ord-no">${o.id}</span>
                <span class="ord-date">${date}</span>
              </div>
              <div class="ord-status-tag">${statusMap[o.status] || ''}</div>
              ${itemsHtml}
              <div class="ord-foot">
                <span>共 ${o.items.reduce((s, i) => s + i.qty, 0)} 件</span>
                <span>实付 <b class="price">¥${o.total.toFixed(2)}</b></span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="mlist">
        <div class="li">我的收藏 <span class="ar">18 件 ›</span></div>
        <div class="li" data-entry="address">收货地址 <span class="ar">›</span></div>
        <div class="li">联系客服 <span class="ar">›</span></div>
        <div class="li">关于郑家匠 <span class="ar">›</span></div>
      </div>
    `;
  },

  bindMineEvents() {
    document.querySelectorAll('.sc').forEach(el => {
      el.addEventListener('click', () => {
        this.toast(`查看「${el.querySelector('.sl').textContent}」订单`);
      });
    });
    const merchantEntry = document.querySelector('[data-entry="merchant"]');
    if (merchantEntry) {
      merchantEntry.addEventListener('click', () => this.render('merchant'));
    }
    // 点击订单卡片 → 订单详情
    document.querySelectorAll('.ord-clickable').forEach(el => {
      el.addEventListener('click', (e) => {
        // 评价按钮自己处理，不触发卡片跳转
        if (e.target.closest('.ord-review-btn')) return;
        this._selectedOrderId = el.dataset.oid;
        this.pendingOrder = Store.getOrderById(el.dataset.oid);
        this.render('order-detail');
      });
    });
    document.querySelectorAll('.ord-review-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.reviewContext = {
          orderId: el.dataset.oid,
          productId: el.dataset.pid,
          productName: el.dataset.pname,
        };
        this.openReviewModal();
      });
    });
    // 收货地址入口
    const addrEntry = document.querySelector('[data-entry="address"]');
    if (addrEntry) {
      addrEntry.addEventListener('click', () => {
        this._returnView = 'mine';
        this.render('address-edit');
      });
    }
    document.querySelectorAll('.mlist .li').forEach(el => {
      if (el.dataset.entry) return; // 已单独绑定
      el.addEventListener('click', () => {
        const name = el.firstChild.textContent.trim();
        this.toast(`「${name}」功能开发中`);
      });
    });
  },

  /* ============================================================
     商家工作台
     ============================================================ */
  renderMerchant() {
    const products = PRODUCTS;
    const totalSales = products.reduce((s, p) => s + (p.sales || 0), 0);
    const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);

    const listHtml = products.map(p => {
      const catName = getCategoryName(p.category);
      return `
        <div class="m-item">
          <img class="m-img" src="${p.cover}" alt="" />
          <div class="m-info">
            <div class="m-name">${p.name}</div>
            <div class="m-meta">¥${p.price} · 库存 ${p.stock || 0} · 已售 ${p.sales || 0}</div>
            <div class="m-cat">${catName}</div>
          </div>
          <div class="m-actions">
            <div class="m-btn edit" data-pid="${p.id}">编辑</div>
            <div class="m-btn del" data-pid="${p.id}">删除</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="m-hero">
        <div class="m-hero-t">郑家匠 · 商家工作台</div>
        <div class="m-hero-s">管理你的手作美食货架</div>
      </div>
      <div class="m-stats">
        <div class="m-st"><div class="m-st-n">${products.length}</div><div class="m-st-l">在售商品</div></div>
        <div class="m-st"><div class="m-st-n">${totalSales}</div><div class="m-st-l">累计销量</div></div>
        <div class="m-st"><div class="m-st-n">${totalStock}</div><div class="m-st-l">库存总量</div></div>
      </div>
      <div class="m-toolbar">
        <button class="btn-primary m-add" id="addProductBtn">＋ 新增商品</button>
        <button class="btn-reset" id="moEntryBtn">订单管理</button>
        <button class="btn-reset" id="catManageBtn">分类管理</button>
        <button class="btn-reset" id="resetProductsBtn">重置</button>
      </div>
      <div class="m-list">${listHtml}</div>
    `;
  },

  bindMerchantEvents() {
    document.getElementById('addProductBtn').addEventListener('click', () => {
      this.editingProduct = null;
      this.render('product-edit');
    });
    document.getElementById('moEntryBtn').addEventListener('click', () => {
      this._merchantOrders = null; // 重置，让页面显示加载按钮
      this.render('merchant-orders');
    });
    document.getElementById('catManageBtn').addEventListener('click', () => {
      this.render('category-manage');
    });
    document.getElementById('resetProductsBtn').addEventListener('click', () => {
      if (confirm('确定要重置为默认商品吗？所有商家修改将被清除。')) {
        resetProducts();
        this.toast('已重置为默认商品');
        this.render('merchant');
      }
    });
    document.querySelectorAll('.m-btn.edit').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editingProduct = getProductById(el.dataset.pid);
        this.render('product-edit');
      });
    });
    document.querySelectorAll('.m-btn.del').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = getProductById(el.dataset.pid);
        if (confirm(`确定删除「${p.name}」吗？此操作不可撤销。`)) {
          deleteProduct(el.dataset.pid);
          this.toast('已删除商品');
          this.render('merchant');
        }
      });
    });
  },

  /* ============================================================
     商品编辑 / 新增
     ============================================================ */
  renderProductEdit() {
    const p = this.editingProduct;
    const isEdit = !!p;
    const cats = getEditableCategories();
    const catOpts = cats.map(c =>
      `<option value="${c.id}" ${p && p.category === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    const name = p ? p.name : '';
    const sub = p ? p.sub : '';
    const price = p ? p.price : '';
    const originPrice = p ? (p.originPrice || '') : '';
    const stock = p ? (p.stock || 0) : 0;
    const tag = p ? (p.tag || '') : '';
    const cover = p ? p.cover : '';
    const tags = p ? (p.tags || []).join('、') : '';
    const specs = p ? (p.specs || []).join('、') : '';
    const quote = p ? (p.quote || '') : '';
    const quoteBy = p ? (p.quoteBy || '') : '';
    const desc = p ? (p.desc || []).join('\n') : '';

    return `
      <div class="pe-form">
        <div class="pe-group">
          <div class="pe-label">商品封面</div>
          <div class="pe-cover-row">
            <div class="pe-cover" id="coverPreview">
              ${cover ? `<img src="${cover}" alt="" />` : '<span>点击上传</span>'}
            </div>
            <input type="file" id="coverInput" accept="image/*" style="display:none" />
            <button class="btn-accent" id="uploadCoverBtn">上传图片</button>
          </div>
          <div class="pe-hint">建议尺寸 750×750，会自动转为 base64 存储</div>
        </div>

        <div class="pe-group">
          <div class="pe-row">
            <label class="pe-k">商品名称</label>
            <input class="pe-v" id="f_name" value="${name}" placeholder="如：糯米瘦肉香肠" />
          </div>
          <div class="pe-row">
            <label class="pe-k">副标题</label>
            <input class="pe-v" id="f_sub" value="${sub}" placeholder="一句话卖点" />
          </div>
          <div class="pe-row">
            <label class="pe-k">分类</label>
            <select class="pe-v" id="f_category">${catOpts}</select>
          </div>
          <div class="pe-row">
            <label class="pe-k">售价(¥)</label>
            <input class="pe-v" type="number" id="f_price" value="${price}" placeholder="68" />
          </div>
          <div class="pe-row">
            <label class="pe-k">原价(¥)</label>
            <input class="pe-v" type="number" id="f_originPrice" value="${originPrice}" placeholder="可选" />
          </div>
          <div class="pe-row">
            <label class="pe-k">库存</label>
            <input class="pe-v" type="number" id="f_stock" value="${stock}" placeholder="0" />
          </div>
          <div class="pe-row">
            <label class="pe-k">角标</label>
            <input class="pe-v" id="f_tag" value="${tag}" placeholder="如：招牌、热销（可选）" />
          </div>
        </div>

        <div class="pe-group">
          <div class="pe-row">
            <label class="pe-k">标签</label>
            <input class="pe-v" id="f_tags" value="${tags}" placeholder="顿号分隔，如：古法风干、纯猪肉" />
          </div>
          <div class="pe-row">
            <label class="pe-k">规格</label>
            <input class="pe-v" id="f_specs" value="${specs}" placeholder="顿号分隔，如：500g / 袋、1000g / 袋" />
          </div>
        </div>

        <div class="pe-group">
          <div class="pe-row">
            <label class="pe-k">匠人引言</label>
            <input class="pe-v" id="f_quote" value="${quote}" placeholder="一句话匠人感悟" />
          </div>
          <div class="pe-row">
            <label class="pe-k">引言署名</label>
            <input class="pe-v" id="f_quoteBy" value="${quoteBy}" placeholder="如：郑家匠第三代 · 郑师傅" />
          </div>
          <div class="pe-row column">
            <label class="pe-k">商品描述</label>
            <textarea class="pe-v pe-ta" id="f_desc" rows="4" placeholder="每行一段，介绍食用方式、产地故事等">${desc}</textarea>
          </div>
        </div>

        <div class="pe-dock">
          <button class="btn-ghost" id="cancelEditBtn">取消</button>
          <button class="btn-primary" id="saveProductBtn">${isEdit ? '保存修改' : '确认上架'}</button>
        </div>
      </div>
    `;
  },

  bindProductEditEvents() {
    const isEdit = !!this.editingProduct;
    let coverData = this.editingProduct ? this.editingProduct.cover : '';

    document.getElementById('uploadCoverBtn').addEventListener('click', () => {
      document.getElementById('coverInput').click();
    });
    document.getElementById('coverInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        coverData = ev.target.result;
        document.getElementById('coverPreview').innerHTML = `<img src="${coverData}" alt="" />`;
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('cancelEditBtn').addEventListener('click', () => {
      this.render('merchant');
    });

    document.getElementById('saveProductBtn').addEventListener('click', () => {
      const name = document.getElementById('f_name').value.trim();
      const price = parseFloat(document.getElementById('f_price').value);
      if (!name) { this.toast('请填写商品名称'); return; }
      if (!price || price <= 0) { this.toast('请填写有效售价'); return; }
      if (!coverData) { this.toast('请上传商品封面'); return; }

      const product = {
        name,
        sub: document.getElementById('f_sub').value.trim(),
        category: document.getElementById('f_category').value,
        price,
        originPrice: parseFloat(document.getElementById('f_originPrice').value) || 0,
        stock: parseInt(document.getElementById('f_stock').value) || 0,
        tag: document.getElementById('f_tag').value.trim(),
        cover: coverData,
        tags: document.getElementById('f_tags').value.split(/[、,，]/).map(s => s.trim()).filter(Boolean),
        specs: document.getElementById('f_specs').value.split(/[、,，]/).map(s => s.trim()).filter(Boolean),
        quote: document.getElementById('f_quote').value.trim(),
        quoteBy: document.getElementById('f_quoteBy').value.trim(),
        desc: document.getElementById('f_desc').value.split('\n').map(s => s.trim()).filter(Boolean),
        detailImage: coverData,
      };

      if (isEdit) {
        updateProduct(this.editingProduct.id, product);
        this.toast('商品已更新');
      } else {
        addProduct(product);
        this.toast('商品已上架');
      }
      this.editingProduct = null;
      this.render('merchant');
    });
  },

  /* ============================================================
     分类管理
     ============================================================ */
  renderCategoryManage() {
    const listHtml = CATEGORIES.map(c => {
      const isAll = c.id === 'all';
      const productCount = c.id === 'all'
        ? PRODUCTS.length
        : PRODUCTS.filter(p => p.category === c.id).length;
      return `
        <div class="cat-m-item">
          <div class="cat-m-circle">${c.char}</div>
          <div class="cat-m-info">
            <div class="cat-m-name">${c.name}</div>
            <div class="cat-m-count">${productCount} 件商品</div>
          </div>
          <div class="cat-m-actions">
            ${!isAll ? `<div class="m-btn edit" data-cat="${c.id}" data-action="rename">重命名</div>` : ''}
            ${!isAll ? `<div class="m-btn del" data-cat="${c.id}" data-action="delete">删除</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="pe-form">
        <div class="pe-group">
          <div class="pe-label">新增分类</div>
          <div class="pe-row">
            <label class="pe-k">分类名称</label>
            <input class="pe-v" id="newCatName" placeholder="如：生鲜" />
          </div>
          <div class="pe-row">
            <label class="pe-k">图标字</label>
            <input class="pe-v" id="newCatChar" placeholder="单字，如：鲜（可选）" maxlength="1" />
          </div>
          <button class="btn-primary" id="addCatBtn" style="width:100%;margin-top:8px;">＋ 添加分类</button>
        </div>
        <div class="pe-group">
          <div class="pe-label">现有分类</div>
          <div class="cat-m-list">${listHtml}</div>
        </div>
      </div>
    `;
  },

  bindCategoryManageEvents() {
    document.getElementById('addCatBtn').addEventListener('click', () => {
      const name = document.getElementById('newCatName').value.trim();
      const char = document.getElementById('newCatChar').value.trim();
      if (!name) { this.toast('请输入分类名称'); return; }
      addCategory(name, char);
      this.toast('分类已添加');
      this.render('category-manage');
    });
    document.querySelectorAll('.cat-m-actions .m-btn').forEach(el => {
      el.addEventListener('click', () => {
        const catId = el.dataset.cat;
        const action = el.dataset.action;
        if (action === 'rename') {
          const cat = CATEGORIES.find(c => c.id === catId);
          const newName = prompt('请输入新的分类名称：', cat ? cat.name : '');
          if (newName && newName.trim()) {
            updateCategoryName(catId, newName.trim());
            this.toast('分类已重命名');
            this.render('category-manage');
          }
        } else if (action === 'delete') {
          const cat = CATEGORIES.find(c => c.id === catId);
          if (confirm(`确定删除分类「${cat.name}」吗？该分类下的商品将保留。`)) {
            deleteCategory(catId);
            this.toast('分类已删除');
            this.render('category-manage');
          }
        }
      });
    });
  },
};

/* 启动 */
document.addEventListener('DOMContentLoaded', () => App.init());
