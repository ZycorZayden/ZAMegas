({
  canMegaEvo(pokemon) {
    if (pokemon.side.hasMegaEvolved) return null;
    const species = pokemon.species;
    const item = pokemon.getItem();
    const stone = item.megaStone;
    const altFormes = {
      dragonascent: {
        megaStone: {Rayquaza: "Rayquaza-Mega"},
      },
    };
    for (const move of pokemon.baseMoves) {
      const megaEvolution = altFormes[move]?.megaStone?.[species.name];
      if (megaEvolution) {
        if (pokemon.volatiles["dynamax"] || pokemon.terastallized || item.zMove) return null;
        return megaEvolution;
      }
    }
    if (!stone) return null;
    let megaEvolution;
    if (typeof stone === 'string') {
      megaEvolution = stone;
    } else if (typeof stone === 'object') {
      megaEvolution = stone[species.name];
    }
    if (!megaEvolution || megaEvolution === species.name) return null;
    return megaEvolution;
  },
  runMegaEvo(pokemon) {
    const speciesid = pokemon.canMegaEvo || pokemon.canUltraBurst;
    if (!speciesid) return false;
    pokemon.formeChange(speciesid, pokemon.getItem(), true);
    const moveSwaps = {
      "Zygarde-Mega": {oldMove: 'Core Enforcer', newMove: 'Nihillight'}
    };
    const swap = moveSwaps[pokemon.species.name];
    if (swap) {
      const battle = this.battle;
      const oldMoveId = battle.toID(swap.oldMove);
      const newMoveId = battle.toID(swap.newMove);
      const newMove = this.dex.moves.get(newMoveId);
      if (newMove.exists) {
        let replaced;
        for (const slot of pokemon.baseMoveSlots.concat(pokemon.moveSlots)) {
          if (slot.id === oldMoveId) {
            slot.id = newMoveId;
            slot.move = newMove.name;
            slot.target = newMove.target;
            replaced = true;
          }
        }
        if (replaced) {
          const activeMove = this.dex.getActiveMove(newMoveId);
          for (const action of battle.queue.list) {
            if (
              action?.choice === 'move' &&
              action.pokemon === pokemon &&
              (action.moveid === oldMoveId || action.move?.id === oldMoveId)
            ) {
              action.moveid = newMoveId;
              action.move = activeMove;
            }
          }
        }
      }
    }
    const wasMega = pokemon.canMegaEvo;
    pokemon.side.hasMegaEvolved = true;
    for (const ally of pokemon.side.pokemon) {
      if (wasMega) {
        ally.canMegaEvo = null;
      } else {
        ally.canUltraBurst = null;
      }
    }
    this.battle.runEvent("AfterMega", pokemon);
    return true;
  }
})