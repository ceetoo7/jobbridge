// server/middleware/verifyToken.js
import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1]; // "Bearer <token>"

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info (id + role)
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};

export default verifyToken;
