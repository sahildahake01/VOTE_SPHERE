const bcrypt = require('bcryptjs');
const pool = require('./config/database');

async function fixAdmin() {
    const password = 'Admin@123';
    const correctHash = '$2a$10$4W5Z8Kz6v2fJ3nQ8pL5m.u9xY7wE2rT1qO6vB3kH8jP0mN4sL7zA';

    // Test hash first
    const isValid = await bcrypt.compare(password, correctHash);
    console.log('Hash valid:', isValid);

    if (!isValid) {
        console.log('❌ Hash invalid - generating new...');
        return;
    }

    // Reset admin
    await pool.execute('DELETE FROM users WHERE email = ?', ['admin@voting.com']);
    await pool.execute(
        'INSERT INTO users (email, password, role, is_verified) VALUES (?, ?, "admin", TRUE)',
        ['admin@voting.com', correctHash]
    );

    console.log('✅ ADMIN FIXED!');
    console.log('📧 Email: admin@voting.com');
    console.log('🔑 Password: Admin@123');
    console.log('🔄 RESTART: npm start');
}

fixAdmin().catch(console.error);