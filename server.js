const express = require("express");
const crypto = require('crypto');
const exphbs = require('express-handlebars');
const nodemailer = require("nodemailer");
const sharp = require("sharp");
const Pool = require('pg').Pool;

//Create a handle bars object and define certain properties. 
const hbs = exphbs.create({
    defaultLayout: false,
    extname: '.handlebars'
});
 
const app = express();

//Define the render engine to be used for express. 
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

//Creating and setting up my postgreSQL ORM
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }


});

//Get route for the home page. 
app.get('/', (req, res) => {

    //Object to be rendered in handlebars. It has two states. One for if a user
    //is logged in and one for the users name.
    let obj = {
        isLoggedIn: false,
        person: ""
    }

    //Checks if there is any cookies. My site doesn't have any cookies if a user
    //is not logged in. So checking if there are cookies at all indicates whether or
    //not a user is logged in. If there isn't it renders the page normally. If there
    //Is it checks the database for a match in the session cookie and then gets the
    //username based on that sessionID and sets person to that user and isLoggedIn to true
        console.log(req.headers.cookie);
        console.log(req.headers.cookie.indexOf('sessionid'));
        const cookieIndex = req.headers.cookie.indexOf('sessionid') + 9;
        console.log(req.headers.cookie.slice(cookieIndex) + 128);

    if (!req.headers.cookie) {
        return res.render('index', {obj});  

    } else { 
        
        pool.query(`select * from users where session = '${req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128}'`, (err, resp) => {

        if (err || resp.rows.length !== 1) {
            console.log('auth failed');
            return res.render('index', {obj});
            
        } else {
                obj.isLoggedIn = true;
                obj.person = resp.rows[0].name;
                return res.render('index', {obj});       
            };
                            
        })
    }
    
});

//Get method for the login page. 
app.get('/login', (req, res) => {

    //The same handlebars file is used to render the initial loggin screen as
    //well as the confirm your email page and the reset your password page.
    //The states of obj determain which parts of the loggin file are rendered. 
    let obj = {
        confirm: false,
        reset: false,
    }

    res.render('login', {obj});
});

//Post method for the login page. 
app.post('/login', (req, res) => {
    
    //Destructures the passed in body object from login.js to get the email and
    //password input of the user. 
    const {email, password} = req.body;
  
    //Queries the database for user with the given user email.
    pool.query(`select * from users where email = '${email}'`, (err, resp) => {
        
        //Sends invalid if there is no match which in turn will tell login.js
        //to create a prompt telling the user that that email or password is invalid
        if (err || resp.rows.length === 0) {
            res.send('invalid')
            return console.log(err);
        }

        //Hashes the input password with the given salt that's stored for that
        //user to check if the password is a match. 
        text = password;
        key = resp.rows[0].salt;
  
        var hash = crypto.createHmac('sha512', key);
        hash.update(text);
        var value = hash.digest('hex');

        //If password is a match...
        if (value === resp.rows[0].password) {
            
            //Send a not verified response if the user hasn't verified their account
            //which will tell login.js to prompt the user of this. 
            if (!resp.rows[0].verified) {      
               return res.send('Not verified');
            }
         
            //Create a sessionID 
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
            
            //Set sessionID to the created session id and store it in the database
            //if there is no session currently in the database. If there is a session
            //IE they are logged in on another device don't update the database and
            //set the session to the sessionID already in the database. 
            if (resp.rows[0].session === null) {

            res.setHeader(`Set-Cookie`, `sessionId=${value}`);

            pool.query(`update users set session = $2 where email = $1`, [email, value], (err, resp) => {
                
                if (err) {
                    console.log(err);
                };
            });

            } else {
                res.setHeader('Set-Cookie', `sessionId=${resp.rows[0].session}`);
            }

            res.send('success');
            return;
        };

        res.send('invalid');
        
    });
    
});

//Get method for the confirm-email page. Your need to confirm the email when
//you want to change the password. I should probably change the name. 
app.get('/confirm-email', (req, res) => {

    let obj = {
        confirm: true,
        reset: false
    }

    res.render('login', {obj});
});

//Post method for confirm email page. 
app.post('/confirm-email', (req, res) => {

    //Get the input of the users email
    let email = req.body.email;

    //Create a verification token
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

    //Query the verfied column of the users table for the given user email.
    pool.query(`select verified from users where email = '${email}'`, (err, resp) => {
        
        //If there is a user with this email and their email has been verified
        //send an email with a link to reset the password. This link will include
        //the verification token. 
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
                  res.send(error);

                } else {
                  console.log(info);
                }
            });

            //Update the users verficationtoken in the database. 
            pool.query('update users set verificationtoken = $2 where email = $1', [email, value], (err, resp) => {
                
                if (err) {
                    console.log(err);
                }

                res.send('Password reset sent')
            })
        }
    })

})

//Get method for password reset page
app.get('/reset-password', (req, res) => {

    let obj = {
        confirm: false,
        reset: true,
    }

    res.render('login', {obj});
})


