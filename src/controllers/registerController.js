const { User, userKeys } = require('../models')
const { Op } = require('sequelize')
const bcrypt = require('bcrypt')
const crypto = require('crypto')

const handleNewUser = async (req, res) => {
    if (process.env.LOG_TO_CONSOLE)
        console.log(`${req.hostname} ${req.clientIp}`)

    // desctructue reg.body
    const { firstname, lastname, username, email, password, phone } = req.body

    // check if all fields are there
    if (!username || !lastname || !firstname || !email || !password || !phone)
        return res.status(400).json({ message: 'All fields are required.' })

    // find the duplicate
    const duplicate = await User.findOne({
        where: {
            [Op.or]: [{ username: username }, { email: email }],
        },
    })

    if (duplicate)
        return res.status(409).json({
            message: 'This username or e-mail address is already in use',
        }) //Conflict

    try {
        // make a pepper to add to password
        const pepper = crypto.randomBytes(8).toString('hex')

        // add the pepper to the password to make it more spicy
        const sharpPassword = password + pepper

        // encrypt the password
        const hashedPwd = await bcrypt.hash(sharpPassword, 10)

        // create and store the new user
        const result = await User.create({
            username: username,
            firstname: firstname,
            lastname: lastname,
            email: email,
            phone: phone,
            roles: '1011',
            password: hashedPwd,
        })
        if (process.env.LOG_TO_CONSOLE) console.log(result)

        // get the user from or the username which is unique
        const newUser = await User.findOne({ where: { username: username } })

        // associate the pepper to the user and create
        const key = await userKeys.create({
            idKey: pepper,
            userId: newUser.id,
        })
        if (process.env.LOG_TO_CONSOLE) console.log(key)

        res.status(201).json({ success: `New user ${username} created!` })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

module.exports = { handleNewUser }
