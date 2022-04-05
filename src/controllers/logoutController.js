const { User } = require('../models')
const { Op } = require('sequelize')

const handleLogout = async (req, res) => {
    // On client, also delete the accessToken
    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(204) //No content
    const refreshToken = cookies.jwt

    // Is refreshToken in db?
    const foundUser = await User.findOne({
        // use like and % because the RT is an csv array
        where: {
            refreshToken: {
                [Op.like]: '%' + refreshToken,
            },
        },
    })

    if (!foundUser) {
        res.clearCookie('jwt', {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
        })
        return res.sendStatus(204)
    }

    // here split to csv token string to array
    const foundTokens = foundUser.refreshToken.split(',')

    // Delete refreshToken in db
    const newTokens = foundTokens.filter((rt) => rt !== refreshToken)

    // set the token joined to the new RT
    foundUser.refreshToken = newTokens.join()
    const result = await foundUser.save()
    if (process.env.LOG_TO_CONSOLE) console.log(result)

    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
    res.sendStatus(204)
}

module.exports = { handleLogout }
