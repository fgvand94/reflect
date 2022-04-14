let bioUpdate = document.querySelector('.update-bio');
let bioForm = document.querySelector('.bio-form');
let bioInput = document.querySelector('.bio-input');
let bioButton = document.querySelector('.bio-button');
let bioText = document.querySelector('.bio-text');
let bioCancel = document.querySelector('.bio-cancel');

let photoUpdate = document.querySelector('.update-picture');
let photoForm = document.querySelector('.photo-form');
let photoInput = document.querySelector('.photo-input');
let photoUpload = document.querySelector('.photo-upload');
let photoCancel = document.querySelector('.photo-cancel');

let image = document.querySelector('.img-container');
let imageEnlarge = document.querySelector(".image-enlarge");
let exit = document.querySelector('.exit');
let enlargedImage = document.querySelector('.enlarged-image');
let setPicture = document.querySelector('.set-picture');

const showBioForm = (e) => {
    bioForm.style.display = 'block';
}

bioUpdate.addEventListener('click', showBioForm);


bioCancel.addEventListener('click', () => {
    bioInput.value = '';
    bioForm.style.display = 'none';
    
})


bioButton.addEventListener('click', (e) => {
    let body = {
        bio: bioInput.value
    }
    console.log(body.bio)

    bioForm.style.display = 'none';

    xhr = new XMLHttpRequest();
    xhr.open('POST', `${window.location.href.slice(window.location.href.lastIndexOf('/'))}`);
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = function () {
        console.log(this.responseText)
        if (this.responseText === 'success') {
            location.reload();          
        }
    }
    xhr.send(JSON.stringify(body));
});


photoUpdate.addEventListener('click', () => {
    photoForm.style.display = 'block'
});

photoCancel.addEventListener('click', () => {
    photoForm.style.display = 'none';
})


photoUpload.addEventListener('click', () => {
    
    let body = {
        photos: ''
    }

    xhr = new XMLHttpRequest();
    xhr.open('POST', `${window.location.href.slice(window.location.href.lastIndexOf('/'))}`);
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = function () {
        console.log(this.responseText)
        if (this.responseText === 'success') {
            location.reload();          
        }
    }
 
    const reader = new FileReader();
    reader.readAsDataURL(photoInput.files[0]);
    reader.onload = function() {
        body.photos = reader.result;
        xhr.send(JSON.stringify(body));
    }
   
})

image.addEventListener('click', (e) => {
    console.log('click');
    if (e.target.className === 'photos') {
    imageEnlarge.style.display = 'block';
    enlargedImage.src = e.target.src;
    console.log(e.target.src);
    }
})

exit.addEventListener('click', () => {
    imageEnlarge.style.display = 'none';
})

setPicture.addEventListener('click', () => {
  
    console.log('what');
    let body = {
        data: enlargedImage.src
    }

    console.log(typeof(body.data));
    let xhr = new XMLHttpRequest();
    xhr.open('PUT', '/updatePhoto');
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = function () {
        if(this.responseText === 'success') {
            location.reload();  
        }
    };
    xhr.send(JSON.stringify(body));
})