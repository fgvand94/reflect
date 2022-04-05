const express = require("express");
const crypto = require('crypto');
const exphbs = require('express-handlebars');


const hbs = exphbs.create({
    defaultLayout: false,
    extname: '.handlebars'
});

const app = express();

app.engine('handlebars', hbs.engine);

app.use(express.static('public'));

app.use(express.json());

app.set('view engine', 'handlebars');


let user = {
    userName: "",
    password: "",
    email: "",
    isLoggedIn: false
};

const alpha = Array.from(Array(26)).map((e, i) => i + 65);
const alphabet = alpha.map((x) => String.fromCharCode(x));

let randomArray = [];

for (let j = 0; j < 16; j++) {
    if (Math.random()* 10 < 5) {
        randomArray.push(Math.floor(Math.random()*10));
    } else {
        randomArray.push(alphabet[Math.floor(Math.random()*26)]);
    }
};

secret = randomArray.join('');


const Pool = require('pg').Pool;
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'reflect',
  password: 'password',
  port: 5432,
});


app.get('/', (req, res) => {
   
    if (user.isLoggedIn === true) {
        
        pool.query(`select * from users where email = '${user.email}'`, (err, resp) => {

            if (err || resp.rows.length !== 1) {
                console.log('auth failed');
                res.sendFile(__dirname + "/public/login.html");
                return;
            } else if (resp.rows[0].name === user.userName && resp.rows[0].email === user.email
                && resp.rows[0].password === user.password && resp.rows[0].session === req.headers.cookie.substring(10)) {
                    res.sendFile(__dirname + "/public/index.html");
                    return;
                }
        })
    }
    res.sendFile(__dirname + "/public/index.html");
});


