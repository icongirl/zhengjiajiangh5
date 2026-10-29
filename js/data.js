/* ============================================================
   郑家匠 · 商品与分类数据
   纯前端静态数据，部署到 GitHub Pages 无需后端
   ============================================================ */

const SEED_CATEGORIES = [
  { id: 'all',      name: '全部', char: '全' },
  { id: 'cured',    name: '腊味', char: '腊' },
  { id: 'snack',    name: '点心', char: '点' },
  { id: 'specialty',name: '特产', char: '特' },
  { id: 'tea',      name: '茶饮', char: '茶' },
  { id: 'seasoning',name: '调味', char: '味' },
  { id: 'grain',    name: '粮油', char: '粮' },
  { id: 'gift',     name: '礼盒', char: '礼' },
];

/* 分类数据持久化 */
const CATEGORIES_STORAGE_KEY = 'zjj_categories_v1';

function loadCategories() {
  try {
    const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return JSON.parse(JSON.stringify(SEED_CATEGORIES));
}

function saveCategories() {
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(CATEGORIES));
}

let CATEGORIES = loadCategories();

/* 重置分类为默认 */
function resetCategories() {
  CATEGORIES = JSON.parse(JSON.stringify(SEED_CATEGORIES));
  saveCategories();
}

/* 新增分类 */
function addCategory(name, char) {
  const id = 'c_' + Date.now();
  CATEGORIES.push({ id, name, char: char || name.charAt(0) });
  saveCategories();
  return id;
}

/* 修改分类名称 */
function updateCategoryName(id, name) {
  const c = CATEGORIES.find(c => c.id === id);
  if (c && id !== 'all') {
    c.name = name;
    saveCategories();
    return true;
  }
  return false;
}

/* 删除分类 */
function deleteCategory(id) {
  if (id === 'all') return false;
  const idx = CATEGORIES.findIndex(c => c.id === id);
  if (idx === -1) return false;
  CATEGORIES.splice(idx, 1);
  // 将该分类下的商品移到全部（保留，不删除商品）
  saveCategories();
  return true;
}

