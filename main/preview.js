"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BP = require("./boulderpuzzle");
var $ = require("jquery");
/*
let p =new BoulderPuzzle(10,10)
p.grid[4][3] = Tile.Pit;
p.boulders.push(new Boulder(4,4))
stack.push(p)
p = p.reverse(BoulderMove.Up)
stack.push(p)
stack = stack.reverse();
*/
var p = new BP.BoulderPuzzle({ width: 10, height: 10, boulders: 2 });
var stack = p.getStack(4, true);
console.log(stack);
$(document).ready(function () {
    var $wrapper = $('<div/>').addClass('puzzle-wrapper').appendTo('body');
    var $div = $('<div/>').addClass('puzzles').appendTo($wrapper);
    stack.forEach(function (s) {
        $('<pre/>').text(s.toString()).appendTo($div);
    });
    $($('.puzzles pre').hide()[0]).show();
    $('.puzzles pre').click(function () {
        if ($(this).next().length != 0)
            $(this).hide().next().show();
    });
    $('.puzzles pre').contextmenu(function () {
        if ($(this).prev().length != 0)
            $(this).hide().prev().show();
        return false;
    });
    console.log(stack);
});
