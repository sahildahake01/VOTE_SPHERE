// backend/reset-admin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/database');

async function resetAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@voting.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    try {
        // Delete existing admin if any
        await pool.execute('DELETE FROM users WHERE email = ?', [adminEmail]);
        
        // Insert fresh admin
        await pool.execute(
            'INSERT INTO users (email, password, role, is_verified) VALUES (?, ?, "admin", TRUE)',
            [adminEmail, hashedPassword]
        );
        
        console.log('✅ Admin user reset successfully');
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Password: ${adminPassword}`);
        
        // Ensure election record exists
        await pool.execute(
            `INSERT INTO elections (id, title, is_active) VALUES (1, 'General Election', FALSE)
             ON DUPLICATE KEY UPDATE id=id`
        );
        console.log('✅ Election record verified');
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

resetAdmin();