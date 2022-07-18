const express = require("express");
const crypto = require('crypto');
const exphbs = require('express-handlebars');
const nodemailer = require("nodemailer");
const { set } = require("express/lib/application");

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

app.use(express.raw({ limit: "50mb" }));


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



const Pool = require('pg').Pool;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});





console.log(pool.user);
app.get('/', (req, res) => {

    if (!req.headers.cookie) {
        console.log('yada');
        res.setHeader(`Set-Cookie`, `sessionId=''`);   
    }


    let obj = {
        isLoggedIn: false,
        person: false
    }
   
  
    
        pool.query(`select * from users where session = '${req.headers.cookie.slice(10)}'`, (err, resp) => {

            if (err || resp.rows.length !== 1) {
                console.log('auth failed');
                return res.render('index', {obj});
                

            } else {

                    obj.isLoggedIn = true;
                    obj.person = resp.rows[0].name;

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

                              
                 
                    return res.render('index', {obj});     
                };
                            
        })
});


app.get('/login', (req, res) => {

    if (!req.headers.cookie) {
        res.setHeader(`Set-Cookie`, `sessionId=''`);   
    }

    let obj = {
        confirm: false,
        reset: false,
    }

    res.render('login', {obj});
});

 
app.post('/login', (req, res) => {
    
    const {email, password} = req.body;
  
    console.log(email);
    pool.query(`select * from users where email = '${email}'`, (err, resp) => {
        console.log('what');
        console.log(resp.rows.email);
        if (err) {
            return console.log(err);
        }
        if (resp.rows.length === 0) {
            console.log('error');
            res.sendStatus(400);
            return;
        };
        console.log('what2');
        text = password;
        key = resp.rows[0].salt;
  
        var hash = crypto.createHmac('sha512', key);
        hash.update(text);
        var value = hash.digest('hex');

        if (value === resp.rows[0].password) {
            console.log('inside');
            if (!resp.rows[0].verified) {
                res.send('Not verified');
                console.log('inside');
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
            

            if (resp.rows[0].session === null) {
            res.setHeader(`Set-Cookie`, `sessionId=${value}`);
            pool.query(`update users set session = $2 where email = $1`, [email, value], (err, resp) => {
                if (err) {
                    console.log(err);
                };
            });
        } else {
            res.setHeader('Set-Cookie', `sessionId=${resp.rows[0].session}`)
        }

            res.send('success');
            return;
        };
        alert('invalid email or password');
        console.log('invalid');
        res.send('invalid');
        
  
    });
    
});

app.get('/confirm-email', (req, res) => {
    if (!req.headers.cookie) {
        res.setHeader(`Set-Cookie`, `sessionId=''`);   
    }
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
 
        
        if (resp.rows[0].verified && resp.rows.length > 0) {

            const transporter = nodemailer.createTransport ({
                service: 'gmail',
                auth: {
                  user: 'portfolliotemp@gmail.com',

                  pass: 'zvyvrysuzkjqkabf'
                }
              })
            
              const mailOptions = {
                from: 'portfolliotemp@gmail.com',
                to: email,
                subject: `Password reset`,
                html: `Reset your password <a href="https://reflect-forum.herokuapp.com/reset-password?email=${email}&token=${value}">here</a>`,     
              }
            
              transporter.sendMail(mailOptions, (error, info)=> {
                if(error) {
                  console.log(error);
                  res.send('error');
                }else {
                  console.log('email sent');
                }
            });

  
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
    if (!req.headers.cookie) {
        res.setHeader(`Set-Cookie`, `sessionId=''`);   
    }
    let obj = {
        confirm: false,
        reset: true,
    }
    console.log('reset password');
    console.log(obj);
    res.render('login', {obj});
})

app.post('/reset-password', (req, res) => {
    console.log(req.body.password, req.body.password2);

    if (req.body.password === req.body.password2) {
        console.log(req.query.email);
        pool.query(`select verificationtoken, email 
        from users where email = '${req.query.email}'`, (err, resp) => {
            if (err) {
                return console.log(err);
            }
            console.log('password');
            console.log(req.query.token);
            console.log(resp.rows[0].verificationtoken);
            if (req.query.token === resp.rows[0].verificationtoken) {
                console.log('password');
                let randomArray = [];
                console.log('password');

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
                pool.query(`update users set password = $2, verificationtoken = $3, salt = $4 
                where email = $1`, 
                [req.query.email, value, null, key], (err, resp) => {
                    if (err) {
                        return console.log(err);
                    }
                    res.send('success');
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
    if (!req.headers.cookie) {
        res.setHeader(`Set-Cookie`, `sessionId=''`);   
    }
    res.sendFile(__dirname + "/public/register.html");
});


app.post('/register', (req, res) => {
    const {userName, email, password} = req.body;
    console.log(req.body);
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
               

           
              
                const transporter = nodemailer.createTransport ({
                  service: 'gmail',
                  host: 'https://reflect-forum.herokuapp.com',
                  auth: {
                    user: 'portfolliotemp@gmail.com',
                    pass: 'zvyvrysuzkjqkabf'
                    //fourothreepm!
                  }
                })
              
                const mailOptions = {
                  from: 'portfolliotemp@gmail.com',
                  to: email,
                  subject: `Email verification`,
                  html: `Go to the link <a href="https://reflect-forum.herokuapp.com/verify?email=${email}&token=${value2}">here</a> to verify your account`,     
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

    if (!req.headers.cookie) {
        res.setHeader(`Set-Cookie`, `sessionId=''`);   
    };

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
            console.log('already verified');
            return res.redirect('/login');;
        }
  
        if (req.query.token === resp.rows[0].verificationtoken && req.query.email === resp.rows[0].email) {
            console.log('verifying');
            pool.query(`update users set verified = $2, verificationtoken = $3
            where email = $1`, [req.query.email, true, null], (err, response) => {
                if (err) {
                    console.log('in update')
                   return console.log(err);
                }
                console.log('updated');
                return res.redirect('/login');
      
            });
            return;
        }
        res.sendStatus(404);
    })
})


app.get('/user-*', (req, res) => {
    if (!req.headers.cookie) {
        res.setHeader(`Set-Cookie`, `sessionId=''`);   
    }
  
    const obj = {
        isLoggedIn: false, 
        photos: {

        },
        conversation: {

        }
            
    };
 console.log('yada');
    pool.query(`select * from users where name = '${req.url.slice(6)}'`, (err, resp) => {
console.log('yada2')

        if (err || resp.rows.length !== 1) {
            console.log('auth failed');
            user.isLoggedIn = false;
            user.userName = '';
            user.password = '';
            user.email = '';
            res.sendFile(__dirname + "/public/login.html");
            return;
        } 

        if (resp.rows[0].session === req.headers.cookie.slice(10)) {
            obj.isLoggedIn = true;
        };

        obj.person = resp.rows[0].name;
        obj.photo = resp.rows[0].photo;
        obj.bio = resp.rows[0].bio;
    
        
        
        pool.query(`select * from pictures where username = '${req.url.slice(6)}'`, (err, response) => {
            if (err) {
                return console.log(err);
            };
            
            
            for (let i = 0; i < response.rows.length; i++) {
                obj.photos[i] = response.rows[i].photo;
            };



            pool.query(`select *
            from 
            (
                select row_number() over (partition by conversation.conversationid order by posts.id desc) as rn
                , posts.id, conversation.conversationid, posts.convid, conversation.user1name, conversation.user2name,
                conversation.title, conversation.datecreated, posts.username, person.photo
                from conversationposts as posts, conversations as conversation, users as person
                where posts.convid = conversation.conversationid and person.name = conversation.user1name
            ) as t
            where t.user1name = '${req.url.slice(6)}' and t.rn = 1
            or t.user2name = '${req.url.slice(6)}' and t.rn = 1
            order by t.id desc;`,  function (error, response) {
              
                if(error) {
                    return console.log(error);
                }
              
                if(response.rows.length !== 0) {
                    let i = 0;
                    function loop () {
                
                        pool.query(`select username, datecreated as date, count(*) over() as full_count
                        from conversationposts where convid = '${response.rows[i].conversationid}' 
                        order by id desc limit 1`, (erro, resp) => {
                         
                            if (erro) {
                                return console.log(err);
                            }
                       
                            obj.conversation[i] = {
                                id: response.rows[i].conversationid,
                                user1: response.rows[i].user1name,
                                user2: response.rows[i].user2name,
                                date: response.rows[i].datecreated,
                                title: response.rows[i].title,
                                photo: response.rows[i].photo,
                                replies: resp.rows[0].full_count,
                                replyDate: resp.rows[0].date,
                                replyUser: resp.rows[0].username,
                                url: response.rows[i].title.replace(/\s+/g, '+') 
                            }
                   
                            console.log(i);
                            console.log(response.rows.length)
                            if (i < response.rows.length - 1) {
                                i++;
                                loop();
                            } else {
                                i = 0;
                              
                                console.log(i);
                                if (obj.isLoggedIn) {
                              
                                   
                                    obj.userMatch = true;
                                    
                                    
                                    console.log('loggedin');
                                    return res.render('user-page', {obj}); 
                                        
                                } else {
                                console.log('loged out');

                                obj.userMatch = false;
                                return res.render('user-page', {obj}); 
                                } 
                            } 
                        })
                        
                    }
                    loop();
                      
                } else {
                    console.log('else');
                    if (obj.isLoggedIn) {
                        obj.userMatch = true;
                    }  else {
                        obj.userMatch = false;
                    };
                    return res.render('user-page', {obj});
                }
            })

        })
                            
    });
      
})

app.post('/user-*', (req, res) => {

    
   
    let column;
    let data;
    if (req.body.bio) {
        column = 'bio';
        data = req.body.bio;
        pool.query(`update users set ${column} = $1 where session = $2`, [data, req.headers.cookie.slice(10)], (err, resp) =>{
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
            console.log(resp.rows.length);
            let id;
            if (resp.rows.length !== 0) {
                id = resp.rows[0].id + 1;
            } else {
                id = 1;
            };
            
            pool.query(`insert into pictures (id, photo, username) values ($1, $2, $3) `,
            [id, data, req.url.slice(req.url.lastIndexOf('-') + 1)], (err, resp) => {
                if (err) {
                    console.log(err);
                }
                res.send('success');
            })
        }) 

    }
 
})


app.post('/new-conversation', (req, res) => {
    console.log(req.url.slice(req.url.lastIndexOf('-') + 1))
    console.log(req.body);
 //combine this and the below user look up   
    pool.query(`select conversations.conversationid, users.name 
    from conversations, users
    where users.name = '${req.body.user}' order by conversations.conversationid desc limit 1`, (err, resp) => {
        if (err) {
            return console.log(err);
        }
        if (resp.rows[0].name) {
            let date_ob = new Date();

            let date = ("0" + date_ob.getDate()).slice(-2);
        
            let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        
            let year = date_ob.getFullYear();
        

        
            let fullTime = year + "-" + month + "-" + date;
            console.log(resp.rows);
            let conversationId;
            if (resp.rows.length !== 0) {
                conversationId = resp.rows[0].conversationid + 1;
            } else {
                conversationId = 1;
            };
            pool.query (`select name from users where session = '${req.headers.cookie.slice(10)}'`, (er, re) => {
                
                pool.query(`insert into conversations (conversationid, datecreated, title, user2name, user1name)
                values ($1, $2, $3, $4, $5)`, [conversationId, fullTime, req.body.title, req.body.user, re.rows[0].name], (err, response) => {
                    if(err) {
                        return console.log(err);
                    }
                });


                pool.query(`select id from conversationposts order by id desc limit 1`, (error, response) => {
                    if (error) {
                        return console.log(error);
                    }

                    let id;

                    if (response.rows.length !== 0) {
                        id = response.rows[0].id + 1;
                    } else {
                        id = 1;
                    }
                    
                    pool.query(`insert into conversationposts (id, convid, datecreated, content, username)
                    values ($1, $2, $3, $4, $5)`, [id, conversationId, fullTime, req.body.message, re.rows[0].name], (err, resp) => {
                        if (err) {
                            return console.log(err);
                        };
                        return res.send('success');
                    })
                })
            })

        }
    })
})

app.get('/conversation/*', (req, res) => {
    if (!req.headers.cookie) {
        res.setHeader(`Set-Cookie`, `sessionId=''`);   
    }
    let obj = {
        isLoggedIn: false,
        person: '',
        view: {}
    }
console.log(req.url.slice(req.url.lastIndexOf('-') + 1, req.url.lastIndexOf('_')));

    pool.query(`select conversationposts.content, users.photo, users.name, count(*) over() as full_count 
    from conversationposts, users 
    where conversationposts.convid = '${req.url.slice(req.url.lastIndexOf('-') + 1, req.url.lastIndexOf('_'))}'
    and users.name = conversationposts.username
    order by conversationposts.id asc`, (err, resp) => {
        if (err) {
            console.log('error');
            return console.log(err);
        }


        obj.pageArray = [];
     
        let postCount = resp.rows[0].full_count;
        let pageCount = Math.ceil(postCount/20);
        if (req.url.slice(req.url.lastIndexOf('_') + 3) > 0 && req.url.slice(req.url.lastIndexOf('_') + 3) <= pageCount) {
         
            obj.pageTotal = pageCount

            for (let j = 0; j < pageCount; j++) {
                obj.pageArray.push(j+1);
            }
        }
        console.log(obj.pageArray);

        obj.conversationName = req.url.slice(req.url.lastIndexOf('/') +1, req.url.lastIndexOf('-'));
        obj.conversationId = req.url.slice(req.url.lastIndexOf('-') + 1, req.url.lastIndexOf('_'));
        console.log(obj.conversationName, obj.conversationId);
        for (let i = 0; i < resp.rows.length; i++) {
            obj.view[i] = {
                content: resp.rows[i].content,
                photo: resp.rows[i].photo,
                name: resp.rows[i].name
            }
        };
        
 
        pool.query(`select name from users where session = '${req.headers.cookie.slice(10)}'`, (error, response) => {
            if (error) {
                res.render('threads', {obj});
                return;
            } else {
                obj.isLoggedIn = true;
                obj.person = response.rows[0].name;
                res.render('threads', {obj});
                return;
            }
        });
        
    })
})

app.post('/conversation-add', (req, res) => {
    console.log(req.body);

    pool.query(`select id from conversationposts order by id desc limit 1`, (err, resp) => {
       
        if (err) {
            return console.log(err);
        };

        id = resp.rows[0].id + 1;

        let date_ob = new Date();

        let date = ("0" + date_ob.getDate()).slice(-2);
    
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    
        let year = date_ob.getFullYear();
    

    
        let fullTime = year + "-" + month + "-" + date;
        console.log(req.body.id);
        //I could just grab the user name from the drop down and send it over from the front end instead
        //of doing a whole new query to get the username. I might change that and test speeds.  
        pool.query (`select name from users where session = '${req.headers.cookie.slice(10)}'`, (er, re) => {
            pool.query(`insert into conversationposts (id, convid, datecreated, content, username)
            values ($1, $2, $3, $4, $5)`, 
            [id, req.body.id, fullTime, req.body.content, re.rows[0].name], (error, response) => {
                if (error) {
                    return console.log(error);
                }
                console.log('success');
                res.send('success');
            })
        })
    })


})


 
app.put('/updatePhoto', (req, res) => {

    pool.query(`select name from users where session = '${req.headers.cookie.slice(10)}'`, (error, response) => {
        pool.query(`update users set photo = $1 where name = $2`, [req.body.data, response.rows[0].name], (err, resp) => {
            if (err) {
                return console.log(err);
            }
            res.send('success');
        })
    })
});

app.get('/forums/([^/]+)/search-results', (req, res) => {
    if (!req.headers.cookie) {
        res.setHeader(`Set-Cookie`, `sessionId=''`);   
    }
    let obj = {
        isLoggedIn: false,
        person: '',
        view: {

        },
        category: req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase(),
        search: req.query.search,
        isSearch: true
    };
    
    if (req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'camping' || req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'hiking' ||
    req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'backpacking' || req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'fish' ||
    req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'mammals' || req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'reptiles' ||
    req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'trees' || req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'vegitation' ||
    req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'flowers' || req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'mushrooms') {   
        pool.query(`select * from ${req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase()}threads where title like '${req.query.search}%'
        order by title asc`, (err, resp) => {

            if (err) {
                return console.log(err);
            }
            obj.category = req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase();
      

            if (resp.rows.length !== 0) {

                let k = 0;
                let yada;
                function loop1 () {
                  
                    pool.query(`select *, count(*) over() as full_count 
                    from ${req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase()}posts
                    where threadid = ${resp.rows[k].id} order by id desc limit 1`, (error, success) => {
                    obj.view[k] = {
                        thread: resp.rows[k].title,
                        user: resp.rows[k].username,
                        threadReplace: resp.rows[k].title.replace(/\s+/g, '-'),
                        id: resp.rows[k].id,
                        postCount: success.rows[0].full_count,
                        userPost: success.rows[0].username
                        }

                        if (k === resp.rows.length - 1) {
                            k = 0;
                            yada = true;
                        } else {
                            k++;
                            loop1();
                        }

                    })

                }

                loop1();
            
                let wordArray = req.query.search.split(' ');
                let queryLike = `where title like '%${wordArray[0]}%'`
                for (let l = 1; l < wordArray.length; l++) {
                    queryLike = queryLike + `or title like '%${wordArray[l]}%'`;
                }


                pool.query(`select * from ${req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase()}threads ${queryLike}`, (error, response) => {
                    console.log(resp.rows);
                    console.log(response.rows);
                    if (error) {
                        console.log(error);
                    }
                    if (response.rows.length !== 0) {

                            let i  = resp.rows.length;
                            let loopDone = false;
                            console.log(resp.rows.length);
                            console.log(response.rows.length);
                            function loop ()   {
                                
                                   
                                
                                
                           console.log(i);
                       
                                    //
                                    pool.query(`select *, count(*) over() as full_count 
                                    from ${req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase()}posts
                                    where threadid = ${response.rows[i - resp.rows.length].id} order by id desc limit 1`, (error, success) => {
                                        
                
                                        let j = 0;
                                        function innerLoop (){
                                        console.log(j);
                                        console.log(loopDone); 


                                        if (j === resp.rows.length - 1 && obj.view[j].thread !== response.rows[i - resp.rows.length].title) {

                                        obj.view[i] = {
                                            thread: response.rows[i - resp.rows.length].title,
                                            user: response.rows[i - resp.rows.length].username,
                                            threadReplace: response.rows[i - resp.rows.length].title.replace(/\s+/g, '-'),
                                            id: response.rows[i - resp.rows.length].id,
                                            postCount: success.rows[0].full_count,
                                            userPost: success.rows[0].username
                                        } 
                                    
                                    }
                                    if (obj.view[j].thread === response.rows[i - resp.rows.length].title || j === resp.rows.length - 1) {
                                        console.log('j = 0');
                                        j = 0;
                                        if (i !== resp.rows.length + response.rows.length - 1) {
                                            i ++;
                                            loop();
                                        } else {
                                            pool.query(`select name from users where session = '${req.headers.cookie.slice(10)}'`, (error, response) => {
                                                if (error) {
                                                    res.render('threads', {obj});
                                                    return;
                                                } else {
                                                    obj.isLoggedIn = true;
                                                    obj.person = response.rows[0].name;
                                                    res.render('threads', {obj});
                                                    return;
                                                }
                                            });
                                            
                                        }
                                        
                                    } else {
                                        console.log('else j++');
                                        j ++;
                                        innerLoop();
                                    }
                                }
                                innerLoop();
                                })
                              
                          
                        
                        }
                        console.log('loop');
                        function loopWait () {
                            console.log(obj.view[resp.rows.length - 1])
                            if (obj.view[resp.rows.length - 1] !== undefined) {
                                console.log('if loop');
                                loop();
                            } else {
                                console.log('else loop');
                                setTimeout(loopWait, 100);
                            }
                        }
                        loopWait();
                      
                    }               
                })              
            } else {
                
            let wordArray = req.query.search.split(' ');
            let queryLike = `where title like '%${wordArray[0]}%'`
            for (let i = 1; i < wordArray.length; i++) {
                queryLike = queryLike + `or title like '%${wordArray[i]}%'`;
            }
            pool.query(`select * from ${req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase()}threads ${queryLike}`, (error, response) => {
    
                if (error) {
                    console.log(error);
                }

                if (response.rows.length !== 0) {
                
                    for (let i = 0; i < response.rows.length; i++) {
                    
                        pool.query(`select *, count(*) over() as full_count 
                        from ${req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase()}posts
                        where threadid = ${response.rows[i].id} order by id desc limit 1`, (error, success) => {
                        obj.view[i] = {
                            thread: response.rows[i].title,
                            user: response.rows[i].username,
                            threadReplace: response.rows[i].title.replace(/\s+/g, '-'),
                            id: response.rows[i].id,
                            postCount: success.rows[0].full_count,
                            userPost: success.rows[0].username
                        }
                        console.log(obj.view[i]);
                        if (i === response.rows.length -1) {
                            pool.query(`select name from users where session = '${req.headers.cookie.slice(10)}'`, (error, response) => {
                                if (error) {
                                    res.render('threads', {obj});
                                    return;
                                } else {
                                    obj.isLoggedIn = true;
                                    obj.person = response.rows[0].name;
                                    res.render('threads', {obj});
                                    return;
                                }
                            });
                            
                        }
                    })

                }
                  
                } else {
                    obj.view[0] = {
                        thread: 'No results'
                    }
                    
                    pool.query(`select name from users where session = '${req.headers.cookie.slice(10)}'`, (error, response) => {
                        if (error) {
                            res.render('threads', {obj});
                            return;
                        } else {
                            obj.isLoggedIn = true;
                            obj.person = response.rows[0].name;
                            res.render('threads', {obj});
                            return;
                        }
                    });
                }             
            })
        }
        })
    }
})

app.get('/forums', (req, res) => {
    if (!req.headers.cookie) {
        res.setHeader(`Set-Cookie`, `sessionId=''`);   
    }
    let obj = {
        isLoggedIn: false,
        person: '',
        recentthreads: {

        }
    };
    console.log(req.headers.cookie.slice(10));

    
    const threadArray = ['camping', 'hiking', 'backpacking', 'fish', 'mammals', 'reptiles', 'trees', 'vegitation', 'flowers', 'mushrooms'];
    let i = 0;
        function loop() {
                        pool.query(`select ${threadArray[i]}threads.title, ${threadArray[i]}threads.id, ${threadArray[i]}posts.id as postid
                        from ${threadArray[i]}threads, ${threadArray[i]}posts where ${threadArray[i]}threads.id = ${threadArray[i]}posts.threadid order by postid desc limit 1`, (err, resp) =>{
               if (err) {
                   return console.log(err);
               }

               obj.recentthreads[threadArray[i]] = {
                   title: resp.rows[0].title,
                   id: resp.rows[0].id,
                   titleReplace: resp.rows[0].title.replace(/\s+/g, '-')
               }
          
               if (i < threadArray.length - 1)  {
                   i++;
                   loop();
               } else {
              
                  
                   pool.query(`select * from users where session = '${req.headers.cookie.slice(10)}'`, (err, resp) => {
                    console.log('query');
                    if (err || resp.rows.length !== 1) {
                        console.log('error');
                     
                        res.render('forum-home', {obj});
                        return;
                    } else {
                        console.log('set true');
                        obj.isLoggedIn = true;
                        obj.person = resp.rows[0].name;
                        console.log(obj.isLoggedIn);
                        res.render('forum-home', {obj});
                        return;
                    }
            });
                  
               }
           })
   
       }
       loop();


});
 

app.get(`/forums/([^/]+)`, (req, res) => {
    if (!req.headers.cookie) {
        res.setHeader(`Set-Cookie`, `sessionId=''`);   
    }

    obj = {
        isLoggedIn: false,
        person: '',
        view: {},
        category: req.url.substring(8).toLowerCase(),
        pageTotal:"",
        isSearch: false   
    }


    const offset = Math.ceil(req.url.slice(req.url.lastIndexOf('_') +3) * 20);
    // const offset = pageRound * 2;
    

    if (req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'camping' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'hiking' ||
    req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'backpacking' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'fish' ||
    req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'mammals' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'reptiles' ||
    req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'trees' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'vegitation' ||
    req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'flowers' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'mushrooms') {

        pool.query(`select *, count(*) over() as full_count
            from 
            (
                select row_number() over (partition by threads.id order by posts.id desc) as rn,
                threads.id, threads.title, threads.username, posts.threadid, posts.id as postsid
                from ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}threads as threads, ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}posts as posts
                where threads.id = posts.threadid 
            ) as t
			where t.rn = 1
            order by t.postsid desc
            limit 20 offset ${offset - 20}`, (err, resp) =>{
                console.log(resp.rows.length);
            obj.pageArray = [];
  
            let threadCount = resp.rows[0].full_count;
            let pageCount = Math.ceil(threadCount/20);
            if (req.url.slice(req.url.lastIndexOf('_') + 3) > 0 && req.url.slice(req.url.lastIndexOf('_') + 3) <= pageCount) {
         
                obj.pageTotal = pageCount;
                obj.category = req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase();
              
                let add = 4;
                let pageLow;

               
                if (Number(req.url.slice(req.url.lastIndexOf('_')+3)) - 2 < 1) {
                    pageLow = 1;
                } else {
                    pageLow = Number(req.url.slice(req.url.lastIndexOf('_')+3)) - 2;
                }

                if (pageLow + 4 <= pageCount) {
                    pageLow = pageLow
                } else {
                    pageLow = pageCount - 4;
                }


                if (pageCount <= 5) {
                   
                    for (let j = 0; j < pageCount; j++) {
                        obj.pageArray.push(j + 1);
                    }
                } else {
                   
                    for (let j = pageLow; j <= pageLow + add; j++) {
                        obj.pageArray.push(j);
                    }
                }

            let i = 0;
            function queryLoop () {
                console.log(i);
                console.log(resp.rows[i].id);
            pool.query(`select username as postuser, count(*) over() as full_count 
            from ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}posts
            where threadid = ${resp.rows[i].id} order by id desc limit 1`, (error, response) => {
                

                obj.view[i] = {
                    thread: resp.rows[i].title,
                    threadReplace: resp.rows[i].title.replace(/\s+/g, '-'),
                    user: resp.rows[i].username,
                    id: resp.rows[i].id,
                    userPost: response.rows[0].postuser,
                    postCount: response.rows[0].full_count
                }  
            
                
       

                if (i === resp.rows.length - 1 ) {
                    pool.query(`select name from users where session = '${req.headers.cookie.slice(10)}'`, (erro, respo) => {
                        i = 0;
                        if (erro || respo.rows.length === 0) {
                            res.render('threads',  {obj}); 
                            return;
                        } else {
                            obj.isLoggedIn = true;
                            obj.person = respo.rows[0].name;
                            res.render('threads',  {obj});
                            return;
                        }
                    })
                    
                } else {
                    i ++;
                    queryLoop();
                }


                
                
            })
        }
        queryLoop();
            
        

            }
        
        }); 
    } 

});

app.get(`/forums/([^/]+):search`, (req, res) => {
    if (!req.headers.cookie) {
        res.setHeader(`Set-Cookie`, `sessionId=''`);   
    }
    console.log('get');
    let obj = {
        isLoggedIn: false,
        person: '',
        view: {

        }
    };

    
    pool.query(`select * from campingthreads where title like '${req.query.search}%'`, (err, resp) => {
        
        if (err) {
            return console.log(err);
        }

   

        for (let i = 0; i < resp.rows.length; i++) {
            console.log(i);
            obj.view[i] = {
                title: resp.rows[i].title,
                name: resp.rows[i].username,
            }
        }

        res.send(obj);
        
    })
})


app.get('/forums/([^/]+)/([^/]+)', (req, res) => {
    if (!req.headers.cookie) {
        res.setHeader(`Set-Cookie`, `sessionId=''`);   
    }

    
    let obj = {
        isLoggedIn: false,
        person: '',
        view: {},
    }

    let lastSlash = req.url.lastIndexOf('/');
    let threadid = req.url.lastIndexOf('-');
    let title = req.url.substring(lastSlash + 1, threadid).replaceAll('-', ' ');
   
    const offset = Math.ceil(req.url.slice(req.url.lastIndexOf('_') +3) * 20);
    console.log(req.url.substring(8, lastSlash).toLowerCase());
    if (req.url.substring(8, lastSlash).toLowerCase() === 'camping' || req.url.substring(8, lastSlash).toLowerCase() === 'hiking' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'backpacking' || req.url.substring(8, lastSlash).toLowerCase() === 'fish' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'mammals' || req.url.substring(8, lastSlash).toLowerCase() === 'reptiles' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'trees' || req.url.substring(8, lastSlash).toLowerCase() === 'vegitation' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'flowers' || req.url.substring(8, lastSlash).toLowerCase() === 'mushrooms') {
        console.log('first if');
    
   
        if (req.url.substring(lastSlash + 1) === 'Introduce-yourself') {
            pool.query(`select name from users where session = '${req.headers.cookie.slice(10)}'`, (error, response) => {
                if (error) {
                    res.render('threads', {obj});
                    return;
                } else {
                    obj.isLoggedIn = true;
                    obj.person = response.rows[0].name;
                    res.render('threads', {obj});
                    return;
                }
            });      
        };

        if (req.url.substring(lastSlash + 1) === 'new-thread') {

            pool.query(`select name from users where session = '${req.headers.cookie.slice(10)}'`, (error, response) => {
                if (error) {
                    res.render('threads', {obj});
                    return;
                } else {
                    obj.isLoggedIn = true;
                    obj.person = response.rows[0].name;
                    res.render('threads', {obj});
                    return;
                }
            });
          
        }

        pool.query(`select users.name, users.photo, ${req.url.substring(8, lastSlash).toLowerCase()}posts.content, ${req.url.substring(8, lastSlash).toLowerCase()}threads.title,
        ${req.url.substring(8, lastSlash).toLowerCase()}posts.id, count(*) over() as full_count
        from ${req.url.substring(8, lastSlash).toLowerCase()}posts, ${req.url.substring(8, lastSlash).toLowerCase()}threads, users 
        where ${req.url.substring(8, lastSlash).toLowerCase()}posts.threadid = '${req.url.slice(threadid + 1, req.url.lastIndexOf('_'))}' 
        and ${req.url.substring(8, lastSlash).toLowerCase()}posts.username = users.name
        and ${req.url.substring(8, lastSlash).toLowerCase()}threads.title = '${title}'
        order by ${req.url.substring(8, lastSlash).toLowerCase()}posts.id asc
        limit 20 offset ${offset - 20}`, (err, resp) => {
            
            if (err) {
                console.log(err);
                return;
            };
           
            obj.pageArray = [];
            obj.category = req.url.substring(8, lastSlash).toLowerCase();
            obj.threadName = req.url.slice(lastSlash + 1, req.url.lastIndexOf('-'));
            obj.threadId = req.url.slice(threadid + 1, req.url.lastIndexOf('_'));
            console.log(obj.threadName);
            console.log(obj.threadId);
     
        
            let postCount = resp.rows[0].full_count;
            let pageCount = Math.ceil(postCount/20);
            if (req.url.slice(req.url.lastIndexOf('_') + 3) > 0 && req.url.slice(req.url.lastIndexOf('_') + 3) <= pageCount) {
                obj.pageCount = pageCount;
              
                if (resp.rows.length > 0) {  
                   
                    for (let j = 0; j < pageCount; j++) {
                        obj.pageArray.push(j+1);
                    }
                    

    
                    pool.query(`select name from users where session = '${req.headers.cookie.slice(10)}'`, (error, response) => {
                        for (let i = 0; i < resp.rows.length; i++) {
                            console.log(resp.rows[i]);
                            obj.view[i] = {
                                name: resp.rows[i].name,
                                content: resp.rows[i].content,
                                photo: resp.rows[i].photo,
                                id: resp.rows[i].id,
                                match: false
                            }
    
                            if (obj.view[i].name === response.rows[0].name) {
                                obj.view[i].match = true;
                            }

                            if (error && i === resp.rows.length - 1 || response.rows.length === 0 && i === resp.rows.length - 1) {
                                console.log(obj.view);
                                res.render('posts', {obj});
                                return;
                            } else if (i === resp.rows.length -1) {
                                console.log(obj.view);
                                obj.isLoggedIn = true;
                                obj.person = response.rows[0].name;
                                res.render('posts', {obj});
                                return;
                            }
    
                        }
                       

                    });      
                } else {
                    res.sendStatus(404);
                }
               
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

app.post('/forums/([^/]+)/new-thread', (req, res) => {
    
    
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
        
     
        pool.query(`select * from ${req.url.substring(8, lastSlash)}threads order by id desc`, (err, resp) => {
            threadid = resp.rows[0].id + 1;
            pool.query(`select name from users where session = '${req.headers.cooke.slice(10)}'`, (error, response) => {
                pool.query(`insert into ${req.url.substring(8, lastSlash).toLowerCase()}threads (id, title, time, username)
                values ($1, $2, $3, $4)`, [threadid, req.query.thread, fullTime, response.rows[0].name]);
            })

            
        });

        pool.query(`select * from ${req.url.substring(8, lastSlash)}posts order by id desc`, (err, resp) => {
            let id = resp.rows[0].id + 1;
            pool.query(`select name from users where session = '${req.headers.cooke.slice(10)}'`, (error, response) => {
                pool.query(`insert into ${req.url.substring(8, lastSlash).toLowerCase()}posts (id, threadid, content, username) 
                values ($1, $2, $3, $4)`, [id, threadid, req.query.message, response.rows[0].name]);
            })
        })
      
    }

});

app.get('/forums/([^/]+)/([^/]+)/add-a-post', (req, res) => {
    
    if (!req.headers.cookie) {
        res.setHeader(`Set-Cookie`, `sessionId=''`);   
    }
    
    const obj = {
        isLoggedIn: false
    }

    pool.query(`select name from users where session = '${req.headers.cookie.slice(10)}'`, (error, response) => {
        if (error) {
            res.render('threads', {obj});
            return;
        } else {
            obj.isLoggedIn = true;
            obj.person = response.rows[0].name;
            res.render('threads', {obj});
            return;
        }
    });
});

app.post('/forums/([^/]+)/([^/]+)/add-a-post', (req, res) => {
    console.log('1');
    let date_ob = new Date();

    let date = ("0" + date_ob.getDate()).slice(-2);

    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    let year = date_ob.getFullYear();

    let hours = date_ob.getHours();
    
    let minutes = date_ob.getMinutes();

    let seconds = date_ob.getSeconds();

    let fullTime = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;

    let threadEndI = req.url.indexOf('message') - 12;
    let threadEnd = req.url.slice(0, threadEndI);
    
   
    let nextLastSlash = threadEnd.lastIndexOf('/');
 
   
    if (threadEnd.substring(8, nextLastSlash).toLowerCase() === 'camping' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'hiking' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'backpacking' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'fish' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'mammals' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'reptiles' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'trees' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'vegitation' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'flowers' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'mushrooms') {
        console.log('2');
        pool.query(`select id, threadid from ${threadEnd.substring(8, nextLastSlash)}posts order by id desc limit 1`, (err, resp) => {
            let id = resp.rows[0].id + 1;
      
            console.log(resp.rows);
            console.log(req.body);
            pool.query(`select name from users where session = '${req.headers.cookie.slice(10)}'`, (error, response) => {
                pool.query(`insert into ${threadEnd.substring(8, nextLastSlash)}posts (id, threadid, content, username)
                values ($1, $2, $3, $4)`, [id, req.body.threadId, req.query.message, response.rows[0].name], (err, re) => {
                    if (err) {
                        console.log(err);
                    }
                    console.log('insert');
                    res.send('success');


                });
            });
        })
    }
    
})


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});