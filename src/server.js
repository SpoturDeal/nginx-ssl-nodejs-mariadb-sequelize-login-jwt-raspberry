require('dotenv').config()

const express = require('express')
const app = express()
const path = require('path')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const requestIp = require('request-ip')
const { sequelize } = require('./models')
const corsOptions = require('./config/corsOptions')
const { logger } = require('./middleware/logEvents')
const errorHandler = require('./middleware/errorHandler')
const verifyJWT = require('./middleware/verifyJWT')
const credentials = require('./middleware/credentials')

const PORT = process.env.PORT || 5000

app.enable('trust proxy')

// get the clientip we are behind nginx server so server must relay ip
app.use(requestIp.mw())

// custom middleware logger
app.use(logger)

// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials)

// Cross Origin Resource Sharing
app.use(cors(corsOptions))

// built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: false }))

// built-in middleware for json
app.use(express.json())

//middleware for cookies
app.use(cookieParser())

var expressOptions = {
    dotfiles: 'ignore',
    etag: true,
    extensions: ['htm', 'html'],
    index: false,
    maxAge: '1d',
    redirect: false,
    setHeaders: function (res, path, stat) {
        res.set('x-timestamp', Date.now())
    },
}
//serve static files
app.use(express.static('public'))

// routes without verifying authentication
app.use('/', require('./routes/root'))
app.use('/register', require('./routes/register'))
app.use('/auth', require('./routes/auth'))
app.use('/refresh', require('./routes/refresh'))
app.use('/logout', require('./routes/logout'))

// routes after verifying authentication
app.use(verifyJWT)

app.use('/employees', require('./routes/api/employees'))
app.use('/users', require('./routes/api/users'))

app.all('*', (req, res) => {
    res.status(404)
    if (req.accepts('html')) {
        res.sendFile('404.html')
    } else if (req.accepts('json')) {
        res.json({ error: '404 Not Found' })
    } else {
        res.type('txt').send('404 Not Found')
    }
})

app.use(errorHandler)

app.listen({ port: PORT }, async () => {
    console.log(`
    Server is running on ${PORT}
    connecting to server...`)
    await sequelize.authenticate()
    console.log(`
    Database connected`)
})
