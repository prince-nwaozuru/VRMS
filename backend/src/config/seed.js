/**
 * npm run seed
 * Creates all tables and inserts seed data.
 * Uses SEQ.CURRVAL after each INSERT to get the generated ID —
 * avoids RETURNING INTO bind-type issues across oracledb versions.
 */
const { initializePool, getConnection, closePool } = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// DDL helper — silently ignores "object does not exist" errors during cleanup
async function ddl(conn, sql, label) {
  try {
    await conn.execute(sql);
    if (label) console.log(`  ✔ ${label}`);
  } catch (e) {
    const ok = ['ORA-00942','ORA-02289','ORA-01418','ORA-01451'];
    if (ok.some(c => e.message.includes(c))) return;
    console.warn(`  ⚠ ${label || ''}: ${e.message}`);
  }
}

// INSERT then return SEQ.CURRVAL
async function insert(conn, sql, binds, seq) {
  await conn.execute(sql, binds || []);
  if (!seq) return null;
  const r = await conn.execute(`SELECT ${seq}.CURRVAL AS ID FROM DUAL`);
  return r.rows[0].ID;
}

async function main() {
  console.log('🚀 Starting VRMS database setup...\n');
  await initializePool();
  const conn = await getConnection();

  try {
    // ── DROP ────────────────────────────────────────────────────────
    console.log('🗑  Dropping existing objects...');
    for (const t of [
      'RESERVATION_INSURANCE','DAMAGE_REPORT','PAYMENT','REVIEW',
      'RESERVATION','PROMOTION','INSURANCE_PLAN','MAINTENANCE',
      'PAYMENT_METHOD','VEHICLE','EMPLOYEE','BRANCH',
      'VEHICLE_CATEGORY','VENDOR','CUSTOMERS','ADDRESS'
    ]) await ddl(conn, `DROP TABLE ${t} CASCADE CONSTRAINTS`);

    for (const s of [
      'SEQ_ADDRESS','SEQ_CUSTOMER','SEQ_CATEGORY','SEQ_BRANCH','SEQ_VEHICLE',
      'SEQ_EMPLOYEE','SEQ_VENDOR','SEQ_PLAN','SEQ_RESERVATION','SEQ_PAYMENT',
      'SEQ_METHOD','SEQ_REVIEW','SEQ_PROMO','SEQ_MAINTENANCE','SEQ_DAMAGE','SEQ_RES_INS'
    ]) await ddl(conn, `DROP SEQUENCE ${s}`);

    // ── SEQUENCES ────────────────────────────────────────────────────
    console.log('\n📐 Creating sequences...');
    for (const s of [
      'SEQ_ADDRESS','SEQ_CUSTOMER','SEQ_CATEGORY','SEQ_BRANCH','SEQ_VEHICLE',
      'SEQ_EMPLOYEE','SEQ_VENDOR','SEQ_PLAN','SEQ_RESERVATION','SEQ_PAYMENT',
      'SEQ_METHOD','SEQ_REVIEW','SEQ_PROMO','SEQ_MAINTENANCE','SEQ_DAMAGE','SEQ_RES_INS'
    ]) await ddl(conn, `CREATE SEQUENCE ${s} START WITH 1 INCREMENT BY 1`, s);

    // ── TABLES ───────────────────────────────────────────────────────
    console.log('\n🏗  Creating tables...');

    await ddl(conn, `CREATE TABLE ADDRESS (
      ADDRESS_ID     NUMBER DEFAULT SEQ_ADDRESS.NEXTVAL PRIMARY KEY,
      STREET_LINE1   VARCHAR2(200) NOT NULL,
      CITY           VARCHAR2(100),
      STATE_PROVINCE VARCHAR2(100),
      POSTAL_CODE    VARCHAR2(20),
      COUNTRY        VARCHAR2(100))`, 'ADDRESS');

    await ddl(conn, `CREATE TABLE CUSTOMERS (
      CUSTOMER_ID   NUMBER DEFAULT SEQ_CUSTOMER.NEXTVAL PRIMARY KEY,
      ADDRESS_ID    NUMBER REFERENCES ADDRESS(ADDRESS_ID),
      FIRST_NAME    VARCHAR2(100) NOT NULL,
      LAST_NAME     VARCHAR2(100) NOT NULL,
      EMAIL         VARCHAR2(200) UNIQUE NOT NULL,
      PHONE         VARCHAR2(30),
      DOB           DATE,
      DL_NUMBER     VARCHAR2(50) UNIQUE,
      DL_EXPIRY     DATE,
      DL_IMAGE_PATH VARCHAR2(500),
      PASSWORD_HASH VARCHAR2(200) NOT NULL,
      CREATED_AT    TIMESTAMP DEFAULT SYSTIMESTAMP)`, 'CUSTOMERS');

    await ddl(conn, `CREATE TABLE VEHICLE_CATEGORY (
      CATEGORY_ID             NUMBER DEFAULT SEQ_CATEGORY.NEXTVAL PRIMARY KEY,
      CATEGORY_NAME           VARCHAR2(100) UNIQUE NOT NULL,
      DESCRIPTION             VARCHAR2(500),
      BASE_DAILY_RATE         NUMBER(10,2),
      DEPOSIT_AMOUNT          NUMBER(10,2),
      MINIMUM_AGE_REQUIREMENT NUMBER(3))`, 'VEHICLE_CATEGORY');

    await ddl(conn, `CREATE TABLE BRANCH (
      BRANCH_ID   NUMBER DEFAULT SEQ_BRANCH.NEXTVAL PRIMARY KEY,
      ADDRESS_ID  NUMBER REFERENCES ADDRESS(ADDRESS_ID),
      BRANCH_NAME VARCHAR2(200),
      PHONE       VARCHAR2(30),
      STATUS      VARCHAR2(20) DEFAULT 'ACTIVE')`, 'BRANCH');

    await ddl(conn, `CREATE TABLE VEHICLE (
      VEHICLE_ID    NUMBER DEFAULT SEQ_VEHICLE.NEXTVAL PRIMARY KEY,
      CATEGORY_ID   NUMBER REFERENCES VEHICLE_CATEGORY(CATEGORY_ID),
      BRANCH_ID     NUMBER REFERENCES BRANCH(BRANCH_ID),
      LICENCE_PLATE VARCHAR2(20) UNIQUE NOT NULL,
      MAKE          VARCHAR2(100),
      MODEL         VARCHAR2(100),
      YEAR_MADE     NUMBER(4),
      COLOR         VARCHAR2(50),
      SEATS         NUMBER(2),
      IMAGE_URL     VARCHAR2(500),
      STATUS        VARCHAR2(20) DEFAULT 'AVAILABLE')`, 'VEHICLE');

    await ddl(conn, `CREATE TABLE EMPLOYEE (
      EMPLOYEE_ID NUMBER DEFAULT SEQ_EMPLOYEE.NEXTVAL PRIMARY KEY,
      BRANCH_ID   NUMBER REFERENCES BRANCH(BRANCH_ID),
      NAME        VARCHAR2(200),
      EMAIL       VARCHAR2(200),
      STATUS      VARCHAR2(20) DEFAULT 'ACTIVE')`, 'EMPLOYEE');

    await ddl(conn, `CREATE TABLE VENDOR (
      VENDOR_ID   NUMBER DEFAULT SEQ_VENDOR.NEXTVAL PRIMARY KEY,
      ADDRESS_ID  NUMBER REFERENCES ADDRESS(ADDRESS_ID),
      VENDOR_NAME VARCHAR2(200),
      VENDOR_TYPE VARCHAR2(100),
      EMAIL       VARCHAR2(200),
      STATUS      VARCHAR2(20) DEFAULT 'ACTIVE')`, 'VENDOR');

    await ddl(conn, `CREATE TABLE INSURANCE_PLAN (
      PLAN_ID     NUMBER DEFAULT SEQ_PLAN.NEXTVAL PRIMARY KEY,
      VENDOR_ID   NUMBER REFERENCES VENDOR(VENDOR_ID),
      PLAN_NAME   VARCHAR2(200),
      DAILY_RATE  NUMBER(10,2),
      DESCRIPTION VARCHAR2(500),
      IS_ACTIVE   CHAR(1) DEFAULT '1')`, 'INSURANCE_PLAN');

    await ddl(conn, `CREATE TABLE PAYMENT_METHOD (
      METHOD_ID   NUMBER DEFAULT SEQ_METHOD.NEXTVAL PRIMARY KEY,
      CUSTOMER_ID NUMBER REFERENCES CUSTOMERS(CUSTOMER_ID),
      METHOD_TYPE VARCHAR2(50),
      CARD_LAST4  CHAR(4),
      IS_DEFAULT  CHAR(1) DEFAULT '0')`, 'PAYMENT_METHOD');

    await ddl(conn, `CREATE TABLE PROMOTION (
      PROMO_ID       NUMBER DEFAULT SEQ_PROMO.NEXTVAL PRIMARY KEY,
      CATEGORY_ID    NUMBER REFERENCES VEHICLE_CATEGORY(CATEGORY_ID),
      PROMO_CODE     VARCHAR2(50),
      DISCOUNT_VALUE NUMBER(5,2),
      IS_ACTIVE      CHAR(1) DEFAULT '1')`, 'PROMOTION');

    await ddl(conn, `CREATE TABLE RESERVATION (
      RESERVATION_ID   NUMBER DEFAULT SEQ_RESERVATION.NEXTVAL PRIMARY KEY,
      CUSTOMER_ID      NUMBER REFERENCES CUSTOMERS(CUSTOMER_ID),
      VEHICLE_ID       NUMBER REFERENCES VEHICLE(VEHICLE_ID),
      PICKUP_BRANCH_ID NUMBER REFERENCES BRANCH(BRANCH_ID),
      PICKUP_DATE      DATE NOT NULL,
      RETURN_DATE      DATE NOT NULL,
      TOTAL_DAYS       NUMBER(5),
      SUBTOTAL         NUMBER(12,2),
      PROMO_ID         NUMBER REFERENCES PROMOTION(PROMO_ID),
      STATUS           VARCHAR2(30) DEFAULT 'PENDING',
      CREATED_AT       TIMESTAMP DEFAULT SYSTIMESTAMP)`, 'RESERVATION');

    await ddl(conn, `CREATE TABLE PAYMENT (
      PAYMENT_ID      NUMBER DEFAULT SEQ_PAYMENT.NEXTVAL PRIMARY KEY,
      RESERVATION_ID  NUMBER REFERENCES RESERVATION(RESERVATION_ID),
      METHOD_ID       NUMBER REFERENCES PAYMENT_METHOD(METHOD_ID),
      PAYMENT_DATE    DATE DEFAULT SYSDATE,
      AMOUNT          NUMBER(12,2),
      PAYMENT_TYPE    VARCHAR2(50),
      TRANSACTION_REF VARCHAR2(100),
      STATUS          VARCHAR2(30) DEFAULT 'PENDING')`, 'PAYMENT');

    await ddl(conn, `CREATE TABLE REVIEW (
      REVIEW_ID      NUMBER DEFAULT SEQ_REVIEW.NEXTVAL PRIMARY KEY,
      RESERVATION_ID NUMBER REFERENCES RESERVATION(RESERVATION_ID),
      CUSTOMER_ID    NUMBER REFERENCES CUSTOMERS(CUSTOMER_ID),
      VEHICLE_RATING NUMBER(2,1),
      SERVICE_RATING NUMBER(2,1),
      OVERALL_RATING NUMBER(2,1),
      COMMENTS       VARCHAR2(1000),
      REVIEW_DATE    DATE DEFAULT SYSDATE,
      IS_PUBLISHED   CHAR(1) DEFAULT '1')`, 'REVIEW');

    await ddl(conn, `CREATE TABLE DAMAGE_REPORT (
      DAMAGE_ID      NUMBER DEFAULT SEQ_DAMAGE.NEXTVAL PRIMARY KEY,
      RESERVATION_ID NUMBER REFERENCES RESERVATION(RESERVATION_ID),
      VEHICLE_ID     NUMBER REFERENCES VEHICLE(VEHICLE_ID),
      DAMAGE_TYPE    VARCHAR2(100),
      DESCRIPTION    VARCHAR2(1000),
      ESTIMATED_COST NUMBER(12,2),
      STATUS         VARCHAR2(30) DEFAULT 'REPORTED')`, 'DAMAGE_REPORT');

    await ddl(conn, `CREATE TABLE MAINTENANCE (
      MAINTENANCE_ID   NUMBER DEFAULT SEQ_MAINTENANCE.NEXTVAL PRIMARY KEY,
      VEHICLE_ID       NUMBER REFERENCES VEHICLE(VEHICLE_ID),
      VENDOR_ID        NUMBER REFERENCES VENDOR(VENDOR_ID),
      PERFORMED_BY     NUMBER REFERENCES EMPLOYEE(EMPLOYEE_ID),
      MAINTENANCE_TYPE VARCHAR2(100),
      DESCRIPTION      VARCHAR2(500),
      COMPLETED_DATE   DATE,
      COST             NUMBER(12,2),
      STATUS           VARCHAR2(30) DEFAULT 'SCHEDULED')`, 'MAINTENANCE');

    await ddl(conn, `CREATE TABLE RESERVATION_INSURANCE (
      RES_INS_ID     NUMBER DEFAULT SEQ_RES_INS.NEXTVAL PRIMARY KEY,
      RESERVATION_ID NUMBER REFERENCES RESERVATION(RESERVATION_ID),
      PLAN_ID        NUMBER REFERENCES INSURANCE_PLAN(PLAN_ID),
      DAYS_COVERED   NUMBER(5),
      PLAN_COST      NUMBER(12,2))`, 'RESERVATION_INSURANCE');

    console.log('✅ Schema created\n');

    // ── SEED DATA ────────────────────────────────────────────────────
    console.log('🌱 Inserting seed data...');

    // ADDRESSES
    const addrIds = [];
    for (const [s, c, sp, p, co] of [
      ['123 Main Street', 'Toronto',     'Ontario', 'M5V 1A1', 'Canada'],
      ['456 King West',   'Toronto',     'Ontario', 'M5H 1K2', 'Canada'],
      ['789 Queen East',  'Mississauga', 'Ontario', 'L4T 2B3', 'Canada'],
      ['321 Bloor St',    'Vaughan',     'Ontario', 'L4H 3Z2', 'Canada'],
      ['99 Bay Street',   'Toronto',     'Ontario', 'M5J 2T3', 'Canada'],
    ]) {
      addrIds.push(await insert(conn,
        `INSERT INTO ADDRESS (STREET_LINE1,CITY,STATE_PROVINCE,POSTAL_CODE,COUNTRY)
         VALUES (:1,:2,:3,:4,:5)`,
        [s, c, sp, p, co], 'SEQ_ADDRESS'));
    }
    console.log('  ✔ Addresses:', addrIds);

    // CUSTOMERS
    const hash = await bcrypt.hash('password', 10);
    const custIds = [];
    for (const [ai, fn, ln, em, ph, dob, dl, dle] of [
      [0, 'John', 'Doe',     'john.doe@email.com',   '416-555-0101', '1990-05-15', 'DL-ON-123456', '2026-05-15'],
      [2, 'Jane', 'Smith',   'jane.smith@email.com', '416-555-0202', '1985-08-22', 'DL-ON-654321', '2027-08-22'],
      [3, 'Mike', 'Johnson', 'mike.j@email.com',     '905-555-0303', '1992-11-30', 'DL-ON-789012', '2025-11-30'],
    ]) {
      custIds.push(await insert(conn,
        `INSERT INTO CUSTOMERS
           (ADDRESS_ID,FIRST_NAME,LAST_NAME,EMAIL,PHONE,DOB,DL_NUMBER,DL_EXPIRY,PASSWORD_HASH)
         VALUES (:1,:2,:3,:4,:5,
                 TO_DATE(:6,'YYYY-MM-DD'),:7,
                 TO_DATE(:8,'YYYY-MM-DD'),:9)`,
        [addrIds[ai], fn, ln, em, ph, dob, dl, dle, hash], 'SEQ_CUSTOMER'));
    }
    console.log('  ✔ Customers (password: "password"):', custIds);

    // VEHICLE CATEGORIES
    const catIds = [];
    for (const [n, d, r, dep, a] of [
      ['Economy',      'Compact and fuel-efficient cars',               45.00, 200.00, 21],
      ['SUV',          'Spacious SUVs perfect for family trips',        95.00, 400.00, 25],
      ['Luxury',       'Premium vehicles for a first-class experience', 175.00,800.00, 25],
      ['Pickup Truck', 'Heavy-duty trucks for cargo and off-road',      85.00, 350.00, 25],
      ['Van',          'Passenger vans for groups',                    110.00, 450.00, 25],
    ]) {
      catIds.push(await insert(conn,
        `INSERT INTO VEHICLE_CATEGORY
           (CATEGORY_NAME,DESCRIPTION,BASE_DAILY_RATE,DEPOSIT_AMOUNT,MINIMUM_AGE_REQUIREMENT)
         VALUES (:1,:2,:3,:4,:5)`,
        [n, d, r, dep, a], 'SEQ_CATEGORY'));
    }
    console.log('  ✔ Vehicle Categories:', catIds);

    // BRANCHES
    const branchIds = [];
    for (const [ai, n, ph] of [
      [0, 'Toronto Downtown Branch', '416-555-1000'],
      [1, 'Toronto West Branch',     '416-555-2000'],
      [2, 'Mississauga Branch',      '905-555-3000'],
    ]) {
      branchIds.push(await insert(conn,
        `INSERT INTO BRANCH (ADDRESS_ID,BRANCH_NAME,PHONE,STATUS)
         VALUES (:1,:2,:3,'ACTIVE')`,
        [addrIds[ai], n, ph], 'SEQ_BRANCH'));
    }
    console.log('  ✔ Branches:', branchIds);

    // VEHICLES with real car image URLs (Wikimedia Commons public domain)
    const vehicles = [
      [0,0,'ABCD 123','Toyota',  'Corolla', 2022,'Silver',        5,'AVAILABLE',
       'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/2019_Toyota_Corolla_sedan_%28facelift%2C_white%29%2C_front_8.21.19.jpg/480px-2019_Toyota_Corolla_sedan_%28facelift%2C_white%29%2C_front_8.21.19.jpg'],
      [0,0,'EFGH 456','Honda',   'Civic',   2023,'Blue',          5,'AVAILABLE',
       'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/2022_Honda_Civic_Sport_in_Aegean_Blue%2C_front_8.19.22.jpg/480px-2022_Honda_Civic_Sport_in_Aegean_Blue%2C_front_8.19.22.jpg'],
      [1,0,'IJKL 789','Ford',    'Explorer',2023,'Black',         7,'AVAILABLE',
       'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/2020_Ford_Explorer_XLT%2C_front_11.3.19.jpg/480px-2020_Ford_Explorer_XLT%2C_front_11.3.19.jpg'],
      [1,1,'MNOP 012','Toyota',  'RAV4',    2022,'White',         5,'AVAILABLE',
       'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/2019_Toyota_RAV4_Adventure_%28facelift%2C_grey%29%2C_front_8.22.19.jpg/480px-2019_Toyota_RAV4_Adventure_%28facelift%2C_grey%29%2C_front_8.22.19.jpg'],
      [2,0,'QRST 345','BMW',     '5 Series',2023,'Midnight Blue', 5,'AVAILABLE',
       'https://upload.wikimedia.org/wikipedia/commons/thumb/6/sixty/2021_BMW_530i_%28G30%2C_facelift%29%2C_front_8.15.21.jpg/480px-2021_BMW_530i_%28G30%2C_facelift%29%2C_front_8.15.21.jpg'],
      [2,1,'UVWX 678','Mercedes','C-Class', 2023,'Obsidian Black',5,'AVAILABLE',
       'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2022_Mercedes-Benz_C300_4MATIC_%28W206%29%2C_front_10.3.21.jpg/480px-2022_Mercedes-Benz_C300_4MATIC_%28W206%29%2C_front_10.3.21.jpg'],
      [3,2,'YZAB 901','Ford',    'F-150',   2022,'Red',           5,'AVAILABLE',
       'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/2021_Ford_F-150_XLT_%2814th_gen%29%2C_front_7.3.21.jpg/480px-2021_Ford_F-150_XLT_%2814th_gen%29%2C_front_7.3.21.jpg'],
      [4,2,'CDEF 234','Chrysler','Pacifica',2022,'Gray',          8,'AVAILABLE',
       'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/2021_Chrysler_Pacifica_Touring_L%2C_front_9.20.20.jpg/480px-2021_Chrysler_Pacifica_Touring_L%2C_front_9.20.20.jpg'],
      [0,2,'GHIJ 567','Hyundai', 'Elantra', 2023,'Cream',         5,'AVAILABLE',
       'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/2021_Hyundai_Elantra_SEL_in_Ceramic_White%2C_front_8.15.21.jpg/480px-2021_Hyundai_Elantra_SEL_in_Ceramic_White%2C_front_8.15.21.jpg'],
    ];
    for (const [ci, bi, pl, mk, mo, yr, cl, se, st, img] of vehicles) {
      await insert(conn,
        `INSERT INTO VEHICLE
           (CATEGORY_ID,BRANCH_ID,LICENCE_PLATE,MAKE,MODEL,YEAR_MADE,COLOR,SEATS,STATUS,IMAGE_URL)
         VALUES (:1,:2,:3,:4,:5,:6,:7,:8,:9,:10)`,
        [catIds[ci], branchIds[bi], pl, mk, mo, yr, cl, se, st, img]);
    }
    console.log('  ✔ Vehicles (9) with images');

    // EMPLOYEES
    for (const [bi, n, em] of [
      [0,'Alice Brown','alice.b@vrms.com'],
      [0,'Bob Wilson', 'bob.w@vrms.com'],
      [1,'Carol Davis','carol.d@vrms.com'],
    ]) {
      await insert(conn,
        `INSERT INTO EMPLOYEE (BRANCH_ID,NAME,EMAIL,STATUS) VALUES (:1,:2,:3,'ACTIVE')`,
        [branchIds[bi], n, em]);
    }
    console.log('  ✔ Employees');

    // VENDORS
    const vendorIds = [];
    for (const [ai, n, t, em] of [
      [4,'Shield Insurance Co.','INSURANCE',  'contact@shieldins.com'],
      [4,'AutoFix Garage',      'MAINTENANCE','service@autofix.com'],
    ]) {
      vendorIds.push(await insert(conn,
        `INSERT INTO VENDOR (ADDRESS_ID,VENDOR_NAME,VENDOR_TYPE,EMAIL,STATUS)
         VALUES (:1,:2,:3,:4,'ACTIVE')`,
        [addrIds[ai], n, t, em], 'SEQ_VENDOR'));
    }
    console.log('  ✔ Vendors:', vendorIds);

    // INSURANCE PLANS
    const planIds = [];
    for (const [n, r, d] of [
      ['Basic Coverage',    8.99,  'Covers third-party liability and minor damage'],
      ['Standard Coverage', 14.99, 'Comprehensive coverage including collision and theft'],
      ['Premium Coverage',  22.99, 'Full zero-deductible coverage with roadside assistance'],
    ]) {
      planIds.push(await insert(conn,
        `INSERT INTO INSURANCE_PLAN (VENDOR_ID,PLAN_NAME,DAILY_RATE,DESCRIPTION,IS_ACTIVE)
         VALUES (:1,:2,:3,:4,'1')`,
        [vendorIds[0], n, r, d], 'SEQ_PLAN'));
    }
    console.log('  ✔ Insurance Plans:', planIds);

    // PAYMENT METHODS
    await insert(conn,
      `INSERT INTO PAYMENT_METHOD (CUSTOMER_ID,METHOD_TYPE,CARD_LAST4,IS_DEFAULT)
       VALUES (:1,'CREDIT_CARD','4242','1')`, [custIds[0]]);
    await insert(conn,
      `INSERT INTO PAYMENT_METHOD (CUSTOMER_ID,METHOD_TYPE,CARD_LAST4,IS_DEFAULT)
       VALUES (:1,'CREDIT_CARD','1234','1')`, [custIds[1]]);
    console.log('  ✔ Payment Methods');

    // PROMOTIONS
    for (const [ci, code, disc] of [
      [0,'ECONOMY10',10.00],
      [1,'SUV15',    15.00],
      [2,'LUXURY20', 20.00],
    ]) {
      await insert(conn,
        `INSERT INTO PROMOTION (CATEGORY_ID,PROMO_CODE,DISCOUNT_VALUE,IS_ACTIVE)
         VALUES (:1,:2,:3,'1')`,
        [catIds[ci], code, disc]);
    }
    console.log('  ✔ Promotions');

    // RESERVATIONS (vehicle IDs 1 and 3 were inserted first, so their PKs are 1 & 3)
    const resId1 = await insert(conn,
      `INSERT INTO RESERVATION
         (CUSTOMER_ID,VEHICLE_ID,PICKUP_BRANCH_ID,PICKUP_DATE,RETURN_DATE,TOTAL_DAYS,SUBTOTAL,STATUS)
       VALUES (:1,:2,:3,DATE '2024-01-10',DATE '2024-01-14',4,180.00,'COMPLETED')`,
      [custIds[1], catIds[0] /* vehicle 1 = first vehicle = CURRVAL of SEQ_VEHICLE after first insert */,
       branchIds[0]], 'SEQ_RESERVATION');
    // Use explicit vehicle lookup instead of guessing ID
    const veh1 = await conn.execute(
      `SELECT VEHICLE_ID FROM VEHICLE WHERE LICENCE_PLATE = 'ABCD 123'`);
    const veh3 = await conn.execute(
      `SELECT VEHICLE_ID FROM VEHICLE WHERE LICENCE_PLATE = 'IJKL 789'`);

    // Redo reservations with correct vehicle IDs
    // First delete the one we just inserted (oops), redo cleanly
    await conn.execute(`DELETE FROM RESERVATION WHERE RESERVATION_ID = :1`, [resId1]);

    const realResId1 = await insert(conn,
      `INSERT INTO RESERVATION
         (CUSTOMER_ID,VEHICLE_ID,PICKUP_BRANCH_ID,PICKUP_DATE,RETURN_DATE,TOTAL_DAYS,SUBTOTAL,STATUS)
       VALUES (:1,:2,:3,DATE '2024-01-10',DATE '2024-01-14',4,180.00,'COMPLETED')`,
      [custIds[1], veh1.rows[0][0], branchIds[0]], 'SEQ_RESERVATION');

    const realResId2 = await insert(conn,
      `INSERT INTO RESERVATION
         (CUSTOMER_ID,VEHICLE_ID,PICKUP_BRANCH_ID,PICKUP_DATE,RETURN_DATE,TOTAL_DAYS,SUBTOTAL,STATUS)
       VALUES (:1,:2,:3,DATE '2024-02-05',DATE '2024-02-08',3,285.00,'COMPLETED')`,
      [custIds[2], veh3.rows[0][0], branchIds[0]], 'SEQ_RESERVATION');

    console.log('  ✔ Reservations:', realResId1, realResId2);

    // REVIEWS
    await insert(conn,
      `INSERT INTO REVIEW
         (RESERVATION_ID,CUSTOMER_ID,VEHICLE_RATING,SERVICE_RATING,OVERALL_RATING,COMMENTS,IS_PUBLISHED)
       VALUES (:1,:2,4.5,5.0,4.5,'Great experience! Car was clean and pickup was smooth.','1')`,
      [realResId1, custIds[1]]);
    await insert(conn,
      `INSERT INTO REVIEW
         (RESERVATION_ID,CUSTOMER_ID,VEHICLE_RATING,SERVICE_RATING,OVERALL_RATING,COMMENTS,IS_PUBLISHED)
       VALUES (:1,:2,4.0,4.5,4.0,'SUV was excellent for our family trip. Would rent again!','1')`,
      [realResId2, custIds[2]]);
    console.log('  ✔ Reviews');

    await conn.commit();

    console.log('\n✅ All seed data inserted and committed!');
    console.log('\n🎉 Database setup complete!');
    console.log('\n📌 Demo Credentials:');
    console.log('   john.doe@email.com   / password');
    console.log('   jane.smith@email.com / password');
    console.log('   mike.j@email.com     / password');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    try { await conn.rollback(); } catch (_) {}
    throw err;
  } finally {
    await conn.close();
    await closePool();
  }
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
