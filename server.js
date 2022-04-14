const express = require("express");
const crypto = require('crypto');
const exphbs = require('express-handlebars');
const nodemailer = require("nodemailer");

const hbs = exphbs.create({
    defaultLayout: false,
    extname: '.handlebars'
});

const app = express();

app.engine('handlebars', hbs.engine);

app.use(express.static('public'));

app.set('view engine', 'handlebars');

app.use(express.json({ limit: "50mb" }));

app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
// app.use(express.urlencoded({limit: '25mb'})); this method is deprecated without the
//above addons for some reason. body parser is deprecated... extended: This option allows to choose between parsing the URL-encoded data with the querystring library (when false) or the qs library (when true). The “extended” syntax allows for rich objects and arrays to be encoded into the URL-encoded format, allowing for a JSON-like experience with URL-encoded. For more information, please see the qs library.
app.use(express.raw({ limit: "50mb" }));

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
                    pool.query(`update users set session = $2 where email = $1`, [user.email, value], async (err, resp) => {
                        if (err) {
                            console.log(err);
                        };
                    });                               
                 
                    return res.render('index', {obj});     
                };
                user.isLoggedIn = false;
                user.userName = '';
                user.password = "";
                user.email = '';
                user.id = 0;
                return res.render('index', {obj});                         
        })
        return;
    }
    res.render('index', {obj});
});


app.get('/login', (req, res) => {
    
    let obj = {
        confirm: false,
        reset: false,
    }

    res.render('login', {obj});
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
            if (!resp.rows[0].verified) {
                res.send('Not verified');
                return;
            }
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
            pool.query(`update users set session = $2 where email = $1`, [email, value], async (err, resp) => {
                if (err) {
                    console.log(err);
                };
            });
            //cant send after header yada could make else idk i'll fix it later
            res.send('success');
            return;
        };

        res.send('invalid');
        console.log('invalid');
  
    });
    
});

app.get('/confirm-email', (req, res) => {
    let obj = {
        confirm: true,
        reset: false
    }

    res.render('login', {obj});
});

app.post('/confirm-email', (req, res) => {
    let email = req.body.email;


    let randomArray = [];


    for (let j = 0; j < 16; j++) {
        if (Math.random()* 10 < 5) {
            randomArray.push(Math.floor(Math.random()*10));
        } else {
            randomArray.push(alphabet[Math.floor(Math.random()*26)]);
        }
    };

    text = email;

    key = randomArray.join('');
    
    var hash = crypto.createHmac('sha512', key);
    hash.update(text);
    var value = hash.digest('hex');


    pool.query(`select verified from users where email = '${email}'`, (err, resp) => {
        //this is just so they don't get a new token if they happen to for some reason
        //try resetting their password before they verify their email. So they don't
        //even have the option before they verify their email. 
        
        if (resp.rows[0].verified && resp.rows.length > 0) {

            const transporter = nodemailer.createTransport ({
                service: 'gmail',
                auth: {
                  user: 'portfolliotemp@gmail.com',
                  //I need to find out how to hide these passwords on my
                  //file
                  pass: 'fourothreepm10!'
                }
              })
            
              const mailOptions = {
                from: 'portfolliotemp@gmail.com',
                to: email,
                subject: `Password reset`,
                html: `Reset your password <a href="http://localhost:5000/reset-password?email=${email}&token=${value}">here</a>`,     
              }
            
              transporter.sendMail(mailOptions, (error, info)=> {
                if(error) {
                  console.log(error);
                  res.send('error');
                }else {
                  console.log('email sent');
                }
            });
            //it might be a good idea for me to have another column in the database that
            //is set true here if the password is being reset. idk if it really matters but
            //since i'm using the same token for this and the initial email verification 
            //someone could technically get the the address with this email and the token 
            //provided during the email verification and use it to reset the password. The email reset has that fail safe
            //where it skips everything if verified is set to true. I mean it would be crazy
            //because i'll set the token to null right after they reset the password and I do
            //right after the person verifies their email and
            //it would be hard enough for someone who didn't have acess to the persons
            //email account to somehow intercept the exact token that I gave and do that
            //so idk if it really matters. but I might.
  
            pool.query('update users set verificationtoken = $2 where email = $1', [email, value], (err, resp) => {
                if (err) {
                    console.log(err);
                }
                res.send('Password reset sent')
            })
        }
    })

})

