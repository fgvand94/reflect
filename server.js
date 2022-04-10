const express = require("express");
const crypto = require('crypto');
const exphbs = require('express-handlebars');
const { addListener } = require("process");
const { sendStatus } = require("express/lib/response");
const res = require("express/lib/response");


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
    id: 0,
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

    let obj = {
        isLoggedIn: user.isLoggedIn,
        person: user.userName
    }
   
    if (user.isLoggedIn === true) {
        
        pool.query(`select * from users where email = '${user.email}'`, (err, resp) => {

            if (err || resp.rows.length !== 1) {
                console.log('auth failed');
                user.isLoggedIn = false;
                user.userName = '';
                user.password = '';
                user.email = '';
                res.sendFile(__dirname + "/public/login.html");

            } else if (resp.rows[0].name === user.userName && resp.rows[0].email === user.email
                && resp.rows[0].password === user.password && resp.rows[0].session === req.headers.cookie.substring(10)) {

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

                    res.setHeader(`Set-Cookie`, `sessionId=${value}`);
                    pool.query(`update users set session = $1 where email = $2`, [value, user.email], async (err, resp) => {
                        if (err) {
                            console.log(err);
                        };
                    });                               
                    
                    res.render('index', {obj});     
                };                         
        })
        return;
    }
    res.render('index', {obj});
});


