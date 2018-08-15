
  let anime = require('../js/anime.js')
  console.log(anime);
  interface Particle {x?:number, y?:number, color?:string, radius?:number, endPos?:{x:number, y:number}, draw?:()=>void};
  var canvasEl = document.querySelector('canvas');
  if(!canvasEl) throw "Can't find canvas"
  var ctx = canvasEl.getContext('2d');
  var numberOfParticules = 30;
  var colors = ['#DD3300', '#882200', '#FF6600', '#666666'];

  function setCanvasSize() {
    if(!canvasEl)throw "no canvas"
    canvasEl.width = canvasEl.offsetWidth * 2
    canvasEl.height = canvasEl.offsetHeight * 2;
    let ctx = canvasEl.getContext('2d');
    if(!ctx) throw "no ctx";
    ctx.scale(2,2)
  }

  function setParticuleDirection(p:Particle):{x:number, y:number} {
    var angle = anime.random(0, 360) * Math.PI / 180;
    var value = anime.random(70, 220);
    var radius = [-1, 1][anime.random(0, 1)] * value;
    if(!p.x || !p.y)throw "article has no pos"
    return {
      x: p.x + radius * Math.cos(angle),
      y: p.y + radius * Math.sin(angle)
    }
  }

  function createParticule(x:number, y:number):Particle {
    var p:Particle = {}
    p.x = x;
    p.y = y;
    p.color = colors[anime.random(0, colors.length - 1)];
    p.radius = anime.random(16, 32);
    p.endPos = setParticuleDirection(p);
    p.draw = function() {
      if(!ctx || !p.x || !p.y || !p.radius || !p.color){
        throw "No context";
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    return p;
  }
  /*
  function createCircle(x,y) {
    var p = {};
    p.x = x;
    p.y = y;
    p.color = '#FFF';
    p.radius = 0.1;
    p.alpha = .5;
    p.lineWidth = 6;
    p.draw = function() {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
      ctx.lineWidth = p.lineWidth;
      ctx.strokeStyle = p.color;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    return p;
  }
  */

  function renderParticule(anim:any) {
    for (var i = 0; i < anim.animatables.length; i++) {
      anim.animatables[i].target.draw();
    }
  }

  export function animateParticules(x:number, y:number) {
    //var circle = createCircle(x, y);
    var particules = [];
    for (var i = 0; i < numberOfParticules; i++) {
      particules.push(createParticule(x, y));
    }
    anime.timeline().add({
      targets: particules,
      x: function(p:any) { return p.endPos.x; },
      y: function(p:any) { return p.endPos.y; },
      radius: 0.2,
      duration: anime.random(1200, 1800),
      easing: 'easeOutExpo',
      update: renderParticule
    })
      /*.add({
      targets: circle,
      radius: anime.random(80, 160),
      lineWidth: 0,
      alpha: {
        value: 0,
        easing: 'linear',
        duration: anime.random(600, 800),
      },
      duration: anime.random(1200, 1800),
      easing: 'easeOutExpo',
      update: renderParticule,
      offset: 0
    });*/
  }

  var render = anime({
    duration: Infinity,
    update: function() {
      if(!ctx || !canvasEl)throw "No c ancas"
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    }
  });

export function setUpExplosions(): void {
  render.play();
  setCanvasSize();
  window.addEventListener('resize', setCanvasSize, false);
}
