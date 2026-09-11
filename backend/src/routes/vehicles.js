const express = require('express');
const router = express.Router();
const { execute } = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/vehicles - list available vehicles with category info
router.get('/', async (req, res) => {
  try {
    const { category_id, branch_id } = req.query;
    let sql = `
      SELECT v.VEHICLE_ID, v.LICENCE_PLATE, v.MAKE, v.MODEL, v.YEAR_MADE,
             v.COLOR, v.SEATS, v.STATUS, v.IMAGE_URL,
             vc.CATEGORY_ID, vc.CATEGORY_NAME, vc.BASE_DAILY_RATE,
             vc.DEPOSIT_AMOUNT, vc.MINIMUM_AGE_REQUIREMENT,
             b.BRANCH_NAME, b.BRANCH_ID
      FROM VEHICLE v
      JOIN VEHICLE_CATEGORY vc ON v.CATEGORY_ID = vc.CATEGORY_ID
      JOIN BRANCH b ON v.BRANCH_ID = b.BRANCH_ID
      WHERE v.STATUS = 'AVAILABLE'
    `;
    const binds = {};
    if (category_id) { sql += ' AND v.CATEGORY_ID = :cat'; binds.cat = category_id; }
    if (branch_id) { sql += ' AND v.BRANCH_ID = :branch'; binds.branch = branch_id; }
    sql += ' ORDER BY vc.BASE_DAILY_RATE ASC';

    const result = await execute(sql, binds);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// GET /api/vehicles/categories
router.get('/categories', async (req, res) => {
  try {
    const result = await execute(
      `SELECT CATEGORY_ID, CATEGORY_NAME, DESCRIPTION, BASE_DAILY_RATE,
              DEPOSIT_AMOUNT, MINIMUM_AGE_REQUIREMENT
       FROM VEHICLE_CATEGORY ORDER BY BASE_DAILY_RATE`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/vehicles/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await execute(
      `SELECT v.VEHICLE_ID, v.LICENCE_PLATE, v.MAKE, v.MODEL, v.YEAR_MADE,
              v.COLOR, v.SEATS, v.STATUS, v.IMAGE_URL,
              vc.CATEGORY_ID, vc.CATEGORY_NAME, vc.BASE_DAILY_RATE,
              vc.DEPOSIT_AMOUNT, vc.MINIMUM_AGE_REQUIREMENT,
              b.BRANCH_NAME, b.PHONE AS BRANCH_PHONE,
              ROUND(AVG(r.OVERALL_RATING), 1) AS AVG_RATING,
              COUNT(r.REVIEW_ID) AS REVIEW_COUNT
       FROM VEHICLE v
       JOIN VEHICLE_CATEGORY vc ON v.CATEGORY_ID = vc.CATEGORY_ID
       JOIN BRANCH b ON v.BRANCH_ID = b.BRANCH_ID
       LEFT JOIN RESERVATION res ON res.VEHICLE_ID = v.VEHICLE_ID
       LEFT JOIN REVIEW r ON r.RESERVATION_ID = res.RESERVATION_ID AND r.IS_PUBLISHED = '1'
       WHERE v.VEHICLE_ID = :id
       GROUP BY v.VEHICLE_ID, v.LICENCE_PLATE, v.MAKE, v.MODEL, v.YEAR_MADE,
                v.COLOR, v.SEATS, v.STATUS, v.IMAGE_URL,
                vc.CATEGORY_ID, vc.CATEGORY_NAME, vc.BASE_DAILY_RATE,
                vc.DEPOSIT_AMOUNT, vc.MINIMUM_AGE_REQUIREMENT,
                b.BRANCH_NAME, b.PHONE`,
      { id: req.params.id }
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

module.exports = router;
