/* ============================================================
   郑家匠 · 订单后端 (Cloudflare Worker)
   ------------------------------------------------------------
   功能：
   - POST   /api/orders              创建订单（用户下单）
   - GET    /api/orders?token=xxx    商家查询全部订单
   - GET    /api/orders/:id?token=xxx  订单详情
   - PATCH  /api/orders/:id          更新订单状态（发货等）
   - POST   /api/wxpay/prepay        微信支付预下单（需配置商户号）
   - GET    /api/health              健康检查
   ------------------------------------------------------------
   部署：
   1. npm install -g wrangler
   2. wrangler login
   3. 修改 wrangler.toml 中的 KV 命名空间
   4. wrangler deploy
   ============================================================ */

// 商家口令（与前端 config.js 中 MERCHANT_TOKEN 保持一致）
const MERCHANT_TOKEN = 'zjj2024admin';

// 微信支付密钥（如需真正收款，在此填入，也可通过环境变量 WX_PAY_KEY 注入）
const WX_PAY_KEY = '';

/* ---------- 工具函数 ---------- */
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers,
    },
  });
}

function corsOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function genOrderId() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return 'ZJJ' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
    pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) +
    Math.floor(Math.random() * 9000 + 1000);
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function getToken(request) {
  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  const url = new URL(request.url);
  return url.searchParams.get('token') || '';
}

function requireMerchant(request) {
  const token = getToken(request);
  if (token !== MERCHANT_TOKEN) {
    return json({ ok: false, error: '未授权：商家口令错误' }, 401);
  }
  return null;
}

/* ---------- KV 操作 ---------- */
async function listOrders(kv) {
  const keys = await kv.list({ prefix: 'order:' });
  const orders = [];
  for (const k of keys.keys) {
    const v = await kv.get(k.name, 'json');
    if (v) orders.push(v);
  }
  // 按创建时间倒序
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return orders;
}

async function getOrder(kv, id) {
  return await kv.get('order:' + id, 'json');
}

async function saveOrder(kv, order) {
  await kv.put('order:' + order.id, JSON.stringify(order));
  return order;
}

/* ============================================================
   主入口
   ============================================================ */
export default {
  async fetch(request, env) {
    const kv = env.ZJJ_ORDERS; // KV 命名空间，需在 wrangler.toml 绑定
    if (!kv) {
      return json({ ok: false, error: 'KV 命名空间未绑定，请检查 wrangler.toml' }, 500);
    }

    if (request.method === 'OPTIONS') return corsOptions();

    const url = new URL(request.url);
    const path = url.pathname;

    /* ---------- 健康检查 ---------- */
    if (path === '/api/health' || path === '/health') {
      return json({ ok: true, service: 'zhengjiajiang-orders', time: new Date().toISOString() });
    }

    /* ---------- 创建订单 ---------- */
    if (path === '/api/orders' && request.method === 'POST') {
      const body = await readBody(request);
      if (!body || !Array.isArray(body.items) || body.items.length === 0) {
        return json({ ok: false, error: '订单商品不能为空' }, 400);
      }
      if (!body.address || !body.address.name || !body.address.phone || !body.address.detail) {
        return json({ ok: false, error: '收货地址不完整' }, 400);
      }

      const order = {
        id: genOrderId(),
        items: body.items.map(i => ({
          productId: String(i.productId || ''),
          name: String(i.name || ''),
          cover: String(i.cover || ''),
          spec: String(i.spec || ''),
          price: Number(i.price) || 0,
          qty: Number(i.qty) || 1,
          reviewed: false,
        })),
        address: {
          name: body.address.name,
          phone: body.address.phone,
          detail: body.address.detail,
        },
        remark: body.remark || '',
        payMethod: body.payMethod || 'cod', // cod=货到付款, wxpay=微信支付
        subtotal: Number(body.subtotal) || 0,
        shipping: Number(body.shipping) || 0,
        discount: Number(body.discount) || 0,
        total: Number(body.total) || 0,
        status: 'pending', // pending→paid→shipped→done, 或 canceled
        createdAt: new Date().toISOString(),
        paidAt: null,
        shippedAt: null,
      };

      // 货到付款直接标记为已支付（待发货）
      if (order.payMethod === 'cod') {
        order.status = 'paid';
        order.paidAt = order.createdAt;
      }

      await saveOrder(kv, order);
      return json({ ok: true, order });
    }

    /* ---------- 商家：查询全部订单 ---------- */
    if (path === '/api/orders' && request.method === 'GET') {
      const err = requireMerchant(request);
      if (err) return err;
      const orders = await listOrders(kv);
      return json({ ok: true, orders });
    }

    /* ---------- 订单详情 / 更新 ---------- */
    const orderMatch = path.match(/^\/api\/orders\/([^/]+)$/);
    if (orderMatch) {
      const id = orderMatch[1];
      const order = await getOrder(kv, id);
      if (!order) return json({ ok: false, error: '订单不存在' }, 404);

      if (request.method === 'GET') {
        // 用户可凭订单号查自己的订单；商家也可查
        const token = getToken(request);
        return json({ ok: true, order });
      }

      if (request.method === 'PATCH') {
        const err = requireMerchant(request);
        if (err) return err;
        const body = await readBody(request) || {};
        const allowed = ['status', 'shippedAt'];
        for (const k of allowed) {
          if (body[k] !== undefined) order[k] = body[k];
        }
        if (body.status === 'shipped' && !order.shippedAt) {
          order.shippedAt = new Date().toISOString();
        }
        await saveOrder(kv, order);
        return json({ ok: true, order });
      }
    }

    /* ---------- 微信支付预下单（需配置商户密钥）---------- */
    if (path === '/api/wxpay/prepay' && request.method === 'POST') {
      const body = await readBody(request) || {};
      if (!body.orderId) return json({ ok: false, error: '缺少订单号' }, 400);

      const order = await getOrder(kv, body.orderId);
      if (!order) return json({ ok: false, error: '订单不存在' }, 404);
      if (order.status !== 'pending') return json({ ok: false, error: '订单状态不可支付' }, 400);

      // 如果未配置微信支付密钥，返回模拟支付成功（便于测试）
      const key = WX_PAY_KEY || (env && env.WX_PAY_KEY) || '';
      if (!key) {
        // 开发模式：直接标记已支付
        order.status = 'paid';
        order.paidAt = new Date().toISOString();
        await saveOrder(kv, order);
        return json({ ok: true, mock: true, msg: '未配置微信支付，已模拟支付成功', order });
      }

      // TODO: 接入真实微信支付统一下单 API
      // 1. 构造签名参数，调用 https://api.mch.weixin.qq.com/pay/unifiedorder
      // 2. 返回 prepay_id 给前端调起 WeixinJSBridge.invoke('getBrandWCPayRequest')
      return json({
        ok: true,
        prepay: {
          appId: '',
          timeStamp: String(Math.floor(Date.now() / 1000)),
          nonceStr: Math.random().toString(36).slice(2),
          package: 'prepay_id=',
          signType: 'MD5',
          paySign: '',
        },
      });
    }

    /* ---------- 微信支付回调（真实支付时由微信服务器调用）---------- */
    if (path === '/api/wxpay/notify' && request.method === 'POST') {
      // TODO: 验签 → 取出 out_trade_no → 更新订单状态为 paid
      return json({ return_code: 'SUCCESS', return_msg: 'OK' });
    }

    return json({ ok: false, error: '接口不存在' }, 404);
  },
};
