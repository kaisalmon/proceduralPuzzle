import $ from 'jquery'
import Hammer from 'hammerjs'
import swal from 'sweetalert2'
import { OrbPuzzle, Tile, OrbMove } from './orbPuzzle'
import { from_json as createPuzzle } from './orbPuzzleGenerator'

async function tryUntilSuccess<T, ARGS>(f: (args: ARGS) => T, args: ARGS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let i = 0;
    async function  _attempt(): Promise<void> {
      try {
        let result = await f(args);
        resolve(result)
      } catch (e) {
        console.error(e)
        for (var j = 0; j < 10; j++) {
          i++;
          if (i % 100 == 0) {
            console.warn("Over " + i + " attempts..")
          }
          if (i > 5000) {
            reject();
            return;
          }
        }
        setTimeout(_attempt)
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
let $tiles: JQuery[][];
$(document).ready(() => {
  (async function() {
    let params = getUrlVars();
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
    let decoy_pits: boolean = params['decoy_pits'] == "true";
    let decoy_orbs: boolean = params['decoy_orbs'] == "true";

    let stack: [OrbPuzzle[], OrbMove[]] | undefined = undefined;
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
      let args =  {size, orbs, depth, mindepth, fragile, crystal, pits, decoy_pits, brick_density, fragile_brick_density, pit_density,decoy_orbs};
      console.log("ignoring",args);
      stack = await tryUntilSuccess(createPuzzle, undefined);
    //  stack = await tryUntilSuccess(createPuzzle, args);
      swal.close();
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

    board = stack[0][0];
    let solution = stack[1]
    $('.hint').click(() => {
      swal(solution.join("\n"))
    });
    $('.back').click(() => {
      window.location.href = window.location.href.replace("game", "index");
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
      apply_move(move)
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
  })();

})

function apply_move(move: OrbMove | undefined): void {
  if (move && !moving && board) {
    moving = true;
    board = board.apply(move)
    $('.puzzle-wrapper .orb').each((i, e) => {
      let b = board.orbs[i];
      if (b && !$(e).hasClass('orb--in-pit')) {
        let s = 0.1 * (b.last_mag || 0);
        let base_transition = "background 0.5s, border 0.5s, filter 0.5s";
        $(e).css('transition', 'transform ' + s + 's ease-in, ' + base_transition)
        $(e).css('transform', 'translate(calc(var(--tsize) * ' + b.x + '), calc(var(--tsize) * ' + b.y + '))')
        if (b.last_move && (b.last_move[0] != 0 || b.last_move[1] != 0)) {
          $(e).removeClass('orb--on-target');
        }
        setTimeout(() => {
          if (board.getTile(b.x, b.y) == Tile.Target) {
            $(e).addClass('orb--on-target');
          }
          if (b.in_pit) {
            setTimeout(() => {
              $(e).addClass('orb--in-pit');
              $(e).removeClass('orb--on-target');
              $(e).css('transform', 'translate(calc(var(--tsize) * ' + b.x + '), calc(var(--tsize) * ' + b.y + ')) scale(0.7)')
            }, 100)
          } else {
            $(e).removeClass('orb--in-pit');
          }
          if (b.last_contact) {
            let t = board.getTile(b.last_contact.x, b.last_contact.y)
            let $t = $tiles[b.last_contact.x][b.last_contact.y]
            if ($t && t == Tile.Empty) {
              $t.addClass('animated');
              if (b.last_contact.x > b.x)
                $t.addClass('fadeOutRight')
              else if (b.last_contact.x < b.x)
                $t.addClass('fadeOutLeft')
              else if (b.last_contact.y < b.y)
                $t.addClass('fadeOutUp')
              else if (b.last_contact.y > b.y)
                $t.addClass('fadeOutDown')
            }
            setTimeout(() => $t.remove, 1000)
          }
        }, s * 1000)
      }
    })
    let time = board.orbs.reduce((t, b) => Math.max(b.last_mag || 0, t), 0) * 100;
    setTimeout(() => {
      moving = false;
      /* for (let x = 0; x < board.width; x++) {
        for (let y = 0; y < board.height; y++) {
          let t = board.getTile(x, y)
          let $t = $tiles[x][y]
          if ($t && t == Tile.Empty) {
            $t.remove();
          }
        }
      } */
      if (board.isSolved()) {
        setTimeout(() => {
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
        }, 400);
      }
    }, time)
  }
}

function create_board(board: OrbPuzzle): JQuery[][] {
  $('.puzzle-wrapper').remove();

  let $wrapper = $('<div/>').addClass('puzzle-wrapper').appendTo('body')
  $("body").attr("style", "--tsize:calc(var(--bsize) / " + board.width + ")");
  $('<div/>').addClass('puzzles')
    .appendTo($wrapper)

  $('<div/>').addClass('upper-layer')
    .appendTo($wrapper)

  var $tiles: JQuery[][] = [];
  for (let x = 0; x < board.width; x++) {
    $tiles[x] = []
    for (let y = 0; y < board.height; y++) {
      let t = board.getTile(x, y)
      let layer: "upper" | "lower" = "upper";
      if (t == Tile.Empty) {
        continue;
      }
      let tileName = 'brick';
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
      if (t == Tile.Pit) {
        tileName = 'pit';
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
