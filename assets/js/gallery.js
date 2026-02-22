/*  PortPic GSAP Gallery
    Converts .photo-grid into a swipeable carousel with GSAP animations.
    Requires GSAP core (loaded via CDN in each device page).
*/
(function(){
  "use strict";

  var grid = document.querySelector(".photo-grid");
  if (!grid) return;

  var images = Array.prototype.slice.call(grid.querySelectorAll("img"));
  if (images.length === 0) return;

  /* ── Build gallery DOM ── */
  var wrap = document.createElement("div");
  wrap.className = "gallery";

  var track = document.createElement("div");
  track.className = "gallery-track";

  images.forEach(function(img){
    var slide = document.createElement("div");
    slide.className = "gallery-slide";
    var clone = img.cloneNode(true);
    clone.removeAttribute("loading");
    slide.appendChild(clone);
    track.appendChild(slide);
  });

  wrap.appendChild(track);

  /* Prev / Next buttons */
  var prev = document.createElement("button");
  prev.className = "gallery-btn gallery-prev";
  prev.setAttribute("aria-label","Previous");
  prev.innerHTML = "&#8249;";
  wrap.appendChild(prev);

  var next = document.createElement("button");
  next.className = "gallery-btn gallery-next";
  next.setAttribute("aria-label","Next");
  next.innerHTML = "&#8250;";
  wrap.appendChild(next);

  /* Tap hint for mobile */
  var hint = document.createElement("div");
  hint.className = "gallery-tap-hint";
  hint.textContent = "Swipe or tap arrows";
  wrap.appendChild(hint);

  /* Dots */
  var dotsRow = document.createElement("div");
  dotsRow.className = "gallery-dots";
  images.forEach(function(_,i){
    var d = document.createElement("div");
    d.className = "gallery-dot" + (i === 0 ? " active" : "");
    d.setAttribute("data-i", i);
    dotsRow.appendChild(d);
  });

  /* Counter */
  var counter = document.createElement("div");
  counter.className = "gallery-counter";
  counter.textContent = "1 / " + images.length;

  /* Thumbnail strip */
  var thumbRow = document.createElement("div");
  thumbRow.className = "gallery-thumb-row";
  images.forEach(function(img, i){
    var t = document.createElement("div");
    t.className = "gallery-thumb" + (i === 0 ? " active" : "");
    t.setAttribute("data-i", i);
    var ti = document.createElement("img");
    ti.src = img.src;
    ti.alt = img.alt;
    t.appendChild(ti);
    thumbRow.appendChild(t);
  });

  /* Replace .photo-grid with gallery */
  var parent = grid.parentNode;
  parent.replaceChild(wrap, grid);
  parent.appendChild(dotsRow);
  parent.appendChild(counter);
  parent.appendChild(thumbRow);

  /* ── State ── */
  var current = 0;
  var total = images.length;
  var animating = false;

  function goTo(index, direction){
    if (animating || index === current) return;
    if (index < 0) index = total - 1;
    if (index >= total) index = 0;
    animating = true;

    var dir = typeof direction === "number" ? direction : (index > current ? 1 : -1);

    /* Animate out current slide, then snap */
    gsap.to(track, {
      x: -(index * 100) + "%",
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: function(){
        animating = false;
      }
    });

    /* Fade-scale the incoming slide */
    var slides = track.querySelectorAll(".gallery-slide");
    gsap.fromTo(slides[index], {
      opacity: 0.4,
      scale: 0.96
    }, {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: "power2.out"
    });

    current = index;
    updateUI();
  }

  function updateUI(){
    /* Dots */
    var dots = dotsRow.querySelectorAll(".gallery-dot");
    dots.forEach(function(d, i){
      if (i === current) d.classList.add("active");
      else d.classList.remove("active");
    });
    /* Counter */
    counter.textContent = (current + 1) + " / " + total;
    /* Thumbs */
    var thumbs = thumbRow.querySelectorAll(".gallery-thumb");
    thumbs.forEach(function(t, i){
      if (i === current) {
        t.classList.add("active");
        /* Scroll thumb into view */
        t.scrollIntoView({behavior:"smooth", block:"nearest", inline:"center"});
      } else {
        t.classList.remove("active");
      }
    });
  }

  /* ── Controls ── */
  prev.addEventListener("click", function(e){ e.stopPropagation(); goTo(current - 1, -1); });
  next.addEventListener("click", function(e){ e.stopPropagation(); goTo(current + 1, 1); });

  dotsRow.addEventListener("click", function(e){
    var dot = e.target.closest(".gallery-dot");
    if (dot) goTo(parseInt(dot.getAttribute("data-i"), 10));
  });

  thumbRow.addEventListener("click", function(e){
    var thumb = e.target.closest(".gallery-thumb");
    if (thumb) goTo(parseInt(thumb.getAttribute("data-i"), 10));
  });

  /* Keyboard arrows */
  document.addEventListener("keydown", function(e){
    if (e.key === "ArrowLeft") goTo(current - 1, -1);
    if (e.key === "ArrowRight") goTo(current + 1, 1);
  });

  /* ── Touch / drag support ── */
  var startX = 0, moveX = 0, dragging = false;
  var threshold = 50;

  track.addEventListener("touchstart", function(e){
    startX = e.touches[0].clientX;
    dragging = true;
  }, {passive:true});

  track.addEventListener("touchmove", function(e){
    if (!dragging) return;
    moveX = e.touches[0].clientX - startX;
  }, {passive:true});

  track.addEventListener("touchend", function(){
    if (!dragging) return;
    dragging = false;
    if (Math.abs(moveX) > threshold){
      if (moveX < 0) goTo(current + 1, 1);
      else goTo(current - 1, -1);
    }
    moveX = 0;
  });

  /* Mouse drag */
  track.addEventListener("mousedown", function(e){
    startX = e.clientX;
    dragging = true;
    track.classList.add("dragging");
    e.preventDefault();
  });
  document.addEventListener("mousemove", function(e){
    if (!dragging) return;
    moveX = e.clientX - startX;
  });
  document.addEventListener("mouseup", function(){
    if (!dragging) return;
    dragging = false;
    track.classList.remove("dragging");
    if (Math.abs(moveX) > threshold){
      if (moveX < 0) goTo(current + 1, 1);
      else goTo(current - 1, -1);
    }
    moveX = 0;
  });

  /* ── Lightbox on slide click ── */
  track.addEventListener("click", function(e){
    if (Math.abs(moveX) > 5) return; /* ignore drag-clicks */
    var lb = document.getElementById("lb");
    var lbImg = document.getElementById("lbImg");
    if (lb && lbImg){
      var slides = track.querySelectorAll(".gallery-slide img");
      lbImg.src = slides[current].src;
      lb.classList.add("open");
    }
  });

  /* ── Mobile hint ── */
  if ("ontouchstart" in window && total > 1){
    hint.classList.add("show");
    setTimeout(function(){ hint.classList.remove("show"); }, 3000);
  }

  /* ── Initial GSAP entrance animation ── */
  gsap.from(wrap, {
    opacity: 0,
    y: 30,
    duration: 0.6,
    ease: "power2.out",
    scrollTrigger: wrap
  });

})();
