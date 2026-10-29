# 郑家匠 · 东方手作美食 H5 电商

> 手作本味 · 烟火人间 —— 一套可部署到 GitHub Pages 的美食电商 H5，配套 Cloudflare Worker 后端，支持微信内真实下单、收货地址、订单管理与微信支付接入。

## ✨ 功能一览

### 用户端
- 🏠 首页 / 分类 / 商品详情 / 购物袋
- 📍 **收货地址填写**（姓名、手机号、省市区、详细地址）
- 🛒 结算：运费计算（满 99 免邮）、满减优惠
- 💳 **支付方式**：货到付款 / 微信支付（微信内浏览器自动显示）
- 📋 订单详情：状态流转（待支付 → 待发货 → 配送中 → 已完成）
- ⭐ 购买后评价（星级 + 文字），商品详情页展示评价与平均分

### 商家工作台
- 📦 商品管理（新增 / 编辑 / 删除 / 图片上传）
- 🗂 分类管理（新增 / 重命名 / 删除）
- 📑 **订单管理**：查看全部订单、收货地址、确认发货

## 🏗 架构说明

```
┌─────────────────────────┐         ┌──────────────────────────┐
│   GitHub Pages (静态)    │  HTTPS  │  Cloudflare Worker       │
│  index.html + js + css   │ ──────▶ │  /api/orders  (订单存储)  │
│  商品/购物车/地址/下单    │         │  /api/wxpay   (微信支付)  │
└─────────────────────────┘         │  KV 存储订单数据          │
                                    └──────────────────────────┘
```

- **前端**：纯 HTML/CSS/JS，部署到 GitHub Pages，无需构建
- **后端**：Cloudflare Worker（免费额度足够），用 KV 存储订单
- **订单**：前端提交到后端 API，后端持久化；网络失败时本地兜底
- **微信支付**：预留 JSAPI 接口，配置商户号后可真正收款

## 📁 目录结构

```
zhengjiajiang-h5/
├── index.html              # 入口 HTML
├── css/style.css           # 全部样式
├── js/
│   ├── config.js           # ⚙️ 配置文件（API 地址、商家口令、微信支付）
│   ├── data.js             # 商品 / 分类数据
│   ├── store.js            # 购物车 / 地址 / 订单 / 评论（含 API 调用）
│   └── app.js              # 视图渲染与交互
├── assets/                 # 图片与图标
├── worker/                 # 🔧 后端（Cloudflare Worker）
│   ├── index.js            # Worker 主代码
│   ├── wrangler.toml       # Worker 配置
│   └── package.json
└── README.md
```

## 🚀 部署指南（三步走）

### 第一步：部署前端到 GitHub Pages

1. 登录 GitHub → `New repository`，仓库名如 `zhengjiajiang-h5`，设为 **Public**
2. 把本项目**根目录下除 `worker/` 外的所有文件**上传（`index.html`、`css/`、`js/`、`assets/`）
3. 仓库 `Settings` → `Pages` → `Deploy from a branch` → 分支 `main` / 目录 `/ (root)` → `Save`
4. 1-2 分钟后得到地址：`https://<用户名>.github.io/zhengjiajiang-h5/`

> 也可以用 Git 命令行推送，所有资源路径为相对路径，无需改 base。

### 第二步：部署后端（Cloudflare Worker）

后端负责接收和存储订单，**商家才能看到真实订单**。

```bash
# 1. 安装 wrangler
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 进入 worker 目录
cd worker

# 4. 创建 KV 命名空间（复制返回的 id）
wrangler kv namespace create ZJJ_ORDERS

# 5. 编辑 wrangler.toml，把 id 替换为上一步得到的 ID
#    同时把 MERCHANT_TOKEN 改成你自己的商家口令

# 6. 部署
wrangler deploy
```

部署成功后会得到一个 Worker 地址，如：`https://zhengjiajiang-orders.你的子域.workers.dev`

验证：浏览器打开 `https://你的worker地址/api/health`，返回 `{"ok":true,...}` 即成功。

### 第三步：关联前后端

编辑 `js/config.js`：

```js
const ZJJ_CONFIG = {
  // 改成你第二步得到的 Worker 地址（末尾不带斜杠）
  API_BASE: 'https://zhengjiajiang-orders.你的子域.workers.dev',

  // 商家口令，需与 worker/wrangler.toml 中的 MERCHANT_TOKEN 一致
  MERCHANT_TOKEN: '你自定义的商家口令',
  ...
}
```

改完后重新提交到 GitHub，等待 Pages 重新部署即可。

## 💳 接入微信支付（可选，需商户号）

要让用户真正用微信支付付款，需要：

1. **申请微信支付商户号**：到 [pay.weixin.qq.com](https://pay.weixin.qq.com) 申请，需营业执照
2. **配置公众号/小程序**：获取 AppID，在商户平台绑定
3. **配置 Worker**：
   ```bash
   cd worker
   wrangler secret put WX_PAY_KEY   # 输入商户 API 密钥
   ```
   编辑 `worker/index.js`，在 `WX_PAY_KEY` 下方填入 `appId`、`mchId`，并实现统一下单签名逻辑（代码中有 TODO 标注）
4. **配置前端**：编辑 `js/config.js`，设置 `WX_PAY.enabled = true` 并填入 `appId`

> 未配置微信支付时，用户下单可选择「货到付款」，商家在后台看到订单后联系客户收款发货。

## 🧪 本地开发测试

```bash
cd zhengjiajiang-h5
python3 -m http.server 8080
# 访问 http://localhost:8080
```

- 未配置 `API_BASE` 时，订单走本地 `localStorage` 兜底，可完整测试下单流程
- 商家工作台 → 订单管理：未配置后端时会提示「请先配置 API_BASE」

## 🔧 配置说明（js/config.js）

| 配置项 | 说明 |
|--------|------|
| `API_BASE` | Cloudflare Worker 地址，订单提交到此 |
| `MERCHANT_TOKEN` | 商家查看/管理订单的口令 |
| `WX_PAY.enabled` | 是否启用微信支付 |
| `WX_PAY.appId` | 公众号/小程序 AppID |
| `WX_PAY.mchId` | 微信支付商户号 |
| `SHIPPING.fee` | 运费金额 |
| `SHIPPING.freeThreshold` | 免邮门槛 |
| `DISCOUNT.amount` | 满减金额 |
| `DISCOUNT.threshold` | 满减门槛 |

## 📡 后端 API 一览

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/orders` | 创建订单 | 无 |
| GET | `/api/orders?token=xxx` | 商家查询全部订单 | 商家口令 |
| GET | `/api/orders/:id` | 订单详情 | 无 |
| PATCH | `/api/orders/:id` | 更新订单状态（发货） | 商家口令 |
| POST | `/api/wxpay/prepay` | 微信支付预下单 | 无 |
| POST | `/api/wxpay/notify` | 微信支付回调 | 微信签名 |
| GET | `/api/health` | 健康检查 | 无 |

## 🛠 技术栈

- 前端：HTML5 + CSS3 + 原生 JavaScript（ES6+），无框架无构建
- 后端：Cloudflare Worker + KV Storage
- 支付：微信 JSAPI（需商户号）
- 兼容：现代浏览器、微信内置浏览器

## License

MIT
