let navPost = document.querySelector('.thread-name');
const forum = document.querySelector('.forum');
let windowFull = window.location.href;
let thread = window.location.href.lastIndexOf('/');
let post = windowFull.slice(thread + 1);

//IDK if naming things based on the html there attached to is a good idea
//or if I should stick whith how I was naming it before based on the function of it

navPost.innerHTML = post.replaceAll('-', ' ');


let nav = window.location.href.replace("http://localhost:5000/forums/", "");
let category = nav.substring(0, nav.lastIndexOf('/'));
let categoryUpper = category.charAt(0).toUpperCase() + category.slice(1);

forum.innerHTML = categoryUpper;
forum.href = `/forums/${category}`;