const jwt = require('jsonwebtoken');
const sercretKey= "kfkr%^&*&^%^%cuelnn%%%$$#$#%^yr7ghtigntikjf"

exports.authUser = async (req, res, next) => {
    try {
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(" ")[1];
            const verification = jwt.verify(token, process.env.sercretKey || sercretKey); 
            if (verification) {
                req.user = verification;
                next();
            } else {
                res.status(401).json({
                    status: "Unauthorized",
                    message: "Invalid Token"
                });
            }
        } else {
            res.status(401).json({
                status: "Unauthorized",
                message: "No token passed"
            });
        }
    } catch (e) {
        res.status(401).json({
            status: "Unauthorized",
            message: 'You are not authorized'
        });
    }
};
