
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const auth = require('../middleware/auth');

const makeToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
};

// REGISTER
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({
        message: 'Name, email and password (at least 8 characters) are required.',
      });
    }

    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: 'Email already registered',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db.execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'staff')",
      [name, email, hashedPassword]
    );

    const user = {
      id: result.insertId,
      name,
      email,
      role: 'staff',
    };

    return res.status(201).json({
      message: 'Registration successful',
      token: makeToken(user),
      user,
    });
  } catch (error) {
    next(error);
  }
});

// LOGIN
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.',
      });
    }

    const [users] = await db.execute(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );

    if (
      users.length === 0 ||
      !(await bcrypt.compare(password, users[0].password_hash))
    ) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    const row = users[0];

    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
    };

    return res.json({
      message: 'Login successful',
      token: makeToken(user),
      user,
    });
  } catch (error) {
    next(error);
  }
});

// GET CURRENT LOGGED-IN USER
router.get('/me', auth, async (req, res, next) => {
  try {
    const [users] = await db.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    return res.json({
      user: users[0],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