const SEED_PRODUCTS = [
  {
    id: 'p_rice',
    name: '糯米瘦肉香肠',
    sub: '糯米香糯，瘦肉紧实',
    price: 68,
    originPrice: 88,
    category: 'cured',
    cover: './assets/images/sausage-rice.jpg',
    detailImage: './assets/images/sausage-rice-detail.jpg',
    tags: ['古法风干', '纯猪肉', '0 添加淀粉'],
    specs: ['500g / 袋', '1000g / 袋'],
    params: {
      '净含量': '500g / 袋',
      '配料': '猪肉、糯米、食用盐、白砂糖、料酒、香辛料',
      '产地': '浙江 · 金华',
      '保质期': '冷藏 180 天 / 冷冻 365 天',
      '储存': '阴凉干燥处，开封后冷藏',
    },
    quote: '好香肠，七分靠肉，三分靠晒。日晒夜露二十天，才有这一口咸香。',
    quoteBy: '郑家匠第三代 · 郑师傅',
    desc: [
      '温水洗净后，隔水蒸 20 分钟即可食用。亦可切片与青椒、蒜苗同炒，或加入煲仔饭中增香。',
      '金华自古出腊味。郑家匠人坚持选用当日现杀土猪后腿肉，手工切条、天然肠衣灌制，在金华冬日的暖阳下自然风干二十天以上。',
    ],
    sales: 1286,
    stock: 86,
    tag: '招牌',
  },
  {
    id: 'p_original',
    name: '原味香肠',
    sub: '肉味醇正，不抢本味',
    price: 58,
    originPrice: 78,
    category: 'cured',
    cover: './assets/images/sausage-original.jpg',
    detailImage: './assets/images/sausage-original-detail.jpg',
    tags: ['古法风干', '纯猪肉'],
    specs: ['500g / 袋', '1000g / 袋'],
    params: {
      '净含量': '500g / 袋',
      '配料': '猪肉、食用盐、白砂糖、料酒、香辛料',
      '产地': '浙江 · 金华',
      '保质期': '冷藏 180 天',
      '储存': '阴凉干燥处，开封后冷藏',
    },
    quote: '本味，是对食材最大的尊重。',
    quoteBy: '郑家匠第三代 · 郑师傅',
    desc: [
      '不加重口调料，只以盐糖酒香激发猪肉本味。适合清蒸、煮粥、炒饭。',
      '坚持三肥七瘦黄金比例，手工灌制，自然风干。',
    ],
    sales: 1003,
    stock: 120,
    tag: '热销',
  },
  {
    id: 'p_spice',
    name: '五香味香肠',
    sub: '五香入味，越嚼越香',
    price: 62,
    originPrice: 82,
    category: 'cured',
    cover: './assets/images/sausage-spice.jpg',
    detailImage: './assets/images/sausage-spice-detail.jpg',
    tags: ['古法风干', '五香入味'],
    specs: ['500g / 袋'],
    params: {
      '净含量': '500g / 袋',
      '配料': '猪肉、食用盐、白砂糖、料酒、五香粉、八角、桂皮',
      '产地': '浙江 · 金华',
      '保质期': '冷藏 180 天',
      '储存': '阴凉干燥处，开封后冷藏',
    },
    quote: '五香的层次，要慢品才出得来。',
    quoteBy: '郑家匠第三代 · 郑师傅',
    desc: [
      '八角、桂皮、丁香等八味香料研磨入味，咸香中带着回甘。',
      '适合切片冷盘、配酒佐餐。',
    ],
    sales: 821,
    stock: 95,
  },
  {
    id: 'p_pepper',
    name: '黑胡椒味香肠',
    sub: '黑胡椒辛香，醒胃提鲜',
    price: 65,
    originPrice: 85,
    category: 'cured',
    cover: './assets/images/sausage-pepper.jpg',
    detailImage: './assets/images/sausage-pepper-detail.jpg',
    tags: ['古法风干', '黑胡椒'],
    specs: ['500g / 袋'],
    params: {
      '净含量': '500g / 袋',
      '配料': '猪肉、食用盐、白砂糖、料酒、黑胡椒',
      '产地': '浙江 · 金华',
      '保质期': '冷藏 180 天',
      '储存': '阴凉干燥处，开封后冷藏',
    },
    quote: '胡椒的辛，是冬日里的一把小火。',
    quoteBy: '郑家匠第三代 · 郑师傅',
    desc: [
      '精选海南黑胡椒现磨入料，辛香不呛，醒胃提鲜。',
      '适合煎烤、披萨、意面搭配。',
    ],
    sales: 654,
    stock: 78,
  },
  {
    id: 'p_ham',
    name: '金华火腿切片',
    sub: '两年陈香，鲜而不咸',
    price: 98,
    originPrice: 128,
    category: 'cured',
    cover: './assets/images/sausage-rice.jpg',
    detailImage: '',
    tags: ['两年陈香', '切片即烹'],
    specs: ['250g / 盒'],
    params: {
      '净含量': '250g / 盒',
      '配料': '猪后腿肉、食用盐',
      '产地': '浙江 · 金华',
      '保质期': '冷藏 365 天',
      '储存': '冷藏保存',
    },
    quote: '火腿的鲜，是时间熬出来的。',
    quoteBy: '郑家匠第三代 · 郑师傅',
    desc: [
      '选用金华两头乌猪后腿，经上盐、洗晒、整形、发酵等传统工艺，历时两年方成。',
      '切片后可直接用于煲汤、蒸鱼、炒菜，提鲜增香。',
    ],
    sales: 432,
    stock: 45,
  },
  {
    id: 'p_bacon',
    name: '农家烟熏腊肉',
    sub: '柏枝烟熏，肥瘦相间',
    price: 78,
    originPrice: 0,
    category: 'cured',
    cover: './assets/images/sausage-original.jpg',
    detailImage: '',
    tags: ['柏枝烟熏', '农家自制'],
    specs: ['400g / 袋'],
    params: {
      '净含量': '400g / 袋',
      '配料': '猪肉、食用盐、白砂糖、柏枝',
      '产地': '四川 · 青城山',
      '保质期': '冷藏 180 天',
      '储存': '阴凉干燥处',
    },
    quote: '烟熏的香，是山里人的年味。',
    quoteBy: '郑家匠第三代 · 郑师傅',
    desc: [
      '选用农家散养土猪五花肉，经柏枝慢火烟熏 72 小时，肉质紧实、烟香浓郁。',
      '温水泡洗后蒸食，或与蒜苗、冬笋同炒。',
    ],
    sales: 567,
    stock: 120,
  },
  {
    id: 'p_gift',
    name: '古法手工腊肠礼盒',
    sub: '四味一盒，送礼佳品',
    price: 168,
    originPrice: 198,
    category: 'gift',
    cover: './assets/images/sausage-spice.jpg',
    detailImage: '',
    tags: ['礼盒装', '四味组合'],
    specs: ['礼盒装 (4×500g)'],
    params: {
      '净含量': '2000g (4×500g)',
      '内含': '原味、五香、黑胡椒、糯米瘦肉 各一袋',
      '产地': '浙江 · 金华',
      '保质期': '冷藏 180 天',
      '储存': '阴凉干燥处',
    },
    quote: '一盒四味，把郑家的年味送给最重要的人。',
    quoteBy: '郑家匠第三代 · 郑师傅',
    desc: [
      '精选四款招牌腊肠，国风礼盒包装，是走亲访友的上佳之选。',
      '支持定制贺卡，代写祝福。',
    ],
    sales: 289,
    stock: 60,
    tag: '送礼',
  },
  {
    id: 'p_walnut',
    name: '临安山核桃仁',
    sub: '酥脆回甘，手剥现炒',
    price: 58,
    originPrice: 0,
    category: 'specialty',
    cover: './assets/images/sausage-pepper.jpg',
    detailImage: '',
    tags: ['临安特产', '手剥现炒'],
    specs: ['150g / 罐'],
    params: {
      '净含量': '150g / 罐',
      '配料': '山核桃仁、食用盐、白砂糖',
      '产地': '浙江 · 临安',
      '保质期': '180 天',
      '储存': '密封阴凉干燥处',
    },
    quote: '小核桃的香，是山里的秋天。',
    quoteBy: '郑家匠第三代 · 郑师傅',
    desc: [
      '选用临安山核桃，手工剥壳、小锅现炒，酥脆回甘。',
      '富含不饱和脂肪酸，是老少皆宜的健康零食。',
    ],
    sales: 378,
    stock: 200,
  },
];