app.get('/login', (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

 
app.post('/login', (req, res) => {
    const {email, password} = req.body;
    
    pool.query(`select * from users where email = '${email}'`, (err, resp) => {

        if (resp.rows.length === 0) {
            res.sendStatus(400);
            return;
        };

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
            user.id = resp.rows[0].id;
            user.isLoggedIn = true;


            res.setHeader(`Set-Cookie`, `sessionId=${value}`);
            pool.query(`update users set session = $1 where email = $2`, [value, email], async (err, resp) => {
                if (err) {
                    console.log(err);
                };
            });

            res.send('success');
            return;
        };

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
    user.id = 0;
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
    
    console.log('jfdksa;');
    const obj = {
        isLoggedIn: user.isLoggedIn,      
    };
   
        
        pool.query(`select * from users where name = '${req.url.slice(6)}'`, (err, resp) => {

            if (err || resp.rows.length !== 1) {
                console.log('auth failed');
                user.isLoggedIn = false;
                user.userName = '';
                user.password = '';
                user.email = '';
                res.sendFile(__dirname + "/public/login.html");
                return;
            } 

            obj.person = resp.rows[0].name;
            obj.photo = resp.rows[0].photo;
            
            if (user.isLoggedIn) {
                if (resp.rows[0].name === user.userName && resp.rows[0].email === user.email
                && resp.rows[0].password === user.password && resp.rows[0].session === req.headers.cookie.substring(10)) {

                    

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
                        
                    res.setHeader(`Set-Cookie`, `sessionId=${value}`);

                    pool.query(`update users set session = $1 where email = $2`, [value, user.email], async (err, resp) => {
                        if (err) {
                            console.log(err);
                        };
                        
                    });
                    
                    
                }    
                    
            };
            res.render('user-page', {obj});                            
        });
      
})

app.get('/forums', (req, res) => {

    let obj = {
        isLoggedIn: user.isLoggedIn,
        person: user.userName,
    };

    
    if (user.isLoggedIn === true) {
        
        pool.query(`select * from users where email = '${user.email}'`, (err, resp) => {

            if (err || resp.rows.length !== 1) {
                console.log('auth failed');
                res.sendFile(__dirname + "/public/login.html");
                return;
            } else if (resp.rows[0].name === user.userName && resp.rows[0].email === user.email
                && resp.rows[0].password === user.password && resp.rows[0].session === req.headers.cookie.substring(10)) {
                    res.render('forum-home', {obj});
                    return;
                };
        });
        return;
    }
 
    res.render('forum-home', {obj});
});
 

app.get(`/forums/([^/]+)`, (req, res) => {

    obj = {
        isLoggedIn: user.isLoggedIn,
        person: user.userName,
        view: {},
        category: req.url.substring(8).toLowerCase(),
        pageTotal:"",
    
    }
    
    console.log(req.params);
    console.log(req.query);
    const pageRound = Math.ceil(req.url.slice(req.url.lastIndexOf('_'))/20);
    const offset = pageRound * 20;

    if (req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'camping' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'hiking' ||
    req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'backpacking' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'fish' ||
    req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'mammals' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'reptiles' ||
    req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'trees' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'vegitation' ||
    req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'flowers' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'mushrooms') {

        pool.query(`select title, username, id, count(*) over() as full_count 
        from ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}threads 
        order by time desc limit 20`, (err, resp) => {
            obj.pageArray = [];
            console.log(req.url.slice(req.url.lastIndexOf('_') + 3));
            let threadCount = resp.rows[0].full_count;
            let pageCount = Math.ceil(threadCount/20);
            if (req.url.slice(req.url.lastIndexOf('_') + 3) > 0 && req.url.slice(req.url.lastIndexOf('_') + 3) <= pageCount) {
                console.log('yada');
                obj.pageTotal = pageCount

                for (let j = 0; j < pageCount; j++) {
                    obj.pageArray.push(j+1);
                }
    
                for (let i = 0; i < resp.rows.length; i++) {
                    obj.view[i] = {
                        thread: resp.rows[i].title,
                        user: resp.rows[i].username,
                        id: resp.rows[i].id
                    }
                };
        
                res.render('threads',  {obj});
                return;
            }

           
        }); 
    } 

});


app.get('/forums/([^/]+)/([^/]+)', (req, res) => {
    
    let obj = {
        isLoggedIn: user.isLoggedIn,
        person: user.userName,
        view: {}
    }

    let lastSlash = req.url.lastIndexOf('/');
    let threadid = req.url.lastIndexOf('-');
   
    //I should see if I can find a way to do the below if that doesn't take up so much 
    //space. I'm not to worried about it but I might when I'm done with everything
    //else. I can't think of anyway at the moment. If not it's fine. 
    if (req.url.substring(8, lastSlash).toLowerCase() === 'camping' || req.url.substring(8, lastSlash).toLowerCase() === 'hiking' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'backpacking' || req.url.substring(8, lastSlash).toLowerCase() === 'fish' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'mammals' || req.url.substring(8, lastSlash).toLowerCase() === 'reptiles' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'trees' || req.url.substring(8, lastSlash).toLowerCase() === 'vegitation' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'flowers' || req.url.substring(8, lastSlash).toLowerCase() === 'mushrooms') {
         
    //I should maybe put these in a next route
        if (req.url.substring(lastSlash + 1) === 'Introduce-yourself-0') {
            res.render('posts', {obj});
            return;       
        };

        if (req.url.substring(lastSlash + 1) === 'New-Thread-0') {
            //the other method would be to put the if logic back here and then
            //render a different object based on that
            res.render('new-thread', {obj});
            return;
        }

        pool.query(`select users.name, users.photo, ${req.url.substring(8, lastSlash).toLowerCase()}posts.content 
        from ${req.url.substring(8, lastSlash).toLowerCase()}posts, users 
        where threadid = '${req.url.slice(threadid + 1)}' limit 10`, (err, resp) => {
            console.log(resp.rows);
            if (err) {
                console.log(err);
                return;
            };

            if (resp.rows.length > 0) {        

                for (let i = 0; i < resp.rows.length; i++) {
                    obj.view[i] = {
                        name: resp.rows[i].name,
                        content: resp.rows[i].content,
                        photo: resp.rows[i].photo
                    }
                }

                res.render('posts', {obj}); 
                return;        
            };
            res.sendStatus(404);
        });
    }
 
});

app.post('/forums/([^/]+)/New-Thread-0', (req, res) => {
    console.log('yada');
    
    let date_ob = new Date();

    let date = ("0" + date_ob.getDate()).slice(-2);

    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    let year = date_ob.getFullYear();

    let hours = date_ob.getHours();
    
    let minutes = date_ob.getMinutes();

    let seconds = date_ob.getSeconds();

    let fullTime = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
  
    
    let lastSlash = req.url.lastIndexOf('/');

   
    if (req.url.substring(8, lastSlash).toLowerCase() === 'camping' || req.url.substring(8, lastSlash).toLowerCase() === 'hiking' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'backpacking' || req.url.substring(8, lastSlash).toLowerCase() === 'fish' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'mammals' || req.url.substring(8, lastSlash).toLowerCase() === 'reptiles' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'trees' || req.url.substring(8, lastSlash).toLowerCase() === 'vegitation' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'flowers' || req.url.substring(8, lastSlash).toLowerCase() === 'mushrooms') {
        let threadid;
        let userid;
     
        pool.query(`select * from ${req.url.substring(8, lastSlash)}threads order by id desc`, (err, resp) => {
            threadid = resp.rows[0].id + 1;
            console.log(resp.rows);
            pool.query(`insert into ${req.url.substring(8, lastSlash).toLowerCase()}threads (id, userid, title, postnumber, time, username)
            values ($1, $2, $3, $4, $5, $6)`, [threadid, user.id, req.query.thread, 1, fullTime, user.userName]);

            
        });

        pool.query(`select * from ${req.url.substring(8, lastSlash)}posts order by id desc`, (err, resp) => {
            let id = resp.rows[0].id + 1;
            
            pool.query(`insert into ${req.url.substring(8, lastSlash).toLowerCase()}posts (id, threadid, userid, content) 
            values ($1, $2, $3, $4)`, [id, threadid, user.id, req.query.message]);
        })
      
    }

});

app.get('/forums/([^/]+)/([^/]+)/add-a-post', (req, res) => {
    console.log('what');
    const obj = {
        isLoggedIn: user.isLoggedIn
    }
    res.render('new-post', {obj});
});

app.post('/forums/([^/]+)/([^/]+)/add-a-post', (req, res) => {
    

    let threadEndI = req.url.indexOf('message') - 12;
    let threadEnd = req.url.slice(0, threadEndI);
    
   
    let nextLastSlash = threadEnd.lastIndexOf('/');
    // let thread = req.url.slice(nextLastSlash + 1, lastSlash);
   
    if (threadEnd.substring(8, nextLastSlash).toLowerCase() === 'camping' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'hiking' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'backpacking' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'fish' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'mammals' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'reptiles' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'trees' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'vegitation' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'flowers' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'mushrooms') {
        //not sure if I should keep the post id like every other id or if I should
        // do like 23-1 14-8. I guess the 23 and that is what the thread id column is
        //for though. 
        console.log(nextLastSlash);
        console.log(threadEnd.slice(threadEnd.lastIndexOf('-')))
        pool.query(`select id from ${threadEnd.substring(8, nextLastSlash)}posts order by id desc`, (err, resp) => {
            let id = resp.rows[0].id + 1;
            console.log(nextLastSlash);
            pool.query(`insert into ${threadEnd.substring(8, nextLastSlash)}posts (id, threadid, userid, content)
            values ($1, $2, $3, $4)`, [id, threadEnd.slice(threadEnd.lastIndexOf('-') + 1), user.id, req.query.message], (err, resp) => {
                if (err) {
                    console.log(err);
                }
            });
        })
    }
    
})


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});


//things to do. I need to make it so you can go to the next page in a thread or a
//list of threads. I need to make it so you can update your posts and so that
// you can comment on a specific post. I need to make it so you can only change
//the picture and other info on an account if your logged into that account. 
//I need to make a password reset feature and email verification for when you
//register. Maybe make it so you can get a code sent to your phone for authentication
//and implement oauth so you can log in with google. I also need to make the search
//bar work so you can search the different threads and things and then try to
//populate my database with a million or so entries just by generating random
//one to three word titles randomly from a list of a few thousand words with all
//different starting letters and things to test the speed of the search feature.
//also should make a direct message system for users