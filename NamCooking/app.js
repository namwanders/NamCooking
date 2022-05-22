const express = require ('express');
const mysql = require ('mysql');
const session= require ('express-session');
const bcrypt=require('bcrypt');
const app= express ();

app.use (express.static('public'));
/* to get values from form */
app.use(express.urlencoded({extended: false}));

const connection= mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'Naoya19288264!',
    database:'Namwanders'
});

connection.connect((err) => {
    if (err) {
      console.log('error connecting: ' + err.stack);
      return;
    }
    console.log('success');
});

/* preparing to use the express-session package */
app.use(
    session({
      secret: 'my_secret_key',
      resave: false,
      saveUninitialized: false,
    })
)

app.use ((req, res, next) => {
    if (req.session.userId === undefined) {
        res.locals.firstName = "you";
        res.locals.isLoggedIn = false;
    } else {
        console.log ('You are logged in');
        res.locals.firstName = req.session.firstName;
        res.locals.userId=req.session.userId;
        res.locals.password=req.session.password;
        res.locals.isLoggedIn = true;
    }
    next();
});

app.get("/", (req, res)=> {
    res.render ('home.ejs');
});

app.get('/recipe/add', (req, res)=> {
    res.render ('add.ejs');
});

app.get('/recipe', (req, res)=> {
    connection.query (
        'SELECT * FROM recipes',
        (error, results)=> {
            res.render('recipe.ejs', {recipes:results});
        }
    );
});

app.get('/recipe/edit/:id', (req, res)=>{
    connection.query (
        'SELECT * FROM recipes where id=?',
        [req.params.id],
        (error, results)=> {
            res.render('recipe-edit.ejs', {recipe:results[0]});
        }
    );
});

app.get('/profile/edit/:id', (req, res)=> {
    connection.query(
        'SELECT * FROM users WHERE id=?',
        [res.locals.userId],
        (error, results)=> {
            res.render('profile-edit.ejs', {profile:results[0]});
        }
    );
});

app.get('/login', (req, res)=> {
    res.render ('login.ejs');
});

app.get('/logout', (req, res)=> {
    req.session.destroy ((error)=> {
        res.redirect ('/');
    });
});

app.get('/signup', (req, res)=> {
    res.render ('signup.ejs', {signupErrors:"", signupPasswordError:"", signupInvitationCodeError:"", duplicatedEmailAddress:""});
});

app.post ('/recipe/create',(req, res)=> {
    connection.query (
        'INSERT INTO recipes (name, url) values (?, ?)',
        [req.body.recipeName, req.body.recipeUrl],
        (error, results) => {
            res.redirect ('/recipe');
        }
    );
});

app.post('/recipe/delete/:id',(req, res)=> {
    connection.query (
        'DELETE FROM recipes WHERE id=?',
        [req.params.id],
        (error, results) => {
            res.redirect ('/recipe');
        }
    );
});

app.post('/recipe/update/:id', (req, res)=> {
    connection.query (
        'UPDATE recipes set name=? url=? user=? where id=?',
        [req.body.recipeName, req.body.recipeUrl, req.body.userName, req.params.id],
        (error, results)=> {
            res.redirect ('/recipe');
        }
    );
});

app.post('/profile/update/:id',(req, res)=>{
    const userName=req.body.username;
    const email=req.body.email;
    const password=req.body.password;
    const id=req.params.id;
    bcrypt.hash(password, 10, (error, hash)=> {
        connection.query(
            'UPDATE users SET username=? email=? password=? WHERE id=?',
            [username, email, hash, id],
            (error, results)=> {

            }
        )
    });
})

app.post('/login', 
(req, res, next) => {
    console.log ('Input value check');
    const email=req.body.email;
    const password=req.body.password;
    if (email !== ""){
        res.locals.loginEmailRemain=email;
    }
    if (password !== ""){
        res.locals.loginPasswordRemain=password;
    }
    next();
},
(req, res)=> {
    console.log ('User Check');
    const loginErrors=[];
    connection.query (
        'SELECT * FROM users where email=?',
        [req.body.email],
        (error, results)=> {
            if (results.length >0) {
                const plain=req.body.password;
                const hash=results[0].password;
                bcrypt.compare(plain, hash, (error, isEqual)=> {
                    if(isEqual) {
                        req.session.userId = results[0].id;
                        req.session.firstName=results[0].firstName;
                        req.session.password=hash;
                        res.redirect ('/recipe');
                    } else {
                        res.locals.loginEmailBlank=req.body.email;
                        loginErrors.push('Your password is wrong!!')
                        res.redirect ('/login');
                    }
                });
            } else {
                res.redirect('/login');
            }
        }
    );
});
app.post('/signup', 
(req, res, next) => {
    console.log ('Input value check');
    const email=req.body.email;
    const password=req.body.password;
    const passwordCheck=req.body.passwordCheck;
    const invitationCode=req.body.invitationCode;
    const signupErrors=[];
    const signupPasswordError=[];
    const signupInvitationCodeError=[];
    if (password === passwordCheck) {
        res.locals.password=password;
        res.locals.passwordCheck = passwordCheck;
    } else {
        signupErrors.push('Password is invalid');
        signupPasswordError.push("Type the same password for 2 times")
    }
    if (invitationCode === "Naoya is genius") {
        res.locals.invitationCode = invitationCode;
    } else {
        signupErrors.push('Invitation Code is invalid');
        signupInvitationCodeError.push('Type the valid code');
    }
    console.log (signupErrors);
    if (signupErrors.length > 0) {
        res.locals.email = email;
        res.render ('signup.ejs', {signupErrors:signupErrors, signupPasswordError:signupPasswordError, signupInvitationCodeError:signupInvitationCodeError, duplicatedEmailAddress:""});
    } else {
        next();
    }
},
(req, res, next) => {
    console.log ('email duplicate check');
    const email=req.body.email;
    const signupErrors=[];
    const duplicatedEmailAddress=[];
    connection.query(
        'SELECT * FROM users where email=?',
        [email],
        (error, results)=> {
            if (results.length > 0){
                signupErrors.push('email address is duplicated');
                duplicatedEmailAddress.push('Your email address is already registered');
                console.log (signupErrors);
                res.render('signup.ejs', {signupErrors:signupErrors, signupPasswordError:"", signupInvitationCodeError:"", duplicatedEmailAddress:duplicatedEmailAddress});
            } else {
                res.locals.email = email;
                next();
            }
        }
    );
},
(req, res)=> {
    console.log ('signup');
    const email=req.body.email;
    const password=req.body.password;
    bcrypt.hash (password, 10, (error, hash)=> {
        connection.query (
            'INSERT INTO users (email, password) VALUES (?, ?)',
            [email, hash],
            (error, results) => {
                req.session.userId=results.insertId;
                req.session.password=hash;
                res.redirect ('/');
            }
        );
    });
});

app.listen(3000);