let navPost = document.querySelector('.thread-name');
let newPost = document.querySelector('.new-post');
const forum = document.querySelector('.forum');
let windowFull = window.location.href;
let thread = window.location.href.lastIndexOf('/');
let post = windowFull.slice(thread + 1);
let allPosts = document.querySelector('.column-container');
let currentUser = document.querySelector('.user');

let threadid = post.lastIndexOf('-');
navPost.innerHTML = post.substring(0, threadid).replaceAll('-', ' ');
console.log

let nav = windowFull.replace("http://localhost:5000/forums/", "");
let category = nav.substring(0, nav.lastIndexOf('/'));
let categoryUpper = category.charAt(0).toUpperCase() + category.slice(1);

forum.innerHTML = categoryUpper;
forum.href = `/forums/${category}_pg1`;

newPost.href = windowFull + '/add-a-post';
console.log(newPost.href);


// for (let i = 0; i < 20; i++) {
//     console.log(i);
//     if (document.querySelector(`.posts${i}`).getAttribute('data-id') === 'false') {
//         if (document.querySelector(`.posts${i}`).innerHTML === currentUser.innerHTML) {
                  
//             document.querySelector(`.update-post${i}`).style.display = 'block';
        
//             document.querySelector(`.update-post${i}`).addEventListener('click', (e) => {
//                 document.querySelector(`.update-form${i}`).style.display = 'block';
                
//             });
        
//         }
    
//     }
// }

allPosts.addEventListener('click', (e) => {

    if (e.target.className.slice(0, 11) === 'update-post') {

        document.querySelector(`.update-post${e.target.className.slice(23)}`).style.display = 'none';
        document.querySelector(`.update-form${e.target.className.slice(23)}`).style.display = 'block'; 

        //apperantly innerHTML doesn't 'escape' the values you put in so it can lead
        //to xss atacks. innertext and textcontent will escape. textcontent doesn't
        //parse as html so apperently it has better performance whatever that means
        //in this context. 
        document.querySelector(`.update-text${e.target.className.slice(23)}`).innerText 
        = document.querySelector(`.content${e.target.className.slice(23)}`).innerText;

        document.querySelector(`.update-cancel${e.target.className.slice(23)}`).addEventListener('click', (event) => {
            document.querySelector(`.update-form${e.target.className.slice(23)}`).style.display = 'none';
            document.querySelector(`.update-text${e.target.className.slice(23)}`).innerText = '';
            document.querySelector(`.update-post${e.target.className.slice(23)}`).style.display = 'block';
        });

        document.querySelector(`.update-button${e.target.className.slice(23)}`).addEventListener('click', (event) => {

            let obj = {
                category: window.location.href.slice(29, window.location.href.lastIndexOf('/')),
                content: document.querySelector(`.update-text${e.target.className.slice(23)}`).value,
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


 
