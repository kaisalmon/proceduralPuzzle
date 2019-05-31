import {
    describe,
    it
} from 'mocha';
import {
    expect
} from 'chai';
import {
    OrbPuzzle
} from '../main/orbPuzzle'
import {
    from_json,
    load_level_from_file
} from '../main/orbPuzzleGenerator'
// if you used the '@types/mocha' method to install mocha type definitions, uncomment the following line
// import 'mocha';

describe('OrbPuzzle.getHintCoords', () => {
    it('should return a valid result for a complex puzzle', async () => {
        var level_json = {
            "criticalTiles": [{
                "x": 2,
                "y": 1
            }, {
                "x": 3,
                "y": 2
            }, {
                "x": 6,
                "y": 4
            }, {
                "x": 2,
                "y": 0
            }, {
                "x": 3,
                "y": 1
            }, {
                "x": 1,
                "y": 0
            }, {
                "x": 1,
                "y": 1
            }, {
                "x": 2,
                "y": 1
            }, {
                "x": 6,
                "y": 3
            }, {
                "x": 5,
                "y": 4
            }, {
                "x": 5,
                "y": 3
            }, {
                "x": 0,
                "y": 1
            }, {
                "x": 5,
                "y": 5
            }, {
                "x": 0,
                "y": 2
            }, {
                "x": 5,
                "y": 6
            }, {
                "x": 0,
                "y": 4
            }, {
                "x": 0,
                "y": 3
            }, {
                "x": 1,
                "y": 1
            }],
            "orbs": [{
                "x": 6,
                "y": 6
            }, {
                "reversed_move_count": 6,
                "x": 0,
                "y": 5
            }, {
                "index": -1,
                "decoy": false,
                "in_pit": false,
                "in_portal": false,
                "exploded": false,
                "last_moves": [],
                "reversed_move_count": 1,
                "x": 1,
                "y": 2
            }, {
                "x": 0,
                "y": 0
            }],
            "grid": [
                [" ", "□", "□", " ", " ", " ", "▼"],
                [" ", "▼", " ", " ", "□", "■", " "],
                ["□", "◎", "□", " ", " ", "▼", " "],
                ["□", "□", "◎", "□", " ", " ", " "],
                [" ", "□", " ", " ", " ", " ", "□"],
                [" ", " ", "□", " ", "□", " ", " "],
                [" ", "▼", " ", " ", "◎", "■", " "]
            ],
            width: 7, height : 7
        }

        var [golden_path] = await from_json(level_json);

        var hint_paths = OrbPuzzle.getHintCoords(golden_path);
        expect(hint_paths).to.be.an('array').that.is.not.empty;
        for(var orb_path of hint_paths){
          expect(orb_path).to.be.an('array').that.is.not.empty;
          for(var move_coords of orb_path){
            expect(move_coords).to.be.an('array').that.is.not.empty;
            for(var coord of move_coords){
              expect(coord).to.have.property('x');
              expect(coord).to.have.property('y');
            }
          }
        }
    }).timeout(5000);
    it('should return a valid result for a simple puzzle', async () => {
        var level_json = {

            "orbs": [{x: 2, y:1}],
            "grid": [
                ["□", " ", " "],
                ["□", " ", "■"],
                ["□", " ", "◎"],
            ],
            criticalTiles:[],
            width: 3, height : 3
        }

        var [golden_path] = await from_json(level_json);
        expect(golden_path).to.have.lengthOf(2);
        var hint_paths = OrbPuzzle.getHintCoords(golden_path);
        expect(hint_paths).to.have.lengthOf(1);
        for(var orb_path of hint_paths){
          expect(orb_path).to.have.lengthOf(2);
          for(var move_coords of orb_path){
            expect(move_coords).to.have.lengthOf(1);
            for(var coord of move_coords){
              expect(coord).to.have.property('x');
              expect(coord).to.have.property('y');
            }
          }
        }
    });
    it('should return a valid result for intro_1.json', async () => {

        var [golden_path] = await load_level_from_file('intro_1.json');
        var hint_paths = OrbPuzzle.getHintCoords(golden_path);
        expect(hint_paths).to.have.lengthOf(1);
        for(var orb_path of hint_paths){
          expect(orb_path).to.have.lengthOf(3);
          for(var move_coords of orb_path){
            expect(move_coords).to.have.lengthOf(1);
            for(var coord of move_coords){
              expect(coord).to.have.property('x');
              expect(coord).to.have.property('y');
            }
          }
        }
    });
});
