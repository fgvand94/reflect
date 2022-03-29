const express = require("express");
const { addNewThread, threads } = require("./public/resources/js/database");
// const { setThreads } = require("./public/linked-pages/reflect/resources/js/display-threads.js");
// const path = require('path');




// let path = require(path);

const app = express();
// const handlebars = require('express-handlebars');
// app.engine('handlebars', handlebars());
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'handlebars');


//seems like there should be a better way to do this
app.use(express.static('public'));
// app.use(express.static('public/linked-pages'));


// app.use(express.static('public/linked-pages/reflect/resources'));
// app.use(express.static('public/linked-pages/reflect/resources/css'));
app.use(express.json());
//when I finally host all this which I might actually do sooner then I thought.
//I wanted to basically finish it first but I think I will so I can see how it
//works, maybe use one that links to your github so it auto updates as you push
// I think I'm going to put the reflect page on its own server like a proper website.
//the other ones are basic enough and aren't really website just basic layout for practice
// app.set('views', path.join(__dirname));




app.get('/', (req, res) => {
  console.log(__dirname);
  res.sendFile(__dirname + "/public/index.html");
  
});

app.get('/forums', (req, res) => {
  console.log(__dirname);
  res.sendFile(__dirname + "/public/reflect-community.html");
  
});
//change path name threads to the name of the thread category click in the get
//request https://stackoverflow.com/questions/56885520/how-to-change-pathname-in-url-inside-http-get-request
app.get('/forums/threads', (req, res) => {
  console.log(__dirname);
  // res.send('<div class"thread">yada</div>');
  res.sendFile(__dirname + "/public/threads/threads.html");
  // let yada = 'yada';
  // res.render('threads', {yada});
  
});
//an ideas to make this work. The front end files aren't attached to the database
// as far as i've read on the internet. So I can't update the threads page from
//the database inside a regular js file. It has to go through my server logic.
// I could just render the entire html structure here. without calling sendfile
//just actually put the whole html code. IDK if that's a great solution though.


// app.get('/reflect/forums/threads', (req, res) => {
//   // res.send('<div class"thread">yada</div>');
//   res.render('<h1>yada</h1>');
// });

app.get('/forums/new-thread', (req, res) => {
  console.log(__dirname);
  res.sendFile(__dirname + "/public/threads/new-thread.html");
  
  console.log(threads);
});

app.post('/forums/new-thread', (req, res) => {
  console.log('yada2');
  console.log(threads);
  console.log(req.body);
  res.send(addNewThread(req.body.key, req.body.threadValues));
})

app.get('/forums/threads/posts', (req, res) => {
  console.log(__dirname);
  res.sendFile(__dirname + "/public/threads/posts/posts.html");
  
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});