const express = require("express");
const crypto = require('crypto');
const exphbs = require('express-handlebars');
const nodemailer = require("nodemailer");
const { set } = require("express/lib/application");

const hbs = exphbs.create({
    defaultLayout: false,
    extname: '.handlebars'
});
//apperently using three {{{}}} in handlebars makes it so whatever goes inside it
//recognises html. It doesn't without that. I can't remember if I put three inside the
//layout file. Maybe that's why it didn't seem to be registering anything. if so 
//I could make the nav bar all on just that layout page. 

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

let secret = randomArray.join('');
console.log('test');

const Pool = require('pg').Pool;
const pool = new Pool({
  user: 'yhizmpuqryqnjq',
  host: '54.159.22.90',
  database: 'dcnebe88p7tv3j',
  password: '113f7218eb8e0bf8dba0e6e47d746dab7c53cd48094d64bf12d968922b824f74',
  port: 5432,
});


app.get('/', (req, res) => {
    console.log(req.headers);
    console.log(req.header);
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
        console.log(resp.rows);
        if (err) {
            return console.log(err);
        }
        if (resp.rows.length === 0) {
            console.log('error');
            res.sendStatus(400);
            return;
        };

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
            
            user.userName = resp.rows[0].name;
            user.password = resp.rows[0].password;
            user.email = resp.rows[0].email;
            user.id = resp.rows[0].id;
            user.isLoggedIn = true;

           
            res.setHeader(`Set-Cookie`, `sessionId=${value}`);
            pool.query(`update users set session = $2 where email = $1`, [email, value], (err, resp) => {
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

//when a user deletes his profile will all his posts stay or will he have to delete
//them manually? If so will I just delete part of the useri n the database or will
//a just put a user deleted column and set it to true?
app.get('/user-*', (req, res) => {
    
  
    const obj = {
        isLoggedIn: user.isLoggedIn, 
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


        //I could just put a post count and last messsage info column into conversations
        //if I can't get this to work. just putting it in the inner loop inside
        //an if that only executes on the last iteration worked. Part of the 
        //problem is the second loop. It's just difficult to put that in an 
        //async function or rather async the render in a way that will wait for
        //that. I tried a promise on the inside but it didn't seem to work unless
        //I was doing it wrong. I think it wants to execute the await after the 
        //first iteration at most. and the fact that an async function pool.query
        //is inside of the loop makes it even more complicated I think the promise
        //syntax I was reading for chained things was confusing because he was putting
        //the second change that isn't directly related to your initial promis first
        //for some reason when I did that it wouldn't reocgnise my resolve value of the
        //first promise as a function. It would when it's the first then though.
        //there's a promise all that iterates over an array and returns promises
        //but if I put this and then the render as functions and iterated over them
        //I'd probably end up with the same problem where it resolves before the inner
        //loop is done. So the only way to make that work is by waiting for the inner
        //loop to resolve. 
        //this https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
        //kind of help me understand async await more. it only works on things that resolve
        //to promises. if you take async await off the object will return empty. if you
        //leave it and put the await on top it will wait 2 seconds to log anything and
        //call calling first. it's wierd because i understand that synchronous runs
        //in a line where as a sync doesn't. but they call async non blocking. 
        // but async in this scenario literally blocks the other stuff in the function
        //from running. although in the case of like a pool.query that function itself
        //is asynchronous and other things run after it without it blocking. So it should
        //just be stated more clearly. the async functino itself is non blocking but the
        //thing that the async function is actually waiting on does block everything
        //else inside of that function. this article https://stackoverflow.com/questions/36266378/promise-chain-executing-out-of-order
        //talkes about chaining .thens and how .then(a() => {}).then(b() =>{}) behaves
        //differently fro .then(a() =>{}).then(b()). b will run first in the second case
        //but a runs first in the first case. which is super confusing because preatty
        //much all the stuff you read says that a chained .then will use stuff from 
        //its previous .then. which makes you think it always waites to excecute until
        //after but what it seems like is that it doesn't it will just await the specific
        //thing from the first .then that it is relying on. whats even more confusing is
        //that he actually says it's the other way. which is not at all what it's made
        //to sound like in most places. he says b() passes its return value to a and
        //b() runs imidiatly where as but b() =>{} just passes a function into a()
        //and it's up to a() to decide if or when to excecute..... which is kind
        //of ambigous itself. when would it decide to do one or the other? in any
        //case in this particular example-I really have no way of saying it's always
        //like that- b() will log b first and b() => {} will log a first. in either
        //of those cases the fact that the return value is in iteration over another 
        //asynch function just makes it way more complicated. I might try to make
        //it work again using async functions later. As I understand it now the only
        //way it will work is if somehow the inner loop as a whole resolves to a promise
        //and then the render statement is inside of a function that awaits that promise
        //before it's called. idk how to make the whole loop resolve to a promise though
        //and not to multiple promises. Unless I want to chain [i] number of promises
        //or something before the render statement. both of which seem way more complicated
        //then the solution I have now. I guess I could maybe do the same if statment
        //and put the resolve in the if i === rows.length and then await or .then from there but that
        //doesn't seem to add any value. but with the .then at least if it only waites
        //on the value that it is borrowing from the other .then idk if that would work
        //cause the resolution isn't the obj object which is what the render relies on.
        //so unless it doesn't quite work like that await seems to be what would work
        //cause .then doesn't seem to await things in the same way that people make it 
        //sound like most of the time. they don't neccesarily run one after the other as
        //far as I can tell. even in the b() => situation it seems more nuanced then that
        //idk if there's another way though.
        
        //I managed to get the conversations sorted by most recent post without putting
        //a time stamp or a true false for if first post or if most recent post to narrow
        //down the posts returned so I only got one of each conversationid. I had to rename
        //some of my columns though as the method I used didn't allow me to pick conversations.whwatever
        //and conversationposts.whatever. so I had to rename conversationid in one to convid. 
        //idk if that's good practice or not. It sounds like your definitly not supposed
        //to name two columns with different datatypes the same thing and usually foreign
        //keys don't have the same name as their conterparts in the other tables if i'm remembering
        //right from codecademy. Now I just need to be able to also count the number of posts
        //per conversation in this one query and I'll be able to take the other query out
        //of the loop and only use one. It doesn't matter that much really cause I got it to
        //work regardless but I'm trying to get better at sql. you can count the number of posts
        //returned in total. you can put a count on the very top or inside the sub query and
        //get different results. on the top you count the whole thing cause it's outside
        //of the sub query so it takes into account the where statements and returns six
        //if it's inside the sub query it doesn't so those when it creates the count-or at least
        //this is what appear to happen- and so you get nine which is the 3 other posts
        //with thread id 1 added to the count that I removed after... actually since the
        //postsconvid and conversation conversation id are in the subquery idk if I needed to
        //change the name. I did tha before I figured out how it worked when I was trying
        //to put that where statement on the outside.  
        //i'm also going to need to add the picture in from here from users somewhere
        //so that's going to make it a bit more complicated as well I wasn't thinking that
         
        //realised i might not have needed to rename the id if i would have just 
        //said posts.conversationid as yada
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
                // console.log('yada3');
                if(error) {
                    return console.log(error);
                }
                // console.log
                if(response.rows.length !== 0) {
                    let i = 0;
                    function loop () {
                    // for (let i = 0; i < response.rows.length; i++) {
                        pool.query(`select username, datecreated as date, count(*) over() as full_count
                        from conversationposts where convid = '${response.rows[i].conversationid}' 
                        order by id desc limit 1`, (erro, resp) => {
                            // console.log(i);
                            if (erro) {
                                return console.log(err);
                            }
                            // console.log(response.rows.id);
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
                        // console.log(obj.conversation);
                            console.log(i);
                            console.log(response.rows.length)
                            if (i < response.rows.length - 1) {
                                i++;
                                loop();
                            } else {
                                i = 0;
                              
                                console.log(i);
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
                                    console.log('loggedin');
                                    return res.render('user-page', {obj}); 
                                        
                                } else {
                                console.log('logedout');
                                user.isLoggedIn = false;
                                user.userName = '';
                                user.password = "";
                                user.email = '';
                                user.id = 0;
                                return res.render('user-page', {obj}); 
                                } 
                            } 
                        })
                        
                    }
                    loop();
                      
                } else {
                    console.log('else');
                    if (obj.person === user.userName) {
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
            pool.query(`insert into pictures (id, username, photo) values ($1, $2, $3) `,
            [id, user.userName, data], (err, resp) => {
                if (err) {
                    console.log(err);
                }
                res.send('success');
            })
        }) 

    }
 
})

//I'm tempted to try to make an IM system instead of the DM system here.
app.post('/new-conversation', (req, res) => {
    console.log(req.body);
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
        
            //I'm going to need to put some time stamp somewhere to sort it by most recent post
            //or I could just sort by highest id in the conversationposts table
            // let hours = date_ob.getHours();
            
            // let minutes = date_ob.getMinutes();
        
            // let seconds = date_ob.getSeconds();
        
            let fullTime = year + "-" + month + "-" + date;

            let conversationId = resp.rows[0].conversationid + 1;
            pool.query(`insert into conversations (conversationid, datecreated, title, user2name, user1name)
            values ($1, $2, $3, $4, $5)`, [conversationId, fullTime, req.body.title, req.body.user, user.userName], (err, response) => {
                if(err) {
                    return console.log(err);
                }
            });

            //I'm going to see later if I can maybe combine this select with the initial
            //select to get both id's at the same time. IDK if that will work though. 
            pool.query(`select id from conversationposts order by id desc limit 1`, (error, response) => {
                if (error) {
                    return console.log(error);
                }

                let id = response.rows[0].id + 1;
                pool.query(`insert into conversationposts (id, convid, datecreated, content, username)
                values ($1, $2, $3, $4, $5)`, [id, conversationId, fullTime, req.body.message, user.userName], (err, resp) => {
                    if (err) {
                        return console.log(err);
                    };
                    return res.send('success');
                })
            })

        }
    })
})

app.get('/conversation/*', (req, res) => {

    let obj = {
        person: user.userName
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

        obj = {
            isLoggedIn: user.isLoggedIn,
            view: {

            }

        }

        obj.pageArray = [];
        // console.log(req.url.slice(req.url.lastIndexOf('_') + 3));
        let postCount = resp.rows[0].full_count;
        let pageCount = Math.ceil(postCount/20);
        if (req.url.slice(req.url.lastIndexOf('_') + 3) > 0 && req.url.slice(req.url.lastIndexOf('_') + 3) <= pageCount) {
            // console.log(resp.rows.length);
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
        
        //idk if I want to use the new conversations handlebar I made or if I
        //should just use posts and adjust everything for this cercumstance. 
        res.render('conversations', {obj});
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
    
        //I'm going to need to put some time stamp somewhere to sort it by most recent post
        //or I could just sort by highest id in the conversationposts table
        // let hours = date_ob.getHours();
        
        // let minutes = date_ob.getMinutes();
    
        // let seconds = date_ob.getSeconds();
    
        let fullTime = year + "-" + month + "-" + date;
        console.log(req.body.id);
        pool.query(`insert into conversationposts (id, convid, datecreated, content, username)
        values ($1, $2, $3, $4, $5)`, 
        [id, req.body.id, fullTime, req.body.content, user.userName], (error, response) => {
            if (error) {
                return console.log(error);
            }
            console.log('success');
            res.send('success');
        })
    })


})


//this update should probably be a put request. 
app.put('/updatePhoto', (req, res) => {

    //why does this work like this here but in other places I have to put the id first?
    pool.query(`update users set photo = $1 where name = $2`, [req.body.data, user.userName], (err, resp) => {
        if (err) {
            return console.log(err);
        }
        res.send('success');
    })
});

app.get('/forums/([^/]+)/search-results', (req, res) => {
    
    let obj = {
        isLoggedIn: user.isLoggedIn,
        person: user.userName,
        view: {

        },
        category: req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase()
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
                                
                                    // console.log(obj.view);
                                
                                
                           console.log(i);
                        //     console.log(resp.rows.length + response.rows.length -1);
                            //The if obj.view doesn't complete fast enough before the next if block.

                            // for (let j = 0; j < resp.rows.length; j++) {

                                // console.log('j' + j);      
                                    //It's like it continues looping inside of the query after the loop stops
                                    //It stops logging the above 'j' + j but logs all the stuff inside it for a couple
                                    //iterations. I don't think I've made one with so many if statements inside
                                    //of the query yet. IDK why it's causing so many problems. which makes me think
                                    //that it is because it's not caught up/delaying because it's async but it seems
                                    //to log perfectly fine other than that... wait actually maybe not. it actually is
                                    //loging all three 'j' + j before it logs anything inside. I didn't notice that before
                                    //
                                    pool.query(`select *, count(*) over() as full_count 
                                    from ${req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase()}posts
                                    where threadid = ${response.rows[i - resp.rows.length].id} order by id desc limit 1`, (error, success) => {
                                        
                                        //Putting the j loop inside the query fixed that but the j
                                        //loop is running out of sync from the i loop. It starts the new
                                        //i loop before finishing... I removed the break I remember and
                                        //changed to a return cause I was trying different things.
                                        //that didn't fix it. it logs i3 then j 0 and else 1 cause of 
                                        //a match and then it goes i 4 j 1 like it's still going off 
                                        //the last iteration of j. This only seems to happen on i 4 and
                                        // i 9 as far as I can tell at least most of the time. the route
                                        //sometimes has no value for obj.view[j].thread. this also seems
                                        // to happen on i 4 after a reload of the page. idk if they're related
                                        //... no as far as I can tell they aren't. this happened because it only
                                        // got the very first response from the first query so rows[1] isn't defined
                                        //there's a timing issue there still. setting a recursive functions that
                                        //sets a timeout and recals itself to check if obj.view(resp.rows.length - 1)
                                        //is undefined every 100 miliseconds worked as far as it returning undfined and
                                        //not displaying the page. It still seems to not be iterating through j = 0 on 
                                        //i = 4 but it doesn't seem to be causing any problems. If row[1] of response query
                                        //was equal to resp.rows[0] it would cause a problem though so it's probaly something
                                        //I still want to try to fix.  
                                        // for (let j = 0; j < resp.rows.length; j++) 
                                        //I fixed it. I had to make a recursive innerLoop function of my own. I had
                                        //to make it so the i++ and loop calls weren't inside of either of the if statements
                                        //they had to be with the part that called j++ or set j back to 0. I think this basic
                                        //concept is what was causing the problem with the for loop. In my loop what happens
                                        //-which causes the same output as the for loop- is that I have to put the j++ outside
                                        //of the if statements. but I put the loop() inside the if statements. which made it
                                        //so the next i loop started before the j could ++ or decide what it wanted to do. I was
                                        //setting j back to 0 in the if-which is sort of equivelent to saying break in a way-
                                        //and then it would trigger the if stattement that iterated the j up right after the 
                                        //next I loop started but before the first if statement in the j so j was already 1 by 
                                        //the time it could execute. so the time was just a little it off which is why all
                                        //of the console logs looked like everything was running smoothly. creating my own iterations
                                        //allowed me to see more of what was actually happening and I figure it was the same basic
                                        //thing that was causing the problem in the for loop cause I was getting the same outputs/
                                        //problems. It's working alot better now. the order is slightly wierd
                                        // for two word searches though sometimes. guitar has two threads. one
                                        //by fgvand94 and one by yada yada. saying highest guitar puts one on the
                                        //top like you would think it would and then the other is toward the bottom.
                                        //as well as some other things that seem sort of out of order it's at least
                                        //partially because the first query is only for when both words match. I guess
                                        //in this case though that isn't true for any query. or at least it doesn't seem
                                        //like it should. it doesn't seem to be in pgadmin but everything comes inside of here
                                        //instead of goint to the else when resp.rows.length is 0. I don't think I really
                                        //need that though cause it will do this regardless so if the first one doesn't have
                                        //anything it'll just come here anyway. So I'll probably get rid of that. 
                                        //It's not to bad though. definitly a lot better then what I had at first. I just
                                        //need to try to catch small misspellings now as well. 
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
                                    
                                        // console.log(i);
                                        // console.log(resp.rows.length + response.rows.length -1);
                                    }
                                    if (obj.view[j].thread === response.rows[i - resp.rows.length].title || j === resp.rows.length - 1) {
                                        console.log('j = 0');
                                        j = 0;
                                        if (i !== resp.rows.length + response.rows.length - 1) {
                                            i ++;
                                            loop();
                                        } else {
                                            res.render('threads', {obj});
                                        }
                                        
                                    } else {
                                        console.log('else j++');
                                        j ++;
                                        innerLoop();
                                    }
                                }
                                innerLoop();
                                })
                              
                            // }
                        
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
                        // console.log(i);
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
                            return res.render('threads', {obj});
                        }
                    })

                }
                  
                }                
            })
        }
        })
    }
})

