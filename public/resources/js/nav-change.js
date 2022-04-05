const navButton = document.querySelector('.button');
const navDiv = document.querySelector('.drop-down-content');


console.log(document.cookie);
//this won't work if I ever have to put more cookies in other then sessionId
//If I can always be sure that sessionId will be the first location I could
//remove it using substring or some other method and go from there. If it
//is ever that I can't be sure of whether or not sessionId will be first
//i'll have to find some way to identify the index range of the sessionId
//cookie and then extract it from there and compare its value. I'm sure there's
//probably a better way of doing this that I haven't found out but so far this
//type of thing has been the hardest to get information on other then that one
//video with the php that I found but they use methods that I've read aren't that
//secure. using session storages. Unless it's something different then session
//storage. it looked like it. he did say it was a super global something that
//was holding all the information.

//I do need to find a way to generate this in the backend. I'll probably use
//php or something. there's so many jobs for people with experience with php
// and they pay really good. Not as many for stuff like handlebars or mustache
// or things like that. php and react or angular or something like that they
//all seem to be in demand. Which is weird cause I've read a lot that php is
//dying but as far as I can tell that's not true. Even facebook uses php along
//side react you can see it right on their url's
if (document.cookie !== `sessionId=''`) {
    navButton.parentNode.removeChild(navButton);
    let h4 = document.createElement('h4');
    let a = document.createElement('a');
    let h42 = document.createElement('h4');
    let a2 = document.createElement('a');
    navDiv.appendChild(h4);
    h4.appendChild(a);
    a.innerHTML = 'User name';
    a.className = 'login';
    a.href = './user-';
    h4.className = 'login';
    navDiv.appendChild(h42);
    h42.appendChild(a2);
    a2.innerHTML = 'Logout';
    a2.className = 'login';
    a2.href = '/logout';
    h42.className = 'login';
};



