const path = require('path')
const express = require('express')
const dotenv = require('dotenv')
const morgan = require('morgan')
const exphbs = require('express-handlebars')
const methodOverride = require('method-override')
const passport = require('passport')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const connectDB = require('./config/db')

// LOAD CONFIG
dotenv.config({path: './config/config.env'})

//LOAD PASSPORT
require('./config/passport')(passport)

connectDB()

const app = express()

//BODY PARSER
app.use(express.urlencoded({ extended: false}))
app.use(express.json())

// Method override
app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method
      delete req.body._method
      return method
    }
  })
)

//DETERMINE LEVEL OF LOGGING
if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

// Handlebars helpers
const {formatDate} = require('./helpers/hbs')

//Handlebars
app.engine(
    '.hbs', 
    //!Change: add '.engine' after exphbs
    exphbs.engine({
      helpers: {
        formatDate,
      },
        defaultLayout: 'main',
        extname: '.hbs'
    })
);
app.set('view engine', '.hbs');

// SESSIONS
app.use(
    session({
      secret: 'keyboard cat',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI
      })
    })
  )
  

// PASSPORT MIDDLEWARE
app.use(passport.initialize())
app.use(passport.session())

//SET GLOBAL VARIABLE
app.use(function(req, res, next){
    res.locals.user = req.user || null
    next()
})

//STATIC FOLDER
app.use(express.static(path.join(__dirname, 'public')))

//ROUTES
app.use('/', require('./routes/index'))
app.use('/auth', require('./routes/auth'))
app.use('/stories', require('./routes/stories'))

const PORT = process.env.PORT || 8000

app.listen(
    PORT, 
    console.log(`Server running on ${process.env.NODE_ENV} mode on PORT ${PORT}`)
    )