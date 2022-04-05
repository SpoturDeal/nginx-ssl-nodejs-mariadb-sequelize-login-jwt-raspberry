const { User } = require('../models')
const { Op } = require('sequelize')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const handleLogin = async (req, res) => {
    const cookies = req.cookies
    if (process.env.LOG_TO_CONSOLE)
        console.log(`cookie available at login: ${JSON.stringify(cookies)}`)

    // deconstruct the data from the request body
    const { username, password } = req.body

    // if username or password is missing
    if (!username || !password)
        return res
            .status(400)
            .json({ message: 'Username and password are required.' })

    // find the user includes the userkeys because
    // this is where we store the users pepper
    const foundUser = await User.findOne({
        where: {
            [Op.or]: [{ username: username }, { email: username }],
        },
        include: 'userkeys',
    })

    // we didn't find the user
    if (!foundUser) return res.sendStatus(401) //Unauthorized

    // evaluate password
    // add the pepper from the userkeys to the password the user entered
    const sharpPassword = password + foundUser.userkeys.idKey

    // compare the passwords
    const match = await bcrypt.compare(sharpPassword, foundUser.password)
    if (match) {
        // the roles are stored as a csv in a string
        const roles = foundUser.roles.split(',')

        // create JWTs
        const accessToken = jwt.sign(
            {
                UserInfo: {
                    username: foundUser.username,
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

        // the tokens are stored as csv (mariadb doesn't allow arrays)
        let foundTokens = []
        const storedTokens = foundUser.refreshToken
        if (storedTokens) {
            foundTokens = storedTokens.split(',')
        }

        let newRefreshTokenArray = !cookies?.jwt
            ? foundTokens
            : foundTokens.filter((rt) => rt !== cookies.jwt)

        if (cookies?.jwt) {
            /* 
            Scenario added here: 
                1) User logs in but never uses RT and does not logout 
                2) RT is stolen
                3) If 1 & 2, reuse detection is needed to clear all RTs when user logs in
            */
            const refreshToken = cookies.jwt

            const foundToken = await User.findOne({
                where: {
                    refreshToken: {
                        [Op.like]: '%' + refreshToken,
                    },
                },
            })

            // Detected refresh token reuse!
            if (!foundToken) {
                if (process.env.LOG_TO_CONSOLE)
                    console.log('attempted refresh token reuse at login!')

                // clear out ALL previous refresh tokens
                newRefreshTokenArray = []
            }

            res.clearCookie('jwt', {
                httpOnly: true,
                sameSite: 'None',
                secure: true,
            })
        }

        // Saving refreshToken with current user
        const refreshTokenToJoin = [...newRefreshTokenArray, newRefreshToken]
        foundUser.refreshToken = refreshTokenToJoin.join()
        const result = await foundUser.save()
        if (process.env.LOG_TO_CONSOLE) {
            console.log(result)
            console.log(roles)
        }
        // Creates Secure Cookie with refresh token
        res.cookie('jwt', newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 24 * 60 * 60 * 1000,
        })

        // Send authorization roles and access token to user
        res.json({ roles, accessToken })
    } else {
        res.sendStatus(401)
    }
}

module.exports = { handleLogin }
