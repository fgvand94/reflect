let forumNav = document.querySelector('.forumNav');
let windowLength = window.location.href.length;
let nav = window.location.href.replace("http://localhost:5000/forums/", "");
let navAll = window.location.href
let navUpper = nav.charAt(0).toUpperCase() + nav.slice(1);


console.log(navUpper);
forumNav.innerHTML = navUpper;


let threadList = document.querySelector('.column-container');



const getForumName = (e) => {
    localStorage.setItem('threads', e.target.innerHTML);

    let urlEnd = e.target.innerHTML.replace(/\s+/g, '-');
    //I'll have to alter this in someway for the username if I want to keep
    //it this general
    e.target.href = `${navAll}/${urlEnd}`;

    console.log(e.target.style.fontSize);  
};


threadList.addEventListener('mouseover', getForumName);