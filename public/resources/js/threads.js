let forumNav = document.querySelector('.forumNav');
let windowLength = window.location.href.length;
let nav = window.location.href.replace("https://reflect-forum.herokuapp.com/forums/", "");
let navAll = window.location.href;
let navUpper = nav.charAt(0).toUpperCase() + nav.slice(1);
let page = document.querySelector('.page-container');
let pg = document.querySelector('.pages');
let searchButton = document.querySelector('.search-button');
let searchInput = document.querySelector('.search-input');


console.log(navUpper);

if (window.location.href.slice(window.location.href.lastIndexOf('/') + 1, window.location.href.lastIndexOf('?'))==='search-results') {
    forumNav.innerHTML = 'Search';
} else {
    forumNav.innerHTML = navUpper.slice(0, navUpper.lastIndexOf('_'));
}

console.log(window.location.href.slice(36, window.location.href.lastIndexOf('?')));


let threadList = document.querySelector('.column-container');


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


