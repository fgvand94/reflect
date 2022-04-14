let forumNav = document.querySelector('.forumNav');
let windowLength = window.location.href.length;
let nav = window.location.href.replace("http://localhost:5000/forums/", "");
let navAll = window.location.href
let navUpper = nav.charAt(0).toUpperCase() + nav.slice(1);
let page = document.querySelector('.page-container');
let pg = document.querySelector('.pages');
// let newthread = doucment.querySelector('.newthread');

console.log(navUpper);
forumNav.innerHTML = navUpper.slice(0, navUpper.lastIndexOf('_'));


let threadList = document.querySelector('.column-container');
// newThread.href = `${navAll}/${urlEnd}`;

// let xhr = new XMLHttpRequest;
// xhr.open('GET', '/getId');
// xhr.onload = () => {
//     let threadid = this.Response;
// }

const getForumName = (e) => {
    localStorage.setItem('threads', e.target.innerHTML);

    let urlEnd = e.target.innerHTML.replace(/\s+/g, '-');
    let id = e.target.getAttribute('data-id');
    if (id !== null) {
    e.target.href = `${navAll.slice(0, navAll.lastIndexOf('_'))}/${urlEnd}-${id}_pg1`;
    }
    console.log(e.target.href);    
};

const getPage = (e) => {

    e.target.setAttribute('data-page', e.target.innerHTML);
    e.target.href = navAll.slice(0, navAll.lastIndexOf('_')) + '_pg' + e.target.getAttribute('data-page');
    console.log(e.target.href);
}

threadList.addEventListener('mouseover', getForumName);
page.addEventListener('mouseover', getPage);

