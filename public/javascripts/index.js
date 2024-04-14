const postMessageBtn = document.querySelector('.post-message')
const messageDialog = document.querySelector('dialog')

if(postMessageBtn) {
  postMessageBtn.addEventListener('click', () => {
    messageDialog.show()
  })
}

