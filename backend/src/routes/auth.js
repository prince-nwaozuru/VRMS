const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { execute } = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Multer config for DL upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './src/uploads';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `dl_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only JPG, PNG, and PDF files allowed'));
  }
});

// POST /api/auth/register
router.post('/register', upload.single('dl_image'), async (req, res) => {
  const { first_name, last_name, email, phone, dob, dl_number, dl_expiry, password } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  try {
    // Check existing email
    const existing = await execute(
      'SELECT CUSTOMER_ID FROM CUSTOMERS WHERE EMAIL = :email',
      { email }
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const dlImagePath = req.file ? req.file.filename : null;

    await execute(
      `INSERT INTO CUSTOMERS (FIRST_NAME, LAST_NAME, EMAIL, PHONE, DOB, DL_NUMBER, DL_EXPIRY, DL_IMAGE_PATH, PASSWORD_HASH)
       VALUES (:fn, :ln, :email, :phone, TO_DATE(:dob,'YYYY-MM-DD'), :dl_number,
               TO_DATE(:dl_expiry,'YYYY-MM-DD'), :dl_image, :hash)`,
      {
        fn: first_name, ln: last_name, email, phone: phone || null,
        dob: dob || null, dl_number: dl_number || null,
        dl_expiry: dl_expiry || null, dl_image: dlImagePath, hash
      }
    );

    const newUser = await execute(
      'SELECT CUSTOMER_ID, FIRST_NAME, LAST_NAME, EMAIL FROM CUSTOMERS WHERE EMAIL = :email',
      { email }
    );

    const customer = newUser.rows[0];
    const token = jwt.sign(
      { customerId: customer.CUSTOMER_ID, email: customer.EMAIL },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: customer.CUSTOMER_ID,
        firstName: customer.FIRST_NAME,
        lastName: customer.LAST_NAME,
        email: customer.EMAIL
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed', detail: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const result = await execute(
      'SELECT CUSTOMER_ID, FIRST_NAME, LAST_NAME, EMAIL, PASSWORD_HASH FROM CUSTOMERS WHERE EMAIL = :email',
      { email }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const customer = result.rows[0];
    const valid = await bcrypt.compare(password, customer.PASSWORD_HASH);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { customerId: customer.CUSTOMER_ID, email: customer.EMAIL },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: customer.CUSTOMER_ID,
        firstName: customer.FIRST_NAME,
        lastName: customer.LAST_NAME,
        email: customer.EMAIL
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const result = await execute(
      `SELECT c.CUSTOMER_ID, c.FIRST_NAME, c.LAST_NAME, c.EMAIL, c.PHONE,
              TO_CHAR(c.DOB,'YYYY-MM-DD') DOB, c.DL_NUMBER,
              TO_CHAR(c.DL_EXPIRY,'YYYY-MM-DD') DL_EXPIRY, c.DL_IMAGE_PATH
       FROM CUSTOMERS c WHERE c.CUSTOMER_ID = :id`,
      { id: req.user.customerId }
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/auth/upload-dl (update DL image for existing user)
router.post('/upload-dl', auth, upload.single('dl_image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    await execute(
      'UPDATE CUSTOMERS SET DL_IMAGE_PATH = :path WHERE CUSTOMER_ID = :id',
      { path: req.file.filename, id: req.user.customerId }
    );
    res.json({ message: 'Driving license uploaded', filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
