import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import sql from 'mssql';

const PORT = process.env.PORT || 4000;
const SQL_CONFIG = {
  authentication: {
    type: 'default',
    options: {
      userName: 'sa',
      password: '12345',
    },
  },
  server: 'localhost',
  options: {
    database: 'parking_management',
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.type('html').send(`
    <html>
      <head><title>ParkFlow API</title></head>
      <body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;padding:24px;">
        <h1>ParkFlow API</h1>
        <p>API đang chạy. Kiểm tra <a href="/api/health">/api/health</a> để xem trạng thái.</p>
      </body>
    </html>
  `);
});

let pool;

async function createDatabase() {
  const masterConfig = { ...SQL_CONFIG, database: 'master' };
  const masterPool = await new sql.ConnectionPool(masterConfig).connect();
  await masterPool.request().query(`
    IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'${SQL_CONFIG.database}')
    BEGIN
      CREATE DATABASE ${SQL_CONFIG.database};
    END
  `);
  await masterPool.close();
}

async function createTables() {
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users' AND schema_id = SCHEMA_ID('dbo'))
    BEGIN
      CREATE TABLE dbo.users (
        user_id INT IDENTITY(1,1) PRIMARY KEY,
        full_name NVARCHAR(200) NOT NULL,
        email NVARCHAR(200) NOT NULL UNIQUE,
        phone NVARCHAR(50) NOT NULL UNIQUE,
        password_hash NVARCHAR(200) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'user',
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
    END
  `);
}

async function initDatabase() {
  await createDatabase();
  pool = await new sql.ConnectionPool(SQL_CONFIG).connect();
  await createTables();
}

function normalizeRole(roleValue) {
  if (!roleValue) return 'Parking User / Driver';
  const normalized = String(roleValue).trim().toLowerCase();
  switch (normalized) {
    case 'admin':
    case 'system administrator':
      return 'System Administrator';
    case 'manager':
    case 'parking manager':
      return 'Parking Manager';
    case 'staff':
    case 'parking staff':
      return 'Parking Staff';
    case 'user':
    case 'parking user / driver':
      return 'Parking User / Driver';
    default:
      return String(roleValue);
  }
}

function getSafeUser(record) {
  const isActive = typeof record.is_active !== 'undefined'
    ? !!record.is_active
    : typeof record.IsActive !== 'undefined'
    ? !!record.IsActive
    : true;

  return {
    id: String(record.user_id || record.Id || ''),
    fullName: record.full_name || record.FullName,
    email: record.email || record.Email,
    phone: record.phone || record.Phone,
    role: normalizeRole(record.role || record.Role),
    status: isActive ? 'Active' : 'Inactive',
    isActive,
    createdAt: record.created_at || record.CreatedAt || null,
  };
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', backend: 'ParkFlow API', database: SQL_CONFIG.database });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, phone, plateNumber, vehicleType, password } = req.body;

    if (!fullName || !email || !phone || !plateNumber || !vehicleType || !password) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc cho đăng ký.' });
    }

    const existing = await pool.request()
      .input('email', sql.NVarChar, email.trim())
      .input('phone', sql.NVarChar, phone.trim())
      .query(`
        SELECT email, phone
        FROM dbo.users
        WHERE email = @email OR phone = @phone
      `);

    if (existing.recordset.length > 0) {
      const conflict = existing.recordset[0];
      if ((conflict.email || '').toLowerCase() === email.trim().toLowerCase()) {
        return res.status(409).json({ error: 'Email này đã được đăng ký.' });
      }
      if ((conflict.phone || '') === phone.trim()) {
        return res.status(409).json({ error: 'Số điện thoại này đã được đăng ký.' });
      }
      return res.status(409).json({ error: 'Thông tin đăng ký đã tồn tại.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const insert = await pool.request()
      .input('full_name', sql.NVarChar, fullName.trim())
      .input('email', sql.NVarChar, email.trim())
      .input('phone', sql.NVarChar, phone.trim())
      .input('password_hash', sql.NVarChar, passwordHash)
      .input('role', sql.NVarChar, 'user')
      .input('is_active', sql.Bit, 1)
      .query(`
        INSERT INTO dbo.users (full_name, email, phone, password_hash, role, is_active)
        OUTPUT inserted.user_id, inserted.full_name, inserted.email, inserted.phone, inserted.role, inserted.is_active, inserted.created_at
        VALUES (@full_name, @email, @phone, @password_hash, @role, @is_active)
      `);

    const user = getSafeUser(insert.recordset[0]);
    return res.status(201).json({ message: 'Đăng ký thành công.', user });
  } catch (error) {
    console.error('REGISTER ERROR', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi tạo tài khoản. Vui lòng thử lại sau.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Thiếu thông tin đăng nhập.' });
    }

    const query = await pool.request()
      .input('identifier', sql.NVarChar, identifier.trim())
      .query(`
        SELECT TOP 1 user_id, full_name, email, phone, password_hash, role, is_active, created_at
        FROM dbo.users
        WHERE email = @identifier OR phone = @identifier
      `);

    const userRecord = query.recordset[0];
    if (!userRecord) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại hoặc thông tin không chính xác.' });
    }

    const passwordHash = userRecord.password_hash || userRecord.PasswordHash || '';
    let passwordMatch = false;
    if (/^\$2[abxy]?\$.{56}$/.test(passwordHash)) {
      passwordMatch = await bcrypt.compare(password, passwordHash);
    } else {
      passwordMatch = password === passwordHash;
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Mật khẩu không chính xác.' });
    }

    const safeUser = getSafeUser(userRecord);
    return res.json({ message: 'Đăng nhập thành công.', user: safeUser });
  } catch (error) {
    console.error('LOGIN ERROR', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi đăng nhập. Vui lòng thử lại.' });
  }
});

initDatabase()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Không thể khởi động backend:', error);
    process.exit(1);
  });
