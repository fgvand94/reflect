let forumNav = document.querySelector('.forumNav');
let windowLength = window.location.href.length;
let nav = window.location.href.replace("http://reflect-forum.herokuapp.com/forums/", "");
let navAll = window.location.href
let navUpper = nav.charAt(0).toUpperCase() + nav.slice(1);
let page = document.querySelector('.page-container');
let pg = document.querySelector('.pages');
let searchButton = document.querySelector('.search-button');
let searchInput = document.querySelector('.search-input');
// let newthread = doucment.querySelector('.newthread');

console.log(navUpper);

if (window.location.href.slice(window.location.href.lastIndexOf('/') + 1, window.location.href.lastIndexOf('?'))==='search-results') {
    forumNav.innerHTML = 'Search';
} else {
    forumNav.innerHTML = navUpper.slice(0, navUpper.lastIndexOf('_'));
}

console.log(window.location.href.slice(36, window.location.href.lastIndexOf('?')));


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
    //to make the search here I either nest an if or just do it all on the backend.
    //idk which one is better. 
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

// threadList.addEventListener('mouseover', getForumName);
// page.addEventListener('mouseover', getPage);


//get requests when they aren't done from a form in the html don't have the correct
//request headers set to render a file from the back end. sec-fetchc-mode needs
//to be navigate and sec-fetch dest needs to be document so doing it manually
//inside of js won't work because chrome and other browser see those headers
//as being unsafe to set manually. It sounds like there's some crazy work around
//where you set it inside an iframe or something. when you send the request through
//the form tag it automatically sets those headers to the right values. I tried taht
//earlier but didn't know about the action and then after I tried setting the action
//to the correct value I didn't think I could get the query. 
//I thought I actually checked I think I saw an empty object but I think I was either looking at the wrong console.log
//Or I was getting it mixed up with the body or something. and then I also didn't
//realise that I had my obj.view keys set to the wrong value so that's part of why
//they wouldn't display. I gurentee I'm not the first programmer to do this type of thing
// I read it all the time on the internet lol. you sit for an hour trying to figure
//out why something isn't working and then realise it was some small thing you over
//looked or a syntax error or something that you knew already. at least I learned
//something about get requests from it though. and tbh it didn't take me that long and
//most of the time was just cause I was trying to fiture out how to do it with js cause
//I perfer to do it that way. I found the action thing and realised that I needed to change
//the key names inside my view object in the obj object preatyy quickly. 
//so doing it like this and just saying window location = 
//whatever with search=whatever would probably work to if I would have had the
//values set right in my object. It worked out though cause I learned how get requests
//work more then if i would have done it all right in the first place. I didn't know
//about all those different headers. I honestly don't see why it's different if i set
//the header manually or if html automatically sets it. not sure why that would be
//unsafe if the end result is exactly the same. maybe it's just so people don't see
//it in dev tools but if you know what you were doing you'd probably know what headers
//were supposed to be set for this and that anyway. 

// searchButton.addEventListener('click', (e) => {
//     // e.preventDefault();

//     let body = {
//         content: searchInput.value
//     }
//     console.log(body);
//     let xhr = new XMLHttpRequest();
    
//     xhr.open('GET', `/search-results?search=${body.content}`);
//     xhr.setRequestHeader('access-control-allow-origin', '*');
//     xhr.setRequestHeader('sec-fetch-mode', 'navigate');
//     xhr.setRequestHeader('sec-fetch-dest', 'document');
    
//     xhr.setRequestHeader('accept', 'application/xml;q=0.9')
//    xhr.setRequestHeader('accept', 'text/html');
//    xhr.setRequestHeader('accept',  'application/xhtml+xml');
  

// //    xhr.setRequestHeader('refe', 'text/html');
//     xhr.onload = function () {
//         console.log('onload');
        
//     }
//     // window.location.href = `/search-results`;
//     xhr.send();
// })

