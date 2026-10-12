const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

router.use(auth);

const fields = [
  'name',
  'sku',
  'description',
  'category_id',
  'supplier_id',
  'quantity',
  'reorder_level',
  'unit_price',
];

const toOptionalId = (value) => {
  if (value === '' || value === undefined || value === null) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : NaN;
};

const toWholeNumber = (value, fallback) => {
  const number = value === '' || value === undefined || value === null ? fallback : Number(value);
  return Number.isInteger(number) && number >= 0 ? number : NaN;
};

const toMoney = (value, fallback) => {
  const number = value === '' || value === undefined || value === null ? fallback : Number(value);
  return Number.isFinite(number) && number >= 0 ? number : NaN;
};

function productPayload(body, defaults = {}) {
  const payload = {
    name: (body.name ?? defaults.name ?? '').trim(),
    sku: (body.sku ?? defaults.sku ?? '').trim(),
    description: body.description ?? defaults.description ?? '',
    category_id: toOptionalId(body.category_id ?? defaults.category_id),
    supplier_id: toOptionalId(body.supplier_id ?? defaults.supplier_id),
    quantity: toWholeNumber(body.quantity, defaults.quantity ?? 0),
    reorder_level: toWholeNumber(body.reorder_level, defaults.reorder_level ?? 5),
    unit_price: toMoney(body.unit_price, defaults.unit_price ?? 0),
  };

  if (!payload.name || !payload.sku) return { error: 'Product name and SKU are required' };
  if (Number.isNaN(payload.category_id)) return { error: 'Choose a valid category or leave it blank' };
  if (Number.isNaN(payload.supplier_id)) return { error: 'Choose a valid supplier or leave it blank' };
  if (Number.isNaN(payload.quantity)) return { error: 'Quantity must be a whole number greater than or equal to 0' };
  if (Number.isNaN(payload.reorder_level)) return { error: 'Reorder level must be a whole number greater than or equal to 0' };
  if (Number.isNaN(payload.unit_price)) return { error: 'Unit price must be greater than or equal to 0' };

  return { payload };
}

async function validateReferences(payload) {
  if (payload.category_id) {
    const [categories] = await db.execute('SELECT id FROM categories WHERE id = ?', [payload.category_id]);
    if (!categories.length) return 'Choose an existing category or leave it blank';
  }

  if (payload.supplier_id) {
    const [suppliers] = await db.execute('SELECT id FROM suppliers WHERE id = ?', [payload.supplier_id]);
    if (!suppliers.length) return 'Choose an existing supplier or leave it blank';
  }

  return null;
}

router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const [rows] = await db.execute(
      `SELECT p.*, c.name category_name, s.name supplier_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       WHERE p.name LIKE ? OR p.sku LIKE ?
       ORDER BY p.updated_at DESC`,
      [`%${q}%`, `%${q}%`]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { payload, error } = productPayload(req.body);
    if (error) return res.status(400).json({ message: error });
    const referenceError = await validateReferences(payload);
    if (referenceError) return res.status(400).json({ message: referenceError });

    const vals = fields.map((key) => payload[key]);
    const [result] = await db.execute(
      `INSERT INTO products(${fields.join(',')}) VALUES(${fields.map(() => '?').join(',')})`,
      vals
    );
    const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const [existingRows] = await db.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!existingRows.length) return res.status(404).json({ message: 'Product not found' });

    const { payload, error } = productPayload(req.body, existingRows[0]);
    if (error) return res.status(400).json({ message: error });
    const referenceError = await validateReferences(payload);
    if (referenceError) return res.status(400).json({ message: referenceError });

    const vals = fields.map((key) => payload[key]);
    await db.execute(
      `UPDATE products SET ${fields.map((key) => `${key} = ?`).join(', ')} WHERE id = ?`,
      [...vals, req.params.id]
    );
    const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    return res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Product not found' });
    return res.json({ message: 'Product deleted' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