app.get('/reset-password', (req, res) => {

    let obj = {
        confirm: false,
        reset: true,
    }

    res.render('login', {obj});
})

app.post('/reset-password', (req, res) => {

    if (req.body.password === req.body.password2) {
        pool.query(`select verificationtoken, email 
        from users where email = '${req.query.email}'`, (err, resp) => {
            if (req.query.token === resp.rows[0].verificationtoken) {
                let randomArray = [];


                for (let j = 0; j < 16; j++) {
                    if (Math.random()* 10 < 5) {
                        randomArray.push(Math.floor(Math.random()*10));
                    } else {
                        randomArray.push(alphabet[Math.floor(Math.random()*26)]);
                    }
                };
            
                text = req.body.password;
            
                key = randomArray.join('');
                
                var hash = crypto.createHmac('sha512', key);
                hash.update(text);
                var value = hash.digest('hex');
                pool.query(`update users set password = $2, verificationtoken = $3 
                where email = $1`, 
                [req.query.email, value, null], (err, resp) => {
                    if (err) {
                        return console.log(err);
                    }
                })
                return;
            }
            res.send('invalid auth');
        })
        return;
    }
    console.log("passwords don't match")
    res.send("passwords don't match");

})

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
        //combine the above and below probably
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
                let randomArray2 = [];

                for (let j = 0; j < 16; j++) {
                    if (Math.random()* 10 < 5) {
                        randomArray.push(Math.floor(Math.random()*10));
                        randomArray2.push(alphabet[Math.floor(Math.random()*26)]);
                    } else {
                        randomArray.push(alphabet[Math.floor(Math.random()*26)]);
                        randomArray2.push(Math.floor(Math.random()*10));
                    }
                };
                text = password;
                text2 = email;

                key = randomArray.join('');
                key2 = randomArray2.join('');
                
              
                var hash = crypto.createHmac('sha512', key);
                hash.update(text);
                var value = hash.digest('hex');

                var hash2 = crypto.createHmac('sha512', key2);
                hash2.update(text2);
                var value2 = hash2.digest('hex');
               
                // res.header("Access-Control-Allow-Credentials", true);
                // res.header("Access-Control-Allow-Origin", "*");
           
              
                const transporter = nodemailer.createTransport ({
                  service: 'gmail',
                  auth: {
                    user: 'portfolliotemp@gmail.com',
                    //I need to find out how to hide these passwords on my
                    //file
                    pass: 'fourothreepm10!'
                  }
                })
              
                const mailOptions = {
                  from: 'portfolliotemp@gmail.com',
                  to: email,
                  subject: `Email verification`,
                  html: `Go to the link <a href="http://localhost:5000/verify?email=${email}&token=${value2}">here</a> to verify your account`,     
                }
              
                transporter.sendMail(mailOptions, (error, info)=> {
                  if(error) {
                    console.log(error);
                    res.send('error');
                  }else {
                    console.log('email sent');
                    pool.query(`insert into users (id, name, email, password, salt, verified, verificationtoken)
                    values ($1, $2, $3, $4, $5, $6, $7)`, [id, userName, email, value, key, false, value2], (error, response) => {
                        if (error) {
                            return console.log(error);
                        }
                       
                        res.send('success');
                    })

                  }

                });
        
            }); 
            
        });

    });

});

app.get('/verify', (req, res) => {

    if (req.query.token === null) {
        return;
    }
    pool.query(`select email, verificationtoken, verified 
    from users where email = '${req.query.email}'`, (err, resp) => {
     
        if (err) {
            console.log('in select')
            return console.log(err);
        };

        if (resp.rows[0].verificationtoken === null || resp.rows[0].verified) {
            return console.log('already verified');
        }
  
        if (req.query.token === resp.rows[0].verificationtoken && req.query.email === resp.rows[0].email) {
            pool.query(`update users set verified = $2, verificationtoken = $3
            where email = $1`, [req.query.email, true, null], (err, response) => {
                if (err) {
                    console.log('in update')
                   return console.log(err);
                }
                res.redirect('/login');
      
            });
            return;
        }
        res.sendStatus(404);
    })
})


