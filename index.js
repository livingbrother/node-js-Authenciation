const express = require("express")  // installing express js framework
const mongoose = require("mongoose") // mongoDB connection use mongoose library
const dotEnv = require("dotenv") // To config .env  credentials
const ejs = require("ejs") // To render View on client side use ejs engine
const session = require('express-session') // npm i express-session
const MongoDBStore = require('connect-mongodb-session')(session); // MongoDB-backed session storage for connect and Express. 
const User = require('./models/User')// To import Model properties of model from User.js as User
const bcrypt = require('bcryptjs') // To get bcryptjs

const app = express(); // assigning the express to app

dotEnv.config();  // To config .env  credentials

const PORT = process.env.PORT || 8000; // assign the Port value

app.set('view engine', 'ejs') // initializing the ejs

app.use(express.static('public')); // Through middleware we get the Public folder

app.use(express.urlencoded({extended: true})) //To get form data through middleware




/// Mongoose connection

mongoose.connect(process.env.MONGODB_URI)
.then(()=>{
    console.log("MongoDB Connected Successfully!");
})
.catch((error)=>{
    console.log(`${error}`)
})

// To store session in MongoDB and create

const store = new MongoDBStore({
    uri:process.env.MONGODB_URI,
    collection: "mySession"
})

// Lightweight MongoDB-based session store built and maintained by MongoDB.
app.use(session({
    secret:"This is Secret",
    resave: false,
    saveUninitialized:false, // for used logout false in case we have the true we have to make that false
    store:store
}))

// middleware

const checkAuth = (req, res, next) => {
    if (req.session.isAuthicated) {
        next()
    } else {
        res.redirect('/signup')
    }
}


// creating Routes for Pages
app.get('/signup',(req,res)=>{
    res.render('register')
})

app.get('/login', (req,res)=>{
    res.render('login')
})
 
app.get('/dashboard', checkAuth, (req, res) => {
    res.render('welcome')
})

// To POST Route register page
app.post('/register', async(req,res)=>{
    const {username, email, password} = req.body
    
    let user = await User.findOne({email})
    if(user){
        return res.redirect('/signup')
    }
    const hashedPassword = await bcrypt.hash(password, 12)

    user = new User({
        username,
        email,
        password: hashedPassword
    })
    req.session.person = user.username
    await user.save()
    res.redirect('/login')

})

// creating the  user Login route

app.post('/user-login', async(req,res)=>{
    const {email, password} = req.body
    const user = await User.findOne({email})

    if(!user){
        return res.redirect('/signup')
    }
    const checkPassword = await bcrypt.compare(password, user.password)

    if(!checkPassword){
        return res.redirect('/signup')
    }
    req.session.isAuthicated = true
    res.redirect('/dashboard')
})

// To create logout and session has to detroy once we had logout
app.post('/logout',(req,res)=>{
    req.session.destroy((err)=>{
        if(err) throw err;
        res.redirect('/signup')
    })
})

// Creating the server
app.listen(PORT, ()=>{
    console.log(`Server Started and Running @ ${PORT}`);
})

