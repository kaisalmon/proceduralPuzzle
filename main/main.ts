import $ from 'jquery'
import Hammer from 'hammerjs'
import swal from 'sweetalert2'
import { OrbPuzzle, Tile, OrbMove} from './orbPuzzle'
import {animatedParticlesFromElement, setUpExplosions } from './explosion'
import { createOrbPuzzle as createPuzzle, load_level, puzzleConfig} from './orbPuzzleGenerator'
import SFX from './sound';
/*globals*/
let player_made_move:boolean = false;
let level_number:number|undefined = undefined;

function delay(ms: number): Promise<void>{
    return new Promise( resolve => setTimeout(resolve, ms) );
}

async function tryUntilSuccess<T, ARGS>(f: (args: ARGS) => T, args: ARGS,  on_e?: (args: ARGS) => void, debug:boolean = false): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let i = 0;
    var t0 = performance.now();

    async function  _attempt(): Promise<void> {
      try {
        let result = await f(args);
        var t1 = performance.now();
        console.log("TIME TO GEN:", (t1-t0)/1000)
        resolve(result)
      } catch (e) {
        if(on_e){
          on_e(args);
        }
        if(debug)console.error(e)
        i++;
        if (i % 10 == 0) {
          console.warn("Over " + i + " attempts..")
        }

        var t1 = performance.now();
        if (t1-t0 > 15000) {
          reject();
          return;
        }
        if (i % 3 == 0) {
        setTimeout(_attempt)
        }else{
          _attempt();
        }
      }
    }


    _attempt();
  })
}

/*
let stack:OrbPuzzle[] = []
let p =new OrbPuzzle(10,10)
p.grid[4][3] = Tile.Pit;
p.orbs.push(new Orb(4,4))
stack.push(p)
p = p.reverse(OrbMove.Up)
stack.push(p)
stack = stack.reverse();
*/
let board: OrbPuzzle;
let moving = false;
let $tiles: (JQuery|undefined)[][];

let level_index:{[l:number]:any, challenge:any, default:any}|null = null;


async function create_level(args:puzzleConfig){
    swal({
      title: 'Generating Level',
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      onOpen: async () => {
        swal.showLoading()
      }
    })

    try {
      function on_err(args:puzzleConfig){
        if(args.seed){
          args.seed++
        }
      }
      let stack = await tryUntilSuccess(createPuzzle, args, on_err, false);
      swal.close();
      return stack
    } catch (e) {
      swal({
        title: "Couldn't generate level!",
        text: "feel free to try a few more times",
        type: "error",
        showCancelButton: true,
        cancelButtonText: "Back to settings",
        confirmButtonText: "New Puzzle",
        useRejections: true,
      }).then(() => {
        window.location.reload();
      }).catch(() => {
        window.location.href = window.location.href.replace("game", "index");
      })
      return
    }
}

function on_level_created():void{
    setTimeout(()=>{
      if(!player_made_move && level_number == 1){
        $('.swipe-prompt-container').css('display', 'block');
        setTimeout(()=>{
          $('.swipe-prompt-container').css('opacity', '1');
        }, 1000);
      }
    }, 2000)
}
function on_player_move():void{
  if(!player_made_move){
      player_made_move = true;
     $('.swipe-prompt-container').css('opacity', '');
     setTimeout(()=>{
       $('.swipe-prompt-container').css('opacity', '');
     }, 1000);
  }
}

