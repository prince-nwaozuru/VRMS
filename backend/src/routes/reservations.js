const express = require('express');
const router = express.Router();
const { execute } = require('../config/db');
const auth = require('../middleware/auth');

// POST /api/reservations - create reservation
router.post('/', auth, async (req, res) => {
  const { vehicle_id, pickup_branch_id, pickup_date, return_date, insurance_plan_id } = req.body;
  const customerId = req.user.customerId;

  if (!vehicle_id || !pickup_date || !return_date) {
    return res.status(400).json({ error: 'vehicle_id, pickup_date, return_date required' });
  }

  try {
    // Verify vehicle is available
    const vehicleResult = await execute(
      `SELECT v.VEHICLE_ID, v.STATUS, vc.BASE_DAILY_RATE, vc.DEPOSIT_AMOUNT
       FROM VEHICLE v JOIN VEHICLE_CATEGORY vc ON v.CATEGORY_ID = vc.CATEGORY_ID
       WHERE v.VEHICLE_ID = :id`,
      { id: vehicle_id }
    );

    if (vehicleResult.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    const vehicle = vehicleResult.rows[0];
    if (vehicle.STATUS !== 'AVAILABLE') {
      return res.status(400).json({ error: 'Vehicle is not available' });
    }

    // Calculate days and subtotal
    const pDate = new Date(pickup_date);
    const rDate = new Date(return_date);
    const totalDays = Math.max(1, Math.ceil((rDate - pDate) / (1000 * 60 * 60 * 24)));
    const subtotal = totalDays * parseFloat(vehicle.BASE_DAILY_RATE);

    // Check customer has DL uploaded
    const dlCheck = await execute(
      'SELECT DL_NUMBER, DL_IMAGE_PATH FROM CUSTOMERS WHERE CUSTOMER_ID = :id',
      { id: customerId }
    );
    if (!dlCheck.rows[0].DL_IMAGE_PATH && !dlCheck.rows[0].DL_NUMBER) {
      return res.status(400).json({ error: 'Please upload your driving license before renting' });
    }

    // Create reservation
    await execute(
      `INSERT INTO RESERVATION (CUSTOMER_ID, VEHICLE_ID, PICKUP_BRANCH_ID, PICKUP_DATE,
        RETURN_DATE, TOTAL_DAYS, SUBTOTAL, STATUS)
       VALUES (:cid, :vid, :bid, TO_DATE(:pd,'YYYY-MM-DD'),
               TO_DATE(:rd,'YYYY-MM-DD'), :days, :sub, 'CONFIRMED')`,
      {
        cid: customerId, vid: vehicle_id,
        bid: pickup_branch_id || 1,
        pd: pickup_date, rd: return_date,
        days: totalDays, sub: subtotal
      }
    );

    // Get the new reservation ID
    const newRes = await execute(
      `SELECT RESERVATION_ID FROM RESERVATION
       WHERE CUSTOMER_ID = :cid AND VEHICLE_ID = :vid
       ORDER BY CREATED_AT DESC FETCH FIRST 1 ROW ONLY`,
      { cid: customerId, vid: vehicle_id }
    );
    const reservationId = newRes.rows[0].RESERVATION_ID;

    // Mark vehicle as rented
    await execute(
      "UPDATE VEHICLE SET STATUS = 'RENTED' WHERE VEHICLE_ID = :id",
      { id: vehicle_id }
    );

    // Add insurance if selected
    if (insurance_plan_id) {
      const planResult = await execute(
        'SELECT DAILY_RATE FROM INSURANCE_PLAN WHERE PLAN_ID = :id',
        { id: insurance_plan_id }
      );
      if (planResult.rows.length > 0) {
        const planCost = totalDays * parseFloat(planResult.rows[0].DAILY_RATE);
        await execute(
          `INSERT INTO RESERVATION_INSURANCE (RESERVATION_ID, PLAN_ID, DAYS_COVERED, PLAN_COST)
           VALUES (:rid, :pid, :days, :cost)`,
          { rid: reservationId, pid: insurance_plan_id, days: totalDays, cost: planCost }
        );
      }
    }

    res.status(201).json({
      message: 'Reservation confirmed!',
      reservationId,
      totalDays,
      subtotal,
      dailyRate: vehicle.BASE_DAILY_RATE
    });
  } catch (err) {
    console.error('Reservation error:', err);
    res.status(500).json({ error: 'Failed to create reservation', detail: err.message });
  }
});

// GET /api/reservations/my - get my reservations
router.get('/my', auth, async (req, res) => {
  try {
    const result = await execute(
      `SELECT r.RESERVATION_ID, r.PICKUP_DATE, r.RETURN_DATE, r.TOTAL_DAYS,
              r.SUBTOTAL, r.STATUS, r.CREATED_AT,
              v.MAKE, v.MODEL, v.YEAR_MADE, v.LICENCE_PLATE, v.COLOR,
              vc.CATEGORY_NAME, vc.BASE_DAILY_RATE,
              b.BRANCH_NAME
       FROM RESERVATION r
       JOIN VEHICLE v ON r.VEHICLE_ID = v.VEHICLE_ID
       JOIN VEHICLE_CATEGORY vc ON v.CATEGORY_ID = vc.CATEGORY_ID
       JOIN BRANCH b ON r.PICKUP_BRANCH_ID = b.BRANCH_ID
       WHERE r.CUSTOMER_ID = :cid
       ORDER BY r.CREATED_AT DESC`,
      { cid: req.user.customerId }
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// GET /api/reservations/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await execute(
      `SELECT r.*, v.MAKE, v.MODEL, v.YEAR_MADE, v.LICENCE_PLATE, v.COLOR,
              vc.CATEGORY_NAME, vc.BASE_DAILY_RATE,
              b.BRANCH_NAME, b.PHONE AS BRANCH_PHONE,
              ri.PLAN_COST, ip.PLAN_NAME, ip.DAILY_RATE AS INS_DAILY_RATE
       FROM RESERVATION r
       JOIN VEHICLE v ON r.VEHICLE_ID = v.VEHICLE_ID
       JOIN VEHICLE_CATEGORY vc ON v.CATEGORY_ID = vc.CATEGORY_ID
       JOIN BRANCH b ON r.PICKUP_BRANCH_ID = b.BRANCH_ID
       LEFT JOIN RESERVATION_INSURANCE ri ON ri.RESERVATION_ID = r.RESERVATION_ID
       LEFT JOIN INSURANCE_PLAN ip ON ri.PLAN_ID = ip.PLAN_ID
       WHERE r.RESERVATION_ID = :id AND r.CUSTOMER_ID = :cid`,
      { id: req.params.id, cid: req.user.customerId }
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reservation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
});

// GET /api/reservations/insurance-plans/list
router.get('/insurance-plans/list', async (req, res) => {
  try {
    const result = await execute(
      `SELECT ip.PLAN_ID, ip.PLAN_NAME, ip.DAILY_RATE, ip.DESCRIPTION, v.VENDOR_NAME
       FROM INSURANCE_PLAN ip
       JOIN VENDOR v ON ip.VENDOR_ID = v.VENDOR_ID
       WHERE ip.IS_ACTIVE = '1'
       ORDER BY ip.DAILY_RATE`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch insurance plans' });
  }
});

module.exports = router;
