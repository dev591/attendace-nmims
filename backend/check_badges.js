const { getClient } = require('./db.js');

async function checkBadges() {
    const client = await getClient();
    try {
        const res = await client.query('SELECT code, name, description, icon FROM badges');
        console.log("✅ Badges in DB:", res.rowCount);
        res.rows.forEach(b => {
            console.log(`- [${b.code}] ${b.name}: ${b.description} (Icon: ${b.icon})`);
        });
    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        client.release();
    }
}

checkBadges();