$(document).ready(() => {
  setUpExplosions();
  setTimeout(()=>{
    $("#level-info").addClass("hoz-hidden");
  });
  (async function() {
    let params = getUrlVars();
    let stack: [OrbPuzzle[], OrbMove[]] | undefined = undefined;
    let level = parseInt(params['level']);
    if(level){
      $("#level-info").text("Level "+level);
      level_number = level;
      if(level_index === null){
        level_index = await $.getJSON("levels/level_index.json");
        if(!level_index){
          throw "Couldn't load level index";
        }
      }
      let level_data;
      for(var i = 0; i<20; i++){
        level_data = level_index[level]
        if(level_data === undefined){
          level--;
        }
      }
      if(level_data === undefined){
        throw "Level not found"
      }
      if(level_data.fn){
        stack = await load_level(level_data.fn);
      }else{
        level_data = Object.assign({},level_index.default,  level_data)
        stack = await create_level(level_data)
        if(!stack){return}
      }
    }else if(params.round_id){
      if(level_index === null){
        level_index = await $.getJSON("levels/level_index.json");
        if(!level_index){
          throw "Couldn't load level index";
        }
      }
      $("#level-info").text("Daily Challenge");
      let seed = parseInt(params.round_id)*2654435761 % Math.pow(2, 32);
      let level_data = Object.assign({},level_index.challenge,  {seed: seed})
      stack = await create_level(level_data)
      if(!stack){return}
    }else{
      $("#level-info").text("Custom Level");
      let size: number = parseInt(params['size']) || 10;
      let orbs: number = parseInt(params['orbs']) || 2;
      let brick_density: number = params['brick_density'] === undefined ? 5 : parseInt(params['brick_density']) ;
      let pit_density: number = params['pit_density'] === undefined ? 5 : parseInt(params['pit_density']) ;
      let fragile_brick_density: number = params['fragile_brick_density'] === undefined ? 5 : parseInt(params['fragile_brick_density']) ;
      let depth: number = parseInt(params['depth']) || 4;
      let mindepth: number = parseInt(params['mindepth']) || depth;
      let fragile: boolean = params['fragile'] == "true";
      let crystal: boolean = params['crystal'] == "true";
      let pits: boolean = params['pits'] == "true";
      let bombs: boolean = params['bombs'] == "true";
      let portals: boolean = params['portals'] == "true";
      let decoy_pits: boolean = params['decoy_pits'] == "true";
      let decoy_orbs: boolean = params['decoy_orbs'] == "true";
      let decoy_bombs: boolean = params['decoy_bombs'] == "true";
      let decoy_portals: boolean = params['decoy_portals'] == "true";
      let seed:number|undefined = parseInt(params['seed']);
      if(isNaN(seed)){
        seed=undefined;
      }
      let args =  {seed, size, orbs, depth, mindepth, fragile, crystal, pits, bombs, portals, decoy_pits, brick_density, fragile_brick_density, pit_density,decoy_orbs,decoy_bombs, decoy_portals};
      stack = await create_level(args)
      if(!stack){return}
    }


    board = stack[0][0];
    let solution = stack[1]
    $('.hint').click(() => {
      swal(solution.join("\n"))
    });
    $('.back').click(() => {
      if(getUrlVars().round_id){
        window.location.href = window.location.href.replace("game", "index");
      }else{
        window.location.href = window.location.href.replace("game", "levelselect");
      }
    });
    let orig = board;
    $('.reset').click(() => {
      swal({
        title: "Restart puzzle?",
        type: "question",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No!",
        useRejections: true,
        focusCancel: true
      }).then(() => {
        board = orig;
        $tiles = create_board(board);
        moving = false;
      });
    });

    $tiles = create_board(board);

    $('body').keyup((e) => {
      (async function():Promise<void>{
        let move: OrbMove | undefined = undefined;
        switch (e.which) {
          case 37:
            move = OrbMove.Left;
            break;
          case 38:
            move = OrbMove.Up;
            break;
          case 39:
            move = OrbMove.Right;
            break;
          case 40:
            move = OrbMove.Down;
            break;
        }
        await apply_move(move)
      })()
    })


    on_level_created();
  })();

})
function getUrlVars(): { [id: string]: string } {
  var vars: { [id: string]: string } = {};
  window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
    function({ }, key, value: string): string {
      vars[key] = value;
      return "";
    }
  );
  return vars;
}
async function move_orbs(n: number = 0){
  $('.puzzle-wrapper .orb').each((i, e) => {
    (async function(){
      let b = board.orbs[i];
      if (b && !$(e).hasClass('orb--in-pit')) {
        let movement = b.last_moves[n];
        if(movement){
          let abs_mag = Math.max(Math.abs(movement.mag.x), Math.abs(movement.mag.y))
          let s, wait_time= 0;
          if(movement.instant){
            s = 0;
            wait_time = 0.3;
          }else{
            let $t = $tiles[movement.from.x][movement.from.y]
            if($t && $t.hasClass('tile--portal')){
              if(!$t.hasClass('fadeOut')){
                $(e).css('opacity', '')
                delay(200)
                SFX['portal-out'].play();
                animatedParticlesFromElement($t, ['#931eaf', '#372f39', '#3a1f41'],7,15)
                $t.addClass('fadeOut').remove()
              }
            }
            s  = 0.1 * abs_mag;
            wait_time = s;
          }
          let base_transition = "background 0.5s, border 0.5s, filter 0.5s";
          $(e).css('transition', 'transform ' + s + 's ease-in, ' + base_transition)
          $(e).css('transform', 'translate(calc(var(--tsize) * ' + movement.to.x + '), calc(var(--tsize) * ' + movement.to.y + '))')
          if (b.last_moves.length > 0 && (b.last_moves[0].mag.x != 0 || b.last_moves[0].mag.y != 0)) {
            if($(e).hasClass('orb--on-target')){
              $(e).removeClass('orb--on-target');
              if(abs_mag > 0) SFX['leave-goal'].play();
            }
          }

          await delay(wait_time * 1000)

          if(!movement.instant){
            let $t = $tiles[movement.to.x][movement.to.y]
            if($t && $t.hasClass('tile--portal')){
              if(!$t.hasClass('fadeOut')){
                $(e).css('opacity', 0)
                SFX['portal-in'].play();
                animatedParticlesFromElement($t, ['#931eaf', '#372f39', '#3a1f41'],7,15)
                $t.addClass('fadeOut').remove()
              }
            }
          }

          if (board.getTile(movement.to.x, movement.to.y) == Tile.Target) {
            $(e).addClass('orb--on-target');
            if(abs_mag > 0) SFX['hit-goal'].play();
          }
          if (b.in_pit) {
            await delay(100)
            $(e).addClass('orb--in-pit');
            if(abs_mag > 0) SFX['hit-pit'].play();
            $(e).removeClass('orb--on-target');
            $(e).css('transform', 'translate(calc(var(--tsize) * ' + movement.to.x + '), calc(var(--tsize) * ' + movement.to.y + ')) scale(0.7)')
          } else {
            $(e).removeClass('orb--in-pit');
          }
          if (movement.last_contact) {

            let t = board.getTile(movement.last_contact.x, movement.last_contact.y)
            if(abs_mag > 0 && !t) SFX['hit-wall'].play();
            let $t = $tiles[movement.last_contact.x] ?
                        $tiles[movement.last_contact.x][movement.last_contact.y]
                        : undefined

            if(abs_mag > 0 && (!$t || !$t.hasClass("portal"))) SFX['hit-wall'].play();

            if ($t && $t.parent()) {
              if($t.hasClass('tile--fragile') && t == Tile.Empty){
                if(abs_mag > 0) SFX['hit-fragile'].play();
                $t.addClass('animated');
                if (movement.last_contact.x > movement.to.x)
                    $t.addClass('fadeOutRight')
                else if (movement.last_contact.x < movement.to.x)
                    $t.addClass('fadeOutLeft')
                else if (movement.last_contact.y < movement.to.y)
                    $t.addClass('fadeOutUp')
                else if (movement.last_contact.y > movement.to.y)
                    $t.addClass('fadeOutDown')
                setTimeout(() => {
                  if (movement.last_contact) {
                    let $b = $tiles[movement.last_contact.x][movement.last_contact.y];
                    if($b){
                      $b.remove()
                      $b.removeClass('tile--fragile')
                      $b.addClass('DELETED')
                    }
                  }
                }, 1000)
              }else if($t.hasClass('tile--bomb') && t == Tile.Empty){
                  $t.addClass('animated');
                  SFX['hit-bomb'].play();
                  $t.addClass('lit shake')
              }
            }else if(t ===Tile.Empty){
              if(abs_mag > 0) SFX['hit-orb'].play();
            }
          }
        }
      }
    })();
  })

  let time = board.orbs.reduce((t, b) => {
    let movement = b.last_moves[n];
    if(movement){
      if(movement.instant){
        return 2;
      }
      return Math.max(Math.max(Math.abs(movement.mag.x), Math.abs(movement.mag.y)), t)
    }
    return t;
  }, 0) * 100;

  SFX['roll'].playFor(time/1000);
  await delay(time)
  return time > 0;
}