app.get('/forums', (req, res) => {
    console.log('1');

    let obj = {
        isLoggedIn: user.isLoggedIn,
        person: user.userName,
        recentthreads: {

        }
    };
    
    const threadArray = ['camping', 'hiking', 'backpacking', 'fish', 'mammals', 'reptiles', 'trees', 'vegitation', 'flowers', 'mushrooms'];
    
    if (user.isLoggedIn === true) {
        console.log('2');
        pool.query(`select * from users where email = '${user.email}'`, (err, resp) => {

            if (err || resp.rows.length !== 1) {
                console.log('error');
                res.sendFile(__dirname + "/public/login.html");
                return;
            } 
            
            if (resp.rows[0].name === user.userName && resp.rows[0].email === user.email
                && resp.rows[0].password === user.password && resp.rows[0].session === req.headers.cookie.substring(10)) {
                    console.log('loged in is true');
                    let i = 0;
                    function loop() {
                        pool.query(`select ${threadArray[i]}threads.title, ${threadArray[i]}threads.id, ${threadArray[i]}posts.id as postid
                        from ${threadArray[i]}threads, ${threadArray[i]}posts where ${threadArray[i]}threads.id = ${threadArray[i]}posts.threadid order by postid desc limit 1`, (err, resp) =>{
               if (err) {
                   return console.log(err);
               }
               console.log(i);
               console.log(resp.rows);
               // console.log(threadArray[i]);
               obj.recentthreads[threadArray[i]] = {
                   title: resp.rows[0].title,
                   id: resp.rows[0].id,
                   titleReplace: resp.rows[0].title.replace(/\s+/g, '-')
               }
               console.log(obj.recentthreads[threadArray[i]].id);
               if (i < threadArray.length - 1)  {
                   i++;
                   loop();
               } else {
                   // console.log(obj.recentthreads);
                   res.render('forum-home', {obj});
                   return;
               }
           })
   
       }
       loop();
                } else {
                console.log('auth failed');
                user.isLoggedIn = false;
                user.userName = '';
                user.password = "";
                user.email = '';
                user.id = 0;
               let i = 0;
                function loop () {
                    pool.query(`select ${threadArray[i]}threads.title, ${threadArray[i]}threads.id, ${threadArray[i]}posts.id as postid
                     from ${threadArray[i]}threads, ${threadArray[i]}posts, where ${threadArray[i]}threads.id = postid order by postid desc limit 1`, (err, resp) =>{
                        if (err) {
                            return console.log(err);
                        }
                        // console.log(i);
                        // console.log(resp.rows);
                        // console.log(threadArray[i]);
                        obj.recentthreads[threadArray[i]] = {
                            title: resp.rows[0].title,
                            id: resp.rows[0].id,
                            titleReplace: resp.rows[0].title.replace(/\s+/g, '-')
                        }
                        console.log(obj.recentthreads[threadArray[i]]);
                        if (i < threadArray.length - 1) {
                            i++;
                            loop();
                        } else{
                            // console.log(obj.recentthreads);
                            res.render('forum-home', {obj});
                            return;
                        }
                    })
                    
                }
                loop();
                // console.log(obj.recentthreads.backpacking);
            }
        });
        
    } else {
    //for some reason this goes 0 1 6 7 2 3 4 5 8 9. It still works right idk why
    //it's out of order though. I'm thinking maybe cause the pool.query doesn't run
    //synchronously it takes longer to do some queries with more data than others
    // doesn't really matter though. all though I might later think of how to fix
    //it just for fun and future reference.  
    console.log('3');    
    let i = 0;
    function loop() {
        console.log(i);
        console.log(threadArray[i]);
        pool.query(`select ${threadArray[i]}threads.title, ${threadArray[i]}threads.id, ${threadArray[i]}posts.id as postid
                     from ${threadArray[i]}threads, ${threadArray[i]}posts where ${threadArray[i]}threads.id = ${threadArray[i]}posts.threadid order by postid desc limit 1`, (err, resp) =>{
                        console.log('4');
            if (err) {
                return console.log(err);
            }
            console.log(i);
            console.log(resp.rows);
            // console.log(threadArray[i]);
            obj.recentthreads[threadArray[i]] = {
                title: resp.rows[0].title,
                id: resp.rows[0].id,
                titleReplace: resp.rows[0].title.replace(/\s+/g, '-')
            }
            console.log(obj.recentthreads[threadArray[i]].id);
            if (i < threadArray.length - 1)  {
                i++;
                loop();
            } else {
                // console.log(obj.recentthreads);
                res.render('forum-home', {obj});
                return;
            }
        })

    }
    loop();
    // console.log(obj.recentthreads.backpacking);
}
});
 

app.get(`/forums/([^/]+)`, (req, res) => {
    //I got heroku logging the things from inside here. It was giving me an error saying that there was
    //no connection to the given database. I updated the credentials in the pg and now it doesn't say that
    //but it timesout at pool.query. after another minute or so from time out it displays an actual error from
    //inside pool query essentially indicating sometype of time out as well. When I removed the error catch
    //it did essentially the same thing but instead of logging the error it went through the rest of it and
    //said resp.rows not defined in the console log. This usually means that the query isn't working. the
    //words are correct though for the query. And It seems like there is some kind of connection established
    //to the database or at least it can see the database now but it's not quite connecting properly i'm not
    //sure why. I tried logging a hash made by crypto outside of all the routes and the app was crashing
    //before it could even get to the home page. I thought maybe the depencies aren't working and so pg
    //isn't working but handlebars is working fine cause that's how the home page is even displayed so
    //I don't know why that was causing it to crash. yeah it gives a code enotfound and not etimeout when
    //I put in the wrong host so it's definitly finding the host and at least trying to connect it just 
    //keeps timing out.
    // console.log(req.headers);
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
        // for (let i = 22; i <= 50; i++) {
        // pool.query(`insert into campingposts (id, threadid, content, username)
        // values ($1, $2, $3, $4)`, [i, i - 22, 'yada yada', 'fgvand94'], (err, resp) => {
        //     if (err) {
        //         return console.log(err);
        //     }
        //     console.log(i);
        // })
        // }

        // pool.query(`select *, count(rn) over() as full_count
        //     from 
        //     (
        //         select row_number() over (partition by threads.id order by posts.id asc) as rn,
        //         threads.id, posts.threadid, posts.id as postsid, posts.postid
        //         from ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}threads as threads, ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}posts as posts
        //         where threads.id =  posts.threadid 
        //     ) as t
			
        //     order by t.postsid desc
        //     limit 20 offset ${offset - 20}`)
            //this would work if I just in js say where full_count = rn but because I
            //alraedy count before that anything I remove is going to be excluded from
            //the page which means not every page will have 20 results... I was trying
            //to make rn of the last post the highest number. I'll just do it like I was
            //doing with the other one and make it the lowest number and just say where rn
            // = 1. I guess it's simpler that way anyway. 

        // select *
            // from 
            // (
            //     select row_number() over (partition by ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}threads order by ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}posts.id as postsid desc) as rn
            //     *
            //     from ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}threads as threads, ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}posts as posts
            //     where ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}threads.id =  ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}posts.threadid and person.name = conversation.user1name
            // ) as t

            // order by t.id desc;
        // pool.query(`select title, username, id, count(*) over() as full_count 
        // from ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}threads 
        // order by time desc limit 20 offset ${offset - 20}`, (err, resp) => 
        pool.query(`select *, count(*) over() as full_count
            from 
            (
                select row_number() over (partition by threads.id order by posts.id desc) as rn,
                threads.id, threads.title, threads.username, posts.threadid, posts.id as postsid
                from ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}threads as threads, ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}posts as posts
                where threads.id =  posts.threadid 
            ) as t
			where t.rn = 1
            order by t.postsid desc
            limit 20 offset ${offset - 20}`, (err, resp) =>{
            obj.pageArray = [];
            // console.log(req.url.slice(req.url.lastIndexOf('_') + 3));
            let threadCount = resp.rows[0].full_count;
            let pageCount = Math.ceil(threadCount/20);
            if (req.url.slice(req.url.lastIndexOf('_') + 3) > 0 && req.url.slice(req.url.lastIndexOf('_') + 3) <= pageCount) {
                // console.log(resp.rows.length);
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
                // console.log(obj.pageArray);
               
                // for (let i = 0; i < resp.rows.length; i++) {
                    
                //I got this query loop to run properly in order I just had to make
                //my own loop esentialy by recursivly calling the query function. 
                //normal loops with a query inside of them will just loop before the
                //query is finished cause the query is async. But if the mechanism
                //that creates the recursion/next iteration is inside of the query
                //it works the way it's supposed to. One of the other loops might do 
                //this actually do while or one of them idk I know there's one where you
                //can put i++ toward the bottom of the loop. IDK if that is what triggers
                //the iteration though in those loops or not. that's all sort of operating
                //under the hood but I assume it's essentially this type of thing. 

                //I'm going to try to add the above and below queries tomorrow like I was
                //going to before with the conversation I just hadn't tried it yet. 
            let i = 0;
            function queryLoop () {
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
            
                
                // console.log(obj.view[i]);
                // console.log(i);

                if (i === resp.rows.length - 1 ) {
                    res.render('threads',  {obj});
                    i = 0;
                    return;
                } 

                i ++;
                queryLoop();
                
                
            })
        }
        queryLoop();
            
        

            }
        
        }); 
    } 

});

app.get(`/forums/([^/]+):search`, (req, res) => {
    console.log('get');
    let obj = {
        isLoggedIn: user.isLoggedIn,
        person: user.userName,
        view: {

        }
    };
    // console.log(req.url);
    // console.log(req.query);
    
    pool.query(`select * from campingthreads where title like '${req.query.search}%'`, (err, resp) => {
        
        if (err) {
            return console.log(err);
        }

        // console.log(resp.rows);

        for (let i = 0; i < resp.rows.length; i++) {
            console.log(i);
            obj.view[i] = {
                title: resp.rows[i].title,
                name: resp.rows[i].username,
            }
        }

        res.send(obj);
        
        // console.log(obj);
    })
})


