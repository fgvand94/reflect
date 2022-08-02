let navPost = document.querySelector('.thread-name');
let newPost = document.querySelector('.new-post');
const forum = document.querySelector('.forum');
let windowFull = window.location.href;
let thread = window.location.href.lastIndexOf('/');
let post = windowFull.slice(thread + 1);
let allPosts = document.querySelector('.column-container');
let currentUser = document.querySelector('.user');
let threadid = post.lastIndexOf('-');

if (post === 'new-thread' || post === 'Introduce-yourself') {
    navPost.innerHTML = post.replaceAll('-', ' ');
} else {
    navPost.innerHTML = post.substring(0, threadid).replaceAll('-', ' ');
}

console.log(post);

let nav = windowFull.replace("https://reflect-forum.herokuapp.com/forums/", "");
let category = nav.substring(0, nav.lastIndexOf('/'));
let categoryUpper = category.charAt(0).toUpperCase() + category.slice(1);

forum.innerHTML = categoryUpper;
forum.href = `/forums/${category}_pg1`;

newPost.href = windowFull + '/add-a-post';
console.log(newPost.href);


allPosts.addEventListener('click', (e) => {

    if (e.target.className.slice(0, 11) === 'update-post') {

        document.querySelector(`.update-post${e.target.className.slice(23)}`).style.display = 'none';
        document.querySelector(`.update-form${e.target.className.slice(23)}`).style.display = 'block'; 


        document.querySelector(`.update-text${e.target.className.slice(23)}`).value 
        = document.querySelector(`.content${e.target.className.slice(23)}`).innerText;

        document.querySelector(`.update-cancel${e.target.className.slice(23)}`).addEventListener('click', (event) => {
    
            document.querySelector(`.update-form${e.target.className.slice(23)}`).style.display = 'none';
            document.querySelector(`.update-post${e.target.className.slice(23)}`).style.display = 'block';
        });

        document.querySelector(`.update-button${e.target.className.slice(23)}`).addEventListener('click', (event) => {
            event.preventDefault();

            let content = document.querySelector(`.update-text${e.target.className.slice(23)}`).value;

            let contentBreaks = content.replace(/\n/g, '<br>');
             
            let obj = {
                category: category,
                content: contentBreaks,
                id: document.querySelector(`.update-form${e.target.className.slice(23)}`).getAttribute('data-id')
            }

            let xhr = new XMLHttpRequest();
            xhr.open('PUT', '/update-post');
            xhr.setRequestHeader('content-type', 'application/json');
            xhr.onload = function () {
                if (this.responseText === 'success') {
                    location.reload();
                }
            }

            xhr.send(JSON.stringify(obj));
        })
    }
})


 
