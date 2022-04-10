let navPost = document.querySelector('.thread-name');
let newPost = document.querySelector('.new-post');
const forum = document.querySelector('.forum');
let windowFull = window.location.href;
let thread = window.location.href.lastIndexOf('/');
let post = windowFull.slice(thread + 1);

//IDK if naming things based on the html there attached to is a good idea
//or if I should stick whith how I was naming it before based on the function of it

//another way to do this would be to make all the spaces pluses so that I don't
//have to give an Id number or put an erounous value at the end of new thread
//for it to work out. Or I could just do it with no js and just the handlebars
//like I was thinking. If I could pass the data-idvalue from threads that was
//clicked here I could do an if else statement based on whether it was null
//or not. I haven't decided which I want to do but this works for now. all the
//code just looks nicer and seems more efficient when I do this part in js lol
//it probably doesn't matter but I like it. I could also make the url just
//the id without the name. 
let threadid = post.lastIndexOf('-');
navPost.innerHTML = post.substring(0, threadid).replaceAll('-', ' ');


let nav = windowFull.replace("http://localhost:5000/forums/", "");
let category = nav.substring(0, nav.lastIndexOf('/'));
let categoryUpper = category.charAt(0).toUpperCase() + category.slice(1);

forum.innerHTML = categoryUpper;
forum.href = `/forums/${category}`;

newPost.href = windowFull + '/add-a-post';
console.log(newPost.href);