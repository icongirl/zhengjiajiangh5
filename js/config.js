/* ============================================================
   郑家匠 · 全局配置
   ------------------------------------------------------------
   部署前请根据实际情况修改以下配置：
   1. API_BASE        —— 后端接口地址（Cloudflare Worker 地址）
   2. MERCHANT_TOKEN  —— 商家查看/管理订单的口令（自定义）
   3. 微信支付参数    —— 需申请微信支付商户号后填入
   ============================================================ */

const ZJJ_CONFIG = {
  /* 后端 API 地址（部署 Cloudflare Worker 后得到的 URL，末尾不带斜杠） */
  API_BASE: 'https://your-worker.your-subdomain.workers.dev',

  /* 商家管理口令：在"我的"页长按品牌名 5 秒输入，即可查看全部订单 */
  MERCHANT_TOKEN: 'zjj2024admin',

  /* 品牌信息 */
  BRAND: {
    name: '郑家匠',
    slogan: '东方手作美食',
    servicePhone: '400-888-0000',
  },

  /* 微信支付配置（如需真正收款，请到 pay.weixin.qq.com 申请商户号）
     未配置时，下单后走"货到付款 / 线下转账"流程 */
  WX_PAY: {
    enabled: false,
    appId: '',        // 公众号 AppID 或 小程序 AppID
    mchId: '',        // 商户号
    // 支付方式：'jsapi'（微信内浏览器）| 'native'（外部浏览器扫码）
    // 后端会根据请求来源自动选择
  },

  /* 运费与优惠规则 */
  SHIPPING: {
    fee: 8,
    freeThreshold: 99,
  },
  DISCOUNT: {
    amount: 10,
    threshold: 200,
  },
};

/* 运行时只读保护 */
if (typeof Object.freeze === 'function') {
  Object.freeze(ZJJ_CONFIG);
}