app.get('/login', (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

 
app.post('/login', (req, res) => {
    const {email, password} = req.body;
    
    pool.query(`select email, password, salt, name from users where email = '${email}'`, (err, resp) => {
        
        if (resp.rows.length > 0) {
            text = password;
            key = resp.rows[0].salt;
            
            var hash = crypto.createHmac('sha512', key);
            hash.update(text);
            var value = hash.digest('hex');
        
            
            if (value === resp.rows[0].password) {
                console.log('login success');
                
                const alpha = Array.from(Array(26)).map((e, i) => i + 65);
                const alphabet = alpha.map((x) => String.fromCharCode(x));
             
                let randomArray = [];
                let randomArray2 = [];

                for (let j = 0; j < 16; j++) {
                    if (Math.random()* 10 < 5) {
                        randomArray.push(Math.floor(Math.random()*10));
                        randomArray2.push(Math.floor(Math.random()*10));
                    } else {
                        randomArray.push(alphabet[Math.floor(Math.random()*26)]);
                        randomArray2.push(alphabet[Math.floor(Math.random()*26)]);
                    }
                };
            
                text = randomArray.join('');
                key = randomArray2.join('');
                              
                var hash = crypto.createHmac('sha512', key);
                hash.update(text);
                var value = hash.digest('hex');
                
                user.userName = resp.rows[0].name;
                user.password = resp.rows[0].password;
                user.email = resp.rows[0].email;
                user.isLoggedIn = true;

                res.setHeader(`Set-Cookie`, `sessionId=${value}`);
                console.log('yada');
                pool.query(`update users set session = $1 where email = $2`, [value, email], (err, resp) => {
                    if (err) {
                        console.log(err);
                    };
                });

                res.send(resp.rows[0].email);
                return;
            };
            console.log('incorect login credentials');
        }
        res.send('invalid');
        console.log('invalid');
  
    });
});

app.get('/logout', (req, res) => {
    res.setHeader('Set-Cookie', `sessionId=''`);
    user.email = '';
    user.userName = '';
    user.password = '';
    user.isLoggedIn = false;
    res.redirect('/forums');
});


app.get('/register', (req, res) => {
    res.sendFile(__dirname + "/public/register.html");
});


app.post('/register', (req, res) => {
    const {userName, email, password} = req.body;

    pool.query(`select email from users where email = '${email}'`, (err, resp) => {
        if (resp.rows.length > 0) {
            console.log(resp.rows[0].email + " already exists");

            return;
        };

        pool.query(`select name from users where name = '${userName}'`, (err, resp) => {
            if (resp.rows.length > 0) {
                console.log(resp.rows[0].name + ' already exists');
                return;
            };
            
            pool.query(`select id from users order by id desc`,  (err, resp) => {
                if (err) {
                   return console.log(err);
                } 
 
                const id = resp.rows[0].id + 1;
                const alpha = Array.from(Array(26)).map((e, i) => i + 65);
                const alphabet = alpha.map((x) => String.fromCharCode(x));

                let randomArray = [];

                for (let j = 0; j < 16; j++) {
                    if (Math.random()* 10 < 5) {
                        randomArray.push(Math.floor(Math.random()*10));
                    } else {
                        randomArray.push(alphabet[Math.floor(Math.random()*26)]);
                    }
                };
                text = password;
                key = randomArray.join('');
                
              
                var hash = crypto.createHmac('sha512', key);
                hash.update(text);
                var value = hash.digest('hex');
                
        
                pool.query(`insert into users (id, name, email, password, salt)
                values ($1, $2, $3, $4, $5)`, [id, userName, email, value, key], (error, response) => {
                    if (error) {
                        return console.log(error);
                    }
                    res.send('success');
                })
        
            }); 
            
        });

    });

});



app.get('/user-*', (req, res) => {
    res.sendFile(__dirname + "/public/user-page.html");
})

app.get('/forums', (req, res) => {

    if (user.isLoggedIn === true) {
        
        pool.query(`select * from users where email = '${user.email}'`, (err, resp) => {

            if (err || resp.rows.length !== 1) {
                console.log('auth failed');
                res.sendFile(__dirname + "/public/login.html");
                return;
            } else if (resp.rows[0].name === user.userName && resp.rows[0].email === user.email
                && resp.rows[0].password === user.password && resp.rows[0].session === req.headers.cookie.substring(10)) {
                    res.sendFile(__dirname + "/public/forum-home.html");
                    return;
                };
        })
    }
 
  res.sendFile(__dirname + "/public/forum-home.html");
});


app.get('/forums/camping', (req, res) => {

  pool.query(`select title, username from campingthreads order by time desc`, (err, resp) => {
    
    res.setHeader('content-type', 'text/html');

    const obj = {
        isLoggedIn: user.isLoggedIn,
        person: user.userName,
        thread: {
            one: resp.rows[0].title,
            two: resp.rows[1].title,
            three: resp.rows[2].title,
            four: resp.rows[3].title
        },

        user: {
            one: resp.rows[0].username,
            two: resp.rows[1].username,
            three: resp.rows[2].username,
            four: resp.rows[3].username
        }
    };
    console.log(user);
    res.render('threads',  {obj});
    
   
    });

});


app.get('/forums/camping/*', (req, res) => {
    console.log(req.url);
    if (req.url.substring(16) === 'Introduce-yourself') {
        res.sendFile(__dirname + "/public/threads/posts/posts.html"); 
        return;       
    };

    if (req.url.substring(16) === 'New-Thread') {
        res.sendFile(__dirname + "/public/threads/new-thread.html");
        return;
    }

    pool.query(`select title from campingthreads where title = '${req.url.substring(16).replaceAll('-', ' ')}'`, (err, resp) => {
        if (err) {
            console.log(err);
            return;
        };
        
        if (resp.rows.length > 0) {
            res.sendFile(__dirname + "/public/threads/posts/posts.html");  
            return;        
        };
        res.sendStatus(404);
    });
 
});


app.get('/forums/camping/yada', (req, res) => {
  res.sendFile(__dirname + "/public/threads/posts/posts.html");
});


app.get('/forums/hiking', (req, res) => {    
    res.sendFile(__dirname + "/public/threads/threads.html");  
});


app.get('/forums/hiking/introduce%20yourself', (req, res) => {
    res.sendFile(__dirname + "/public/threads/posts/posts.html");
});


app.get('/forums/backpacking', (req, res) => {
    res.sendFile(__dirname + "/public/threads/threads.html");
});

 
app.get('/forums/fish', (req, res) => {
    res.sendFile(__dirname + "/public/threads/threads.html");  
});


app.get('/forums/mammals', (req, res) => {
    res.sendFile(__dirname + "/public/threads/threads.html");
});

  
app.get('/forums/reptiles', (req, res) => {
    res.sendFile(__dirname + "/public/threads/threads.html");  
});

  
app.get('/forums/trees', (req, res) => {
    res.sendFile(__dirname + "/public/threads/threads.html");
});

  
app.get('/forums/vegitation', (req, res) => {
    res.sendFile(__dirname + "/public/threads/threads.html");  
});

  
app.get('/forums/flowers', (req, res) => {
    res.sendFile(__dirname + "/public/threads/threads.html");  
});

  
app.get('/forums/mushrooms', (req, res) => {  
    res.sendFile(__dirname + "/public/threads/threads.html");  
});


app.get('/forums/threads/posts', (req, res) => {
  res.sendFile(__dirname + "/public/threads/posts/posts.html");
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});