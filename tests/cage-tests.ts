import {
    describe,
    it
} from 'mocha';
import * as assert from 'assert';
import boxen from 'boxen';

import {
    load_level_from_file
} from '../main/orbPuzzleGenerator'

describe('Cage Mechanics', () => {
  describe('getCagePairs', () => {
    it('Gets one pair going across', async () => {
      const [[level]] = await load_level_from_file('../tests/fixtures/cage.json');
      console.log(boxen(level.toString()))
      const pairs = level.getCagePairs([1, 0]);
      assert.ok(pairs);
      assert.equal(pairs.length, 1);
      const [pair] = pairs;
      assert.ok(pair.orb);
      assert.ok(pair.cagedOrb);
    });
    it('Gets zero pairs going across', async () => {
      const [[level]] = await load_level_from_file('../tests/fixtures/cage.json');
      const pairs = level.getCagePairs([0, 1]);
      assert.ok(pairs);
      assert.equal(pairs.length, 0);
    });
  });
  describe('reverseCage', () => {
    it('Correctly puts one orb in a cage', async () => {
      const [[level]] = await load_level_from_file('../tests/fixtures/cage.json');
      level.reverseCage([1, 0]);
      assert.equal(level.orbs.filter(o=>o.caged).length, 1, "One orb should caged");
      assert.equal(level.orbs.filter(o=>!o.caged).length, 1, "One orb should uncaged");
    });
  });
});
