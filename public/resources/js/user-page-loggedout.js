let image = document.querySelector('.img-container');
let imageEnlarge = document.querySelector(".image-enlarge");
let exit = document.querySelector('.exit');
let enlargedImage = document.querySelector('.enlarged-image');
let windowPhotoHeight = Math.floor(window.innerHeight * .48);

image.addEventListener('click', (e) => {

      if (e.target.className === 'photos') {
          let borderWidth = e.target.dataset.width*1.12;
          let borderLeft = (window.innerWidth - borderWidth)/2;
          let imageLeft = (borderWidth - e.target.dataset.width)/2
          imageEnlarge.style.display = 'block';
          imageEnlarge.style.width = `${borderWidth}px`;
          imageEnlarge.style.left = `${borderLeft}px`;
          enlargedImage.src = e.target.dataset.full;
          enlargedImage.style.height = `${windowPhotoHeight}px`;
          enlargedImage.style.width = `${e.target.dataset.width}px`;
          enlargedImage.style.left = `${imageLeft}px`;
        
      }
  })
  
  exit.addEventListener('click', () => {
      imageEnlarge.style.display = 'none';
  })