/* 商品数据持久化（localStorage），支持商家增删改 */
const PRODUCTS_STORAGE_KEY = 'zjj_products_v1';

function loadProducts() {
  try {
    const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return JSON.parse(JSON.stringify(SEED_PRODUCTS));
}

function saveProducts() {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(PRODUCTS));
}

/* 运行时商品数组（从 localStorage 加载，商家修改后会持久化） */
let PRODUCTS = loadProducts();

/* 重置为默认商品（清除商家修改） */
function resetProducts() {
  PRODUCTS = JSON.parse(JSON.stringify(SEED_PRODUCTS));
  saveProducts();
}

/* 新增商品 */
function addProduct(product) {
  product.id = 'p_' + Date.now();
  if (!product.sales) product.sales = 0;
  if (!product.stock) product.stock = 0;
  if (!product.tags) product.tags = [];
  if (!product.specs) product.specs = ['默认规格'];
  if (!product.params) product.params = {};
  if (!product.desc) product.desc = [];
  if (!product.quote) product.quote = '';
  if (!product.quoteBy) product.quoteBy = '郑家匠';
  PRODUCTS.unshift(product);
  saveProducts();
  return product;
}

/* 更新商品 */
function updateProduct(id, updates) {
  const idx = PRODUCTS.findIndex(p => p.id === id);
  if (idx === -1) return null;
  PRODUCTS[idx] = { ...PRODUCTS[idx], ...updates };
  saveProducts();
  return PRODUCTS[idx];
}

/* 删除商品 */
function deleteProduct(id) {
  const idx = PRODUCTS.findIndex(p => p.id === id);
  if (idx === -1) return false;
  PRODUCTS.splice(idx, 1);
  saveProducts();
  return true;
}

/* 通过 id 获取商品 */
function getProductById(id) {
  return PRODUCTS.find(p => p.id === id);
}

/* 通过分类获取商品 */
function getProductsByCategory(catId) {
  if (catId === 'all') return PRODUCTS;
  return PRODUCTS.filter(p => p.category === catId);
}

/* 获取分类名称 */
function getCategoryName(catId) {
  const c = CATEGORIES.find(c => c.id === catId);
  return c ? c.name : '';
}

/* 获取可编辑分类（排除'全部'） */
function getEditableCategories() {
  return CATEGORIES.filter(c => c.id !== 'all');
}