app.post('/reset-password', (req, res) => {

    //First check if there is a match for both new passwords the user inputs.
    if (req.body.password === req.body.password2) {

        //Query the database for the verification token and email for the given
        //user. 
        pool.query(`select verificationtoken, email 
        from users where email = '${req.query.email}'`, (err, resp) => {

            if (err) {
                return console.log(err);
            }
            
            //Check if the verification token in the url matches that in the
            //database. 
            if (req.query.token === resp.rows[0].verificationtoken) {
                
                //Create a randomely generated salt phrase for the user password. 
                let randomArray = [];
            
                for (let j = 0; j < 16; j++) {
                    if (Math.random()* 10 < 5) {
                        randomArray.push(Math.floor(Math.random()*10));
                    } else {
                        randomArray.push(alphabet[Math.floor(Math.random()*26)]);
                    }
                };
                
                //Add the salt phrase to the user password and create a sha512 hash
                text = req.body.password;
            
                key = randomArray.join('');
                
                var hash = crypto.createHmac('sha512', key);
                hash.update(text);
                var value = hash.digest('hex');

                //update the user password, set verification to null and update the salt in the database. 
                pool.query(`update users set password = $2, verificationtoken = $3, salt = $4 
                where email = $1`, [req.query.email, value, null, key], (err, resp) => {

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

    res.send("passwords don't match");

})

//Get method for logout.
app.get('/logout', (req, res) => {

    //Clears the users sessionID cookie and redirect to the forum home page. 
    res.clearCookie("sessionId");
    res.redirect('/forums');
});

//Get method for the register user page. 
app.get('/register', (req, res) => {
    res.sendFile(__dirname + "/public/register.html");
});

//Post method for the register user page. 
app.post('/register', (req, res) => {

    //Desctucture username, email and password provided as input by the user. 
    const {userName, email, password} = req.body;

    //Query the user table for a matching email to check if the user already exists. 
    pool.query(`select email from users where email = '${email}'`, (err, resp) => {

        if (resp.rows.length > 0) {
            console.log(resp.rows[0].email + " already exists");
            res.send('email in use')
            return;
        };

        //query user table to check if user name exists. 
        pool.query(`select name from users where name = '${userName}'`, (err, resp) => {
            if (resp.rows.length > 0) {
                console.log(resp.rows[0].name + ' already exists');
                return;
            };
            
            //If the user doesn't exists get the highest id for the user so it can
            //be incremented. I don't need this. The email acts as the primary key.
          

                if (err) {
                   return console.log(err);
                } 
              
           
    
                
                const alpha = Array.from(Array(26)).map((e, i) => i + 65);
                const alphabet = alpha.map((x) => String.fromCharCode(x));

                //Create two randomely generated arrays of characters. One for
                //the passwords salt and one to create the verification token
                //to be used to confirm the email. 
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

                //Add salt to password and create a hash also create a hash for
                //the verification token. 
                key = randomArray.join('');
                key2 = randomArray2.join('');
                
                var hash = crypto.createHmac('sha512', key);
                hash.update(text);
                var value = hash.digest('hex');

                var hash2 = crypto.createHmac('sha512', key2);
                hash2.update(text2);
                var value2 = hash2.digest('hex');
                
                //Email the user a link to confirm their email. 
                const transporter = nodemailer.createTransport ({
                  service: 'gmail',
                  host: 'https://reflect-forum.herokuapp.com',
                  auth: {
                    user: 'portfolliotemp@gmail.com',
                    pass: 'zvyvrysuzkjqkabf'
                  },
                  from: 'portfolliotemp@gmail.com'
                })
              
                const mailOptions = {
                  from: 'portfolliotemp@gmail.com',
                  to: email,
                  subject: `Email verification`,
                  text: `Go to the link <a href="https://reflect-forum.herokuapp.com/verify?email=${email}&token=${value2}">here</a> to verify your account`,
                  html: `Go to the link <a href="https://reflect-forum.herokuapp.com/verify?email=${email}&token=${value2}">here</a> to verify your account`,     
                }
              
                transporter.sendMail(mailOptions, (error, info)=> {

                  if(error) {
                 
                    return res.send(error);

                  } else {
                    
                    //If the email sends without error create a new row in the user table and add all
                    //the column values. The only reason the email would fail to send is if the user 
                    //input an invalid email. So I only create the account if a valid email is used. 
                    pool.query(`insert into users (email, name, password, salt, verified, verificationtoken)
                    values ($1, $2, $3, $4, $5, $6)`, [email, userName, value, key, false, value2], (error, response) => {
                       
                        if (error) {
                            res.send(error);
                            return console.log(error);
                        }
                       
                        res.send('success');
                    })

                  }

                });
        
       
            
        });

    });

});

//Get method for the verify email page. 
app.get('/verify', (req, res) => {

    //if the theres no token in the url send a 404 status cause the page shouldn't
    //be accessable without a token. 
    if (req.query.token === null) {
        res.sendStatus(404);
        return;
    }

    //query the database for the email verificationtoken and verified status of the
    //given user email provided in the url. 
    pool.query(`select email, verificationtoken, verified 
    from users where email = '${req.query.email}'`, (err, resp) => {
     
        if (err) {
            res.sendStatus(404);
            return console.log(err);
        };

        //If theres the verification toekn is null or if the user is already verfied
        //redirect to the login page.
        if (resp.rows[0].verificationtoken === null || resp.rows[0].verified) {
            return res.redirect('/login');;
        }
        
        //If the verification token is a match and the user is not verified yet update the users
        //verified status to true and reset the verification token to null. 
        if (req.query.token === resp.rows[0].verificationtoken && req.query.email === resp.rows[0].email && !resp.rows[0].verified) {

            pool.query(`update users set verified = $2, verificationtoken = $3
            where email = $1`, [req.query.email, true, null], (err, response) => {

                if (err) {
                   return console.log(err);
                }
              
                return res.redirect('/login');
      
            });

            return;

        }


    })
})

//Get method for user pages. 
app.get('/user-*', (req, res) => {
  console.log(req.headers.cookie);
    const obj = {
        userMatch: false, 
        photos: {
            
        },
        conversation: {

        }
            
    };
const cookieIndex = req.headers.cookie.indexOf('sessionid');
    //Check if there is a sessionID. if there is and it matches a session ID in 
    //the database-each would be unique-set the user logged in state to true. This
    //Is used to control certian permissions on the page such as setting pictures
    //and sending or viewing personal messages. 
    if (!req.headers.cookie) {
        obj.userMatch = false;

    } else {


        //IDK if it's faster to put the if statement in therer like that or if it's faster to query
        //for the match of the session and req.url.slice I'll have to check. 
        pool.query(`select name from users where session = '${req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128}'`, (e, re) => {
            if (e) {
                console.log(e);
            };
            console.log(re.rows);
            if (re.rows[0].name === req.url.slice(6)) {
            obj.userMatch = true;
            console.log(obj.userMatch);
            obj.person = re.rows[0].name;
            }
        })
        
    };
    
    //Query the database for the user with the name givin in the url after user. 
    pool.query(`select * from users where name = '${req.url.slice(6)}'`, (err, resp) => {

        //If no user exists send a 404 response. 
        if (err || resp.rows.length !== 1) {
            res.sendStatus(404);
            return;
        } 

        if (resp.rows.length === 0) {
            res.send("User doesn't exist");
        }
        //Set the appropriet obj properties to the users name, profile picture and
        //biography to be rendered on the page. 
        obj.person = resp.rows[0].name;
        obj.photo = resp.rows[0].photo;
        obj.bio = resp.rows[0].bio;
        
        //Get the users other picture from the pictures table in the database. 
        pool.query(`select * from pictures where username = '${req.url.slice(6)}'`, (err, response) => {
         

            if (err) {
                return console.log(err);
            };
           
            //Add all the users pictures the the obj.photos array to be rendered. 
            for (let i = 0; i < response.rows.length; i++) {
              
               
                obj.photos[i] = {thumb: response.rows[i].photo, full:response.rows[i].photo2, width:response.rows[i].width};
       
        
            };
          console.log(obj.photos[0]);
            //Query the database for the conversations that have a primary or secondary
            //participant that is equal to the user for the given userpage. Sorted by the 
            //conversation with the most recent post. 
            //The inner query partitions the query by the conversationid and gives an index number for each partition
            //group. This partition is ordered by post.id so that partition index one is the highest
            //post.id in the given parition group. And the where statements insure this happens
            //only when there are non erronous rows. The second sub query gets the reply count per conversation. 
            //The outer query defines that query should only return the rows that have
            //a 1 index in their partition group. This insures that you only get one row for each 
            //conversation and that row is the row containing the most recent post.
            //It then orders the whole result by the post.id as well so that the whole query is displayed
            //by the conversationid with the most recent post. 
            pool.query(`select *
            from 
            (
                select row_number() over (partition by conversation.conversationid order by posts.id desc) as rn
                , a.count, posts.id, conversation.conversationid, posts.convid, conversation.user1name, conversation.user2name,
                conversation.title, conversation.datecreated, posts.datecreated as date, posts.username, person.photo
                from conversationposts as posts, conversations as conversation, users as person,
                (
                    select count(id) as count, convid
                    from conversationposts
                    group by convid
                ) as a
                where posts.convid = conversation.conversationid and person.name = conversation.user1name and a.convid = posts.convid	
            ) as t
            where t.user1name = '${req.url.slice(6)}' and t.rn = 1
            or t.user2name = '${req.url.slice(6)}' and t.rn = 1
            order by t.id desc;`,  function (error, response) {
              
                if(error) {
                    return console.log(error);
                }
              
                if(response.rows.length !== 0) {

                    let i = 0;

                    //create a loop to add the conversations to a obj.conversation array.
                    function loop () { 

                    
                        obj.conversation[i] = {
                            id: response.rows[i].conversationid,
                            user1: response.rows[i].user1name,
                            user2: response.rows[i].user2name,
                            date: response.rows[i].datecreated,
                            title: response.rows[i].title,
                            photo: response.rows[i].photo,
                            replies: response.rows[i].count,
                            replyDate: response.rows[i].date,
                            replyUser: response.rows[i].username,
                            url: response.rows[i].title.replace(/\s+/g, '+') 
                        }
                
                        if (i < response.rows.length - 1) {
                            i++;
                            loop();

                        } else {
                            i = 0;
                            return res.render('user-page', {obj});

                        } 
                        
                    }

                    loop();
                      
                } else {
                    
         

                    return res.render('user-page', {obj});

                }
            })

        })
                            
    });
      
})

//post method for user profiles. 
app.post('/user-*', (req, res) => {

    let column;
    let data;

    //if the body object from user-page.js has a bio element then we're updating
    //the bio and so set the column name to add to the database as bio and the
    //data as the bio property from the body object. Else it's a photo being updated
    //and the the column and data are set approprietly. 
    if (req.body.bio) {

        column = 'bio';
        data = req.body.bio;

        pool.query(`update users set ${column} = $1 where session = $2`, [data, req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128], (err, resp) =>{
            
            if (err) {
                console.log(err);
                return;
            }
           
            res.send('success');
        });

    } else {
      
        column = 'photos';
        let height = Math.floor(req.body.height);
        //Takes the image file chosen by the user which was converted to a 
        //dataurl in user-page.js and initialises a variable with the base64 part
        //of that dataURL. 
        base64Pic = req.body.photos.slice(22);
        
        //Takes the data url and creates a buffer from that data url because
        //the sharp add on won't accept the string base64 as input. 
        const Buffer = require("buffer").Buffer;
        let base64buffer = Buffer.from(base64Pic, "base64");

        //Get the aspect ratio of the input photo
        sharp(base64buffer).metadata().then(result => {
            
            let aspectRatio = result.width/result.height;

        
        //Use the sharp dependency to resize that buffer to 100 by 100 pixels 
        //which is the size used in the thumbnails and to a smaller version 
        //of the photo with the same aspect ratio it came in with
        //to increase page load speeds. 
            sharp(base64buffer).resize(100, 100).toBuffer().then(result => {
               
                //Convert the resized base64 buffer back to string and create a data
                //url to be stored in the database and rendered in html. 
                let newBase64 = result.toString("base64");
                let dataUrl = `data:image/png;base64,${newBase64}`;

                sharp(base64buffer).resize(Math.floor(height * aspectRatio), height).toBuffer().then(result => {
                
                    //Same as previous comment with the proper aspec ratio version. 
                    let newBase642 = result.toString("base64");
                    let dataUrl2 = `data:image/png;base64,${newBase642}`;
            
                    pool.query(`select id from pictures order by id desc limit 1`, (err, resp) => {
                        
                        let id;
                       
            
                        if (resp.rows.length !== 0) {
                            id = resp.rows[0].id + 1;
                           
                        } else {
                            id = 1;
                            
                        };
                       
                        pool.query(`insert into pictures (id, photo, username, photo2, width) values ($1, $2, $3, $4, $5) `,
                        [id, dataUrl, req.url.slice(req.url.lastIndexOf('-') + 1), dataUrl2, Math.floor(height * aspectRatio)], (err, resp) => {
                            
                            if (err) {
                                console.log(err);
                            }
                            res.send('success');
                        })
                    }) 
                })
                return result;
            });
        })

    }
 
})

//Post method for adding new conversations. 
app.post('/new-conversation', (req, res) => {
    
    //Query the database for the conversationid of conversations and the username
    //input to create a conversation with if that user exists. 
    pool.query(`select conversations.conversationid, users.name 
    from conversations, users
    where users.name = '${req.body.user}' order by conversations.conversationid desc limit 1`, (err, resp) => {
        
        if (err) {
            return console.log(err);
        }

        //Check if user exists. 
        if (resp.rows[0].name) {

            //Get the date the conversation was created. 
            let date_ob = new Date();

            let date = ("0" + date_ob.getDate()).slice(-2);
        
            let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        
            let year = date_ob.getFullYear();
        
            let fullTime = year + "-" + month + "-" + date;
         
            let conversationId;

            if (resp.rows.length !== 0) {
                conversationId = resp.rows[0].conversationid + 1;   
            } else {
                conversationId = 1;
            };

            //Get the name of the user creating the conversation. I don't need to
            //get this form the database in this way I can just use the current url
            pool.query (`select name from users where session = '${req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128}'`, (er, re) => {
                
                //Inser the conversation into the conversation table. 
                pool.query(`insert into conversations (conversationid, datecreated, title, user2name, user1name)
                values ($1, $2, $3, $4, $5)`, [conversationId, fullTime, req.body.title, req.body.user, re.rows[0].name], (err, response) => {
                    if(err) {
                        return console.log(err);
                    }
                });

                //Get the most recent id form the conversationposts table. 
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
                    
                    //Insert the initial post created with the conversation into conversationposts. 
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

//Get method for conversations. 
app.get('/conversation/*', (req, res) => {

    let obj = {
        isLoggedIn: false,
        person: '',
        view: {}
    }
        const cookieIndex = req.headers.cookie.indexOf('sessionid');

    //Query the database for the posts and user photos for each post for the given
    //conversation. 
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
        
        //need to finish the page functionality here as it is in the threads page
        //I haven't because I haven't made many conversations posts in my test site yet. 
        let postCount = resp.rows[0].full_count;
        let pageCount = Math.ceil(postCount/20);
       
        if (req.url.slice(req.url.lastIndexOf('_') + 3) > 0 && req.url.slice(req.url.lastIndexOf('_') + 3) <= pageCount) {
         
            obj.pageTotal = pageCount

            for (let j = 0; j < pageCount; j++) {
                obj.pageArray.push(j+1);
            }
        }

        //Assign the conversation name and id to the handlebars object
        obj.conversationName = req.url.slice(req.url.lastIndexOf('/') +1, req.url.lastIndexOf('-'));
        obj.conversationId = req.url.slice(req.url.lastIndexOf('-') + 1, req.url.lastIndexOf('_'));
        
        //Create several view objects that hold specific info fo each conversation
        for (let i = 0; i < resp.rows.length; i++) {
            obj.view[i] = {
                content: resp.rows[i].content,
                photo: resp.rows[i].photo,
                name: resp.rows[i].name
            }
        };
        
        //Check if there's a seesion to verify again if the user is logged
        //in and set the person property of the object to the name of the session
        //that matches in the database and set is logged in to true so that it
        //will show in the top right of the page. 
        if (!req.headers.cookie) {
            return res.render('conversations', {obj});  

        } else {

            pool.query(`select name from users where session = '${req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128}'`, (error, response) => {
                if (error || response.rows.length === 0) {
                    res.render('conversations', {obj});
                    return;
                } else {
                    obj.isLoggedIn = true;
                    obj.person = response.rows[0].name;
                    res.render('conversations', {obj});
                    return;
                }
            });

        }  
    })

})

//Post method for adding new posts to an already existing conversation. 
app.post('/conversation-add', (req, res) => {

    //Get the id of the last post from conversations
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
    
        //I could just grab the user name from the drop down and send it over from the front end instead
        //of doing a whole new query to get the username. I might change that and test speeds.
        pool.query (`select name from users where session = '${req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128}'`, (er, re) => {
            
            //Inser tnew post. 
            pool.query(`insert into conversationposts (id, convid, datecreated, content, username)
            values ($1, $2, $3, $4, $5)`, 
            [id, req.body.id, fullTime, req.body.content, re.rows[0].name], (error, response) => {
                
                if (error) {
                    return console.log(error);
                }
            
                res.send('success');

            })
        })
    })
})


//Put request for changing user porfile picture 
app.put('/updatePhoto', (req, res) => {

    //Find the user from the session id
    pool.query(`select name from users where session = '${req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128}'`, (error, response) => {
       
        //Update photo on that user name to the selected photo. 
        pool.query(`update users set photo = $1 where name = $2`, [req.body.data, response.rows[0].name], (err, resp) => {
            
            if (err) {
                return console.log(err);
            }

            res.send('success');

        })
    })
});

//Get request for search results in a given forum. 
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
            const cookieIndex = req.headers.cookie.indexOf('sessionid');

    let trim = req.query.search.trim();
    
    //Check if the keyword of one of the forums exists in the usrl where it should
    //and use it to make quries if it does. 
    if (req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'camping' || req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'hiking' ||
    req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'backpacking' || req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'fish' ||
    req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'mammals' || req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'reptiles' ||
    req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'trees' || req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'vegitation' ||
    req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'flowers' || req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase() === 'mushrooms') {   
       
        //The actual search consists of multiple levels of quries that get more
        //broad as they go. It will try to match the input directly first with this query
        //and then find less and less exact matches from there and order the results
        //approprietly. 
        pool.query(`select * from ${req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase()}threads where title like '${trim}%'
        order by title asc`, (err, resp) => {

            if (err) {
                return console.log(err);
            }
            
            obj.category = req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase();

            //If there are results for the exact match...
            if (resp.rows.length !== 0) {

                let k = 0;
                let yada;

                //Query for the kth result from the queries above and get the
                //most recent post to be displayed with the thread title. 
                function loop1 () {
                  
                    pool.query(`select *, count(*) over() as full_count 
                    from ${req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase()}posts
                    where threadid = ${resp.rows[k].id} order by id desc limit 1`, (error, success) => {
                        
                        //Create a view object with the applicable info from this
                        //and the above query
                        obj.view[k] = {
                            thread: resp.rows[k].title,
                            user: resp.rows[k].username,
                            threadReplace: resp.rows[k].title.replace(/\s+/g, '-'),
                            id: resp.rows[k].id,
                            postCount: success.rows[0].full_count,
                            userPost: success.rows[0].username
                        }

                        //If k represents the last entry set k back to zero
                        //else iterate k and continue the loop. 
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
                
                //Create an array of each word and assaign a variable to 
                //the phrase that represents the query for that each word by
                //iterating and adding an or statement at the beggining of all
                //beyond the first. 
                let wordArray = trim.split(' ');
                let queryLike = `where title like '%${wordArray[0]}%'`;

                for (let l = 1; l < wordArray.length; l++) {
                    queryLike = queryLike + `or title like '%${wordArray[l]}%'`;
                }

                //Query for the above words. 
                pool.query(`select * from ${req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase()}threads ${queryLike}`, (error, response) => {

                    if (error) {
                        console.log(error);
                    }

                    //If there are results do the below. 
                   

                        let i  = resp.rows.length;

                        //Loop through each result from the above query and query for the
                        //most recent post of that thread. 
                        function loop2 ()   {
                            
                            //query through each response for the more broad search. Starting
                            //at response object 0. This 0 is based on i minus i's starting
                            //value which is resp.rows.length so that it will be in terms of
                            //i as it increases and start at 0.
                            pool.query(`select *, count(*) over() as full_count 
                            from ${req.url.substring(8, req.url.lastIndexOf('/')).toLowerCase()}posts
                            where threadid = ${response.rows[i - resp.rows.length].id} order by id desc limit 1`, (error, success) => {
                                
                                let j = 0;
                                //for each result create a new loop. This loop essentially checks
                                //for copies between the broad and exact search
                                function innerLoop () {
                                    console.log('inner');
                                    //Add to the view object starting at i which
                                    //is where the first query left off. it will do this
                                    //if the current broad search isn't the same as the exact search
                                    //and also if j is equal to the last index of the initial exact search.
                                    //this is to made sure it's check for all possible repeats present from
                                    //object.view[0] to obj.view[last index] and then makes one final check on
                                    //the last index. If it's not a match on the last index it adds the result
                                    //to the view object
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

                                    //When theres a duplicate or if j reaches the last index of the
                                    //exact result reset j back to 0.
                                    if (obj.view[j].thread === response.rows[i - resp.rows.length].title || j === resp.rows.length - 1) {
                                        
                                        j = 0;

                                        //I needs to iteraate until it has gone through the last result
                                        //from the broad search. Since I starts at the length of the strict
                                        //search you add the two lengths. If it's not the last iteration increment
                                        //I and loop again. 
                                        if (i !== resp.rows.length + response.rows.length - 1) {
                                            i ++;
                                            loop2();

                                        } else {

                                            //Check the name of the user based off the sessionid and set the account
                                            //in the top right to their name. Then render the template with the obj
                                            //object. 
                                            if (!req.headers.cookie) {
                                                return res.render('threads', {obj});  

                                            } else {
                                                const cookieIndex = req.headers.cookie.indexOf('sessionid');
                                                pool.query(`select name from users where session = '${req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128}'`, (error, response) => {
                                                    
                                                    if (error || response.rows.length === 0) {
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
                                        }
                                        
                                    } else {
                                        j ++;
                                        innerLoop();
                                    }
                                }

                                innerLoop();

                            })
                        }

                       
                    //wait for loop1 to compleatly resolve before calling the loop2.
                    function loopWait () {
                   
                            if (obj.view[resp.rows.length - 1] !== undefined) {
                                console.log('if loop');
                                loop2();
                            } else {
                                console.log('else loop');
                                setTimeout(loopWait, 100);
                            }
                        }

                    loopWait();              
                })              
            } else {
            //if the strict search doesn't match start on the broad search.
            
            let wordArray = trim.split(' ');
            let queryLike = `where title like '%${wordArray[0]}%'`;

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
                         
                            if (i === response.rows.length -1) {

                                if (!req.headers.cookie) {
                                    return res.render('threads', {obj}); 

                                } else {

                                    pool.query(`select name from users where session = '${req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128}'`, (error, response) => {
                                        if (error || response.rows.length === 0) {
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
                                
                            }
                        })

                    }
                  
                } else {

                    obj.view[0] = {
                        thread: 'No results'
                    }
                    
                    if (!req.headers.cookie) {
                        return res.render('threads', {obj});

                    } else {
                        const cookieIndex = req.headers.cookie.indexOf('sessionid');
                        pool.query(`select name from users where session = '${req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128}'`, (error, response) => {
                            
                            if (error || response.rows.length === 0) {
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
        const cookieIndex = req.headers.cookie.indexOf('sessionid');


    const threadArray = ['camping', 'hiking', 'backpacking', 'fish', 'mammals', 'reptiles', 'trees', 'vegitation', 'flowers', 'mushrooms'];
    let i = 0;
    console.log("forums");
        
    function loop() {
        
        pool.query(`select ${threadArray[i]}threads.title, ${threadArray[i]}threads.id, ${threadArray[i]}posts.id as postid
        from ${threadArray[i]}threads, ${threadArray[i]}posts where ${threadArray[i]}threads.id = ${threadArray[i]}posts.threadid order by postid desc limit 1`, (err, resp) =>{
            console.log("query");
            if (err) {
                res.send("Currently transfering database. Should be up shortly");
                return console.log(err);
            }

            if (resp.rows.length === 0) {

                return res.render('forum-home', {obj}); 
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
        
                if (!req.headers.cookie) {
                    return res.render('forum-home', {obj});  

                } else {                  
                    
                    pool.query(`select * from users where session = '${req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128}'`, (err, resp) => {
                
                        if (err || resp.rows.length !== 1) {
                            res.render('forum-home', {obj});
                            return;

                        } else {
                            obj.isLoggedIn = true;
                            obj.person = resp.rows[0].name;
                            res.render('forum-home', {obj});
                            return;

                        }

                    });
                }
            
            }
        })

    }

    loop();

});
 

app.get(`/forums/([^/]+)`, (req, res) => {

    obj = {
        isLoggedIn: false,
        person: '',
        view: {},
        category: req.url.substring(8).toLowerCase(),
        pageTotal:"",
        isSearch: false   
    }
        const cookieIndex = req.headers.cookie.indexOf('sessionid');

    const offset = Math.ceil(req.url.slice(req.url.lastIndexOf('_') +3) * 20); 

    if (req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'camping' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'hiking' ||
    req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'backpacking' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'fish' ||
    req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'mammals' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'reptiles' ||
    req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'trees' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'vegitation' ||
    req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'flowers' || req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase() === 'mushrooms') {

        pool.query(`select *, count(*) over() as full_count
        from 
        (
            select row_number() over (partition by threads.id order by posts.id desc) as rn,
            threads.id, a.count, posts.username as postuser, threads.title, threads.username, posts.threadid, posts.id as postsid
            from ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}threads as threads, ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}posts as posts,
            (
                select count(id) as count, threadid
                from ${req.url.substring(8, req.url.lastIndexOf('_')).toLowerCase()}posts
                group by threadid
            ) as a
            where threads.id = posts.threadid and a.threadid = posts.threadid
        ) as t
        where t.rn = 1
        order by t.postsid desc
        limit 20 offset ${offset - 20};`, (err, resp) =>{
          
            obj.pageArray = [];
            if (resp.rows.length === 0) {
                return res.render('threads',  {obj});                
            }
  
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
                        
                    obj.view[i] = {
                        thread: resp.rows[i].title,
                        threadReplace: resp.rows[i].title.replace(/\s+/g, '-'),
                        user: resp.rows[i].username,
                        id: resp.rows[i].id,
                        userPost: resp.rows[i].postuser,
                        postCount: resp.rows[i].count
                    }  
                
                    if (i === resp.rows.length - 1 ) {

                        if (!req.headers.cookie) {
                            return res.render('threads',  {obj}); 

                        } else {
                            
                            pool.query(`select name from users where session = '${req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128}'`, (erro, respo) => {
                                
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
                        }  

                    } else {
                        i ++;
                        queryLoop();
                    }
                    
                }

                queryLoop();

            }
        
        }); 
    } 

});


app.get('/forums/([^/]+)/([^/]+)', (req, res) => {
    
    let obj = {
        isLoggedIn: false,
        person: '',
        view: {},
    }
        const cookieIndex = req.headers.cookie.indexOf('sessionid');

    let lastSlash = req.url.lastIndexOf('/');
    let threadid = req.url.lastIndexOf('-');
    let title = req.url.substring(lastSlash + 1, threadid).replaceAll('-', ' ');
   
    const offset = Math.ceil(req.url.slice(req.url.lastIndexOf('_') +3) * 20);
   
    if (req.url.substring(8, lastSlash).toLowerCase() === 'camping' || req.url.substring(8, lastSlash).toLowerCase() === 'hiking' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'backpacking' || req.url.substring(8, lastSlash).toLowerCase() === 'fish' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'mammals' || req.url.substring(8, lastSlash).toLowerCase() === 'reptiles' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'trees' || req.url.substring(8, lastSlash).toLowerCase() === 'vegitation' ||
    req.url.substring(8, lastSlash).toLowerCase() === 'flowers' || req.url.substring(8, lastSlash).toLowerCase() === 'mushrooms') {
 
        if (req.url.substring(lastSlash + 1) === 'Introduce-yourself') {

            if (!req.headers.cookie) {
                return res.render('posts', {obj}); 

            } else {

                pool.query(`select name from users where session = '${req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128}'`, (error, response) => {
                    
                    if (error || response.rows.length === 0) {
                        res.render('posts', {obj});
                        return;
                    } else {
                        obj.isLoggedIn = true;
                        obj.person = response.rows[0].name;
                        res.render('posts', {obj});
                        return;
                    }
                }); 
            }     
        };

        if (req.url.substring(lastSlash + 1) === 'new-thread') {

            if (!req.headers.cookie) {
                return res.render('new-thread', {obj});

            } else {

                pool.query(`select name from users where session = '${req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128}'`, (error, response) => {
                    if (error || response.rows.length === 0) {
                        res.render('new-thread', {obj});
                        return;
                    } else {
                        obj.isLoggedIn = true;
                        obj.person = response.rows[0].name;
                        res.render('new-thread', {obj});
                        return;
                    }
                }); 
            } 
          return;
        }

        pool.query(`select users.name, users.photo, ${req.url.substring(8, lastSlash).toLowerCase()}posts.content, ${req.url.substring(8, lastSlash).toLowerCase()}threads.title,
        ${req.url.substring(8, lastSlash).toLowerCase()}posts.id, count(*) over() as full_count
        from ${req.url.substring(8, lastSlash).toLowerCase()}posts, ${req.url.substring(8, lastSlash).toLowerCase()}threads, users 
        where ${req.url.substring(8, lastSlash).toLowerCase()}posts.threadid = '${req.url.slice(threadid + 1, req.url.lastIndexOf('_'))}' 
        and ${req.url.substring(8, lastSlash).toLowerCase()}posts.username = users.name
        and ${req.url.substring(8, lastSlash).toLowerCase()}threads.title = '${title}'
        and ${req.url.substring(8, lastSlash).toLowerCase()}threads.id = '${req.url.slice(threadid + 1, req.url.lastIndexOf('_'))}'
        order by ${req.url.substring(8, lastSlash).toLowerCase()}posts.id asc
        limit 20 offset ${offset - 20}`, (err, resp) => {
            
            if (err) {
                console.log(err);
                return;
            };

            if (resp.rows.length === 0) {
                return res.render('threads',  {obj}); 
            }
           
            obj.pageArray = [];
            obj.category = req.url.substring(8, lastSlash).toLowerCase();
            obj.threadName = req.url.slice(lastSlash + 1, req.url.lastIndexOf('-'));
            obj.threadId = req.url.slice(threadid + 1, req.url.lastIndexOf('_'));
        
            let postCount = resp.rows[0].full_count;
            let pageCount = Math.ceil(postCount/20);

            if (req.url.slice(req.url.lastIndexOf('_') + 3) > 0 && req.url.slice(req.url.lastIndexOf('_') + 3) <= pageCount) {
                obj.pageCount = pageCount;
              
                if (resp.rows.length > 0) {  
                   
                    for (let j = 0; j < pageCount; j++) {
                        obj.pageArray.push(j+1);
                    }

                    if (!req.headers.cookie) {
                        for (let i = 0; i < resp.rows.length; i++) {
                      
                            obj.view[i] = {
                                name: resp.rows[i].name,
                                content: resp.rows[i].content,
                                photo: resp.rows[i].photo,
                                id: resp.rows[i].id,
                                match: false
                            }

                            if (i === resp.rows.length -1) {
                                return res.render('posts', {obj});
                            }
                        } 

                    } else {
                        
                        pool.query(`select name from users where session = '${req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128 || null}'`, (error, response) => {
                        
                            for (let i = 0; i < resp.rows.length; i++) {
                           
                                obj.view[i] = {
                                    name: resp.rows[i].name,
                                    content: resp.rows[i].content,
                                    photo: resp.rows[i].photo,
                                    id: resp.rows[i].id,
                                    match: false
                                }
                                
                                if (response.rows.length !== 0) {
                                    if (obj.view[i].name === response.rows[0].name) {
                                        obj.view[i].match = true;
                                    }
                                }

                                if (error && i === resp.rows.length - 1 || response.rows.length === 0 && i === resp.rows.length - 1) {
                                    res.render('posts', {obj});
                                    return;

                                } else if (i === resp.rows.length -1) {
                                 
                                    obj.isLoggedIn = true;
                                    obj.person = response.rows[0].name;
                                    res.render('posts', {obj});
                                    return;
                                }
                            }
                        }); 
                    } 

                } else {
                    res.sendStatus(404);
                }
               
            }

        });
    }
 
});

app.put('/update-post', (req, res) => {

    pool.query(`update ${req.body.category}posts set content = $2 where id = $1`, 
    [req.body.id, req.body.content], (err, resp) => {
    
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
            
            pool.query(`select name from users where session = '${req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128}'`, (error, response) => {
                
                pool.query(`insert into ${req.url.substring(8, lastSlash).toLowerCase()}threads (id, title, time, username)
                values ($1, $2, $3, $4)`, [threadid, req.query.thread, fullTime, response.rows[0].name], (er, re) => {
                    
                    pool.query(`select * from ${req.url.substring(8, lastSlash)}posts order by id desc`, (err, respon) => {
                       
                        let id = respon.rows[0].id + 1;
                        
                        pool.query(`insert into ${req.url.substring(8, lastSlash).toLowerCase()}posts (id, threadid, content, username) 
                        values ($1, $2, $3, $4)`, [id, threadid, req.query.message, response.rows[0].name], (er, re) => {
                            
                            if (er) {
                                console.log(er);
                            };

                            return res.send('success');
                        }); 
                    })
                });

            })
        });      
    }

});

app.get('/forums/([^/]+)/([^/]+)/add-a-post', (req, res) => {
    
    const obj = {
        isLoggedIn: false
    }
        const cookieIndex = req.headers.cookie.indexOf('sessionid');

    if (!req.headers.cookie) {
        return res.render('new-post', {obj}); 

    } else {

        pool.query(`select name from users where session = '${req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128}'`, (error, response) => {
            
            if (error || response.rows.length === 0) {
                res.render('new-post', {obj});
                return;
            } else {
                obj.isLoggedIn = true;
                obj.person = response.rows[0].name;
                res.render('new-post', {obj});
                return;
            }
        });
    }
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
   
    if (threadEnd.substring(8, nextLastSlash).toLowerCase() === 'camping' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'hiking' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'backpacking' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'fish' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'mammals' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'reptiles' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'trees' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'vegitation' ||
    threadEnd.substring(8, nextLastSlash).toLowerCase() === 'flowers' || threadEnd.substring(8, nextLastSlash).toLowerCase() === 'mushrooms') {
       
        pool.query(`select id, threadid from ${threadEnd.substring(8, nextLastSlash)}posts order by id desc limit 1`, (err, resp) => {
           
            let id = resp.rows[0].id + 1;

            pool.query(`select name from users where session = '${req.headers.cookie.slice(cookieIndex), req.headers.cookie.slice(cookieIndex) + 128}'`, (error, response) => {
                
                pool.query(`insert into ${threadEnd.substring(8, nextLastSlash)}posts (id, threadid, content, username)
                values ($1, $2, $3, $4)`, [id, req.body.threadId, req.query.message, response.rows[0].name], (err, re) => {
                    
                    if (err) {
                        console.log(err);
                    }

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