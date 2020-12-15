function copy(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
  
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
  
    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        toastr.info('Texte copié dans le presse-papier !')
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        toastr.error('Le texte n\'a pas pu être copié dans le presse-papier')
    }
  
    document.body.removeChild(textArea);
  }