document.querySelectorAll(".session-gallery").forEach(function (gallery) {
  var track = gallery.querySelector(".session-gallery__track");
  var prev = gallery.querySelector(".session-gallery__prev");
  var next = gallery.querySelector(".session-gallery__next");
  if (!track) return;

  function scrollByOne(direction) {
    var item = track.querySelector(".session-gallery__image");
    var amount = item ? item.getBoundingClientRect().width + 16 : track.clientWidth;
    track.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  if (prev) prev.addEventListener("click", function () { scrollByOne(-1); });
  if (next) next.addEventListener("click", function () { scrollByOne(1); });
});