async function apply_move(move: OrbMove | undefined): Promise<void> {
  SFX['swipe'].play();
  if(board.isSolved()){
    return;
  }
  if (move && !moving && board) {
    moving = true;
    board = board.apply(move)

    let max_moves = board.orbs.reduce((max:number, o) => Math.max(max, o.last_moves.length), 0);
    for(let i  = 0; i < max_moves; i++){
      let any_movement = await move_orbs(i);
      if(!any_movement){
        break
      }else{
        on_player_move();
      }
    }
    moving = false;

    for (let x = 0; x < board.width; x++) {
      for (let y = 0; y < board.height; y++) {
        let t = board.getTile(x, y)
        let $t = $tiles[x][y]
        if ($t && t == Tile.Empty && !$t.hasClass('animated')) {
          $t.remove();
        }
        if ($t && t == Tile.Empty && $t.hasClass('lit')) {
          $t.addClass('fadeOut')
          SFX['bomb'].play();
          animatedParticlesFromElement($t);
          moving = true;
          setTimeout(() => {
            if($t){
              $t.removeClass("lit tile--bomb")
              $t.remove()
            }
            moving = false
          }, 500)
        }
      }

      $('.puzzle-wrapper .orb').each((i, e) => {
        let b = board.orbs[i];
        if(b.exploded && !$(e).hasClass("fadeOut")){
          $(e).addClass("animated fadeOut")
        }
      });

      if (board.isSolved()) {
        await delay(500)
        if(!swal.isVisible()){
          if(getUrlVars().level){
            let next_level = parseInt(getUrlVars().level)+1;
            let ls:any = localStorage;
            if(ls.player_progress < next_level){
              ls.player_progress++;
            }
            SFX["ui-victory"].play();
            swal({
              title: "You win!",
              type: "success",
              showCancelButton: true,
              cancelButtonText: "Back to level select",
              confirmButtonText: "Next Puzzle",
              useRejections: true,
            }).then(() => {
              let base =   window.location.href.split("?")[0]
              window.location.href = base+"?level="+next_level
            }).catch(() => {
              window.location.href = window.location.href.replace("game", "index");
            })
          }else{
            swal({
              title: "You win!",
              type: "success",
              showCancelButton: true,
              cancelButtonText: "Back to settings",
              confirmButtonText: "New Puzzle",
              useRejections: true,
            }).then(() => {
              window.location.reload();
            }).catch(() => {
              window.location.href = window.location.href.replace("game", "index");
            })
          }
        }
      }
    }
  }
}

