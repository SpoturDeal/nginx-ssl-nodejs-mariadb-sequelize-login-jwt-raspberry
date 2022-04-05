const { User } = require('../models')
const { Op } = require('sequelize')
const jwt = require('jsonwebtoken')

const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(401)

    const refreshToken = cookies.jwt
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })

    // use like and % because the RT is an csv array
    const foundUser = await User.findOne({
        where: {
            refreshToken: {
                [Op.like]: '%' + refreshToken,
            },
        },
    })

    // Detected refresh token reuse!
    if (!foundUser) {
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, decoded) => {
                if (err) return res.sendStatus(403) //Forbidden

                if (process.env.LOG_TO_CONSOLE)
                    console.log('attempted refresh token reuse!')
                const hackedUser = await User.findOne({
                    where: { username: decoded.username },
                })
                hackedUser.refreshToken = []
                const result = await hackedUser.save()
                if (process.env.LOG_TO_CONSOLE) console.log(result)
            }
        )
        return res.sendStatus(403) //Forbidden
    }
    let availableTokens = []
    const storedToken = foundUser.refreshToken
    if (storedToken) availableTokens = storedToken.split(',')

    const newRefreshTokenArray = availableTokens.filter(
        (rt) => rt !== refreshToken
    )

    // evaluate jwt
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err) {
                console.log('expired refresh token')
                const refreshTokenToStore = [...newRefreshTokenArray]
                foundUser.refreshToken = refreshTokenToStore.join()
                const result = await foundUser.save()
                console.log(result)
            }
            if (err || foundUser.username !== decoded.username)
                return res.sendStatus(403)

            // Refresh token was still valid
            //const roles = Object.values(foundUser.roles);
            const roles = foundUser.roles.split(',')
            const accessToken = jwt.sign(
                {
                    UserInfo: {
                        username: decoded.username,
                        roles: roles,
                    },
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '300s' }
            )

            const newRefreshToken = jwt.sign(
                { username: foundUser.username },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '1d' }
            )
            // Saving refreshToken with current user
            const newRefreshTokenToDB = [
                ...newRefreshTokenArray,
                newRefreshToken,
            ]

            foundUser.refreshToken = newRefreshTokenToDB.join()
            const result = await foundUser.save()

            // Creates Secure Cookie with refresh token
            res.cookie('jwt', newRefreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'None',
                maxAge: 24 * 60 * 60 * 1000,
            })

            res.json({ roles, accessToken })
        }
    )
}

module.exports = { handleRefreshToken }
