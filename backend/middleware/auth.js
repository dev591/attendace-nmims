
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret';

// Existing Middleware Reuse (assumed existing or created here)
export const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, sapid, role, ... }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Director Role Check
export const requireDirector = (req, res, next) => {
    // Check if requireAuth already ran
    if (!req.user) {
        return res.status(500).json({ error: 'Auth middleware missing.' });
    }

    if (req.user.role !== 'director') {
        console.warn(`[AUTH] Access Denied: User ${req.user.sapid} is ${req.user.role}, not director.`);
        return res.status(403).json({ error: 'Access denied. Directors only.' });
    }

    next();
};

// Aliases for compatibility
export const authenticateToken = requireAuth;