app.get('/forums/([^/]+)/([^/]+)', (req, res) => {
    
    let obj = {
        isLoggedIn: user.isLoggedIn,
        person: user.userName,
        view: {},
    }

    let lastSlash = req.url.lastIndexOf('/');
    let threadid = req.url.lastIndexOf('-');
    let title = req.url.substring(lastSlash + 1, threadid).replaceAll('-', ' ');
   
    const offset = Math.ceil(req.url.slice(req.url.lastIndexOf('_') +3) * 20);
  
    if (req.url.substring(8, lastSlash).toLowerCase() === 'camping' || req.url.substring(8, lastSlash).toLowerCase() === 'hiking' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'backpacking' || req.url.substring(8, lastSlash).toLowerCase() === 'fish' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'mammals' || req.url.substring(8, lastSlash).toLowerCase() === 'reptiles' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'trees' || req.url.substring(8, lastSlash).toLowerCase() === 'vegitation' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'flowers' || req.url.substring(8, lastSlash).toLowerCase() === 'mushrooms') {
    
    //I should maybe put these in a next route
        if (req.url.substring(lastSlash + 1) === 'Introduce-yourself') {
            res.render('posts', {obj});
            return;       
        };

        if (req.url.substring(lastSlash + 1) === 'new-thread') {
            //the other method would be to put the if logic back here and then
            //render a different object based on that
            res.render('new-thread', {obj});
            return;
        }


        console.log(req.url.slice(threadid + 1, req.url.lastIndexOf('_')));
        console.log(req.url.substring(8, lastSlash).toLowerCase());
        console.log(title);
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
     
            console.log(resp.rows);
        
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
        let userid;
     
        pool.query(`select * from ${req.url.substring(8, lastSlash)}threads order by id desc`, (err, resp) => {
            threadid = resp.rows[0].id + 1;
           
            pool.query(`insert into ${req.url.substring(8, lastSlash).toLowerCase()}threads (id, title, time, username)
            values ($1, $2, $3, $4)`, [threadid, req.query.thread, fullTime, user.userName]);

            
        });

        pool.query(`select * from ${req.url.substring(8, lastSlash)}posts order by id desc`, (err, resp) => {
            let id = resp.rows[0].id + 1;
            
            pool.query(`insert into ${req.url.substring(8, lastSlash).toLowerCase()}posts (id, threadid, content, username) 
            values ($1, $2, $3, $4)`, [id, threadid, req.query.message, user.userName]);
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
    // let thread = req.url.slice(nextLastSlash + 1, lastSlash);
   
    if (threadEnd.substring(8, nextLastSlash).toLowerCase() === 'camping' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'hiking' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'backpacking' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'fish' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'mammals' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'reptiles' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'trees' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'vegitation' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'flowers' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'mushrooms') {

        pool.query(`select id, threadid from ${threadEnd.substring(8, nextLastSlash)}posts order by id desc limit 1`, (err, resp) => {
            let id = resp.rows[0].id + 1;
            // let threadid = req.url.slice;
            console.log(resp.rows);
            console.log(req.body);
            // console.log(id, threadid, req.query.message, user.userName);
            pool.query(`insert into ${threadEnd.substring(8, nextLastSlash)}posts (id, threadid, content, username)
            values ($1, $2, $3, $4)`, [id, req.body.threadId, req.query.message, user.userName], (err, response) => {
                if (err) {
                    console.log(err);
                }
                console.log('insert');
                pool.query(`update ${threadEnd.substring(8, nextLastSlash)}threads set time = $2 where id = $1`, [req.body.threadId, fullTime])
            });
        })
    }
    
})


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});

//heroku won't load anything but the first page. I was wondering if it was even getting through to my
//server cause I don't see any of my console logs but it loads the first page and the first page at this
//point won't even rendere without going through my server file so that's not the issue. My intial thought
//is that it's just causse I haven't populated all the database tables yet so when it tries to get info
//from the database it won't read anything. it will go to the login page to which doesn't have anything
//to do with the database so I'm thinking it's either because of that or some other issue with the database
//connection in general. I'm going to have to change all the stuff that takes the url to decide what information
//to populate to the heroku web name instead of local host. 


//things to do. I need to make it so you can go to the next page in a thread or a
//list of threads(done). I need to make it so you can update your posts(done but I need
//to make it so you can make paragraphs and tab to indent cause the textarea form
//isn't doing that automatically... it looks like facebook doesn't even
//have tab function and it's preatty crazy cause the text area wasn't really
//designed for it so I'm going to call it good for now. the formatting holds
//on update so it's functional) and so that
// you can comment on a specific post. I need to make it so you can only change
//the picture and other info on an account if your logged into that account(done,
//I'm holding all the photos as binary data in my database. I can't open the picture
//in a new window but It seems like i'd have to essentially create a url for the
//picture to be able to do that.)
//I need to make a password reset feature and email verification for when you
//register(done). Maybe make it so you can get a code sent to your phone for authentication
//and implement oauth so you can log in with google. I also need to make the search
//bar work so you can search the different threads and things(done, it's working on
//each category and has been improved. still could be better but it will take into
//consideration each individual word and will match even if it's not the first word.) and then try to
//populate my database with a million or so entries just by generating random
//one to three word titles randomly from a list of a few thousand words with all
//different starting letters and things to test the speed of the search feature(done
//with 10000 and it's working fine. I'll probably test with a million or so.).
//also should make a direct message system for users(done)

//I need to make sure the page function is working on post and conversation and
//decide if I want to keep them seperate handlebars or if I want to combine them(complete)
//I need to put last post info on all the threads and the most recent or popular 
//thread in forum-home(complete). and I need to make sure the formating is working right
//on the conversation and all the new post/ new threads(complete). I might take away the new
//post entirely and just put a add post at the bottom of the page. I need to add
//functionality for hyperlinking and different things like they do on most forums in a post.
//I need to probably change the text area to a content editable div cause it seems]
// like that's how it's generally done or at least the one that I looked at was like
//that. 
//This stuff with the hyperlinking and different things for adding new posts is about
//the only thing I need to do now. That and I should make it so you can delete your account
//and things which I haven't done. Then escape all my queries and sanatize data and
//stuff.

var yada = `a
aa
aaa
aaron
ab
abandoned
abc
aberdeen
abilities
ability
able
aboriginal
abortion
about
above
abraham
abroad
abs
absence
absent
absolute
absolutely
absorption
abstract
abstracts
abu
abuse
ac
academic
academics
academy
acc
accent
accept
acceptable
acceptance
accepted
accepting
accepts
access
accessed
accessibility
accessible
accessing
accessories
accessory
accident
accidents
accommodate
accommodation
accommodations
accompanied
accompanying
accomplish
accomplished
accordance
according
accordingly
account
accountability
accounting
accounts
accreditation
accredited
accuracy
accurate
accurately
accused
acdbentity
ace
acer
achieve
achieved
achievement
achievements
achieving
acid
acids
acknowledge
acknowledged
acm
acne
acoustic
acquire
acquired
acquisition
acquisitions
acre
acres
acrobat
across
acrylic
act
acting
action
actions
activated
activation
active
actively
activists
activities
activity
actor
actors
actress
acts
actual
actually
acute
ad
ada
adam
adams
adaptation
adapted
adapter
adapters
adaptive
adaptor
add
added
addiction
adding
addition
additional
additionally
additions
address
addressed
addresses
addressing
adds
adelaide
adequate
adidas
adipex
adjacent
adjust
adjustable
adjusted
adjustment
adjustments
admin
administered
administration
administrative
administrator
administrators
admission
admissions
admit
admitted
adobe
adolescent
adopt
adopted
adoption
adrian
ads
adsl
adult
adults
advance
advanced
advancement
advances
advantage
advantages
adventure
adventures
adverse
advert
advertise
advertisement
advertisements
advertiser
advertisers
advertising
advice
advise
advised
advisor
advisors
advisory
advocacy
advocate
adware
ae
aerial
aerospace
af
affair
affairs
affect
affected
affecting
affects
affiliate
affiliated
affiliates
affiliation
afford
affordable
afghanistan
afraid
africa
african
after
afternoon
afterwards
ag
again
against
age
aged
agencies
agency
agenda
agent
agents
ages
aggregate
aggressive
aging
ago
agree
agreed
agreement
agreements
agrees
agricultural
agriculture
ah
ahead
ai
aid
aids
aim
aimed
aims
air
aircraft
airfare
airline
airlines
airplane
airport
airports
aj
ak
aka
al
ala
alabama
alan
alarm
alaska
albania
albany
albert
alberta
album
albums
albuquerque
alcohol
alert
alerts
alex
alexander
alexandria
alfred
algebra
algeria
algorithm
algorithms
ali
alias
alice
alien
align
alignment
alike
alive
all
allah
allan
alleged
allen
allergy
alliance
allied
allocated
allocation
allow
allowance
allowed
allowing
allows
alloy
almost
alone
along
alot
alpha
alphabetical
alpine
already
also
alt
alter
altered
alternate
alternative
alternatively
alternatives
although
alto
aluminium
aluminum
alumni
always
am
amanda
amateur
amazing
amazon
amazoncom
amazoncouk
ambassador
amber
ambien
ambient
amd
amend
amended
amendment
amendments
amenities
america
american
americans
americas
amino
among
amongst
amount
amounts
amp
ampland
amplifier
amsterdam
amy
an
ana
anaheim
anal
analog
analyses
analysis
analyst
analysts
analytical
analyze
analyzed
anatomy
anchor
ancient
and
andale
anderson
andorra
andrea
andreas
andrew
andrews
andy
angel
angela
angeles
angels
anger
angle
angola
angry
animal
animals
animated
animation
anime
ann
anna
anne
annex
annie
anniversary
annotated
annotation
announce
announced
announcement
announcements
announces
annoying
annual
annually
anonymous
another
answer
answered
answering
answers
ant
antarctica
antenna
anthony
anthropology
anti
antibodies
antibody
anticipated
antigua
antique
antiques
antivirus
antonio
anxiety
any
anybody
anymore
anyone
anything
anytime
anyway
anywhere
aol
ap
apache
apart
apartment
apartments
api
apnic
apollo
app
apparatus
apparel
apparent
apparently
appeal
appeals
appear
appearance
appeared
appearing
appears
appendix
apple
appliance
appliances
applicable
applicant
applicants
application
applications
applied
applies
apply
applying
appointed
appointment
appointments
appraisal
appreciate
appreciated
appreciation
approach
approaches
appropriate
appropriations
approval
approve
approved
approx
approximate
approximately
apps
apr
april
apt
aqua
aquarium
aquatic
ar
arab
arabia
arabic
arbitrary
arbitration
arc
arcade
arch
architect
architects
architectural
architecture
archive
archived
archives
arctic
are
area
areas
arena
arg
argentina
argue
argued
argument
arguments
arise
arising
arizona
arkansas
arlington
arm
armed
armenia
armor
arms
armstrong
army
arnold
around
arrange
arranged
arrangement
arrangements
array
arrest
arrested
arrival
arrivals
arrive
arrived
arrives
arrow
art
arthritis
arthur
article
articles
artificial
artist
artistic
artists
arts
artwork
aruba
as
asbestos
ascii
ash
ashley
asia
asian
aside
asin
ask
asked
asking
asks
asn
asp
aspect
aspects
aspnet
ass
assault
assembled
assembly
assess
assessed
assessing
assessment
assessments
asset
assets
assign
assigned
assignment
assignments
assist
assistance
assistant
assisted
assists
associate
associated
associates
association
associations
assume
assumed
assumes
assuming
assumption
assumptions
assurance
assure
assured
asthma
astrology
astronomy
asus
at
ata
ate
athens
athletes
athletic
athletics
ati
atlanta
atlantic
atlas
atm
atmosphere
atmospheric
atom
atomic
attach
attached
attachment
attachments
attack
attacked
attacks
attempt
attempted
attempting
attempts
attend
attendance
attended
attending
attention
attitude
attitudes
attorney
attorneys
attract
attraction
attractions
attractive
attribute
attributes
au
auburn
auckland
auction
auctions
aud
audi
audience
audio
audit
auditor
aug
august
aurora
aus
austin
australia
australian
austria
authentic
authentication
author
authorities
authority
authorization
authorized
authors
auto
automated
automatic
automatically
automation
automobile
automobiles
automotive
autos
autumn
av
availability
available
avatar
ave
avenue
average
avg
avi
aviation
avoid
avoiding
avon
aw
award
awarded
awards
aware
awareness
away
awesome
awful
axis
aye
az
azerbaijan
b
ba
babe
babes
babies
baby
bachelor
back
backed
background
backgrounds
backing
backup
bacon
bacteria
bacterial
bad
badge
badly
bag
baghdad
bags
bahamas
bahrain
bailey
baker
baking
balance
balanced
bald
bali
ball
ballet
balloon
ballot
balls
baltimore
ban
banana
band
bands
bandwidth
bang
bangbus
bangkok
bangladesh
bank
banking
bankruptcy
banks
banned
banner
banners
baptist
bar
barbados
barbara
barbie
barcelona
bare
barely
bargain
bargains
barn
barnes
barrel
barrier
barriers
barry
bars
base
baseball
based
baseline
basement
basename
bases
basic
basically
basics
basin
basis
basket
basketball
baskets
bass
bat
batch
bath
bathroom
bathrooms
baths
batman
batteries
battery
battle
battlefield
bay
bb
bbc
bbs
bbw
bc
bd
bdsm
be
beach
beaches
beads
beam
bean
beans
bear
bearing
bears
beast
beastality
beastiality
beat
beatles
beats
beautiful
beautifully
beauty
beaver
became
because
become
becomes
becoming
bed
bedding
bedford
bedroom
bedrooms
beds
bee
beef
been
beer
before
began
begin
beginner
beginners
beginning
begins
begun
behalf
behavior
behavioral
behaviour
behind
beijing
being
beings
belarus
belfast
belgium
belief
beliefs
believe
believed
believes
belize
belkin
bell
belle
belly
belong
belongs
below
belt
belts
ben
bench
benchmark
bend
beneath
beneficial
benefit
benefits
benjamin
bennett
benz
berkeley
berlin
bermuda
bernard
berry
beside
besides
best
bestiality
bestsellers
bet
beta
beth
better
betting
betty
between
beverage
beverages
beverly
beyond
bg
bhutan
bi
bias
bible
biblical
bibliographic
bibliography
bicycle
bid
bidder
bidding
bids
big
bigger
biggest
bike
bikes
bikini
bill
billing
billion
bills
billy
bin
binary
bind
binding
bingo
bio
biodiversity
biographies
biography
biol
biological
biology
bios
biotechnology
bird
birds
birmingham
birth
birthday
bishop
bit
bitch
bite
bits
biz
bizarre
bizrate
bk
bl
black
blackberry
blackjack
blacks
blade
blades
blah
blair
blake
blame
blank
blanket
blast
bleeding
blend
bless
blessed
blind
blink
block
blocked
blocking
blocks
blog
blogger
bloggers
blogging
blogs
blond
blonde
blood
bloody
bloom
bloomberg
blow
blowing
blowjob
blowjobs
blue
blues
bluetooth
blvd
bm
bmw
bo
board
boards
boat
boating
boats
bob
bobby
boc
bodies
body
bold
bolivia
bolt
bomb
bon
bond
bondage
bonds
bone
bones
bonus
boob
boobs
book
booking
bookings
bookmark
bookmarks
books
bookstore
bool
boolean
boom
boost
boot
booth
boots
booty
border
borders
bored
boring
born
borough
bosnia
boss
boston
both
bother
botswana
bottle
bottles
bottom
bought
boulder
boulevard
bound
boundaries
boundary
bouquet
boutique
bow
bowl
bowling
box
boxed
boxes
boxing
boy
boys
bp
br
bra
bracelet
bracelets
bracket
brad
bradford
bradley
brain
brake
brakes
branch
branches
brand
brandon
brands
bras
brass
brave
brazil
brazilian
breach
bread
break
breakdown
breakfast
breaking
breaks
breast
breasts
breath
breathing
breed
breeding
breeds
brian
brick
bridal
bride
bridge
bridges
brief
briefing
briefly
briefs
bright
brighton
brilliant
bring
bringing
brings
brisbane
bristol
britain
britannica
british
britney
broad
broadband
broadcast
broadcasting
broader
broadway
brochure
brochures
broke
broken
broker
brokers
bronze
brook
brooklyn
brooks
bros
brother
brothers
brought
brown
browse
browser
browsers
browsing
bruce
brunei
brunette
brunswick
brush
brussels
brutal
bryan
bryant
bs
bt
bubble
buck
bucks
budapest
buddy
budget
budgets
buf
buffalo
buffer
bufing
bug
bugs
build
builder
builders
building
buildings
builds
built
bukkake
bulgaria
bulgarian
bulk
bull
bullet
bulletin
bumper
bunch
bundle
bunny
burden
bureau
buried
burke
burlington
burn
burner
burning
burns
burst
burton
bus
buses
bush
business
businesses
busty
busy
but
butler
butt
butter
butterfly
button
buttons
butts
buy
buyer
buyers
buying
buys
buzz
bw
by
bye
byte
bytes
c
ca
cab
cabin
cabinet
cabinets
cable
cables
cache
cached
cad
cadillac
cafe
cage
cake
cakes
cal
calcium
calculate
calculated
calculation
calculations
calculator
calculators
calendar
calendars
calgary
calibration
calif
california
call
called
calling
calls
calm
calvin
cam
cambodia
cambridge
camcorder
camcorders
came
camel
camera
cameras
cameron
cameroon
camp
campaign
campaigns
campbell
camping
camps
campus
cams
can
canada
canadian
canal
canberra
cancel
cancellation
cancelled
cancer
candidate
candidates
candle
candles
candy
cannon
canon
cant
canvas
canyon
cap
capabilities
capability
capable
capacity
cape
capital
capitol
caps
captain
capture
captured
car
carb
carbon
card
cardiac
cardiff
cardiovascular
cards
care
career
careers
careful
carefully
carey
cargo
caribbean
caring
carl
carlo
carlos
carmen
carnival
carol
carolina
caroline
carpet
carried
carrier
carriers
carries
carroll
carry
carrying
cars
cart
carter
cartoon
cartoons
cartridge
cartridges
cas
casa
case
cases
casey
cash
cashiers
casino
casinos
casio
cassette
cast
casting
castle
casual
cat
catalog
catalogs
catalogue
catalyst
catch
categories
category
catering
cathedral
catherine
catholic
cats
cattle
caught
cause
caused
causes
causing
caution
cave
cayman
cb
cbs
cc
ccd
cd
cdna
cds
cdt
ce
cedar
ceiling
celebrate
celebration
celebrities
celebrity
celebs
cell
cells
cellular
celtic
cement
cemetery
census
cent
center
centered
centers
central
centre
centres
cents
centuries
century
ceo
ceramic
ceremony
certain
certainly
certificate
certificates
certification
certified
cest
cet
cf
cfr
cg
cgi
ch
chad
chain
chains
chair
chairman
chairs
challenge
challenged
challenges
challenging
chamber
chambers
champagne
champion
champions
championship
championships
chan
chance
chancellor
chances
change
changed
changelog
changes
changing
channel
channels
chaos
chapel
chapter
chapters
char
character
characteristic
characteristics
characterization
characterized
characters
charge
charged
charger
chargers
charges
charging
charitable
charity
charles
charleston
charlie
charlotte
charm
charming
charms
chart
charter
charts
chase
chassis
chat
cheap
cheaper
cheapest
cheat
cheats
check
checked
checking
checklist
checkout
checks
cheers
cheese
chef
chelsea
chem
chemical
chemicals
chemistry
chen
cheque
cherry
chess
chest
chester
chevrolet
chevy
chi
chicago
chick
chicken
chicks
chief
child
childhood
children
childrens
chile
china
chinese
chip
chips
cho
chocolate
choice
choices
choir
cholesterol
choose
choosing
chorus
chose
chosen
chris
christ
christian
christianity
christians
christina
christine
christmas
christopher
chrome
chronic
chronicle
chronicles
chrysler
chubby
chuck
church
churches
ci
cia
cialis
ciao
cigarette
cigarettes
cincinnati
cindy
cinema
cingular
cio
cir
circle
circles
circuit
circuits
circular
circulation
circumstances
circus
cisco
citation
citations
cite
cited
cities
citizen
citizens
citizenship
city
citysearch
civic
civil
civilian
civilization
cj
cl
claim
claimed
claims
claire
clan
clara
clarity
clark
clarke
class
classes
classic
classical
classics
classification
classified
classifieds
classroom
clause
clay
clean
cleaner
cleaners
cleaning
cleanup
clear
clearance
cleared
clearing
clearly
clerk
cleveland
click
clicking
clicks
client
clients
cliff
climate
climb
climbing
clinic
clinical
clinics
clinton
clip
clips
clock
clocks
clone
close
closed
closely
closer
closes
closest
closing
closure
cloth
clothes
clothing
cloud
clouds
cloudy
club
clubs
cluster
clusters
cm
cms
cn
cnet
cnetcom
cnn
co
coach
coaches
coaching
coal
coalition
coast
coastal
coat
coated
coating
cock
cocks
cod
code
codes
coding
coffee
cognitive
cohen
coin
coins
col
cold
cole
coleman
colin
collaboration
collaborative
collapse
collar
colleague
colleagues
collect
collectables
collected
collectible
collectibles
collecting
collection
collections
collective
collector
collectors
college
colleges
collins
cologne
colombia
colon
colonial
colony
color
colorado
colored
colors
colour
colours
columbia
columbus
column
columnists
columns
com
combat
combination
combinations
combine
combined
combines
combining
combo
come
comedy
comes
comfort
comfortable
comic
comics
coming
comm
command
commander
commands
comment
commentary
commented
comments
commerce
commercial
commission
commissioner
commissioners
commissions
commit
commitment
commitments
committed
committee
committees
commodities
commodity
common
commonly
commons
commonwealth
communicate
communication
communications
communist
communities
community
comp
compact
companies
companion
company
compaq
comparable
comparative
compare
compared
comparing
comparison
comparisons
compatibility
compatible
compensation
compete
competent
competing
competition
competitions
competitive
competitors
compilation
compile
compiled
compiler
complaint
complaints
complement
complete
completed
completely
completing
completion
complex
complexity
compliance
compliant
complicated
complications
complimentary
comply
component
components
composed
composer
composite
composition
compound
compounds
comprehensive
compressed
compression
compromise
computation
computational
compute
computed
computer
computers
computing
con
concentrate
concentration
concentrations
concept
concepts
conceptual
concern
concerned
concerning
concerns
concert
concerts
conclude
concluded
conclusion
conclusions
concord
concrete
condition
conditional
conditioning
conditions
condo
condos
conduct
conducted
conducting
conf
conference
conferences
conferencing
confidence
confident
confidential
confidentiality
config
configuration
configure
configured
configuring
confirm
confirmation
confirmed
conflict
conflicts
confused
confusion
congo
congratulations
congress
congressional
conjunction
connect
connected
connecticut
connecting
connection
connections
connectivity
connector
connectors
cons
conscious
consciousness
consecutive
consensus
consent
consequence
consequences
consequently
conservation
conservative
consider
considerable
consideration
considerations
considered
considering
considers
consist
consistency
consistent
consistently
consisting
consists
console
consoles
consolidated
consolidation
consortium
conspiracy
const
constant
constantly
constitute
constitutes
constitution
constitutional
constraint
constraints
construct
constructed
construction
consult
consultancy
consultant
consultants
consultation
consulting
consumer
consumers
consumption
contact
contacted
contacting
contacts
contain
contained
container
containers
containing
contains
contamination
contemporary
content
contents
contest
contests
context
continent
continental
continually
continue
continued
continues
continuing
continuity
continuous
continuously
contract
contracting
contractor
contractors
contracts
contrary
contrast
contribute
contributed
contributing
contribution
contributions
contributor
contributors
control
controlled
controller
controllers
controlling
controls
controversial
controversy
convenience
convenient
convention
conventional
conventions
convergence
conversation
conversations
conversion
convert
converted
converter
convertible
convicted
conviction
convinced
cook
cookbook
cooked
cookie
cookies
cooking
cool
cooler
cooling
cooper
cooperation
cooperative
coordinate
coordinated
coordinates
coordination
coordinator
cop
cope
copied
copies
copper
copy
copying
copyright
copyrighted
copyrights
coral
cord
cordless
core
cork
corn
cornell
corner
corners
cornwall
corp
corporate
corporation
corporations
corps
corpus
correct
corrected
correction
corrections
correctly
correlation
correspondence
corresponding
corruption
cos
cosmetic
cosmetics
cost
costa
costs
costume
costumes
cottage
cottages
cotton
could
council
councils
counsel
counseling
count
counted
counter
counters
counties
counting
countries
country
counts
county
couple
coupled
couples
coupon
coupons
courage
courier
course
courses
court
courtesy
courts
cove
cover
coverage
covered
covering
covers
cow
cowboy
cox
cp
cpu
cr
crack
cradle
craft
crafts
craig
crap
craps
crash
crawford
crazy
cream
create
created
creates
creating
creation
creations
creative
creativity
creator
creature
creatures
credit
credits
creek
crest
crew
cricket
crime
crimes
criminal
crisis
criteria
criterion
critical
criticism
critics
crm
croatia
crop
crops
cross
crossing
crossword
crowd
crown
crucial
crude
cruise
cruises
cruz
cry
crystal
cs
css
cst
ct
cu
cuba
cube
cubic
cuisine
cult
cultural
culture
cultures
cum
cumshot
cumshots
cumulative
cunt
cup
cups
cure
curious
currencies
currency
current
currently
curriculum
cursor
curtis
curve
curves
custody
custom
customer
customers
customise
customize
customized
customs
cut
cute
cuts
cutting
cv
cvs
cw
cyber
cycle
cycles
cycling
cylinder
cyprus
cz
czech
d
da
dad
daddy
daily
dairy
daisy
dakota
dale
dallas
dam
damage
damaged
damages
dame
damn
dan
dana
dance
dancing
danger
dangerous
daniel
danish
danny
dans
dare
dark
darkness
darwin
das
dash
dat
data
database
databases
date
dated
dates
dating
daughter
daughters
dave
david
davidson
davis
dawn
day
days
dayton
db
dc
dd
ddr
de
dead
deadline
deadly
deaf
deal
dealer
dealers
dealing
deals
dealt
dealtime
dean
dear
death
deaths
debate
debian
deborah
debt
debug
debut
dec
decade
decades
december
decent
decide
decided
decimal
decision
decisions
deck
declaration
declare
declared
decline
declined
decor
decorating
decorative
decrease
decreased
dedicated
dee
deemed
deep
deeper
deeply
deer
def
default
defeat
defects
defence
defend
defendant
defense
defensive
deferred
deficit
define
defined
defines
defining
definitely
definition
definitions
degree
degrees
del
delaware
delay
delayed
delays
delegation
delete
deleted
delhi
delicious
delight
deliver
delivered
delivering
delivers
delivery
dell
delta
deluxe
dem
demand
demanding
demands
demo
democracy
democrat
democratic
democrats
demographic
demonstrate
demonstrated
demonstrates
demonstration
den
denial
denied
denmark
dennis
dense
density
dental
dentists
denver
deny
department
departmental
departments
departure
depend
dependence
dependent
depending
depends
deployment
deposit
deposits
depot
depression
dept
depth
deputy
der
derby
derek
derived
des
descending
describe
described
describes
describing
description
descriptions
desert
deserve
design
designated
designation
designed
designer
designers
designing
designs
desirable
desire
desired
desk
desktop
desktops
desperate
despite
destination
destinations
destiny
destroy
destroyed
destruction
detail
detailed
details
detect
detected
detection
detective
detector
determination
determine
determined
determines
determining
detroit
deutsch
deutsche
deutschland
dev
devel
develop
developed
developer
developers
developing
development
developmental
developments
develops
deviant
deviation
device
devices
devil
devon
devoted
df
dg
dh
di
diabetes
diagnosis
diagnostic
diagram
dial
dialog
dialogue
diameter
diamond
diamonds
diana
diane
diary
dice
dick
dicke
dicks
dictionaries
dictionary
did
die
died
diego
dies
diesel
diet
dietary
diff
differ
difference
differences
different
differential
differently
difficult
difficulties
difficulty
diffs
dig
digest
digit
digital
dildo
dildos
dim
dimension
dimensional
dimensions
dining
dinner
dip
diploma
dir
direct
directed
direction
directions
directive
directly
director
directories
directors
directory
dirt
dirty
dis
disabilities
disability
disable
disabled
disagree
disappointed
disaster
disc
discharge
disciplinary
discipline
disciplines
disclaimer
disclaimers
disclose
disclosure
disco
discount
discounted
discounts
discover
discovered
discovery
discrete
discretion
discrimination
discs
discuss
discussed
discusses
discussing
discussion
discussions
disease
diseases
dish
dishes
disk
disks
disney
disorder
disorders
dispatch
dispatched
display
displayed
displaying
displays
disposal
disposition
dispute
disputes
dist
distance
distances
distant
distinct
distinction
distinguished
distribute
distributed
distribution
distributions
distributor
distributors
district
districts
disturbed
div
dive
diverse
diversity
divide
divided
dividend
divine
diving
division
divisions
divorce
divx
diy
dj
dk
dl
dm
dna
dns
do
doc
dock
docs
doctor
doctors
doctrine
document
documentary
documentation
documentcreatetextnode
documented
documents
dod
dodge
doe
does
dog
dogs
doing
doll
dollar
dollars
dolls
dom
domain
domains
dome
domestic
dominant
dominican
don
donald
donate
donated
donation
donations
done
donna
donor
donors
dont
doom
door
doors
dos
dosage
dose
dot
double
doubt
doug
douglas
dover
dow
down
download
downloadable
downloadcom
downloaded
downloading
downloads
downtown
dozen
dozens
dp
dpi
dr
draft
drag
dragon
drain
drainage
drama
dramatic
dramatically
draw
drawing
drawings
drawn
draws
dream
dreams
dress
dressed
dresses
dressing
drew
dried
drill
drilling
drink
drinking
drinks
drive
driven
driver
drivers
drives
driving
drop
dropped
drops
drove
drug
drugs
drum
drums
drunk
dry
dryer
ds
dsc
dsl
dt
dts
du
dual
dubai
dublin
duck
dude
due
dui
duke
dumb
dump
duncan
duo
duplicate
durable
duration
durham
during
dust
dutch
duties
duty
dv
dvd
dvds
dx
dying
dylan
dynamic
dynamics
e
ea
each
eagle
eagles
ear
earl
earlier
earliest
early
earn
earned
earning
earnings
earrings
ears
earth
earthquake
ease
easier
easily
east
easter
eastern
easy
eat
eating
eau
ebay
ebony
ebook
ebooks
ec
echo
eclipse
eco
ecological
ecology
ecommerce
economic
economics
economies
economy
ecuador
ed
eddie
eden
edgar
edge
edges
edinburgh
edit
edited
editing
edition
editions
editor
editorial
editorials
editors
edmonton
eds
edt
educated
education
educational
educators
edward
edwards
ee
ef
effect
effective
effectively
effectiveness
effects
efficiency
efficient
efficiently
effort
efforts
eg
egg
eggs
egypt
egyptian
eh
eight
either
ejaculation
el
elder
elderly
elect
elected
election
elections
electoral
electric
electrical
electricity
electro
electron
electronic
electronics
elegant
element
elementary
elements
elephant
elevation
eleven
eligibility
eligible
eliminate
elimination
elite
elizabeth
ellen
elliott
ellis
else
elsewhere
elvis
em
emacs
email
emails
embassy
embedded
emerald
emergency
emerging
emily
eminem
emirates
emission
emissions
emma
emotional
emotions
emperor
emphasis
empire
empirical
employ
employed
employee
employees
employer
employers
employment
empty
en
enable
enabled
enables
enabling
enb
enclosed
enclosure
encoding
encounter
encountered
encourage
encouraged
encourages
encouraging
encryption
encyclopedia
end
endangered
ended
endif
ending
endless
endorsed
endorsement
ends
enemies
enemy
energy
enforcement
eng
engage
engaged
engagement
engaging
engine
engineer
engineering
engineers
engines
england
english
enhance
enhanced
enhancement
enhancements
enhancing
enjoy
enjoyed
enjoying
enlarge
enlargement
enormous
enough
enquiries
enquiry
enrolled
enrollment
ensemble
ensure
ensures
ensuring
ent
enter
entered
entering
enterprise
enterprises
enters
entertaining
entertainment
entire
entirely
entities
entitled
entity
entrance
entrepreneur
entrepreneurs
entries
entry
envelope
environment
environmental
environments
enzyme
eos
ep
epa
epic
epinions
epinionscom
episode
episodes
epson
eq
equal
equality
equally
equation
equations
equilibrium
equipment
equipped
equity
equivalent
er
era
eric
ericsson
erik
erotic
erotica
erp
error
errors
es
escape
escort
escorts
especially
espn
essay
essays
essence
essential
essentially
essentials
essex
est
establish
established
establishing
establishment
estate
estates
estimate
estimated
estimates
estimation
estonia
et
etc
eternal
ethernet
ethical
ethics
ethiopia
ethnic
eu
eugene
eur
euro
europe
european
euros
ev
eva
eval
evaluate
evaluated
evaluating
evaluation
evaluations
evanescence
evans
eve
even
evening
event
events
eventually
ever
every
everybody
everyday
everyone
everything
everywhere
evidence
evident
evil
evolution
ex
exact
exactly
exam
examination
examinations
examine
examined
examines
examining
example
examples
exams
exceed
excel
excellence
excellent
except
exception
exceptional
exceptions
excerpt
excess
excessive
exchange
exchanges
excited
excitement
exciting
exclude
excluded
excluding
exclusion
exclusive
exclusively
excuse
exec
execute
executed
execution
executive
executives
exempt
exemption
exercise
exercises
exhaust
exhibit
exhibition
exhibitions
exhibits
exist
existed
existence
existing
exists
exit
exotic
exp
expand
expanded
expanding
expansion
expansys
expect
expectations
expected
expects
expedia
expenditure
expenditures
expense
expenses
expensive
experience
experienced
experiences
experiencing
experiment
experimental
experiments
expert
expertise
experts
expiration
expired
expires
explain
explained
explaining
explains
explanation
explicit
explicitly
exploration
explore
explorer
exploring
explosion
expo
export
exports
exposed
exposure
express
expressed
expression
expressions
ext
extend
extended
extending
extends
extension
extensions
extensive
extent
exterior
external
extra
extract
extraction
extraordinary
extras
extreme
extremely
eye
eyed
eyes
ez
f
fa
fabric
fabrics
fabulous
face
faced
faces
facial
facilitate
facilities
facility
facing
fact
factor
factors
factory
facts
faculty
fail
failed
failing
fails
failure
failures
fair
fairfield
fairly
fairy
faith
fake
fall
fallen
falling
falls
false
fame
familiar
families
family
famous
fan
fancy
fans
fantastic
fantasy
faq
faqs
far
fare
fares
farm
farmer
farmers
farming
farms
fascinating
fashion
fast
faster
fastest
fat
fatal
fate
father
fathers
fatty
fault
favor
favorite
favorites
favors
favour
favourite
favourites
fax
fbi
fc
fcc
fd
fda
fe
fear
fears
feat
feature
featured
features
featuring
feb
february
fed
federal
federation
fee
feed
feedback
feeding
feeds
feel
feeling
feelings
feels
fees
feet
fell
fellow
fellowship
felt
female
females
fence
feof
ferrari
ferry
festival
festivals
fetish
fever
few
fewer
ff
fg
fi
fiber
fibre
fiction
field
fields
fifteen
fifth
fifty
fig
fight
fighter
fighters
fighting
figure
figured
figures
fiji
file
filed
filename
files
filing
fill
filled
filling
film
filme
films
filter
filtering
filters
fin
final
finally
finals
finance
finances
financial
financing
find
findarticles
finder
finding
findings
findlaw
finds
fine
finest
finger
fingering
fingers
finish
finished
finishing
finite
finland
finnish
fioricet
fire
fired
firefox
fireplace
fires
firewall
firewire
firm
firms
firmware
first
fiscal
fish
fisher
fisheries
fishing
fist
fisting
fit
fitness
fits
fitted
fitting
five
fix
fixed
fixes
fixtures
fl
fla
flag
flags
flame
flash
flashers
flashing
flat
flavor
fleece
fleet
flesh
flex
flexibility
flexible
flickr
flight
flights
flip
float
floating
flood
floor
flooring
floors
floppy
floral
florence
florida
florist
florists
flour
flow
flower
flowers
flows
floyd
flu
fluid
flush
flux
fly
flyer
flying
fm
fo
foam
focal
focus
focused
focuses
focusing
fog
fold
folder
folders
folding
folk
folks
follow
followed
following
follows
font
fonts
foo
food
foods
fool
foot
footage
football
footwear
for
forbes
forbidden
force
forced
forces
ford
forecast
forecasts
foreign
forest
forestry
forests
forever
forge
forget
forgot
forgotten
fork
form
formal
format
formation
formats
formatting
formed
former
formerly
forming
forms
formula
fort
forth
fortune
forty
forum
forums
forward
forwarding
fossil
foster
foto
fotos
fought
foul
found
foundation
foundations
founded
founder
fountain
four
fourth
fox
fp
fr
fraction
fragrance
fragrances
frame
framed
frames
framework
framing
france
franchise
francis
francisco
frank
frankfurt
franklin
fraser
fraud
fred
frederick
free
freebsd
freedom
freelance
freely
freeware
freeze
freight
french
frequencies
frequency
frequent
frequently
fresh
fri
friday
fridge
friend
friendly
friends
friendship
frog
from
front
frontier
frontpage
frost
frozen
fruit
fruits
fs
ft
ftp
fu
fuck
fucked
fucking
fuel
fuji
fujitsu
full
fully
fun
function
functional
functionality
functioning
functions
fund
fundamental
fundamentals
funded
funding
fundraising
funds
funeral
funk
funky
funny
fur
furnished
furnishings
furniture
further
furthermore
fusion
future
futures
fuzzy
fw
fwd
fx
fy
g
ga
gabriel
gadgets
gage
gain
gained
gains
galaxy
gale
galleries
gallery
gambling
game
gamecube
games
gamespot
gaming
gamma
gang
gangbang
gap
gaps
garage
garbage
garcia
garden
gardening
gardens
garlic
garmin
gary
gas
gasoline
gate
gates
gateway
gather
gathered
gathering
gauge
gave
gay
gays
gazette
gb
gba
gbp
gc
gcc
gd
gdp
ge
gear
geek
gel
gem
gen
gender
gene
genealogy
general
generally
generate
generated
generates
generating
generation
generations
generator
generators
generic
generous
genes
genesis
genetic
genetics
geneva
genius
genome
genre
genres
gentle
gentleman
gently
genuine
geo
geographic
geographical
geography
geological
geology
geometry
george
georgia
gerald
german
germany
get
gets
getting
gg
ghana
ghost
ghz
gi
giant
giants
gibraltar
gibson
gif
gift
gifts
gig
gilbert
girl
girlfriend
girls
gis
give
given
gives
giving
gl
glad
glance
glasgow
glass
glasses
glen
glenn
global
globe
glory
glossary
gloves
glow
glucose
gm
gmbh
gmc
gmt
gnome
gnu
go
goal
goals
goat
god
gods
goes
going
gold
golden
golf
gone
gonna
good
goods
google
gordon
gore
gorgeous
gospel
gossip
got
gothic
goto
gotta
gotten
gourmet
gov
governance
governing
government
governmental
governments
governor
govt
gp
gpl
gps
gr
grab
grace
grad
grade
grades
gradually
graduate
graduated
graduates
graduation
graham
grain
grammar
grams
grand
grande
granny
grant
granted
grants
graph
graphic
graphical
graphics
graphs
gras
grass
grateful
gratis
gratuit
grave
gravity
gray
great
greater
greatest
greatly
greece
greek
green
greene
greenhouse
greensboro
greeting
greetings
greg
gregory
grenada
grew
grey
grid
griffin
grill
grip
grocery
groove
gross
ground
grounds
groundwater
group
groups
grove
grow
growing
grown
grows
growth
gs
gsm
gst
gt
gtk
guam
guarantee
guaranteed
guarantees
guard
guardian
guards
guatemala
guess
guest
guestbook
guests
gui
guidance
guide
guided
guidelines
guides
guild
guilty
guinea
guitar
guitars
gulf
gun
guns
guru
guy
guyana
guys
gym
gzip
h
ha
habitat
habits
hack
hacker
had
hair
hairy
haiti
half
halfcom
halifax
hall
halloween
halo
ham
hamburg
hamilton
hammer
hampshire
hampton
hand
handbags
handbook
handed
handheld
handhelds
handjob
handjobs
handle
handled
handles
handling
handmade
hands
handy
hang
hanging
hans
hansen
happen
happened
happening
happens
happiness
happy
harassment
harbor
harbour
hard
hardcore
hardcover
harder
hardly
hardware
hardwood
harley
harm
harmful
harmony
harold
harper
harris
harrison
harry
hart
hartford
harvard
harvest
harvey
has
hash
hat
hate
hats
have
haven
having
hawaii
hawaiian
hawk
hay
hayes
hazard
hazardous
hazards
hb
hc
hd
hdtv
he
head
headed
header
headers
heading
headline
headlines
headphones
headquarters
heads
headset
healing
health
healthcare
healthy
hear
heard
hearing
hearings
heart
hearts
heat
heated
heater
heath
heather
heating
heaven
heavily
heavy
hebrew
heel
height
heights
held
helen
helena
helicopter
hell
hello
helmet
help
helped
helpful
helping
helps
hence
henderson
henry
hentai
hepatitis
her
herald
herb
herbal
herbs
here
hereby
herein
heritage
hero
heroes
herself
hewlett
hey
hh
hi
hidden
hide
hierarchy
high
higher
highest
highland
highlight
highlighted
highlights
highly
highs
highway
highways
hiking
hill
hills
hilton
him
himself
hindu
hint
hints
hip
hire
hired
hiring
his
hispanic
hist
historic
historical
history
hit
hitachi
hits
hitting
hiv
hk
hl
ho
hobbies
hobby
hockey
hold
holdem
holder
holders
holding
holdings
holds
hole
holes
holiday
holidays
holland
hollow
holly
hollywood
holmes
holocaust
holy
home
homeland
homeless
homepage
homes
hometown
homework
hon
honda
honduras
honest
honey
hong
honolulu
honor
honors
hood
hook
hop
hope
hoped
hopefully
hopes
hoping
hopkins
horizon
horizontal
hormone
horn
horny
horrible
horror
horse
horses
hose
hospital
hospitality
hospitals
host
hosted
hostel
hostels
hosting
hosts
hot
hotel
hotels
hotelscom
hotmail
hottest
hour
hourly
hours
house
household
households
houses
housewares
housewives
housing
houston
how
howard
however
howto
hp
hq
hr
href
hrs
hs
ht
html
http
hu
hub
hudson
huge
hugh
hughes
hugo
hull
human
humanitarian
humanities
humanity
humans
humidity
humor
hundred
hundreds
hung
hungarian
hungary
hunger
hungry
hunt
hunter
hunting
huntington
hurricane
hurt
husband
hwy
hybrid
hydraulic
hydrocodone
hydrogen
hygiene
hypothesis
hypothetical
hyundai
hz
i
ia
ian
ibm
ic
ice
iceland
icon
icons
icq
ict
id
idaho
ide
idea
ideal
ideas
identical
identification
identified
identifier
identifies
identify
identifying
identity
idle
idol
ids
ie
ieee
if
ignore
ignored
ii
iii
il
ill
illegal
illinois
illness
illustrated
illustration
illustrations
im
ima
image
images
imagination
imagine
imaging
img
immediate
immediately
immigrants
immigration
immune
immunology
impact
impacts
impaired
imperial
implement
implementation
implemented
implementing
implications
implied
implies
import
importance
important
importantly
imported
imports
impose
imposed
impossible
impressed
impression
impressive
improve
improved
improvement
improvements
improving
in
inappropriate
inbox
inc
incentive
incentives
incest
inch
inches
incidence
incident
incidents
incl
include
included
includes
including
inclusion
inclusive
income
incoming
incomplete
incorporate
incorporated
incorrect
increase
increased
increases
increasing
increasingly
incredible
incurred
ind
indeed
independence
independent
independently
index
indexed
indexes
india
indian
indiana
indianapolis
indians
indicate
indicated
indicates
indicating
indication
indicator
indicators
indices
indie
indigenous
indirect
individual
individually
individuals
indonesia
indonesian
indoor
induced
induction
industrial
industries
industry
inexpensive
inf
infant
infants
infected
infection
infections
infectious
infinite
inflation
influence
influenced
influences
info
inform
informal
information
informational
informative
informed
infrared
infrastructure
ing
ingredients
inherited
initial
initially
initiated
initiative
initiatives
injection
injured
injuries
injury
ink
inkjet
inline
inn
inner
innocent
innovation
innovations
innovative
inns
input
inputs
inquire
inquiries
inquiry
ins
insects
insert
inserted
insertion
inside
insider
insight
insights
inspection
inspections
inspector
inspiration
inspired
install
installation
installations
installed
installing
instance
instances
instant
instantly
instead
institute
institutes
institution
institutional
institutions
instruction
instructional
instructions
instructor
instructors
instrument
instrumental
instrumentation
instruments
insulin
insurance
insured
int
intake
integer
integral
integrate
integrated
integrating
integration
integrity
intel
intellectual
intelligence
intelligent
intend
intended
intense
intensity
intensive
intent
intention
inter
interact
interaction
interactions
interactive
interest
interested
interesting
interests
interface
interfaces
interference
interim
interior
intermediate
internal
international
internationally
internet
internship
interpretation
interpreted
interracial
intersection
interstate
interval
intervals
intervention
interventions
interview
interviews
intimate
intl
into
intranet
intro
introduce
introduced
introduces
introducing
introduction
introductory
invalid
invasion
invention
inventory
invest
investigate
investigated
investigation
investigations
investigator
investigators
investing
investment
investments
investor
investors
invisible
invision
invitation
invitations
invite
invited
invoice
involve
involved
involvement
involves
involving
io
ion
iowa
ip
ipaq
ipod
ips
ir
ira
iran
iraq
iraqi
irc
ireland
irish
iron
irrigation
irs
is
isa
isaac
isbn
islam
islamic
island
islands
isle
iso
isolated
isolation
isp
israel
israeli
issn
issue
issued
issues
ist
istanbul
it
italia
italian
italiano
italic
italy
item
items
its
itsa
itself
itunes
iv
ivory
ix
j
ja
jack
jacket
jackets
jackie
jackson
jacksonville
jacob
jade
jaguar
jail
jake
jam
jamaica
james
jamie
jan
jane
janet
january
japan
japanese
jar
jason
java
javascript
jay
jazz
jc
jd
je
jean
jeans
jeep
jeff
jefferson
jeffrey
jelsoft
jennifer
jenny
jeremy
jerry
jersey
jerusalem
jesse
jessica
jesus
jet
jets
jewel
jewellery
jewelry
jewish
jews
jill
jim
jimmy
jj
jm
jo
joan
job
jobs
joe
joel
john
johnny
johns
johnson
johnston
join
joined
joining
joins
joint
joke
jokes
jon
jonathan
jones
jordan
jose
joseph
josh
joshua
journal
journalism
journalist
journalists
journals
journey
joy
joyce
jp
jpeg
jpg
jr
js
juan
judge
judges
judgment
judicial
judy
juice
jul
julia
julian
julie
july
jump
jumping
jun
junction
june
jungle
junior
junk
jurisdiction
jury
just
justice
justify
justin
juvenile
jvc
k
ka
kai
kansas
karaoke
karen
karl
karma
kate
kathy
katie
katrina
kay
kazakhstan
kb
kde
keen
keep
keeping
keeps
keith
kelkoo
kelly
ken
kennedy
kenneth
kenny
keno
kent
kentucky
kenya
kept
kernel
kerry
kevin
key
keyboard
keyboards
keys
keyword
keywords
kg
kick
kid
kidney
kids
kijiji
kill
killed
killer
killing
kills
kilometers
kim
kinase
kind
kinda
kinds
king
kingdom
kings
kingston
kirk
kiss
kissing
kit
kitchen
kits
kitty
klein
km
knee
knew
knife
knight
knights
knit
knitting
knives
knock
know
knowing
knowledge
knowledgestorm
known
knows
ko
kodak
kong
korea
korean
kruger
ks
kurt
kuwait
kw
ky
kyle
l
la
lab
label
labeled
labels
labor
laboratories
laboratory
labour
labs
lace
lack
ladder
laden
ladies
lady
lafayette
laid
lake
lakes
lamb
lambda
lamp
lamps
lan
lancaster
lance
land
landing
lands
landscape
landscapes
lane
lanes
lang
language
languages
lanka
lap
laptop
laptops
large
largely
larger
largest
larry
las
laser
last
lasting
lat
late
lately
later
latest
latex
latin
latina
latinas
latino
latitude
latter
latvia
lauderdale
laugh
laughing
launch
launched
launches
laundry
laura
lauren
law
lawn
lawrence
laws
lawsuit
lawyer
lawyers
lay
layer
layers
layout
lazy
lb
lbs
lc
lcd
ld
le
lead
leader
leaders
leadership
leading
leads
leaf
league
lean
learn
learned
learners
learning
lease
leasing
least
leather
leave
leaves
leaving
lebanon
lecture
lectures
led
lee
leeds
left
leg
legacy
legal
legally
legend
legendary
legends
legislation
legislative
legislature
legitimate
legs
leisure
lemon
len
lender
lenders
lending
length
lens
lenses
leo
leon
leonard
leone
les
lesbian
lesbians
leslie
less
lesser
lesson
lessons
let
lets
letter
letters
letting
leu
level
levels
levitra
levy
lewis
lexington
lexmark
lexus
lf
lg
li
liabilities
liability
liable
lib
liberal
liberia
liberty
librarian
libraries
library
libs
licence
license
licensed
licenses
licensing
licking
lid
lie
liechtenstein
lies
life
lifestyle
lifetime
lift
light
lighter
lighting
lightning
lights
lightweight
like
liked
likelihood
likely
likes
likewise
lil
lime
limit
limitation
limitations
limited
limiting
limits
limousines
lincoln
linda
lindsay
line
linear
lined
lines
lingerie
link
linked
linking
links
linux
lion
lions
lip
lips
liquid
lisa
list
listed
listen
listening
listing
listings
listprice
lists
lit
lite
literacy
literally
literary
literature
lithuania
litigation
little
live
livecam
lived
liver
liverpool
lives
livesex
livestock
living
liz
ll
llc
lloyd
llp
lm
ln
lo
load
loaded
loading
loads
loan
loans
lobby
loc
local
locale
locally
locate
located
location
locations
locator
lock
locked
locking
locks
lodge
lodging
log
logan
logged
logging
logic
logical
login
logistics
logitech
logo
logos
logs
lol
lolita
london
lone
lonely
long
longer
longest
longitude
look
looked
looking
looks
looksmart
lookup
loop
loops
loose
lopez
lord
los
lose
losing
loss
losses
lost
lot
lots
lottery
lotus
lou
loud
louis
louise
louisiana
louisville
lounge
love
loved
lovely
lover
lovers
loves
loving
low
lower
lowest
lows
lp
ls
lt
ltd
lu
lucas
lucia
luck
lucky
lucy
luggage
luis
luke
lunch
lung
luther
luxembourg
luxury
lycos
lying
lynn
lyric
lyrics
m
ma
mac
macedonia
machine
machinery
machines
macintosh
macro
macromedia
mad
madagascar
made
madison
madness
madonna
madrid
mae
mag
magazine
magazines
magic
magical
magnet
magnetic
magnificent
magnitude
mai
maiden
mail
mailed
mailing
mailman
mails
mailto
main
maine
mainland
mainly
mainstream
maintain
maintained
maintaining
maintains
maintenance
major
majority
make
maker
makers
makes
makeup
making
malawi
malaysia
maldives
male
males
mali
mall
malpractice
malta
mambo
man
manage
managed
management
manager
managers
managing
manchester
mandate
mandatory
manga
manhattan
manitoba
manner
manor
manual
manually
manuals
manufacture
manufactured
manufacturer
manufacturers
manufacturing
many
map
maple
mapping
maps
mar
marathon
marble
marc
march
marco
marcus
mardi
margaret
margin
maria
mariah
marie
marijuana
marilyn
marina
marine
mario
marion
maritime
mark
marked
marker
markers
market
marketing
marketplace
markets
marking
marks
marriage
married
marriott
mars
marshall
mart
martha
martial
martin
marvel
mary
maryland
mas
mask
mason
mass
massachusetts
massage
massive
master
mastercard
masters
masturbating
masturbation
mat
match
matched
matches
matching
mate
material
materials
maternity
math
mathematical
mathematics
mating
matrix
mats
matt
matter
matters
matthew
mattress
mature
maui
mauritius
max
maximize
maximum
may
maybe
mayor
mazda
mb
mba
mc
mcdonald
md
me
meal
meals
mean
meaning
meaningful
means
meant
meanwhile
measure
measured
measurement
measurements
measures
measuring
meat
mechanical
mechanics
mechanism
mechanisms
med
medal
media
median
medicaid
medical
medicare
medication
medications
medicine
medicines
medieval
meditation
mediterranean
medium
medline
meet
meeting
meetings
meets
meetup
mega
mel
melbourne
melissa
mem
member
members
membership
membrane
memo
memorabilia
memorial
memories
memory
memphis
men
mens
ment
mental
mention
mentioned
mentor
menu
menus
mercedes
merchandise
merchant
merchants
mercury
mercy
mere
merely
merge
merger
merit
merry
mesa
mesh
mess
message
messages
messaging
messenger
met
meta
metabolism
metadata
metal
metallic
metallica
metals
meter
meters
method
methodology
methods
metres
metric
metro
metropolitan
mexican
mexico
meyer
mf
mfg
mg
mh
mhz
mi
mia
miami
mic
mice
michael
michel
michelle
michigan
micro
microphone
microsoft
microwave
mid
middle
midi
midlands
midnight
midwest
might
mighty
migration
mike
mil
milan
mild
mile
mileage
miles
milf
milfhunter
milfs
military
milk
mill
millennium
miller
million
millions
mills
milton
milwaukee
mime
min
mind
minds
mine
mineral
minerals
mines
mini
miniature
minimal
minimize
minimum
mining
minister
ministers
ministries
ministry
minneapolis
minnesota
minolta
minor
minority
mins
mint
minus
minute
minutes
miracle
mirror
mirrors
misc
miscellaneous
miss
missed
missile
missing
mission
missions
mississippi
missouri
mistake
mistakes
mistress
mit
mitchell
mitsubishi
mix
mixed
mixer
mixing
mixture
mj
ml
mlb
mls
mm
mn
mo
mobile
mobiles
mobility
mod
mode
model
modeling
modelling
models
modem
modems
moderate
moderator
moderators
modern
modes
modification
modifications
modified
modify
mods
modular
module
modules
moisture
mold
moldova
molecular
molecules
mom
moment
moments
momentum
moms
mon
monaco
monday
monetary
money
mongolia
monica
monitor
monitored
monitoring
monitors
monkey
mono
monroe
monster
montana
monte
montgomery
month
monthly
months
montreal
mood
moon
moore
moral
more
moreover
morgan
morning
morocco
morris
morrison
mortality
mortgage
mortgages
moscow
moses
moss
most
mostly
motel
motels
mother
motherboard
mothers
motion
motivated
motivation
motor
motorcycle
motorcycles
motorola
motors
mount
mountain
mountains
mounted
mounting
mounts
mouse
mouth
move
moved
movement
movements
movers
moves
movie
movies
moving
mozambique
mozilla
mp
mpeg
mpegs
mpg
mph
mr
mrna
mrs
ms
msg
msgid
msgstr
msie
msn
mt
mtv
mu
much
mud
mug
multi
multimedia
multiple
mumbai
munich
municipal
municipality
murder
murphy
murray
muscle
muscles
museum
museums
music
musical
musician
musicians
muslim
muslims
must
mustang
mutual
muze
mv
mw
mx
my
myanmar
myers
myrtle
myself
mysimon
myspace
mysql
mysterious
mystery
myth
n
na
nail
nails
naked
nam
name
named
namely
names
namespace
namibia
nancy
nano
naples
narrative
narrow
nasa
nascar
nasdaq
nashville
nasty
nat
nathan
nation
national
nationally
nations
nationwide
native
nato
natural
naturally
naturals
nature
naughty
nav
naval
navigate
navigation
navigator
navy
nb
nba
nbc
nc
ncaa
nd
ne
near
nearby
nearest
nearly
nebraska
nec
necessarily
necessary
necessity
neck
necklace
need
needed
needle
needs
negative
negotiation
negotiations
neighbor
neighborhood
neighbors
neil
neither
nelson
neo
neon
nepal
nerve
nervous
nest
nested
net
netherlands
netscape
network
networking
networks
neural
neutral
nevada
never
nevertheless
new
newark
newbie
newcastle
newer
newest
newfoundland
newly
newport
news
newscom
newsletter
newsletters
newspaper
newspapers
newton
next
nextel
nfl
ng
nh
nhl
nhs
ni
niagara
nicaragua
nice
nicholas
nick
nickel
nickname
nicole
niger
nigeria
night
nightlife
nightmare
nights
nike
nikon
nil
nine
nintendo
nipple
nipples
nirvana
nissan
nitrogen
nj
nl
nm
nn
no
noble
nobody
node
nodes
noise
nokia
nominated
nomination
nominations
non
none
nonprofit
noon
nor
norfolk
norm
normal
normally
norman
north
northeast
northern
northwest
norton
norway
norwegian
nos
nose
not
note
notebook
notebooks
noted
notes
nothing
notice
noticed
notices
notification
notifications
notified
notify
notion
notre
nottingham
nov
nova
novel
novels
novelty
november
now
nowhere
np
nr
ns
nsw
nt
ntsc
nu
nuclear
nude
nudist
nudity
nuke
null
number
numbers
numeric
numerical
numerous
nurse
nursery
nurses
nursing
nut
nutrition
nutritional
nuts
nutten
nv
nvidia
nw
ny
nyc
nylon
nz
o
oak
oakland
oaks
oasis
ob
obesity
obituaries
obj
object
objective
objectives
objects
obligation
obligations
observation
observations
observe
observed
observer
obtain
obtained
obtaining
obvious
obviously
oc
occasion
occasional
occasionally
occasions
occupation
occupational
occupations
occupied
occur
occurred
occurrence
occurring
occurs
ocean
oclc
oct
october
odd
odds
oe
oecd
oem
of
off
offense
offensive
offer
offered
offering
offerings
offers
office
officer
officers
offices
official
officially
officials
offline
offset
offshore
often
og
oh
ohio
oil
oils
ok
okay
oklahoma
ol
old
older
oldest
olive
oliver
olympic
olympics
olympus
om
omaha
oman
omega
omissions
on
once
one
ones
ongoing
onion
online
only
ons
ontario
onto
oo
ooo
oops
op
open
opened
opening
openings
opens
opera
operate
operated
operates
operating
operation
operational
operations
operator
operators
opinion
opinions
opponent
opponents
opportunities
opportunity
opposed
opposite
opposition
opt
optical
optics
optimal
optimization
optimize
optimum
option
optional
options
or
oracle
oral
orange
orbit
orchestra
order
ordered
ordering
orders
ordinance
ordinary
oregon
org
organ
organic
organisation
organisations
organised
organisms
organization
organizational
organizations
organize
organized
organizer
organizing
orgasm
orgy
oriental
orientation
oriented
origin
original
originally
origins
orlando
orleans
os
oscar
ot
other
others
otherwise
ottawa
ou
ought
our
ours
ourselves
out
outcome
outcomes
outdoor
outdoors
outer
outlet
outline
outlined
outlook
output
outputs
outreach
outside
outsourcing
outstanding
oval
oven
over
overall
overcome
overhead
overnight
overseas
overview
owen
own
owned
owner
owners
ownership
owns
oxford
oxide
oxygen
oz
ozone
p
pa
pac
pace
pacific
pack
package
packages
packaging
packard
packed
packet
packets
packing
packs
pad
pads
page
pages
paid
pain
painful
paint
paintball
painted
painting
paintings
pair
pairs
pakistan
pal
palace
pale
palestine
palestinian
palm
palmer
pam
pamela
pan
panama
panasonic
panel
panels
panic
panties
pants
pantyhose
paper
paperback
paperbacks
papers
papua
par
para
parade
paradise
paragraph
paragraphs
paraguay
parallel
parameter
parameters
parcel
parent
parental
parenting
parents
paris
parish
park
parker
parking
parks
parliament
parliamentary
part
partial
partially
participant
participants
participate
participated
participating
participation
particle
particles
particular
particularly
parties
partition
partly
partner
partners
partnership
partnerships
parts
party
pas
paso
pass
passage
passed
passenger
passengers
passes
passing
passion
passive
passport
password
passwords
past
pasta
paste
pastor
pat
patch
patches
patent
patents
path
pathology
paths
patient
patients
patio
patricia
patrick
patrol
pattern
patterns
paul
pavilion
paxil
pay
payable
payday
paying
payment
payments
paypal
payroll
pays
pb
pc
pci
pcs
pct
pd
pda
pdas
pdf
pdt
pe
peace
peaceful
peak
pearl
peas
pediatric
pee
peeing
peer
peers
pen
penalties
penalty
pencil
pendant
pending
penetration
penguin
peninsula
penis
penn
pennsylvania
penny
pens
pension
pensions
pentium
people
peoples
pepper
per
perceived
percent
percentage
perception
perfect
perfectly
perform
performance
performances
performed
performer
performing
performs
perfume
perhaps
period
periodic
periodically
periods
peripheral
peripherals
perl
permalink
permanent
permission
permissions
permit
permits
permitted
perry
persian
persistent
person
personal
personality
personalized
personally
personals
personnel
persons
perspective
perspectives
perth
peru
pest
pet
pete
peter
petersburg
peterson
petite
petition
petroleum
pets
pf
pg
pgp
ph
phantom
pharmaceutical
pharmaceuticals
pharmacies
pharmacology
pharmacy
phase
phases
phd
phenomenon
phentermine
phi
phil
philadelphia
philip
philippines
philips
phillips
philosophy
phoenix
phone
phones
photo
photograph
photographer
photographers
photographic
photographs
photography
photos
photoshop
php
phpbb
phrase
phrases
phys
physical
physically
physician
physicians
physics
physiology
pi
piano
pic
pichunter
pick
picked
picking
picks
pickup
picnic
pics
picture
pictures
pie
piece
pieces
pierce
pierre
pig
pike
pill
pillow
pills
pilot
pin
pine
ping
pink
pins
pioneer
pipe
pipeline
pipes
pirates
piss
pissing
pit
pitch
pittsburgh
pix
pixel
pixels
pizza
pj
pk
pl
place
placed
placement
places
placing
plain
plains
plaintiff
plan
plane
planes
planet
planets
planned
planner
planners
planning
plans
plant
plants
plasma
plastic
plastics
plate
plates
platform
platforms
platinum
play
playback
playboy
played
player
players
playing
playlist
plays
playstation
plaza
plc
pleasant
please
pleased
pleasure
pledge
plenty
plot
plots
plug
plugin
plugins
plumbing
plus
plymouth
pm
pmc
pmid
pn
po
pocket
pockets
pod
podcast
podcasts
poem
poems
poet
poetry
point
pointed
pointer
pointing
points
pokemon
poker
poland
polar
pole
police
policies
policy
polish
polished
political
politicians
politics
poll
polls
pollution
polo
poly
polyester
polymer
polyphonic
pond
pontiac
pool
pools
poor
pop
pope
popular
popularity
population
populations
por
porcelain
pork
porn
porno
porsche
port
portable
portal
porter
portfolio
portion
portions
portland
portrait
portraits
ports
portsmouth
portugal
portuguese
pos
pose
posing
position
positioning
positions
positive
possess
possession
possibilities
possibility
possible
possibly
post
postage
postal
postcard
postcards
posted
poster
posters
posting
postings
postposted
posts
pot
potato
potatoes
potential
potentially
potter
pottery
poultry
pound
pounds
pour
poverty
powder
powell
power
powered
powerful
powerpoint
powers
powerseller
pp
ppc
ppm
pr
practical
practice
practices
practitioner
practitioners
prague
prairie
praise
pray
prayer
prayers
pre
preceding
precious
precipitation
precise
precisely
precision
predict
predicted
prediction
predictions
prefer
preference
preferences
preferred
prefers
prefix
pregnancy
pregnant
preliminary
premier
premiere
premises
premium
prep
prepaid
preparation
prepare
prepared
preparing
prerequisite
prescribed
prescription
presence
present
presentation
presentations
presented
presenting
presently
presents
preservation
preserve
president
presidential
press
pressed
pressing
pressure
preston
pretty
prev
prevent
preventing
prevention
preview
previews
previous
previously
price
priced
prices
pricing
pride
priest
primarily
primary
prime
prince
princess
princeton
principal
principle
principles
print
printable
printed
printer
printers
printing
prints
prior
priorities
priority
prison
prisoner
prisoners
privacy
private
privilege
privileges
prix
prize
prizes
pro
probability
probably
probe
problem
problems
proc
procedure
procedures
proceed
proceeding
proceedings
proceeds
process
processed
processes
processing
processor
processors
procurement
produce
produced
producer
producers
produces
producing
product
production
productions
productive
productivity
products
prof
profession
professional
professionals
professor
profile
profiles
profit
profits
program
programme
programmer
programmers
programmes
programming
programs
progress
progressive
prohibited
project
projected
projection
projector
projectors
projects
prominent
promise
promised
promises
promising
promo
promote
promoted
promotes
promoting
promotion
promotional
promotions
prompt
promptly
proof
propecia
proper
properly
properties
property
prophet
proportion
proposal
proposals
propose
proposed
proposition
proprietary
pros
prospect
prospective
prospects
prostate
prostores
prot
protect
protected
protecting
protection
protective
protein
proteins
protest
protocol
protocols
prototype
proud
proudly
prove
proved
proven
provide
provided
providence
provider
providers
provides
providing
province
provinces
provincial
provision
provisions
proxy
prozac
ps
psi
psp
pst
psychiatry
psychological
psychology
pt
pts
pty
pub
public
publication
publications
publicity
publicly
publish
published
publisher
publishers
publishing
pubmed
pubs
puerto
pull
pulled
pulling
pulse
pump
pumps
punch
punishment
punk
pupils
puppy
purchase
purchased
purchases
purchasing
pure
purple
purpose
purposes
purse
pursuant
pursue
pursuit
push
pushed
pushing
pussy
put
puts
putting
puzzle
puzzles
pvc
python
q
qatar
qc
qld
qt
qty
quad
qualification
qualifications
qualified
qualify
qualifying
qualities
quality
quantitative
quantities
quantity
quantum
quarter
quarterly
quarters
que
quebec
queen
queens
queensland
queries
query
quest
question
questionnaire
questions
queue
qui
quick
quickly
quiet
quilt
quit
quite
quiz
quizzes
quotations
quote
quoted
quotes
r
ra
rabbit
race
races
rachel
racial
racing
rack
racks
radar
radiation
radical
radio
radios
radius
rage
raid
rail
railroad
railway
rain
rainbow
raise
raised
raises
raising
raleigh
rally
ralph
ram
ran
ranch
rand
random
randy
range
rangers
ranges
ranging
rank
ranked
ranking
rankings
ranks
rap
rape
rapid
rapidly
rapids
rare
rarely
rat
rate
rated
rates
rather
rating
ratings
ratio
rational
ratios
rats
raw
ray
raymond
rays
rb
rc
rca
rd
re
reach
reached
reaches
reaching
reaction
reactions
read
reader
readers
readily
reading
readings
reads
ready
real
realistic
reality
realize
realized
really
realm
realtor
realtors
realty
rear
reason
reasonable
reasonably
reasoning
reasons
rebate
rebates
rebecca
rebel
rebound
rec
recall
receipt
receive
received
receiver
receivers
receives
receiving
recent
recently
reception
receptor
receptors
recipe
recipes
recipient
recipients
recognised
recognition
recognize
recognized
recommend
recommendation
recommendations
recommended
recommends
reconstruction
record
recorded
recorder
recorders
recording
recordings
records
recover
recovered
recovery
recreation
recreational
recruiting
recruitment
recycling
red
redeem
redhead
reduce
reduced
reduces
reducing
reduction
reductions
reed
reef
reel
ref
refer
reference
referenced
references
referral
referrals
referred
referring
refers
refinance
refine
refined
reflect
reflected
reflection
reflections
reflects
reform
reforms
refresh
refrigerator
refugees
refund
refurbished
refuse
refused
reg
regard
regarded
regarding
regardless
regards
reggae
regime
region
regional
regions
register
registered
registrar
registration
registry
regression
regular
regularly
regulated
regulation
regulations
regulatory
rehab
rehabilitation
reid
reject
rejected
rel
relate
related
relates
relating
relation
relations
relationship
relationships
relative
relatively
relatives
relax
relaxation
relay
release
released
releases
relevance
relevant
reliability
reliable
reliance
relief
religion
religions
religious
reload
relocation
rely
relying
remain
remainder
remained
remaining
remains
remark
remarkable
remarks
remedies
remedy
remember
remembered
remind
reminder
remix
remote
removable
removal
remove
removed
removing
renaissance
render
rendered
rendering
renew
renewable
renewal
reno
rent
rental
rentals
rentcom
rep
repair
repairs
repeat
repeated
replace
replaced
replacement
replacing
replica
replication
replied
replies
reply
report
reported
reporter
reporters
reporting
reports
repository
represent
representation
representations
representative
representatives
represented
representing
represents
reprint
reprints
reproduce
reproduced
reproduction
reproductive
republic
republican
republicans
reputation
request
requested
requesting
requests
require
required
requirement
requirements
requires
requiring
res
rescue
research
researcher
researchers
reseller
reservation
reservations
reserve
reserved
reserves
reservoir
reset
residence
resident
residential
residents
resist
resistance
resistant
resolution
resolutions
resolve
resolved
resort
resorts
resource
resources
respect
respected
respective
respectively
respiratory
respond
responded
respondent
respondents
responding
response
responses
responsibilities
responsibility
responsible
rest
restaurant
restaurants
restoration
restore
restored
restrict
restricted
restriction
restrictions
restructuring
result
resulted
resulting
results
resume
resumes
retail
retailer
retailers
retain
retained
retention
retired
retirement
retreat
retrieval
retrieve
retrieved
retro
return
returned
returning
returns
reunion
reuters
rev
reveal
revealed
reveals
revelation
revenge
revenue
revenues
reverse
review
reviewed
reviewer
reviewing
reviews
revised
revision
revisions
revolution
revolutionary
reward
rewards
reynolds
rf
rfc
rg
rh
rhode
rhythm
ri
ribbon
rica
rice
rich
richard
richards
richardson
richmond
rick
rico
rid
ride
rider
riders
rides
ridge
riding
right
rights
rim
ring
rings
ringtone
ringtones
rio
rip
ripe
rise
rising
risk
risks
river
rivers
riverside
rj
rl
rm
rn
rna
ro
road
roads
rob
robert
roberts
robertson
robin
robinson
robot
robots
robust
rochester
rock
rocket
rocks
rocky
rod
roger
rogers
roland
role
roles
roll
rolled
roller
rolling
rolls
rom
roman
romance
romania
romantic
rome
ron
ronald
roof
room
roommate
roommates
rooms
root
roots
rope
rosa
rose
roses
ross
roster
rotary
rotation
rouge
rough
roughly
roulette
round
rounds
route
router
routers
routes
routine
routines
routing
rover
row
rows
roy
royal
royalty
rp
rpg
rpm
rr
rrp
rs
rss
rt
ru
rubber
ruby
rug
rugby
rugs
rule
ruled
rules
ruling
run
runner
running
runs
runtime
rural
rush
russell
russia
russian
ruth
rv
rw
rwanda
rx
ryan
s
sa
sacramento
sacred
sacrifice
sad
saddam
safari
safe
safely
safer
safety
sage
sagem
said
sail
sailing
saint
saints
sake
salad
salaries
salary
sale
salem
sales
sally
salmon
salon
salt
salvador
salvation
sam
samba
same
samoa
sample
samples
sampling
samsung
samuel
san
sand
sandra
sandwich
sandy
sans
santa
sanyo
sao
sap
sapphire
sara
sarah
sas
saskatchewan
sat
satellite
satin
satisfaction
satisfactory
satisfied
satisfy
saturday
saturn
sauce
saudi
savage
savannah
save
saved
saver
saves
saving
savings
saw
say
saying
says
sb
sbjct
sc
scale
scales
scan
scanned
scanner
scanners
scanning
scary
scenario
scenarios
scene
scenes
scenic
schedule
scheduled
schedules
scheduling
schema
scheme
schemes
scholar
scholars
scholarship
scholarships
school
schools
sci
science
sciences
scientific
scientist
scientists
scoop
scope
score
scored
scores
scoring
scotia
scotland
scott
scottish
scout
scratch
screen
screening
screens
screensaver
screensavers
screenshot
screenshots
screw
script
scripting
scripts
scroll
scsi
scuba
sculpture
sd
se
sea
seafood
seal
sealed
sean
search
searchcom
searched
searches
searching
seas
season
seasonal
seasons
seat
seating
seats
seattle
sec
second
secondary
seconds
secret
secretariat
secretary
secrets
section
sections
sector
sectors
secure
secured
securely
securities
security
see
seed
seeds
seeing
seek
seeker
seekers
seeking
seeks
seem
seemed
seems
seen
sees
sega
segment
segments
select
selected
selecting
selection
selections
selective
self
sell
seller
sellers
selling
sells
semester
semi
semiconductor
seminar
seminars
sen
senate
senator
senators
send
sender
sending
sends
senegal
senior
seniors
sense
sensitive
sensitivity
sensor
sensors
sent
sentence
sentences
seo
sep
separate
separated
separately
separation
sept
september
seq
sequence
sequences
ser
serbia
serial
series
serious
seriously
serum
serve
served
server
servers
serves
service
services
serving
session
sessions
set
sets
setting
settings
settle
settled
settlement
setup
seven
seventh
several
severe
sewing
sex
sexcam
sexo
sexual
sexuality
sexually
sexy
sf
sg
sh
shade
shades
shadow
shadows
shaft
shake
shakespeare
shakira
shall
shame
shanghai
shannon
shape
shaped
shapes
share
shared
shareholders
shares
shareware
sharing
shark
sharon
sharp
shaved
shaw
she
shed
sheep
sheer
sheet
sheets
sheffield
shelf
shell
shelter
shemale
shemales
shepherd
sheriff
sherman
shield
shift
shine
ship
shipment
shipments
shipped
shipping
ships
shirt
shirts
shit
shock
shoe
shoes
shoot
shooting
shop
shopper
shoppercom
shoppers
shopping
shoppingcom
shops
shopzilla
shore
short
shortcuts
shorter
shortly
shorts
shot
shots
should
shoulder
show
showcase
showed
shower
showers
showing
shown
shows
showtimes
shut
shuttle
si
sic
sick
side
sides
sie
siemens
sierra
sig
sight
sigma
sign
signal
signals
signature
signatures
signed
significance
significant
significantly
signing
signs
signup
silence
silent
silicon
silk
silly
silver
sim
similar
similarly
simon
simple
simplified
simply
simpson
simpsons
sims
simulation
simulations
simultaneously
sin
since
sing
singapore
singer
singh
singing
single
singles
sink
sip
sir
sister
sisters
sit
site
sitemap
sites
sitting
situated
situation
situations
six
sixth
size
sized
sizes
sk
skating
ski
skiing
skill
skilled
skills
skin
skins
skip
skirt
skirts
sku
sky
skype
sl
slave
sleep
sleeping
sleeps
sleeve
slide
slides
slideshow
slight
slightly
slim
slip
slope
slot
slots
slovak
slovakia
slovenia
slow
slowly
slut
sluts
sm
small
smaller
smart
smell
smile
smilies
smith
smithsonian
smoke
smoking
smooth
sms
smtp
sn
snake
snap
snapshot
snow
snowboard
so
soa
soap
soc
soccer
social
societies
society
sociology
socket
socks
sodium
sofa
soft
softball
software
soil
sol
solar
solaris
sold
soldier
soldiers
sole
solely
solid
solo
solomon
solution
solutions
solve
solved
solving
soma
somalia
some
somebody
somehow
someone
somerset
something
sometimes
somewhat
somewhere
son
song
songs
sonic
sons
sony
soon
soonest
sophisticated
sorry
sort
sorted
sorts
sought
soul
souls
sound
sounds
soundtrack
soup
source
sources
south
southampton
southeast
southern
southwest
soviet
sox
sp
spa
space
spaces
spain
spam
span
spanish
spank
spanking
sparc
spare
spas
spatial
speak
speaker
speakers
speaking
speaks
spears
spec
special
specialist
specialists
specialized
specializing
specially
specials
specialties
specialty
species
specific
specifically
specification
specifications
specifics
specified
specifies
specify
specs
spectacular
spectrum
speech
speeches
speed
speeds
spell
spelling
spencer
spend
spending
spent
sperm
sphere
spice
spider
spies
spin
spine
spirit
spirits
spiritual
spirituality
split
spoke
spoken
spokesman
sponsor
sponsored
sponsors
sponsorship
sport
sporting
sports
spot
spotlight
spots
spouse
spray
spread
spreading
spring
springer
springfield
springs
sprint
spy
spyware
sq
sql
squad
square
squirt
squirting
sr
src
sri
ss
ssl
st
stability
stable
stack
stadium
staff
staffing
stage
stages
stainless
stakeholders
stamp
stamps
stan
stand
standard
standards
standing
standings
stands
stanford
stanley
star
starring
stars
starsmerchant
start
started
starter
starting
starts
startup
stat
state
stated
statement
statements
states
statewide
static
stating
station
stationery
stations
statistical
statistics
stats
status
statute
statutes
statutory
stay
stayed
staying
stays
std
ste
steady
steal
steam
steel
steering
stem
step
stephanie
stephen
steps
stereo
sterling
steve
steven
stevens
stewart
stick
sticker
stickers
sticks
sticky
still
stock
stockholm
stockings
stocks
stolen
stomach
stone
stones
stood
stop
stopped
stopping
stops
storage
store
stored
stores
stories
storm
story
str
straight
strain
strand
strange
stranger
strap
strategic
strategies
strategy
stream
streaming
streams
street
streets
strength
strengthen
strengthening
strengths
stress
stretch
strict
strictly
strike
strikes
striking
string
strings
strip
stripes
strips
stroke
strong
stronger
strongly
struck
struct
structural
structure
structured
structures
struggle
stuart
stuck
stud
student
students
studied
studies
studio
studios
study
studying
stuff
stuffed
stunning
stupid
style
styles
stylish
stylus
su
sub
subaru
subcommittee
subdivision
subject
subjects
sublime
sublimedirectory
submission
submissions
submit
submitted
submitting
subscribe
subscriber
subscribers
subscription
subscriptions
subsection
subsequent
subsequently
subsidiaries
subsidiary
substance
substances
substantial
substantially
substitute
subtle
suburban
succeed
success
successful
successfully
such
suck
sucking
sucks
sudan
sudden
suddenly
sue
suffer
suffered
suffering
sufficient
sufficiently
sugar
suggest
suggested
suggesting
suggestion
suggestions
suggests
suicide
suit
suitable
suite
suited
suites
suits
sullivan
sum
summaries
summary
summer
summit
sun
sunday
sunglasses
sunny
sunrise
sunset
sunshine
super
superb
superintendent
superior
supervision
supervisor
supervisors
supplement
supplemental
supplements
supplied
supplier
suppliers
supplies
supply
support
supported
supporters
supporting
supports
suppose
supposed
supreme
sur
sure
surely
surf
surface
surfaces
surfing
surge
surgeon
surgeons
surgery
surgical
surname
surplus
surprise
surprised
surprising
surrey
surround
surrounded
surrounding
surveillance
survey
surveys
survival
survive
survivor
survivors
susan
suse
suspect
suspected
suspended
suspension
sussex
sustainability
sustainable
sustained
suzuki
sv
sw
swap
sweden
swedish
sweet
swift
swim
swimming
swing
swingers
swiss
switch
switched
switches
switching
switzerland
sword
sydney
symantec
symbol
symbols
sympathy
symphony
symposium
symptoms
sync
syndicate
syndication
syndrome
synopsis
syntax
synthesis
synthetic
syracuse
syria
sys
system
systematic
systems
t
ta
tab
table
tables
tablet
tablets
tabs
tackle
tactics
tag
tagged
tags
tahoe
tail
taiwan
take
taken
takes
taking
tale
talent
talented
tales
talk
talked
talking
talks
tall
tamil
tampa
tan
tank
tanks
tanzania
tap
tape
tapes
tar
target
targeted
targets
tariff
task
tasks
taste
tattoo
taught
tax
taxation
taxes
taxi
taylor
tb
tba
tc
tcp
td
te
tea
teach
teacher
teachers
teaches
teaching
team
teams
tear
tears
tech
technical
technician
technique
techniques
techno
technological
technologies
technology
techrepublic
ted
teddy
tee
teen
teenage
teens
teeth
tel
telecharger
telecom
telecommunications
telephone
telephony
telescope
television
televisions
tell
telling
tells
temp
temperature
temperatures
template
templates
temple
temporal
temporarily
temporary
ten
tenant
tend
tender
tennessee
tennis
tension
tent
term
terminal
terminals
termination
terminology
terms
terrace
terrain
terrible
territories
territory
terror
terrorism
terrorist
terrorists
terry
test
testament
tested
testimonials
testimony
testing
tests
tex
texas
text
textbook
textbooks
textile
textiles
texts
texture
tf
tft
tgp
th
thai
thailand
than
thank
thanks
thanksgiving
that
thats
the
theater
theaters
theatre
thee
theft
thehun
their
them
theme
themes
themselves
then
theology
theorem
theoretical
theories
theory
therapeutic
therapist
therapy
there
thereafter
thereby
therefore
thereof
thermal
thesaurus
these
thesis
they
thick
thickness
thin
thing
things
think
thinking
thinkpad
thinks
third
thirty
this
thomas
thompson
thomson
thong
thongs
thorough
thoroughly
those
thou
though
thought
thoughts
thousand
thousands
thread
threaded
threads
threat
threatened
threatening
threats
three
threesome
threshold
thriller
throat
through
throughout
throw
throwing
thrown
throws
thru
thu
thumb
thumbnail
thumbnails
thumbs
thumbzilla
thunder
thursday
thus
thy
ti
ticket
tickets
tide
tie
tied
tier
ties
tiffany
tiger
tigers
tight
til
tile
tiles
till
tim
timber
time
timeline
timely
timer
times
timing
timothy
tin
tiny
tion
tions
tip
tips
tire
tired
tires
tissue
tit
titanium
titans
title
titled
titles
tits
titten
tm
tmp
tn
to
tobacco
tobago
today
todd
toddler
toe
together
toilet
token
tokyo
told
tolerance
toll
tom
tomato
tomatoes
tommy
tomorrow
ton
tone
toner
tones
tongue
tonight
tons
tony
too
took
tool
toolbar
toolbox
toolkit
tools
tooth
top
topic
topics
topless
tops
toronto
torture
toshiba
total
totally
totals
touch
touched
tough
tour
touring
tourism
tourist
tournament
tournaments
tours
toward
towards
tower
towers
town
towns
township
toxic
toy
toyota
toys
tp
tr
trace
track
trackback
trackbacks
tracked
tracker
tracking
tracks
tract
tractor
tracy
trade
trademark
trademarks
trader
trades
trading
tradition
traditional
traditions
traffic
tragedy
trail
trailer
trailers
trails
train
trained
trainer
trainers
training
trains
tramadol
trance
tranny
trans
transaction
transactions
transcript
transcription
transcripts
transexual
transexuales
transfer
transferred
transfers
transform
transformation
transit
transition
translate
translated
translation
translations
translator
transmission
transmit
transmitted
transparency
transparent
transport
transportation
transsexual
trap
trash
trauma
travel
traveler
travelers
traveling
traveller
travelling
travels
travesti
travis
tray
treasure
treasurer
treasures
treasury
treat
treated
treating
treatment
treatments
treaty
tree
trees
trek
trembl
tremendous
trend
trends
treo
tri
trial
trials
triangle
tribal
tribe
tribes
tribunal
tribune
tribute
trick
tricks
tried
tries
trigger
trim
trinidad
trinity
trio
trip
tripadvisor
triple
trips
triumph
trivia
troops
tropical
trouble
troubleshooting
trout
troy
truck
trucks
true
truly
trunk
trust
trusted
trustee
trustees
trusts
truth
try
trying
ts
tsunami
tt
tu
tub
tube
tubes
tucson
tue
tuesday
tuition
tulsa
tumor
tune
tuner
tunes
tuning
tunisia
tunnel
turbo
turkey
turkish
turn
turned
turner
turning
turns
turtle
tutorial
tutorials
tv
tvcom
tvs
twelve
twenty
twice
twiki
twin
twinks
twins
twist
twisted
two
tx
ty
tyler
type
types
typical
typically
typing
u
uc
uganda
ugly
uh
ui
uk
ukraine
ul
ultimate
ultimately
ultra
ultram
um
un
una
unable
unauthorized
unavailable
uncertainty
uncle
und
undefined
under
undergraduate
underground
underlying
understand
understanding
understood
undertake
undertaken
underwear
undo
une
unemployment
unexpected
unfortunately
uni
unified
uniform
union
unions
uniprotkb
unique
unit
united
units
unity
univ
universal
universe
universities
university
unix
unknown
unless
unlike
unlikely
unlimited
unlock
unnecessary
unsigned
unsubscribe
until
untitled
unto
unusual
unwrap
up
upc
upcoming
update
updated
updates
updating
upgrade
upgrades
upgrading
upload
uploaded
upon
upper
ups
upset
upskirt
upskirts
ur
urban
urge
urgent
uri
url
urls
uruguay
urw
us
usa
usage
usb
usc
usd
usda
use
used
useful
user
username
users
uses
usgs
using
usps
usr
usual
usually
ut
utah
utc
utilities
utility
utilization
utilize
utils
uv
uw
uzbekistan
v
va
vacancies
vacation
vacations
vaccine
vacuum
vagina
val
valentine
valid
validation
validity
valium
valley
valuable
valuation
value
valued
values
valve
valves
vampire
van
vancouver
vanilla
var
variable
variables
variance
variation
variations
varied
varies
variety
various
vary
varying
vast
vat
vatican
vault
vb
vbulletin
vc
vcr
ve
vector
vegas
vegetable
vegetables
vegetarian
vegetation
vehicle
vehicles
velocity
velvet
vendor
vendors
venezuela
venice
venture
ventures
venue
venues
ver
verbal
verde
verification
verified
verify
verizon
vermont
vernon
verse
version
versions
versus
vertex
vertical
very
verzeichnis
vessel
vessels
veteran
veterans
veterinary
vg
vhs
vi
via
viagra
vibrator
vibrators
vic
vice
victim
victims
victor
victoria
victorian
victory
vid
video
videos
vids
vienna
vietnam
vietnamese
view
viewed
viewer
viewers
viewing
viewpicture
views
vii
viii
viking
villa
village
villages
villas
vincent
vintage
vinyl
violation
violations
violence
violent
violin
vip
viral
virgin
virginia
virtual
virtually
virtue
virus
viruses
visa
visibility
visible
vision
visit
visited
visiting
visitor
visitors
visits
vista
visual
vital
vitamin
vitamins
vocabulary
vocal
vocals
vocational
voice
voices
void
voip
vol
volkswagen
volleyball
volt
voltage
volume
volumes
voluntary
volunteer
volunteers
volvo
von
vote
voted
voters
votes
voting
voyeur
voyeurweb
voyuer
vp
vpn
vs
vsnet
vt
vulnerability
vulnerable
w
wa
wage
wages
wagner
wagon
wait
waiting
waiver
wake
wal
wales
walk
walked
walker
walking
walks
wall
wallace
wallet
wallpaper
wallpapers
walls
walnut
walt
walter
wan
wang
wanna
want
wanted
wanting
wants
war
warcraft
ward
ware
warehouse
warm
warming
warned
warner
warning
warnings
warrant
warranties
warranty
warren
warrior
warriors
wars
was
wash
washer
washing
washington
waste
watch
watched
watches
watching
water
waterproof
waters
watershed
watson
watt
watts
wav
wave
waves
wax
way
wayne
ways
wb
wc
we
weak
wealth
weapon
weapons
wear
wearing
weather
web
webcam
webcams
webcast
weblog
weblogs
webmaster
webmasters
webpage
webshots
website
websites
webster
wed
wedding
weddings
wednesday
weed
week
weekend
weekends
weekly
weeks
weight
weighted
weights
weird
welcome
welding
welfare
well
wellington
wellness
wells
welsh
wendy
went
were
wesley
west
western
westminster
wet
whale
what
whatever
whats
wheat
wheel
wheels
when
whenever
where
whereas
wherever
whether
which
while
whilst
white
who
whole
wholesale
whom
whore
whose
why
wi
wichita
wicked
wide
widely
wider
widescreen
widespread
width
wife
wifi
wiki
wikipedia
wild
wilderness
wildlife
wiley
will
william
williams
willing
willow
wilson
win
wind
window
windows
winds
windsor
wine
wines
wing
wings
winner
winners
winning
wins
winston
winter
wire
wired
wireless
wires
wiring
wisconsin
wisdom
wise
wish
wishes
wishlist
wit
witch
with
withdrawal
within
without
witness
witnesses
wives
wizard
wm
wma
wn
wolf
woman
women
womens
won
wonder
wonderful
wondering
wood
wooden
woods
wool
worcester
word
wordpress
words
work
worked
worker
workers
workflow
workforce
working
workout
workplace
works
workshop
workshops
workstation
world
worldcat
worlds
worldsex
worldwide
worm
worn
worried
worry
worse
worship
worst
worth
worthy
would
wound
wow
wp
wr
wrap
wrapped
wrapping
wrestling
wright
wrist
write
writer
writers
writes
writing
writings
written
wrong
wrote
ws
wt
wto
wu
wv
ww
www
wx
wy
wyoming
x
xanax
xbox
xerox
xhtml
xi
xl
xml
xnxx
xp
xx
xxx
y
ya
yacht
yahoo
yale
yamaha
yang
yard
yards
yarn
ye
yea
yeah
year
yearly
years
yeast
yellow
yemen
yen
yes
yesterday
yet
yield
yields
yn
yo
yoga
york
yorkshire
you
young
younger
your
yours
yourself
youth
yr
yrs
yu
yugoslavia
yukon
z
za
zambia
zdnet
zealand
zen
zero
zimbabwe
zinc
zip
zoloft
zone
zones
zoning
zoo
zoom
zoophilia
zope
zshops
zu
zum
zus`;

//yada
// this put the same time stamp on everything so I might just sort by post id like
// i did with the other one cause it doesn't know how to sort it. I figured it would
// take long enough for it to get distinct timestamps but it didn't. 

// let wordArray = yada.split(/\n/);

// for (let i = 0; i < 10000; i++) {

//     let date_ob = new Date();

//     let date = Math.ceil(Math.random()* 21);

//     let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

//     let year = date_ob.getFullYear();

//     let hours = Math.floor(Math.random()*13);
    
//     let minutes = Math.floor(Math.random()*61);

//     let seconds = Math.floor(Math.random()*61);

//     let fullTime = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;

// let userArray = ['fgvand94', 'yada', 'j;a', 'test1', 'test2', 'test3', 'test4', 'test5', 'test6'];

// let numOfWords = Math.floor(Math.random()*4);
// let userIndex = Math.floor(Math.random()*9);
// let phraseArray = [];
// let phraseArray2 = [];
//     for (let j = 0; j <= numOfWords; j++) {
//         let wordIndex = Math.floor(Math.random()* 10000);
//         let wordIndex2 = Math.floor(Math.random()* 10000);
//         phraseArray.push(wordArray[wordIndex]);
//         phraseArray2.push(wordArray[wordIndex2]);
//     }
    
// let phrase = phraseArray.join(' ');
// let phrase2 = phraseArray2.join(' ');
// // console.log(phraseArray);
// // console.log(phrase);
// // console.log(phrase);
// // console.log(i, phrase, fullTime);
// pool.query(`insert into mushroomsthreads (id, title, time, username)
// values ($1, $2, $3, $4)`, [i, phrase, fullTime, userArray[userIndex]], (error, respsonse) => {
//     if (error) {
//         return console.log(error);
//     }
//     console.log(i);
//     pool.query(`insert into mushroomsposts (id, threadid, content, username)
//     values ($1, $2, $3, $4)`, [i, i, phrase2, userArray[userIndex]], (err, resp) => {
//         if (err) {
//             return console.log(err);
//         }
//         console.log(i);
//     })

// })

// console.log(fullTime)

// }