function create_board(board: OrbPuzzle): (JQuery|undefined)[][] {
  $('.puzzle-wrapper').remove();

  let $wrapper = $('<div/>').addClass('puzzle-wrapper').appendTo('body')
  $("body").attr("style", "--tsize:calc(var(--bsize) / " + board.width + ")");
  $('<div/>').addClass('puzzles')
    .appendTo($wrapper)

  $('<div/>').addClass('upper-layer')
    .appendTo($wrapper)

  var $tiles: (JQuery|undefined)[][] = [];
  for (let x = 0; x < board.width; x++) {
    $tiles[x] = []
    for (let y = 0; y < board.height; y++) {
      let t = board.getTile(x, y)
      let layer: "upper" | "lower" = "upper";
      let tileName = 'brick';
      let html = '';
      if (t == Tile.Target) {
        tileName = 'target';
        layer = "lower";
      }
      if (t == Tile.Fragile) {
        tileName = 'fragile';
      }
      if (t == Tile.Crystal) {
        tileName = 'crystal';
      }
      if (t == Tile.Bomb) {
        tileName = 'bomb';
        html = '<i class="fas fa-exclamation-triangle"></i>'
      }
      if (t == Tile.Portal) {
        tileName = 'portal';
        layer = "lower";
      }
      if (t == Tile.Pit) {
        tileName = 'pit';
        layer = "lower";
      }
      if (t == Tile.Empty) {
        tileName = 'empty';
        layer = "lower";
      }
      let $tw = $('<div/>')
        .addClass('tile-wrapper')
        .appendTo(layer == "upper" ? '.upper-layer' : '.puzzles')
        .css('transform', 'translate(calc(var(--tsize) * ' + x + '), calc(var(--tsize) * ' + y + '))')
      let $t = $('<div/>')
        .addClass('tile')
        .addClass('tile--' + tileName)
        .appendTo($tw)
        .html(html);
      /*
      if(board.criticalTiles.find(ct => ct.x == x && ct.y == y)){
        $t.addClass("tile__critical");
      }
      */
      $tiles[x][y] = $t
    }
  }
  for (let b of board.orbs) {
    let $e = $('<div class="orb"/>')
      .css('transform', 'translate(calc(var(--tsize) * ' + b.x + '), calc(var(--tsize) * ' + b.y + '))')
      .data('x', b.x)
      .data('y', b.y)
      .appendTo('.upper-layer')
    if (board.getTile(b.x, b.y) == Tile.Target) {
      $e.addClass('orb--on-target');
    }
  }

  var mc = new Hammer($wrapper[0]);
  mc.get('swipe').set({ direction: Hammer.DIRECTION_ALL });

  mc.on("swipeleft", function() {
    apply_move(OrbMove.Left)
  });
  mc.on("swiperight", function() {
    apply_move(OrbMove.Right)
  });
  mc.on("swipeup", function() {
    apply_move(OrbMove.Up)
  });
  mc.on("swipedown", function() {
    apply_move(OrbMove.Down)
  });



  return $tiles;
}
