import { useState, useEffect, useRef } from "react";
import { getPokemon as getSpeciesData } from "../data/pokemonService";
import categoryIcons from "../data/categoryIcons";
import { generateRandomIVs, getRandomNature, calculateStats } from "../data/statCalculator.js";


const FEMALE_BACK_IDS = [
  3,12,19,20,25,26,41,44,45,64,65,84,85,97,111,112,118,119,123,129,130,133,154,
  165,166,178,185,186,190,194,195,198,203,207,208,212,214,215,217,221,224,229,
  232,255,256,257,267,269,272,274,275,307,308,315,316,317,322,323,350,369,396,
  397,399,401,402,403,404,405,407,418,419,424,443,445,449,450,453,454,456,457,
  459,461,464,473,521,592,593,678,876
];

export default function Battle() {
  const [myPokemon, setMyPokemon] = useState(null);
  const [enemy, setEnemy] = useState(null);
  const [team, setTeam] = useState([]);
  const [items, setItems] = useState([]);
  const [battleLog, setBattleLog] = useState([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const [battleOver, setBattleOver] = useState(false);
  const [showSwitchPopup, setShowSwitchPopup] = useState(false);
  const [selectedSwitch, setSelectedSwitch] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectingPokemon, setSelectingPokemon] = useState(false);
  const [highlightedPokemon, setHighlightedPokemon] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(0);
  const [turnUsed, setTurnUsed] = useState(false); // ✅ Control de turno
  const [skipEnemyTurn, setSkipEnemyTurn] = useState(false); // 🧩 Evita doble ataque enemigo
  const hasFetchedRef = useRef(false);
  const logRef = useRef(null); // ✅ Referencia para auto-scroll del log
  

  const CATEGORIES = ["Medicinas", "Poke Balls", "Objetos de Batalla", "Berries"];
  const genderSymbol = (g) => {
  if (g === "male") return " ♂️";
  if (g === "female") return " ♀️";
  if (g === "genderless") return " ";
    return " ❓"; // para depurar si algo llega vacío
  };

    // 🧮 Cálculo de daño físico (Attack vs Defense)
  const calcPhysicalDamage = (attacker, defender) => {
    const atk = attacker?.stats?.attack || 10;
    const def = defender?.stats?.defense || 10;
    const level = attacker?.level || 5;

    // fórmula simplificada inspirada en la de Pokémon real
    const baseDamage = (((2 * level / 5 + 2) * atk / def) / 2) + 2;
    const randomFactor = 0.85 + Math.random() * 0.15; // variación 85–100%
    return Math.max(1, Math.floor(baseDamage * randomFactor));
  };

  // 🧮 Cálculo de daño especial (SpAttack vs SpDefense)
  const calcSpecialDamage = (attacker, defender) => {
    const atk = attacker?.stats?.special_attack || 10;
    const def = defender?.stats?.special_defense || 10;
    const level = attacker?.level || 5;

    const baseDamage = (((2 * level / 5 + 2) * atk / def) / 2) + 2;
    const randomFactor = 0.85 + Math.random() * 0.15;
    return Math.max(1, Math.floor(baseDamage * randomFactor));
  };


  const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  const getBackSprite = (pokemon) => {
    const gender = pokemon.gender || "male";
    const isShiny = pokemon.shiny || false;
    const pokeId = pokemon.species?.pokedex_id || pokemon.id;
    const hasFemaleBack = FEMALE_BACK_IDS.includes(pokeId);
    if (gender === "female" && hasFemaleBack && isShiny)
      return `/sprites/sprites/pokemon/back/shiny/female/${pokeId}.png`;
    if (gender === "female" && hasFemaleBack)
      return `/sprites/sprites/pokemon/back/female/${pokeId}.png`;
    if (isShiny)
      return `/sprites/sprites/pokemon/back/shiny/${pokeId}.png`;
    return `/sprites/sprites/pokemon/back/${pokeId}.png`;
  };

  const getFrontSprite = (pokemon) => {
    const isShiny = pokemon.shiny || false;
    const pokeId = pokemon.species?.pokedex_id || pokemon.id;
    if (isShiny)
      return `/sprites/sprites/pokemon/shiny/${pokeId}.png`;
    return `/sprites/sprites/pokemon/${pokeId}.png`;
  };

  // ✅ Auto-scroll del log al final
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [battleLog]);

  // 🧩 Carga inicial
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchData = async () => {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData) return;

      const [resPkm, resItems] = await Promise.all([
        fetch("http://localhost:8000/api/pokemons/?active=true", { credentials: "include" }),
        fetch("http://localhost:8000/api/user/items/", { credentials: "include" }),
      ]);

      const teamData = (await resPkm.json())
        .filter((p) => p.user === userData.id)
        .sort((a, b) => a.slot - b.slot);
      setTeam(teamData);

      const alivePokemon = teamData.find((p) => p.current_hp > 0);
      if (!alivePokemon) {
        setBattleOver(true);
        setBattleLog(["💀 Todos tus Pokémon están debilitados."]);
        return;
      }

      const myWithSprite = { ...alivePokemon, backSprite: getBackSprite(alivePokemon) };
      setMyPokemon(myWithSprite);

      // 🔹 Obtener movimientos actuales del Pokémon
      const movesRes = await fetch(`http://localhost:8000/api/pokemons/${alivePokemon.id}/current-moves/`, { credentials: "include" });
      const movesData = await movesRes.json();

      // Agregamos PP actual y máximo
      const movesWithPP = movesData.map(m => ({
        id: m.id ?? m.pokemon_current_move_id ?? m.move_instance_id, // 👈 intenta varias claves posibles
        move: m.move,
        slot: m.slot,
        pp_current: m.pp_current ?? m.move.pp,
        pp_max: m.pp_max ?? m.move.pp,
      }));

      setMyPokemon((prev) => ({ ...prev, moves: movesWithPP }));

      const itemsData = await resItems.json();
      setItems(itemsData);

      const randomId = Math.floor(Math.random() * 1000) + 1;
      const enemySpecies = await getSpeciesData(randomId, 5);
      let randomGender = "";
      const rate = enemySpecies.gender_rate;

      // ⚙️ Asignar correctamente según el gender_rate de la especie
      if (rate === -1) {
        randomGender = "genderless";
        
      } else if (rate === 0) {
        randomGender = "male";
        
      } else if (rate === 8) {
        randomGender = "female";
        
      } else if (typeof rate === "number") {
        // Cada punto = 12.5% de probabilidad de ser hembra (como en PokéAPI)
        const femaleChance = (rate / 8) * 100;
        randomGender = Math.random() * 100 < femaleChance ? "female" : "male";
      }
      // 🧬 Generar IVs, naturaleza y stats calculados correctamente
      const ivs = generateRandomIVs();
      const nature = getRandomNature();
      const calculatedStats = calculateStats(enemySpecies.baseStats, 5, ivs, nature);

      const enemyPokemon = {
        id: "wild",
        nickname: enemySpecies.displayName,
        pokedex_id: enemySpecies.id, // 👈 muy importante para capturas
        sprite: enemySpecies.sprite,
        gender: randomGender,
        shiny: enemySpecies.shiny,
        baseStats: enemySpecies.baseStats,
        ivs,
        nature,
        stats: calculatedStats,
        level: 5,
        current_hp: calculatedStats.hp,
      };

      setEnemy(enemyPokemon);
      // 🔹 Asignar movimientos aleatorios según su especie y nivel
      const moveRes = await fetch(`http://localhost:8000/api/pokemon-species/${enemySpecies.id}/moves/`);
      const allMoves = await moveRes.json();

      // Solo los que aprende por nivel y <= a su nivel
      const filteredMoves = allMoves
        .filter(m => m.learn_method === "level-up" && (!m.level_learned_at || m.level_learned_at <= enemyPokemon.level))
        .sort((a, b) => b.level_learned_at - a.level_learned_at)
        .slice(0, 4);

      // Añade PP y descripción
      const enemyMoves = filteredMoves.map(m => ({
        ...m,
        pp_current: m.move.pp,
        pp_max: m.move.pp,
      }));

      setEnemy(prev => ({ ...prev, moves: enemyMoves }));

      setBattleLog([
        `🌿 ¡Un ${enemyPokemon.nickname}${enemyPokemon.shiny ? " ✨" : ""}${genderSymbol(enemyPokemon.gender)} salvaje apareció!`
      ]);
    };
    fetchData();
  }, []);
  
  const updatePokemonHP = async (pokemonId, hp) => {
    try {
      const csrfToken = getCookie("csrftoken");
      await fetch(`http://localhost:8000/api/pokemons/${pokemonId}/`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
        body: JSON.stringify({ current_hp: hp }),
      });
    } catch (err) {
      console.error("❌ Error actualizando HP:", err);
    }
  };

  // ✅ CURACIÓN con actualización en BD y uso de turno
  const handleUseItem = async (pokemon) => {
    if (!selectedItem || turnUsed || battleOver) return;
  // 🎯 Captura con Poké Balls
    if (selectedItem.template_category === "Poke Balls") {
      setSkipEnemyTurn(true); // ❌ evita doble ataque
      const csrfToken = getCookie("csrftoken");
      const res = await fetch("http://localhost:8000/api/battle/throw_ball/", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify({
      item_id: selectedItem.id,
      enemy: {
        pokedex_id: enemy.pokedex_id || 1,
        level: enemy.level,
        current_hp: enemy.current_hp,
        max_hp: enemy.stats.hp,
        gender: enemy.gender,
        ivs: enemy.ivs,
        nature: enemy.nature,
        nature_name: enemy.nature.name || enemy.nature,
        base_stats: enemy.baseStats,
      },
    }),
  });

    const data = await res.json();

    if (data.captured) {
      setBattleLog((prev) => [...prev, data.message]);
      setBattleOver(true); // ✅ Solo termina si capturas
    } else {
      setBattleLog((prev) => [...prev, data.message, "⚔️ ¡El enemigo sigue en pie!"]);
      setTurnUsed(true); // ✅ Gasta turno si falló
      setSkipEnemyTurn(false); // ✅ Permite que el enemigo ataque
    }


    setItems((prev) =>
      prev.map((i) =>
        i.id === selectedItem.id ? { ...i, quantity: i.quantity - 1 } : i
      )
    );

    return;
  }

    try {
      const csrfToken = getCookie("csrftoken");
      const res = await fetch("http://localhost:8000/api/use_item/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
          pokemon_id: pokemon.id,
          item_id: selectedItem.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al usar el ítem.");

      // 🔄 Actualizar equipo e ítems locales
      setTeam((prev) =>
        prev.map((p) =>
          p.id === pokemon.id ? { ...p, current_hp: data.pokemon.current_hp } : p
        )
      );
      if (myPokemon?.id === pokemon.id)
        setMyPokemon((prev) => ({ ...prev, current_hp: data.pokemon.current_hp }));

      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id
            ? { ...i, quantity: Math.max(0, data.item_remaining) }
            : i
        )
      );

      setBattleLog((prev) => [
        ...prev,
        `💖 ${pokemon.nickname} recuperó salud con ${selectedItem.template_name}.`,
      ]);

      setSelectingPokemon(false);
      setSelectedItem(null);
      setTurnUsed(true);
    } catch (err) {
      console.error("❌ Error al usar el ítem:", err);
      setBattleLog((prev) => [...prev, "❌ Error al aplicar el objeto."]);
    }
  };  

    function applyMoveEffect(move, attacker, defender, setBattleLog) {
    const log = [];
    const name = move.move.name.toLowerCase();

    if (move.move.category !== "status") return log;

    // ==============================
    // 💥 Reducciones de estadísticas
    // ==============================
    if (name.includes("growl")) {
      defender.tempAttackMod = (defender.tempAttackMod || 1) * 0.75;
      log.push(`😾 El ataque de ${defender.nickname} bajó.`);
    } 
    else if (name.includes("tail whip") || name.includes("leer")) {
      defender.tempDefenseMod = (defender.tempDefenseMod || 1) * 0.75;
      log.push(`🌀 La defensa de ${defender.nickname} se redujo.`);
    }
    else if (name.includes("string shot")) {
      defender.tempSpeedMod = (defender.tempSpeedMod || 1) * 0.75;
      log.push(`🕸️ La velocidad de ${defender.nickname} disminuyó.`);
    }
    else if (name.includes("fake tears")) {
      defender.tempSpDefenseMod = (defender.tempSpDefenseMod || 1) * 0.75;
      log.push(`😭 La defensa especial de ${defender.nickname} bajó.`);
    }
    else if (name.includes("screech")) {
      defender.tempDefenseMod = (defender.tempDefenseMod || 1) * 0.5;
      log.push(`🔊 La defensa de ${defender.nickname} bajó drásticamente.`);
    }

    // ==============================
    // 💪 Aumentos de estadísticas
    // ==============================
    else if (name.includes("swords dance")) {
      attacker.tempAttackMod = (attacker.tempAttackMod || 1) * 1.5;
      log.push(`💪 El ataque de ${attacker.nickname} aumentó.`);
    }
    else if (name.includes("growth")) {
      attacker.tempSpAttackMod = (attacker.tempSpAttackMod || 1) * 1.5;
      log.push(`🌿 El ataque especial de ${attacker.nickname} aumentó.`);
    }
    else if (name.includes("iron defense")) {
      attacker.tempDefenseMod = (attacker.tempDefenseMod || 1) * 1.5;
      log.push(`🛡️ La defensa de ${attacker.nickname} aumentó.`);
    }
    else if (name.includes("agility")) {
      attacker.tempSpeedMod = (attacker.tempSpeedMod || 1) * 1.5;
      log.push(`⚡ La velocidad de ${attacker.nickname} aumentó.`);
    }
    else if (name.includes("calm mind")) {
      attacker.tempSpAttackMod = (attacker.tempSpAttackMod || 1) * 1.5;
      attacker.tempSpDefenseMod = (attacker.tempSpDefenseMod || 1) * 1.5;
      log.push(`🧘 ${attacker.nickname} aumentó su ataque y defensa especial.`);
    }
    else if (name.includes("bulk up")) {
      attacker.tempAttackMod = (attacker.tempAttackMod || 1) * 1.5;
      attacker.tempDefenseMod = (attacker.tempDefenseMod || 1) * 1.5;
      log.push(`🏋️ ${attacker.nickname} fortaleció su ataque y defensa.`);
    }

    // ==============================
    // ⚡️ Cambios de estado
    // ==============================
    else if (name.includes("thunder wave")) {
      defender.status = "paralyzed";
      log.push(`⚡ ${defender.nickname} quedó paralizado.`);
    }
    else if (name.includes("sleep powder")) {
      defender.status = "sleep";
      defender.sleepTurns = 2 + Math.floor(Math.random() * 3);
      log.push(`💤 ${defender.nickname} se durmió.`);
    }

    return log;
  }




    // ✅ ATAQUE con turnos
    const handleMoveAttack = async (slot) => {

      // 💤 Verifica estados antes de atacar
    if (myPokemon.status === "sleep") {
      myPokemon.sleepTurns -= 1;
      if (myPokemon.sleepTurns <= 0) {
        myPokemon.status = null;
        setBattleLog((prev) => [...prev, `${myPokemon.nickname} despertó.`]);
      } else {
        setBattleLog((prev) => [...prev, `${myPokemon.nickname} está dormido y no puede atacar.`]);
        setTurnUsed(true);
        return;
      }
    }

    if (myPokemon.status === "paralyzed" && Math.random() < 0.25) {
      setBattleLog((prev) => [...prev, `${myPokemon.nickname} está paralizado y no se mueve.`]);
      setTurnUsed(true);
      return;
    }


    if (!myPokemon || !enemy || battleOver || isAttacking || turnUsed) return;
    if (slot.pp_current <= 0) return;

    setIsAttacking(true);
    const log = [];

    // 🚫 Si es movimiento de estado, no hace daño
    if (slot.move.category === "status") {
      const effectLog = applyMoveEffect(slot, myPokemon, enemy, setBattleLog);
      if (effectLog.length > 0) {
        setBattleLog((prev) => [...prev, ...effectLog]);
      } else {
        setBattleLog((prev) => [
          ...prev,
          `⚪ ${myPokemon.nickname} usó ${slot.move.name.toUpperCase()} (sin efecto).`
        ]);
      }
      setTurnUsed(true);
      setIsAttacking(false);
      return; // 👈 evita que calcule daño
    }

      // Aplicar todos los modificadores de estadísticas
    const power = slot.move.power || 40;

    const attacker = {
      ...myPokemon,
      stats: {
        ...myPokemon.stats,
        attack: myPokemon.stats.attack * (myPokemon.tempAttackMod || 1),
        defense: myPokemon.stats.defense * (myPokemon.tempDefenseMod || 1),
        special_attack: myPokemon.stats.special_attack * (myPokemon.tempSpAttackMod || 1),
        special_defense: myPokemon.stats.special_defense * (myPokemon.tempSpDefenseMod || 1),
        speed: myPokemon.stats.speed * (myPokemon.tempSpeedMod || 1),
      },
    };

    const defender = {
      ...enemy,
      stats: {
        ...enemy.stats,
        attack: enemy.stats.attack * (enemy.tempAttackMod || 1),
        defense: enemy.stats.defense * (enemy.tempDefenseMod || 1),
        special_attack: enemy.stats.special_attack * (enemy.tempSpAttackMod || 1),
        special_defense: enemy.stats.special_defense * (enemy.tempSpDefenseMod || 1),
        speed: enemy.stats.speed * (enemy.tempSpeedMod || 1),
      },
    };


    const base = slot.move.category === "physical"
      ? calcPhysicalDamage(attacker, defender)
      : calcSpecialDamage(attacker, defender);

    const dmg = Math.floor(base * (power / 50));



    const newEnemyHP = Math.max(0, enemy.current_hp - dmg);
    const newPP = Math.max(0, slot.pp_current - 1);

    // Actualiza PP del movimiento usado
    setMyPokemon((prev) => ({
      ...prev,
      moves: prev.moves.map((m) =>
        m.move.id === slot.move.id ? { ...m, pp_current: newPP } : m
      ),
    }));
    // 🛡️ Evita enviar PATCH con ID undefined
    if (slot.id) {
      try {
        const csrfToken = getCookie("csrftoken");
        await fetch(`http://localhost:8000/api/pokemon-current-moves/${slot.id}/`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({ pp_current: newPP }),
        });
      } catch (err) {
        console.error("❌ Error actualizando PP en backend:", err);
      }
    } else {
      console.warn("⚠️ Movimiento sin ID, no se envió PATCH:", slot);
    }


    // Aplica efectos de estado si corresponde
    const effectLog = applyMoveEffect(slot, myPokemon, enemy, setBattleLog);
    if (effectLog.length > 0) log.push(...effectLog);

    log.push(
      `💥 ${myPokemon.nickname} usó ${slot.move.name.toUpperCase()} e hizo ${dmg} de daño.`
    );


    setEnemy((prev) => ({ ...prev, current_hp: newEnemyHP }));

    if (newEnemyHP <= 0) log.push(`💀 ${enemy.nickname} ha caído.`);

    setBattleLog((prev) => [...prev, ...log]);
    setIsAttacking(false);
    setTurnUsed(true);
  };



  const handleSpecialAttack = async () => {
  if (!myPokemon || !enemy || battleOver || isAttacking || turnUsed) return;
  if (myPokemon.current_hp <= 0) {
    setBattleLog((prev) => [...prev, "❌ No puedes atacar con un Pokémon debilitado."]);
    return;
  }

  setIsAttacking(true);
  const log = [];

  const dmg = calcSpecialDamage(myPokemon, enemy);
  const newEnemyHP = Math.max(0, enemy.current_hp - dmg);
  log.push(`🌟 ${myPokemon.nickname} usó Placaje Especial e hizo ${dmg} de daño.`);

  setEnemy((prev) => ({ ...prev, current_hp: newEnemyHP }));

  if (newEnemyHP <= 0) log.push(`💀 ${enemy.nickname} ha caído.`);

  setBattleLog((prev) => [...prev, ...log]);
  setIsAttacking(false);
  setTurnUsed(true);
  };



  // ✅ CAMBIO de Pokémon con control de turno
  const confirmSwitch = async () => {
    
    if (!selectedSwitch) return;

    const samePokemon = selectedSwitch.id === myPokemon.id;
    if (samePokemon) {
      setBattleLog((prev) => [...prev, "⚠️ No puedes cambiar al mismo Pokémon."]);
      return;
    }

    const switched = { 
      ...selectedSwitch, 
      backSprite: getBackSprite(selectedSwitch),
      tempAttackMod: 1,
      tempDefenseMod: 1,
      status: null
    };
    const log = [`🔁 ${switched.nickname} entra en batalla.`];

    // Solo se gasta turno si no estás obligado a cambiar
    const forcedChange = myPokemon.current_hp <= 0;
    if (forcedChange) {
      setTurnUsed(false); // 🔓 después de cambiar por uno muerto, el turno vuelve al jugador
    } else {
      setTurnUsed(true);  // 🔒 cambio voluntario sí gasta turno
    }

    setMyPokemon(switched);
    // 🔹 Cargar los movimientos del Pokémon al cambiar
    try {
      const movesRes = await fetch(`http://localhost:8000/api/pokemons/${switched.id}/current-moves/`, { credentials: "include" });
      const movesData = await movesRes.json();

      const movesWithPP = movesData.map(m => ({
        id: m.id ?? m.pokemon_current_move_id ?? m.move_instance_id, // 👈 intenta varias claves posibles
        move: m.move,
        slot: m.slot,
        pp_current: m.pp_current ?? m.move.pp,
        pp_max: m.pp_max ?? m.move.pp,
      }));

      setMyPokemon((prev) => ({ ...prev, moves: movesWithPP }));
    } catch (error) {
      console.error("❌ Error al cargar movimientos del nuevo Pokémon:", error);
    }
    
    setBattleLog((prev) => [...prev, ...log]);
    setShowSwitchPopup(false);
    setSelectedSwitch(null);
  };

  const closePopup = () => {
    setShowSwitchPopup(false);
    setSelectedSwitch(null);
  };

  const handleCategoryChange = (i) => {
    setCurrentCategory(i);
    setSelectedItem(null);
    setSelectingPokemon(false);
  };

  // 🔄 Fin de turno: enemigo ataca si aún puede
  useEffect(() => {
  const enemyTurn = async () => {
    if (!isAttacking && turnUsed && !skipEnemyTurn && myPokemon?.current_hp > 0 && enemy?.current_hp > 0 && !battleOver) {
      // 🔹 El enemigo elige aleatoriamente entre ataque físico o especial
      const availableMoves = enemy.moves?.filter(m => m.pp_current > 0) || [];
      if (availableMoves.length === 0) return;
      const chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];

      const dmg =
        chosenMove.move.category === "physical"
          ? calcPhysicalDamage(enemy, myPokemon)
          : calcSpecialDamage(enemy, myPokemon);

      chosenMove.pp_current -= 1;


      const newHP = Math.max(0, myPokemon.current_hp - dmg);

      setMyPokemon((prev) => ({ ...prev, current_hp: newHP }));
      setTeam((prev) =>
        prev.map((p) => (p.id === myPokemon.id ? { ...p, current_hp: newHP } : p))
      );

      const attackType = chosenMove.move.category === "physical" ? "ataque físico" : "ataque especial";
      const availablesMoves = enemy.moves?.filter(m => m.pp_current > 0) || [];
      if (availablesMoves.length === 0) return;
      //const chosenMoves = availablesMoves[Math.floor(Math.random() * availablesMoves.length)];

      // 🔹 Cálculo real según tipo de movimiento
      const power = chosenMove.move.power || 40;
      
      // Aplicar todos los modificadores de estadísticas del enemigo y jugador
      const enemyAtk = {
        ...enemy,
        stats: {
          ...enemy.stats,
          attack: enemy.stats.attack * (enemy.tempAttackMod || 1),
          defense: enemy.stats.defense * (enemy.tempDefenseMod || 1),
          special_attack: enemy.stats.special_attack * (enemy.tempSpAttackMod || 1),
          special_defense: enemy.stats.special_defense * (enemy.tempSpDefenseMod || 1),
          speed: enemy.stats.speed * (enemy.tempSpeedMod || 1),
        },
      };

      const playerDef = {
        ...myPokemon,
        stats: {
          ...myPokemon.stats,
          attack: myPokemon.stats.attack * (myPokemon.tempAttackMod || 1),
          defense: myPokemon.stats.defense * (myPokemon.tempDefenseMod || 1),
          special_attack: myPokemon.stats.special_attack * (myPokemon.tempSpAttackMod || 1),
          special_defense: myPokemon.stats.special_defense * (myPokemon.tempSpDefenseMod || 1),
          speed: myPokemon.stats.speed * (myPokemon.tempSpeedMod || 1),
        },
      };


      const base = chosenMove.move.category === "physical"
        ? calcPhysicalDamage(enemyAtk, playerDef)
        : calcSpecialDamage(enemyAtk, playerDef);

      // 🔹 Efectos de estado
      const enemyEffect = applyMoveEffect(chosenMove, enemy, myPokemon, setBattleLog);
      if (enemyEffect.length > 0) setBattleLog(prev => [...prev, ...enemyEffect]);


      const dmge = Math.floor(base * (power / 50)); // Ajusta daño por potencia del movimiento

      // 🔹 Reducir PP del movimiento
      chosenMove.pp_current -= 1;

      // 🔹 Actualizar HP
      const newHp = Math.max(0, myPokemon.current_hp - dmge);

      setMyPokemon((prev) => ({ ...prev, current_hp: newHp }));
      setTeam((prev) =>
        prev.map((p) => (p.id === myPokemon.id ? { ...p, current_hp: newHp } : p))
      );

      // 🔹 Mostrar nombre y tipo de movimiento
      setBattleLog((prev) => [
        ...prev,
        `🔥 ${enemy.nickname} usó ${chosenMove.move.name.toUpperCase()} e hizo ${dmge} de daño.`,
      ]);


      await updatePokemonHP(myPokemon.id, newHp);
      setTurnUsed(false); // ✅ vuelve el turno al jugador
      setSkipEnemyTurn(false);
    }
  };
    enemyTurn();
  }, [turnUsed]);

  const filteredItems = items.filter(
    (i) => i.template_category === CATEGORIES[currentCategory] && i.quantity > 0
  );

  if (!myPokemon || !enemy)
    return <h2 className="loading">⚙️ Preparando batalla...</h2>;

  const allDead = team.every((p) => p.current_hp <= 0);
  const myHpPercent = Math.max(0, (myPokemon.current_hp / myPokemon.stats.hp) * 100);
  const enemyHpPercent = Math.max(0, (enemy.current_hp / enemy.stats.hp) * 100);

  return (
    <div className="battle-wrapper">
      <div className="battle-container">
        <h2 className="battle-title">⚔️ ¡Batalla Pokémon!</h2>

        {/* ESCENA */}
        <div className="battle-scene">
          {/* Enemigo */}
          <div className="enemy-side">
            <div className="enemy-info">
              <h4>
                {enemy.nickname}
                {enemy.shiny ? " ✨" : ""}
                {genderSymbol(enemy.gender)} - Lvl {enemy.level}
              </h4>
              <div className="hp-bar-battle">
                <div
                  className="hp-fill-battle"
                  style={{ width: `${enemyHpPercent}%` }}
                ></div>
              </div>
              <small>
                {enemy.current_hp}/{enemy.stats.hp}
              </small>
            </div>
            <div className="grass-bg">
              <img src={enemy.sprite} alt={enemy.nickname} className="enemy-sprite" />
            </div>
          </div>

          {/* Jugador */}
          <div className="player-side">
            <div className="grass-bg">
              <img
                src={myPokemon.backSprite}
                alt={myPokemon.nickname}
                className="player-sprite"
              />
            </div>
            <div className="player-info">
              <h4>
                {myPokemon.nickname}
                {myPokemon.shiny ? " ✨" : ""}
                {genderSymbol(myPokemon.gender)} - Lvl {myPokemon.level}
              </h4>
              <div className="hp-bar">
                <div
                  className="hp-fill hp-fill-player"
                  style={{ width: `${myHpPercent}%` }}
                ></div>
              </div>
              <small>
                {myPokemon.current_hp}/{myPokemon.stats.hp}
              </small>
            </div>
          </div>
        </div>

        {/* BOTONES */}
        <div className="battle-actions">
          {battleOver || allDead ? (
            <button className="return-btn" onClick={() => window.location.reload()}>
              🔁 Nueva Batalla
            </button>
          ) : myPokemon.current_hp <= 0 ? (
            <button className="switch-btn-battle" onClick={() => setShowSwitchPopup(true)}>
              ⚠️ Cambiar Pokémon
            </button>
          ) : (
            <>
              {/* BOTONES DE MOVIMIENTOS */}
              <div className="move-grid">
                {myPokemon?.moves?.length > 0 ? (
                  myPokemon.moves.map((slot, idx) => (
                    <button
                      key={idx}
                      className={`move-btn ${slot.move.category}`}
                      onClick={() => handleMoveAttack(slot)}
                      disabled={turnUsed || isAttacking || slot.pp_current <= 0}
                      title={`${slot.move.description || "Sin descripción"}\nPP: ${slot.pp_current}/${slot.pp_max}`}
                    >
                      <div className="move-name">{slot.move.name}</div>
                      <div className="move-type">{slot.move.type.toUpperCase()}</div>
                      <div className="move-pp">{slot.pp_current}/{slot.pp_max}</div>
                    </button>
                  ))
                ) : (
                  <div className="empty-moves">
                    <p>-- Vacío --</p>
                  </div>
                )}
              </div>

              <button
                className="switch-btn-battle"
                onClick={() => setShowSwitchPopup(true)}
                disabled={turnUsed}
              >
                🔄 Cambiar
              </button>
            </>
          )}
        </div>

        {/* POPUP CAMBIO */}
        {showSwitchPopup && (
          <div className="switch-popup">
            <div className="popup-content">
              <h3>Selecciona un Pokémon</h3>
              <div className="switch-grid">
                {team.map((pkm) => {
                  const hpPercent = Math.max(0, (pkm.current_hp / pkm.stats.hp) * 100);
                  const sprite = getFrontSprite(pkm);
                  const isCurrent = myPokemon && pkm.id === myPokemon.id;
                  return (
                    <div
                      key={pkm.id}
                      className={`switch-slot ${
                        pkm.current_hp <= 0 ? "disabled" : ""
                      } ${isCurrent ? "disabled" : ""} ${
                        selectedSwitch?.id === pkm.id ? "selected" : ""
                      }`}
                      onClick={() => !isCurrent && pkm.current_hp > 0 && setSelectedSwitch(pkm)}
                    >
                      <img src={sprite} alt={pkm.nickname} />
                      <p>
                        {pkm.nickname}
                        {pkm.shiny ? " ✨" : ""}
                        {genderSymbol(pkm.gender)}
                      </p>
                      <div className="hp-bar-mini">
                        <div
                          className="hp-fill-mini"
                          style={{ width: `${hpPercent}%` }}
                        ></div>
                      </div>
                      <small>
                        {pkm.current_hp}/{pkm.stats.hp}
                      </small>
                    </div>
                  );
                })}
              </div>

              {selectedSwitch && (
                <div className="confirm-switch">
                  <p>¿Cambiar a {selectedSwitch.nickname}?</p>
                  <button onClick={confirmSwitch}>✅ Confirmar</button>
                  <button onClick={() => setSelectedSwitch(null)}>❌ Cancelar</button>
                </div>
              )}
              <button className="close-btn" onClick={closePopup}>
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* LOG */}
        <div className="battle-log" ref={logRef}>
          {battleLog.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
            {/* INVENTARIO */}
      <div className="inventory-container-battle">
        {/* Carrusel de categorías */}
        <div className="inv-category-header-battle">
          <button
            className="arrow-btn"
            onClick={() =>
              setCurrentCategory(
                (currentCategory - 1 + CATEGORIES.length) % CATEGORIES.length
              )
            }
          >
            ◀
          </button>

          {CATEGORIES.map((cat, i) => (
            <div
              key={cat}
              className={`cat-icon-battle ${i === currentCategory ? "active" : ""}`}
              title={cat}
              onClick={() => handleCategoryChange(i)}
            >
              <img src={categoryIcons[cat]} alt={cat} />
            </div>
          ))}

          <button
            className="arrow-btn"
            onClick={() =>
              setCurrentCategory((currentCategory + 1) % CATEGORIES.length)
            }
          >
            ▶
          </button>
        </div>

        {/* Lista de ítems */}
        <div className="inv-item-list-battle">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`inv-item-row-battle ${
                  selectedItem?.id === item.id ? "highlight" : ""
                }`}
                onClick={() => !turnUsed && setSelectedItem(item)} // 🔒 no selecciona si ya usaste turno
              >
                <span>{item.template_name}</span>
                <span>x{item.quantity}</span>
              </div>
            ))
          ) : (
            <p className="no-items">Sin ítems en esta categoría.</p>
          )}
        </div>

        {/* Detalle del ítem */}
        {selectedItem && (
          <div className="inv-item-details-battle">
            <h4>{selectedItem.template_name}</h4>
            <p>{selectedItem.template_description}</p>
            {(selectedItem.is_healing || selectedItem.template_category === "Poke Balls") && (
            <button
              className="use-btn-inv-battle"
              disabled={selectedItem.quantity <= 0 || turnUsed}
              onClick={() => {
                if (selectedItem.template_category === "Poke Balls") {
                  handleUseItem(myPokemon); // 👈 lanza la Poké Ball directo
                } else {
                  setSelectingPokemon(true); // 👈 si es curativo, eliges a quién curar
                }
              }}
            >
              🎯 {selectedItem.template_category === "Poke Balls" ? "Lanzar" : "Usar"}
            </button>
          )}
          </div>
        )}

        {/* Selección de Pokémon */}
        {selectingPokemon && (
          <div className="select-pokemon-grid-battle">
            {team.map((pkm) => (
              <div
                key={pkm.id}
                className={`select-pokemon-slot-battle ${
                  highlightedPokemon === pkm.id ? "highlight" : ""
                }`}
                onMouseEnter={() => setHighlightedPokemon(pkm.id)}
                onMouseLeave={() => setHighlightedPokemon(null)}
                onClick={() => {
                  if (!pkm?.stats || !pkm.stats.hp) {
                    setBattleLog((prev) => [
                      ...prev,
                      `⚠️ No se puede usar ítem en ${pkm.nickname}: datos incompletos.`,
                    ]);
                    return;
                  }
                  if (!turnUsed) handleUseItem(pkm); // ✅ sólo si no usaste turno
                }}
              >
                <img src={getFrontSprite(pkm)} alt={pkm.nickname} />
                <p>
                  {pkm.nickname}
                  {pkm.shiny ? " ✨" : ""} {genderSymbol(pkm.gender)} (
                  {pkm.current_hp ?? 0}/{pkm.stats?.hp ?? "?"})
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
