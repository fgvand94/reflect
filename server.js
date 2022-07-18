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

//all this user info carries over devices so I need to find a way around that. There's npm packeges that do
//this authorization stuff for you but I want to be able to create it myself. IDK how but I'm thinking maybe
//I could somehow use the ip address of the device and have a different user object depending on the ip address.
//something to that effect at least. I'm pretty sure I could make it work by creating something in my database
//everytime someone visits with the ip address and do it like that but that seems like alot of stuff to put
//in my database. That would be wierd having a bunch of ip addresses in my database for people who aren't even
//registered lol. maybe I could store the ip address in local storage or something but then there's safety concerns
//with stuff like that. I'll have to look again at how secure the different storages are.
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
//   user: 'yhizmpuqryqnjq',
//   host: '34.229.119.37',
//   database: 'dcnebe88p7tv3j',
//   password: '113f7218eb8e0bf8dba0e6e47d746dab7c53cd48094d64bf12d968922b824f74',
//   port: 5432,
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

//no pg_hba.conf entry for host "34.229.119.37", user "yhizmpuqryqnjq", database "dcnebe88p7tv3j"

console.log(pool.user);
app.get('/', (req, res) => {
//    console.log(req.getHeader('Set-Cookie'));
//    console.log(req.getHeader('Cookie'));
    console.log(user);
    // console.log(req.headers.cookie.slice(10));
    console.log(req.header);
    let obj = {
        isLoggedIn: false,
        person: false
    }
   
    // if (user.isLoggedIn === true) {
        
        pool.query(`select * from users where session = '${req.headers.cookie.slice(10)}'`, (err, resp) => {

            if (err || resp.rows.length !== 1) {
                console.log('auth failed');
                // user.isLoggedIn = false;
                // user.userName = '';
                // user.password = '';
                // user.email = '';
                // res.sendFile(__dirname + "/public/login.html");
                res.render('index', {obj});

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

                    // res.setHeader(`Set-Cookie`, `sessionId=${value}`);
                    // pool.query(`update users set session = $2 where email = $1`, [user.email, value], async (err, resp) => {
                    //     if (err) {
                    //         console.log(err);
                    //     };
                    // });                               
                 
                    return res.render('index', {obj});     
                };
                // user.isLoggedIn = false;
                // user.userName = '';
                // user.password = "";
                // user.email = '';
                // user.id = 0;
                return res.render('index', {obj});                         
        })
        return;
    // }
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
            
            // user.userName = resp.rows[0].name;
            // user.password = resp.rows[0].password;
            // user.email = resp.rows[0].email;
            // user.id = resp.rows[0].id;
            // user.isLoggedIn = true;

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
        //I'll maybe see later if there's a way I can reset the session ID every refresh or page change and still allow
        //independent logins across multiple devices. 
            //cant send after header yada could make else idk i'll fix it later
            res.send('success');
            return;
        };
        alert('invalid email or password');
        console.log('invalid');
        res.send('invalid');
        
  
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
               
                // res.header("Access-Control-Allow-Credentials", true);
                // res.header("Access-Control-Allow-Origin", "*");
           
              
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
                    console.log
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

//when a user deletes his profile will all his posts stay or will he have to delete
//them manually? If so will I just delete part of the useri n the database or will
//a just put a user deleted column and set it to true?
app.get('/user-*', (req, res) => {
    
  
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
//idk why I was essentially logging people out if the user page you went to didn't exist in the database lol
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
                                if (obj.isLoggedIn) {
                                    // if (resp.rows[0].name === user.userName && resp.rows[0].email === user.email
                                    // && resp.rows[0].password === user.password && resp.rows[0].session === req.headers.cookie.substring(10)) {
                    
                                        
                    
                                    //     const alpha = Array.from(Array(26)).map((e, i) => i + 65);
                                    //     const alphabet = alpha.map((x) => String.fromCharCode(x));
                                        
                                    //     let randomArray = [];
                                    //     let randomArray2 = [];
                        
                                    //     for (let j = 0; j < 16; j++) {
                                    //         if (Math.random()* 10 < 5) {
                                    //             randomArray.push(Math.floor(Math.random()*10));
                                    //             randomArray2.push(Math.floor(Math.random()*10));
                                    //         } else {
                                    //             randomArray.push(alphabet[Math.floor(Math.random()*26)]);
                                    //             randomArray2.push(alphabet[Math.floor(Math.random()*26)]);
                                    //         }
                                    //     };
                                    
                                    //     text = randomArray.join('');
                                    //     key = randomArray2.join('');
                                                        
                                    //     var hash = crypto.createHmac('sha512', key);
                                    //     hash.update(text);
                                    //     var value = hash.digest('hex');  
                                            
                                    //     res.setHeader(`Set-Cookie`, `sessionId=${value}`);
                    
                                    //     pool.query(`update users set session = $2 where email = $1`, [user.email, value], (err, resp) => {
                                    //         if (err) {
                                    //             console.log(err);
                                    //         };
                                            
                                    //     });
                                        
                                        
                                    // }  
                                   
                                    obj.userMatch = true;
                                    
                                    
                                    console.log('loggedin');
                                    return res.render('user-page', {obj}); 
                                        
                                } else {
                                console.log('logedout');
                                // user.isLoggedIn = false;
                                // user.userName = '';
                                // user.password = "";
                                // user.email = '';
                                // user.id = 0;
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
            console.log(resp.rows.length);
            let id;
            if (resp.rows.length !== 0) {
                id = resp.rows[0].id + 1;
            } else {
                id = 1;
            };
            
            pool.query(`insert into pictures (id, photo, username) values ($1, $2, $3) `,
            [id, data, user.userName], (err, resp) => {
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
            console.log(resp.rows);
            let conversationId;
            if (resp.rows.length !== 0) {
                conversationId = resp.rows[0].conversationid + 1;
            } else {
                conversationId = 1;
            };

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

                let id;

                if (response.rows.length !== 0) {
                    id = response.rows[0].id + 1;
                } else {
                    id = 1;
                }
                
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
            //    console.log(i);
            //    console.log(resp.rows);
               // console.log(threadArray[i]);
               obj.recentthreads[threadArray[i]] = {
                   title: resp.rows[0].title,
                   id: resp.rows[0].id,
                   titleReplace: resp.rows[0].title.replace(/\s+/g, '-')
               }
            //    console.log(obj.recentthreads[threadArray[i]].id);
               if (i < threadArray.length - 1)  {
                   i++;
                   loop();
               } else {
                   // console.log(obj.recentthreads);
                  
                   pool.query(`select * from users where session = '${req.headers.cookie.slice(10)}'`, (err, resp) => {
                    console.log('query');
                    if (err || resp.rows.length !== 1) {
                        console.log('error');
                        // res.render('index', {obj});
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
    // if (user.isLoggedIn === true) {
        // console.log('2');

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
    //keeps timing out. changing password didn't give any errors so it doesn't really give you a lot to 
    //go on. I realised I was using the credectials from the first database that I didn't populate. changed
    //to the right one and initially got the error no pg_hba.conf entry for host "34.229.119.37", user "yhizmpuqryqnjq", database "dcnebe88p7tv3j"
    //which isn't the host for the database. Not sure what that's about. ran it again and didn't get that error
    //message. just the regular timout still. The error with the different host gave the same user and 
    //database name though which is really strang the host is just different which makes no sense. I'll
    //read more tomorrow maybe there's just something I have to add to pool for heroku that I don't for
    //my local host or something. found out ssl mode is set to require. It looks like it might have to
    //be set to this. and it won't let a connection be established if it's not. I don't think I have ssl
    //set up. If I do I also read something and hour or so ago about ssl issues with node.js heroku and
    //having to do something specific. I'll figure it out. there should be a way to remove it for testing
    //though cause security at this point is really not an issue. I'm getting emails from git guardian
    //which is something that detects secrets being reveled in you git hub. The emails seem to correspond
    //with me connecting to heroku. I never signed up for git guardian. idk if that's something that 
    //heroku has built in. oh no actually it seems to coincide with me pushing things to my github.
    //which is even wierder cause I'm preatty sure I never signed up for any git guardian. 
    // console.log(req.headers);
    obj = {
        isLoggedIn: false,
        person: '',
        view: {},
        category: req.url.substring(8).toLowerCase(),
        pageTotal:"",
        isSearch: false   
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
                where threads.id = posts.threadid 
            ) as t
			where t.rn = 1
            order by t.postsid desc
            limit 20 offset ${offset - 20}`, (err, resp) =>{
                console.log(resp.rows.length);
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
            
                
                // console.log(obj.view[i]);
                // console.log(i);

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
    console.log('get');
    let obj = {
        isLoggedIn: false,
        person: '',
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
    
    //I should maybe put these in a next route
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
            //the other method would be to put the if logic back here and then
            //render a different object based on that
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


        // console.log(req.url.slice(threadid + 1, req.url.lastIndexOf('_')));
        // console.log(req.url.substring(8, lastSlash).toLowerCase());
        // console.log(title);
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
     
            // console.log(resp.rows);
        
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
    // let thread = req.url.slice(nextLastSlash + 1, lastSlash);
   
    if (threadEnd.substring(8, nextLastSlash).toLowerCase() === 'camping' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'hiking' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'backpacking' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'fish' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'mammals' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'reptiles' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'trees' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'vegitation' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'flowers' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'mushrooms') {
        console.log('2');
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
                res.send('success');

                //have time in threads to update to latest post. I don't really need that anymore cause the order of
                //the posts aren't based off the post time anymore but the post id. IDK maybe I'll keep it just as a time
                //stamp for the origional post. Some forums have a time by the latest post on the thread though but if I want
                //to do that it makes more sense to just put it in the posts table. 
                // pool.query(`update ${threadEnd.substring(8, nextLastSlash)}threads set time = $2 where id = $1`, [req.body.threadId, fullTime], (error, res) => {
                //     res.send('success');
                // })
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

//got it to work on heroku intermitintly. it was saying can't connect to local host
//when trying to sign in and I figured I'd have to go through and change somethings
//that rely on the url away from localhost. It was also not loading when I tried
//to go to posts in a particular thread. I don't remember exactly what it said 
//but it was something like yada yada is not defined which means it just isn't
//working cause something in the database quirie isn't working. which also could
//be from the url and probably is. But another problem that seems to be aside from
//that is after a few minutes or seconds nothing works at all. Off the top of my
//head I think this has to do with me setting the ssl to reject unauthorized false
//that's what I had to do to get it to work in the first place. setting it to
//true gave me another error'i'll have to do it again to see exactly' basically
//saying it was a self signed ssl or something. It sounds like there's a way to
//actually make it not do this instead of just setting reject unauthorized
//to false. also this might not be the problem at all. https://dev.to/lawrence_eagles/causes-of-heroku-h10-app-crashed-error-and-how-to-solve-them-3jnl
//that article has a few suggestions-I keep getting h10 or h13- for h10. non of them
//seem to apply to me but he says heroku restart might help. someone on stackoverflow
//said that helped aswell. I'm going to try some other stuff but if I can't find
//anything else I'll try that. probably tomorrow though. heroku restart didn't
//work. the wierd thing is that it's intermitint which I haven't seen anywhere yet
//I'll try the ssl thing tomorrow and see if that works and then go from there.
//I'll also just probably change all the stuff to the correct url and everything
//I don't think that will help with the total crashing after a few seconds but
//we'll see. I should also make the database credentials and the url stuff update
//depending on the environment so that It'll work on local still without having
//to change stuff everytime. https://stackoverflow.com/questions/61097695/self-signed-certificate-error-during-query-the-heroku-hosted-postgres-database
//this article has some other stuff about the ssl. 
//my main page had http not https for the link to the css file. I changed that and
//it hasn't crashed randomly again so I think that might have had something
//to do with that. so now if I change all the paths in my routes and js files
//everything should be working like it was locally. 


//got the sessions working independentlly on different devices. Seems to be functioning just like any other 
//website at this point. I just need to update the posts away from the user.name and that and add all the delete
//routes. I could add some bells and whistles and make it look nicer. add the trail search api
//on the home page. Other than that I need to just make sure all of my security stuff is as good as it can be
//create session timeouts and I think there's a way in the session packages to check the ip address so I'll see
//if I can do that on my end. And then just learn whatever else I can as far as security goes. I think it's
//decent though at this point but probably not amazing cause I don't know to much about that. It has https though
//so that's good. The pictures load quick after they're chached so I think if I just upgrade my dynos it'll
//be fine in that aspect to. Not to sure though. Oh yeah and maybe work on the add post and update parts so 
//they're all fancy like other forums with things you can insert and just make sure that's all working as good
//as possible. Then maybe make it so you can login with google and facebook and do 2fa. Certain pages like the user
//page don't have a button to go back to the home page either so I should fix that. I didn't want the bar on
//the top but I'm thinking I'll just put it in. I was going to think of some other button but idk might seem
//wierd. Oh and I either need to take out the search bar in the posts page or make it so it will search through
//the posts in the thread that your on. 

