const path = require('path')
const verifyRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req?.roles) return res.status(401).sendFile('403.html')

        const rolesArray = [...allowedRoles]
        const result = req.roles
            .map((role) => rolesArray.includes(role))
            .find((val) => val === true)

        if (!result) return res.status(401).sendFile('403.html')

        next()
    }
}

module.exports = verifyRoles