app.get('/user-*', (req, res) => {
    
  
    const obj = {
        isLoggedIn: user.isLoggedIn, 
        photos: {

        }
            
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
            obj.bio = resp.rows[0].bio;
        
           
           
            pool.query(`select * from pictures where userid = '${resp.rows[0].id}'`, (err, response) => {
                if (err) {
                   return console.log(err);
                };
                console.log('response.rows is')
             
                for (let i = 0; i < response.rows.length; i++) {
                    obj.photos[i] = response.rows[i].photo;
                };
                // obj.photos = response.rows[1].photo;
              
                
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
    
                        pool.query(`update users set session = $2 where email = $1`, [user.email, value], (err, resp) => {
                            if (err) {
                                console.log(err);
                            };
                            
                        });
                        
                        
                    }  
                    if (obj.person === user.userName) {
                        obj.userMatch = true;
                    }  else {
                        obj.userMatch = false;
                    };
                  
                    return res.render('user-page', {obj});     
                };

                user.isLoggedIn = false;
                user.userName = '';
                user.password = "";
                user.email = '';
                user.id = 0;
                return res.render('user-page', {obj});
            })
            
                           
        });
      
})
//I should do more verification here to make sure your logged in but I figured there's
//already alot of verification on the get part so that mostly is sufficiant. I could
//also just put an update profile button that goes to another page and allows you
//to update from there but I kind of like this. 
app.post('/user-*', (req, res) => {
    //idk if I should make an independant image table. It sounds like all the photos
    //when uploaded together come in an array so if I can just merge arrays across subsequent
    //uploads it should be fine. 
   
    let column;
    let data;
    if (req.body.bio) {
        column = 'bio';
        data = req.body.bio;
        pool.query(`update users set ${column} = $1 where email = $2`, [data, user.email], (err, resp) =>{
            if (err) {
                console.log(err);
                console.log('in query')
                return;
            }
           
            res.send('success');
        });
    } else {
        column = 'photos';
        data = req.body.photos;
        pool.query(`select id from pictures order by id desc limit 1`, (err, resp) => {
            let id = resp.rows[0].id + 1;//if length = 0 then 1 or yada. 
            pool.query(`insert into pictures (id, userid, photo) values ($1, $2, $3) `,
            [id, user.id, data], (err, resp) => {
                if (err) {
                    console.log(err);
                }
                res.send('success');
            })
        }) 

    }
 

})
//this update should probably be a put request. 
app.put('/updatePhoto', (req, res) => {

    pool.query(`update users set photo = $1 where id = $2`, [req.body.data, user.id], (err, resp) => {
        if (err) {
            return console.log(err);
        }
        res.send('success');
    })
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
                user.isLoggedIn = false;
                user.userName = '';
                user.password = "";
                user.email = '';
                user.id = 0;
                return res.render('index', {obj}); 
        });
        
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
    //So i think the reason I couldn't send body data is because I forgot to set
    //the request header type to application/json. it's apperently still not
    //something your supposed to do I guess unless I was reading it wrong and
    //it's something more specific your not supposed to do with sending body
    //in get request. I was thinking though I could maybe send the info itself
    //in the header or as a cookie and I might be able to avoid putting the page
    //number that way. I had another idea beofre I realised that the header was
    //what was making it so I couldn't send the information. I was thinking
    //I could just send in in a query param like normal so forum/yada/:param
    //and then set a variable outside of the routes to whatever was in the 
    //param and then redirect from there to the regular forum/yada and use
    //the info in that variable I had set to work around not putting the page
    //number or any other info in the header.

    const offset = Math.ceil(req.url.slice(req.url.lastIndexOf('_') +3) * 20);
    // const offset = pageRound * 2;
    

    if (req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'camping' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'hiking' ||
    req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'backpacking' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'fish' ||
    req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'mammals' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'reptiles' ||
    req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'trees' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'vegitation' ||
    req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'flowers' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'mushrooms') {

        pool.query(`select title, username, id, count(*) over() as full_count 
        from ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}threads 
        order by time desc limit 20 offset ${offset - 20}`, (err, resp) => {
            obj.pageArray = [];
            // console.log(req.url.slice(req.url.lastIndexOf('_') + 3));
            let threadCount = resp.rows[0].full_count;
            let pageCount = Math.ceil(threadCount/20);
            if (req.url.slice(req.url.lastIndexOf('_') + 3) > 0 && req.url.slice(req.url.lastIndexOf('_') + 3) <= pageCount) {
                // console.log(resp.rows.length);
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

   
    const offset = Math.ceil(req.url.slice(req.url.lastIndexOf('_') +3) * 20);
  
    if (req.url.substring(8, lastSlash).toLowerCase() === 'camping' || req.url.substring(8, lastSlash).toLowerCase() === 'hiking' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'backpacking' || req.url.substring(8, lastSlash).toLowerCase() === 'fish' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'mammals' || req.url.substring(8, lastSlash).toLowerCase() === 'reptiles' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'trees' || req.url.substring(8, lastSlash).toLowerCase() === 'vegitation' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'flowers' || req.url.substring(8, lastSlash).toLowerCase() === 'mushrooms') {
    
    //I should maybe put these in a next route
        if (req.url.substring(lastSlash + 1) === 'Introduce-yourself-0_pg1') {
            res.render('posts', {obj});
            return;       
        };

        if (req.url.substring(lastSlash + 1) === 'New-Thread-0_pg1') {
            //the other method would be to put the if logic back here and then
            //render a different object based on that
            res.render('new-thread', {obj});
            return;
        }

        pool.query(`select users.name, users.photo, ${req.url.substring(8, lastSlash).toLowerCase()}posts.content, 
        ${req.url.substring(8, lastSlash).toLowerCase()}posts.id, count(*) over() as full_count
        from ${req.url.substring(8, lastSlash).toLowerCase()}posts, users 
        where threadid = '${req.url.slice(threadid + 1, req.url.lastIndexOf('_'))}' 
        and ${req.url.substring(8, lastSlash).toLowerCase()}posts.userid = users.id
        order by ${req.url.substring(8, lastSlash).toLowerCase()}posts.id asc
        limit 20 offset ${offset - 20}`, (err, resp) => {
            
            if (err) {
                console.log(err);
                return;
            };
            obj.pageArray = [];
         
            let postCount = resp.rows[0].full_count;
            let pageCount = Math.ceil(postCount/20);
            if (req.url.slice(req.url.lastIndexOf('_') + 3) > 0 && req.url.slice(req.url.lastIndexOf('_') + 3) <= pageCount) {
                obj.pageCount = pageCount;
              
                if (resp.rows.length > 0) {  
                   
                    for (let j = 0; j < pageCount; j++) {
                        obj.pageArray.push(j+1);
                    }

                    for (let i = 0; i < resp.rows.length; i++) {

                        obj.view[i] = {
                            name: resp.rows[i].name,
                            content: resp.rows[i].content,
                            photo: resp.rows[i].photo,
                            id: resp.rows[i].id,
                            match: false
                        }

                        if (obj.view[i].name === user.userName) {
                            obj.view[i].match = true;
                        }

                    }
    
                    res.render('posts', {obj}); 
                    return;        
                };
                res.sendStatus(404);
            }

        });
    }
 
});

app.put('/update-post', (req, res) => {
    console.log(req.body);
    pool.query(`update ${req.body.category}posts set content = $2 where id = $1`, 
    [req.body.id, req.body.content], (err, resp) => {
        console.log(resp.rows);
        if (err) {
            return console.log(err);
        }

        res.send('success');
    });
})

app.post('/forums/([^/]+)/New-Thread-0', (req, res) => {
    
    
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

        pool.query(`select id from ${threadEnd.substring(8, nextLastSlash)}posts order by id desc`, (err, resp) => {
            let id = resp.rows[0].id + 1;
            
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
//list of threads(done). I need to make it so you can update your posts(done but I need
//to make it so you can make paragraphs and tab to indent cause the textarea form
//isn't doing that automatically) and so that
// you can comment on a specific post. I need to make it so you can only change
//the picture and other info on an account if your logged into that account(done,
//I'm holding all the photos as binary data in my database. I can't open the picture
//in a new window but It seems like i'd have to essentially create a url for the
//picture to be able to do that.)
//I need to make a password reset feature and email verification for when you
//register(done). Maybe make it so you can get a code sent to your phone for authentication
//and implement oauth so you can log in with google. I also need to make the search
//bar work so you can search the different threads and things and then try to
//populate my database with a million or so entries just by generating random
//one to three word titles randomly from a list of a few thousand words with all
//different starting letters and things to test the speed of the search feature.
//also should make a direct message system for users