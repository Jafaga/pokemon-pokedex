"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// These types describe only the PokéAPI fields the interface reads. Keeping the
// shapes small makes it easier to see which API data drives each screen section.
type Pokemon = {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { type: { name: string; url: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  moves: {
    move: { name: string };
    version_group_details: {
      level_learned_at: number;
      move_learn_method: { name: string };
      version_group: { name: string };
    }[];
  }[];
  sprites: { front_default: string; front_shiny: string; other?: { "official-artwork"?: { front_default: string; front_shiny: string } } };
  cries?: { latest?: string; legacy?: string };
  location_area_encounters: string;
};

type Species = {
  flavor_text_entries: { flavor_text: string; language: { name: string }; version: { name: string } }[];
  genera: { genus: string; language: { name: string } }[];
  habitat?: { name: string };
  growth_rate: { name: string };
  capture_rate: number;
  evolution_chain: { url: string };
};

type MoveDetail = { name: string; type: string; power: number | null; accuracy: number | null; category: string };
type EvolutionNode = {
  species: { name: string; url: string };
  evolution_details: { min_level: number | null; item: { name: string } | null; trigger: { name: string }; min_happiness: number | null; time_of_day: string; held_item: { name: string } | null; known_move: { name: string } | null; location: { name: string } | null }[];
  evolves_to: EvolutionNode[];
};
type Encounter = { location_area: { name: string }; version_details: { max_chance: number; version: { name: string } }[] };

// Local region lists let the grid render immediately while detailed records
// load on demand. IDs remain National Pokédex numbers for PokéAPI lookups.
const kantoNames = [
  "bulbasaur","ivysaur","venusaur","charmander","charmeleon","charizard","squirtle","wartortle","blastoise","caterpie","metapod","butterfree","weedle","kakuna","beedrill","pidgey","pidgeotto","pidgeot","rattata","raticate","spearow","fearow","ekans","arbok","pikachu","raichu","sandshrew","sandslash","nidoran-f","nidorina","nidoqueen","nidoran-m","nidorino","nidoking","clefairy","clefable","vulpix","ninetales","jigglypuff","wigglytuff","zubat","golbat","oddish","gloom","vileplume","paras","parasect","venonat","venomoth","diglett","dugtrio","meowth","persian","psyduck","golduck","mankey","primeape","growlithe","arcanine","poliwag","poliwhirl","poliwrath","abra","kadabra","alakazam","machop","machoke","machamp","bellsprout","weepinbell","victreebel","tentacool","tentacruel","geodude","graveler","golem","ponyta","rapidash","slowpoke","slowbro","magnemite","magneton","farfetchd","doduo","dodrio","seel","dewgong","grimer","muk","shellder","cloyster","gastly","haunter","gengar","onix","drowzee","hypno","krabby","kingler","voltorb","electrode","exeggcute","exeggutor","cubone","marowak","hitmonlee","hitmonchan","lickitung","koffing","weezing","rhyhorn","rhydon","chansey","tangela","kangaskhan","horsea","seadra","goldeen","seaking","staryu","starmie","mr-mime","scyther","jynx","electabuzz","magmar","pinsir","tauros","magikarp","gyarados","lapras","ditto","eevee","vaporeon","jolteon","flareon","porygon","omanyte","omastar","kabuto","kabutops","aerodactyl","snorlax","articuno","zapdos","moltres","dratini","dragonair","dragonite","mewtwo","mew"
];

const johtoNames = [
  "chikorita","bayleef","meganium","cyndaquil","quilava","typhlosion","totodile","croconaw","feraligatr","sentret","furret","hoothoot","noctowl","ledyba","ledian","spinarak","ariados","crobat","chinchou","lanturn","pichu","cleffa","igglybuff","togepi","togetic","natu","xatu","mareep","flaaffy","ampharos","bellossom","marill","azumarill","sudowoodo","politoed","hoppip","skiploom","jumpluff","aipom","sunkern","sunflora","yanma","wooper","quagsire","espeon","umbreon","murkrow","slowking","misdreavus","unown","wobbuffet","girafarig","pineco","forretress","dunsparce","gligar","steelix","snubbull","granbull","qwilfish","scizor","shuckle","heracross","sneasel","teddiursa","ursaring","slugma","magcargo","swinub","piloswine","corsola","remoraid","octillery","delibird","mantine","skarmory","houndour","houndoom","kingdra","phanpy","donphan","porygon2","stantler","smeargle","tyrogue","hitmontop","smoochum","elekid","magby","miltank","blissey","raikou","entei","suicune","larvitar","pupitar","tyranitar","lugia","ho-oh","celebi"
];

const regions = {
  kanto: { name: "Kanto", start: 1, end: 151, names: kantoNames, editions: "RED · BLUE · YELLOW", generation: "GEN I", accent: "#c63d36", accentSoft: "#ead1cd" },
  johto: { name: "Johto", start: 152, end: 251, names: johtoNames, editions: "GOLD · SILVER · CRYSTAL", generation: "GEN II", accent: "#b28732", accentSoft: "#e8dcc1" }
} as const;

type RegionKey = keyof typeof regions;

const gameOptions = {
  kanto: [{ value: "red-blue", label: "Red / Blue" }, { value: "yellow", label: "Yellow" }],
  johto: [{ value: "gold-silver", label: "Gold / Silver" }, { value: "crystal", label: "Crystal" }]
} as const;

const dexOptions = {
  kanto: ["red", "blue", "yellow"],
  johto: ["gold", "silver", "crystal"]
} as const;

const versionsByGroup: Record<string, string[]> = {
  "red-blue": ["red", "blue"], yellow: ["yellow"],
  "gold-silver": ["gold", "silver"], crystal: ["crystal"]
};

// Type colors are shared by the detail-panel badges.
const typeColors: Record<string, string> = {
  normal: "#8a8b78", fire: "#e45b35", water: "#3a7cc8", electric: "#e3ad28",
  grass: "#5b9b55", ice: "#57aeb0", fighting: "#b54a3d", poison: "#8d5b9d",
  ground: "#b68c4d", flying: "#7788b7", psychic: "#c55076", bug: "#879548",
  rock: "#94824c", ghost: "#6c5f89", dragon: "#6750a7", dark: "#554c46",
  steel: "#8d96a3", fairy: "#bd7f9e"
};

// Common type hints make the first filter interaction instant. The selected
// Pokémon's complete type data is supplemented from PokéAPI after it loads.
const typeHints: Record<number, string[]> = {
  1:["grass","poison"],2:["grass","poison"],3:["grass","poison"],4:["fire"],5:["fire"],6:["fire","flying"],
  7:["water"],8:["water"],9:["water"],25:["electric"],94:["ghost","poison"],130:["water","flying"],
  131:["water","ice"],133:["normal"],144:["ice","flying"],145:["electric","flying"],146:["fire","flying"],150:["psychic"],151:["psychic"]
};

// Small display helpers keep API slugs, Pokédex numbers, and sprite URLs
// consistent throughout the index and detail panel.
const format = (value: string) => value.replaceAll("-", " ").replace(/\b\w/g, c => c.toUpperCase());
const pad = (id: number) => String(id).padStart(3, "0");
const sprite = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const idFromUrl = (url: string) => Number(url.split("/").filter(Boolean).at(-1));

function TypeBadge({ type }: { type: string }) {
  return <span className="type" style={{ "--type": typeColors[type] || "#777" } as React.CSSProperties}>{type}</span>;
}

function MoveTable({ moves, details, showLevel = false }: { moves: { name: string; level: number }[]; details: Record<string, MoveDetail>; showLevel?: boolean }) {
  return <div className="move-table">
    <div className="move-heading"><span>{showLevel ? "LV." : "#"}</span><span>MOVE</span><span>TYPE</span><span>CAT.</span><span>POW.</span><span>ACC.</span></div>
    {moves.map((move, index) => {
      const detail = details[move.name];
      return <div className="move-row" key={`${move.name}-${move.level}-${index}`}><b>{showLevel ? move.level || "—" : index + 1}</b><strong>{format(move.name)}</strong><i style={{ "--type": typeColors[detail?.type] || "#777" } as React.CSSProperties}>{detail ? format(detail.type) : "…"}</i><span>{detail ? format(detail.category).slice(0, 4) : "…"}</span><span>{detail?.power ?? "—"}</span><span>{detail?.accuracy ?? "—"}</span></div>;
    })}
  </div>;
}

export default function Home() {
  // UI state is kept together here because the index and detail panel update as
  // one interactive Pokédex rather than as separate routes.
  const [selected, setSelected] = useState(25);
  const [regionKey, setRegionKey] = useState<RegionKey>("kanto");
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [species, setSpecies] = useState<Species | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [moveVersion, setMoveVersion] = useState("red-blue");
  const [dexVersion, setDexVersion] = useState("red");
  const [showShiny, setShowShiny] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(24);
  const [moveDetails, setMoveDetails] = useState<Record<string, MoveDetail>>({});
  const [evolution, setEvolution] = useState<EvolutionNode | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [typeDefense, setTypeDefense] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bootState, setBootState] = useState<"idle" | "booting" | "ready">("idle");
  const introAudio = useRef<HTMLAudioElement>(null);
  const region = regions[regionKey];

  // Browser autoplay rules require the intro to begin from the power button.
  // The audio element remains mounted after the overlay leaves, so the supplied
  // theme can finish naturally without looping or holding up the Pokédex.
  const powerOn = () => {
    if (bootState !== "idle") return;
    setBootState("booting");
    if (introAudio.current) {
      introAudio.current.volume = 0.22;
      introAudio.current.currentTime = 0;
      introAudio.current.play().catch(() => undefined);
    }
    window.setTimeout(() => setBootState("ready"), 2600);
  };

  const switchRegion = (next: RegionKey) => {
    if (next === regionKey) return;
    const nextRegion = regions[next];
    setRegionKey(next);
    setQuery("");
    setFilter("all");
    setMoveVersion(next === "kanto" ? "red-blue" : "gold-silver");
    setDexVersion(next === "kanto" ? "red" : "gold");
    setShowShiny(false);
    setVisibleLimit(24);
    setPokemon(null);
    setSpecies(null);
    loadPokemon(nextRegion.start);
  };

  // Pokémon and species endpoints contain complementary data, so fetch them in
  // parallel whenever an entry is selected.
  const loadPokemon = useCallback(async (id: number) => {
    setSelected(id); setLoading(true); setError("");
    setShowShiny(false); setEvolution(null); setEncounters([]); setTypeDefense({});
    try {
      const [p, s] = await Promise.all([
        fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).then(r => { if (!r.ok) throw new Error(); return r.json(); })
      ]);
      setPokemon(p); setSpecies(s);
      const [chain, foundEncounters, typeRecords] = await Promise.all([
        fetch(s.evolution_chain.url).then(r => r.ok ? r.json() : null),
        fetch(p.location_area_encounters).then(r => r.ok ? r.json() : []),
        Promise.all(p.types.map((entry: Pokemon["types"][number]) => fetch(entry.type.url).then(r => r.ok ? r.json() : null)))
      ]);
      setEvolution(chain?.chain || null);
      setEncounters(foundEncounters);
      const multipliers: Record<string, number> = {};
      typeRecords.filter(Boolean).forEach(record => {
        record.damage_relations.double_damage_from.forEach((entry: { name: string }) => { multipliers[entry.name] = (multipliers[entry.name] ?? 1) * 2; });
        record.damage_relations.half_damage_from.forEach((entry: { name: string }) => { multipliers[entry.name] = (multipliers[entry.name] ?? 1) * 0.5; });
        record.damage_relations.no_damage_from.forEach((entry: { name: string }) => { multipliers[entry.name] = 0; });
      });
      setTypeDefense(multipliers);
    } catch {
      setError("The Pokédex signal is weak. Check your connection and try again.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("pokedex-favorites");
      // Hydrate the browser-only collection after the server render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setFavorites(new Set(JSON.parse(saved)));
    } catch { /* Ignore malformed storage from an older visit. */ }
  }, []);

  const toggleFavorite = () => setFavorites(current => {
    const next = new Set(current);
    if (next.has(selected)) next.delete(selected); else next.add(selected);
    window.localStorage.setItem("pokedex-favorites", JSON.stringify([...next]));
    return next;
  });

  // Pikachu is the opening entry. Arrow keys provide quick desktop navigation,
  // but are ignored while a visitor is typing in the search field.
  useEffect(() => { loadPokemon(25); }, [loadPokemon]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowLeft") loadPokemon(selected === region.start ? region.end : selected - 1);
      if (e.key === "ArrowRight") loadPokemon(selected === region.end ? region.start : selected + 1);
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [selected, loadPokemon, region]);

  // Derive the visible index from search and type controls instead of storing a
  // second copy of the Pokémon list in state.
  const visible = useMemo(() => region.names.map((name, i) => ({ name, id: region.start + i })).filter(p => {
    const searchMatch = p.name.includes(query.toLowerCase().trim()) || String(p.id) === query.trim().replace(/^#/, "");
    const typeMatch = filter === "all" || (typeHints[p.id] || []).includes(filter) || (p.id === selected && pokemon?.types.some(t => t.type.name === filter));
    return searchMatch && typeMatch && (!favoritesOnly || favorites.has(p.id));
  }), [query, filter, selected, pokemon, region, favoritesOnly, favorites]);
  const displayed = visible.slice(0, visibleLimit);

  // Flavor text follows the chosen cartridge, with an English fallback for the
  // handful of species/version combinations that do not contain a unique entry.
  const preferredVersions = regionKey === "kanto" ? ["red", "blue", "yellow"] : ["gold", "silver", "crystal"];
  const description = species?.flavor_text_entries.find(x => x.language.name === "en" && x.version.name === dexVersion)
    || species?.flavor_text_entries.find(x => x.language.name === "en" && preferredVersions.includes(x.version.name))
    || species?.flavor_text_entries.find(x => x.language.name === "en");
  const genus = species?.genera.find(g => g.language.name === "en")?.genus;
  const total = pokemon?.stats.reduce((sum, s) => sum + s.base_stat, 0) || 0;
  const versionMoves = useMemo(() => {
    const result: Record<string, { name: string; level: number }[]> = { "level-up": [], machine: [], egg: [] };
    pokemon?.moves.forEach(entry => entry.version_group_details.forEach(detail => {
      if (detail.version_group.name === moveVersion && result[detail.move_learn_method.name]) {
        result[detail.move_learn_method.name].push({ name: entry.move.name, level: detail.level_learned_at });
      }
    }));
    Object.values(result).forEach(items => items.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)));
    return result;
  }, [pokemon, moveVersion]);
  const levelMoves = versionMoves["level-up"];
  const machineMoves = versionMoves.machine;
  const eggMoves = versionMoves.egg;

  useEffect(() => {
    const names = [...levelMoves, ...machineMoves, ...eggMoves].map(move => move.name);
    if (!names.length) return;
    const controller = new AbortController();
    Promise.all(names.map(name => fetch(`https://pokeapi.co/api/v2/move/${name}`, { signal: controller.signal }).then(r => r.json())))
      .then(records => setMoveDetails(Object.fromEntries(records.map(record => [record.name, { name: record.name, type: record.type.name, power: record.power, accuracy: record.accuracy, category: record.damage_class.name }]))))
      .catch(() => undefined);
    return () => controller.abort();
  }, [levelMoves, machineMoves, eggMoves]);

  const evolutionStages: { id: number; name: string; condition: string }[] = [];
  const collectEvolution = (node: EvolutionNode) => {
    const detail = node.evolution_details[0];
    let condition = "Base form";
    if (detail) {
      if (detail.min_level) condition = `Level ${detail.min_level}`;
      else if (detail.item) condition = `Use ${format(detail.item.name)}`;
      else if (detail.trigger.name === "trade") condition = detail.held_item ? `Trade holding ${format(detail.held_item.name)}` : "Trade";
      else if (detail.min_happiness) condition = `Friendship ${detail.min_happiness}+${detail.time_of_day ? ` · ${format(detail.time_of_day)}` : ""}`;
      else if (detail.known_move) condition = `Know ${format(detail.known_move.name)}`;
      else if (detail.location) condition = `At ${format(detail.location.name)}`;
      else condition = format(detail.trigger.name);
    }
    evolutionStages.push({ id: idFromUrl(node.species.url), name: node.species.name, condition });
    node.evolves_to.forEach(collectEvolution);
  };
  if (evolution) collectEvolution(evolution);
  const gameEncounters = encounters.filter(encounter => encounter.version_details.some(detail => versionsByGroup[moveVersion]?.includes(detail.version.name)));
  const matchupGroups = {
    weak: Object.entries(typeDefense).filter(([, value]) => value > 1),
    resistant: Object.entries(typeDefense).filter(([, value]) => value > 0 && value < 1),
    immune: Object.entries(typeDefense).filter(([, value]) => value === 0)
  };

  // Browsers can block audio until a user interacts with the page, which is why
  // cries are played only from the explicit speaker button.
  const playCry = () => {
    const url = pokemon?.cries?.legacy || pokemon?.cries?.latest;
    if (url) new Audio(url).play().catch(() => undefined);
  };

  return (
    <main style={{ "--red": region.accent, "--accent-soft": region.accentSoft } as React.CSSProperties}>
      {/* The supplied intro is instrumental background music, so no captions apply. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={introAudio} src="/pokemon_intro.mp3" preload="auto" aria-hidden="true" />
      {bootState !== "ready" && <section className={`boot-screen ${bootState}`} aria-label="Pokédex startup screen" aria-live="polite">
        <div className="dex-device">
          <div className="dex-top" aria-hidden="true">
            <div className="dex-lens"><i /></div>
            <div className="dex-lights"><i /><i /><i /></div>
            <span className="dex-ridge" />
          </div>
          <div className="dex-body">
            <div className="dex-screen-bezel">
              <div className="dex-speakers" aria-hidden="true"><i /><i /></div>
              <div className="boot-display">
                <div className="boot-grid" aria-hidden="true" />
                <div className="pokeball-scan" aria-hidden="true"><i /></div>
                <p className="boot-kicker">PROF. OAK&apos;S</p>
                <h1>POKÉDEX</h1>
                <p className="boot-status">{bootState === "booting" ? "GOTTA CATCH 'EM ALL!" : "KANTO + JOHTO EDITION"}</p>
                {bootState === "booting" && <div className="boot-progress" aria-hidden="true"><i /></div>}
                {bootState === "idle" && <button className="power-button" onClick={powerOn}><span aria-hidden="true">▶</span> START</button>}
              </div>
              <div className="dex-controls" aria-hidden="true"><i /><span>POKÉDEX 025</span><b /></div>
            </div>
          </div>
        </div>
      </section>}
      {/* Persistent tools: project identity, search, and generation label. */}
      <header className="topbar">
        <a className="brand" href="#top" aria-label={`${region.name} Pokédex home`}>
          <span className="brand-ball"><i /></span><span>{region.name.toUpperCase()}</span><b>POKÉDEX</b>
        </a>
        <label className="search"><span>⌕</span><input value={query} onChange={e => { setQuery(e.target.value); setVisibleLimit(24); }} placeholder="Search name or number..." aria-label="Search Pokémon"/><kbd>/</kbd></label>
        <div className="edition"><i /> {region.editions} <span>{region.generation}</span></div>
      </header>

      <section className="workspace" id="top">
        {/* Compact desktop navigation rail; hidden on smaller screens by CSS. */}
        <aside className="rail">
          <div><span className="eyebrow">REGION</span><strong>{region.name.toUpperCase()}</strong><small>{pad(region.start)}—{pad(region.end)}</small></div>
          <nav aria-label="Pokédex sections">
            <a className={!favoritesOnly ? "active" : ""} href="#index"><b>⌗</b><span>Pokédex</span></a>
            <a href="#details"><b>◫</b><span>Details</span></a>
            <button className={favoritesOnly ? "active" : ""} onClick={() => { setFavoritesOnly(value => !value); setVisibleLimit(24); }}><b>★</b><span>Favorites</span></button>
            <a href="#about"><b>?</b><span>About</span></a>
          </nav>
          <div className="rail-foot"><div className="mini-ball"/><span>OAK<br/>RESEARCH<br/>LAB</span></div>
        </aside>

        {/* Searchable and filterable index of all 151 Kanto Pokémon. */}
        <section className="index" id="index">
          <div className="section-head"><div><span className="eyebrow">{favoritesOnly ? "SAVED SPECIMENS" : "REGIONAL INDEX"}</span><h1>{favoritesOnly ? "Favorites" : `${region.name} Pokémon`}</h1></div><span className="count">{displayed.length} / {visible.length}</span></div>
          <div className="region-switcher" role="group" aria-label="Choose a Pokémon region">
            {(Object.keys(regions) as RegionKey[]).map(key => <button key={key} className={regionKey === key ? "active" : ""} onClick={() => switchRegion(key)} aria-pressed={regionKey === key}><span>{regions[key].generation}</span>{regions[key].name}</button>)}
          </div>
          <div className="filters" role="group" aria-label="Filter by type">
            {["all","grass","fire","water","electric","psychic","ghost"].map(t => <button key={t} className={filter === t ? "chosen" : ""} onClick={() => { setFilter(t); setVisibleLimit(24); }}>{t}</button>)}
          </div>
          <div className="grid">
            {displayed.map(p => <button key={p.id} className={`poke-card ${selected === p.id ? "selected" : ""}`} onClick={() => loadPokemon(p.id)} aria-label={`View ${format(p.name)}, number ${p.id}`}>
              <span className="number">#{pad(p.id)}</span>
              {favorites.has(p.id) && <span className="favorite-mark" aria-label="Favorite">★</span>}
              <img src={sprite(p.id)} alt="" loading="lazy"/>
              <strong>{format(p.name)}</strong>
              <span className="dot" />
            </button>)}
            {!visible.length && <div className="no-results">No Pokémon found in this field guide.</div>}
          </div>
          {displayed.length < visible.length && <button className="load-more" onClick={() => setVisibleLimit(limit => limit + 24)}>LOAD 24 MORE <span>{visible.length - displayed.length} REMAINING</span></button>}
        </section>

        {/* Live specimen file populated by the two PokéAPI responses. */}
        <aside className="detail" id="details" aria-live="polite" style={{ "--specimen": pokemon ? typeColors[pokemon.types[0].type.name] : region.accent } as React.CSSProperties}>
          <div className="detail-top"><span className="eyebrow">SPECIMEN FILE</span><div><button className={`favorite-button ${favorites.has(selected) ? "saved" : ""}`} onClick={toggleFavorite} aria-label={favorites.has(selected) ? "Remove from favorites" : "Add to favorites"}>{favorites.has(selected) ? "★ SAVED" : "☆ SAVE"}</button><span className="detail-id">#{pad(selected)}</span></div></div>
          {loading && !pokemon ? <div className="loading">Scanning specimen…</div> : error ? <div className="error">{error}<button onClick={() => loadPokemon(selected)}>Retry scan</button></div> : pokemon && <>
            <div className="hero-image">
              <span className="scanline" />
              <img src={(showShiny ? pokemon.sprites.other?.["official-artwork"]?.front_shiny || pokemon.sprites.front_shiny : pokemon.sprites.other?.["official-artwork"]?.front_default || pokemon.sprites.front_default)} alt={`${showShiny ? "Shiny " : ""}${format(pokemon.name)}`}/>
              <button className={`shiny-toggle ${showShiny ? "active" : ""}`} onClick={() => setShowShiny(value => !value)} aria-pressed={showShiny}>✦ {showShiny ? "SHINY" : "NORMAL"}</button>
              <button className="cry" onClick={playCry} title="Play cry" aria-label={`Play ${format(pokemon.name)} cry`}>◖))</button>
            </div>
            <div className="name-row"><div><h2>{format(pokemon.name)}</h2><p>{genus || "Pokémon"}</p></div><div className="badges">{pokemon.types.map(t => <TypeBadge key={t.type.name} type={t.type.name}/>)}</div></div>
            <div className="flavor-head"><span>POKÉDEX ENTRY</span><select value={dexVersion} onChange={event => setDexVersion(event.target.value)} aria-label="Pokédex entry game">{dexOptions[regionKey].map(version => <option key={version} value={version}>{format(version)}</option>)}</select></div>
            <p className="description">{description?.flavor_text.replace(/[\n\f]/g, " ")}</p>
            <div className="measurements"><div><span>HEIGHT</span><strong>{(pokemon.height / 10).toFixed(1)} m</strong></div><div><span>WEIGHT</span><strong>{(pokemon.weight / 10).toFixed(1)} kg</strong></div><div><span>HABITAT</span><strong>{format(species?.habitat?.name || "unknown")}</strong></div></div>
            <section className="stats"><div className="subhead"><h3>BASE STATS</h3><span>TOTAL <b>{total}</b></span></div>{pokemon.stats.map(s => <div className="stat" key={s.stat.name}><span>{s.stat.name.replace("special-attack","sp. atk").replace("special-defense","sp. def")}</span><b>{s.base_stat}</b><i><em style={{ width: `${Math.min(100, s.base_stat / 1.6)}%` }}/></i></div>)}</section>
            <section className="facts"><div><span>ABILITIES</span><strong>{pokemon.abilities.map(a => format(a.ability.name)).join(" · ")}</strong></div><div><span>GROWTH</span><strong>{format(species?.growth_rate.name || "—")}</strong></div><div><span>CAPTURE RATE</span><strong>{species?.capture_rate ?? "—"}</strong></div></section>
            <section className="matchups">
              <div className="subhead"><h3>TYPE EFFECTIVENESS</h3><span>DEFENDING</span></div>
              {(["weak", "resistant", "immune"] as const).map(group => matchupGroups[group].length > 0 && <div className="matchup-row" key={group}><span>{group === "weak" ? "WEAK TO" : group === "resistant" ? "RESISTS" : "IMMUNE"}</span><div>{matchupGroups[group].map(([type, value]) => <i key={type} style={{ "--type": typeColors[type] } as React.CSSProperties}>{format(type)} <b>×{value}</b></i>)}</div></div>)}
            </section>
            {evolutionStages.length > 1 && <section className="evolution">
              <div className="subhead"><h3>EVOLUTION PATH</h3><span>{evolutionStages.length} STAGES</span></div>
              <div className="evolution-flow">{evolutionStages.map((stage, index) => <div className="evolution-step" key={`${stage.id}-${stage.name}`}>{index > 0 && <span className="evolution-arrow">→<small>{stage.condition}</small></span>}<button onClick={() => loadPokemon(stage.id)}><img src={sprite(stage.id)} alt=""/><b>{format(stage.name)}</b><small>#{pad(stage.id)}</small></button></div>)}</div>
            </section>}
            <section className="game-data">
              <div className="subhead"><div><span className="eyebrow">GAME DATA</span><h3>MOVES LEARNED</h3></div><label>EDITION<select value={moveVersion} onChange={event => setMoveVersion(event.target.value)}>{gameOptions[regionKey].map(game => <option key={game.value} value={game.value}>{game.label}</option>)}</select></label></div>
              {levelMoves.length ? <MoveTable moves={levelMoves} details={moveDetails} showLevel /> : <p className="no-moves">No level-up moves listed for this edition.</p>}
              <details className="extra-moves"><summary>TM / HM MOVES <span>{machineMoves.length}</span></summary>{machineMoves.length ? <MoveTable moves={machineMoves} details={moveDetails} /> : <p className="no-moves">No machine moves listed.</p>}</details>
              <details className="extra-moves"><summary>EGG MOVES <span>{eggMoves.length}</span></summary>{eggMoves.length ? <MoveTable moves={eggMoves} details={moveDetails} /> : <p className="no-moves">No egg moves in this edition.</p>}</details>
              <p className="move-source">Version-specific move data from <a href="https://pokeapi.co" target="_blank" rel="noreferrer">PokéAPI</a>. Cross-reference the full learnset on <a href={`https://pokemondb.net/pokedex/${pokemon.name}/moves/${regionKey === "kanto" ? 1 : 2}`} target="_blank" rel="noreferrer">Pokémon Database</a>.</p>
            </section>
            <section className="locations">
              <div className="subhead"><h3>KNOWN LOCATIONS</h3><span>{gameOptions[regionKey].find(game => game.value === moveVersion)?.label.toUpperCase()}</span></div>
              {gameEncounters.length ? <div className="location-list">{gameEncounters.slice(0, 12).map(encounter => { const versionInfo = encounter.version_details.filter(detail => versionsByGroup[moveVersion].includes(detail.version.name)); return <div key={encounter.location_area.name}><strong>{format(encounter.location_area.name.replace("-area", ""))}</strong><span>{versionInfo.map(detail => `${format(detail.version.name)} · ${detail.max_chance}%`).join(" / ")}</span></div>; })}</div> : <p className="no-moves">Not found in the wild in this edition.</p>}
            </section>
            <div className="pager"><button onClick={() => loadPokemon(selected === region.start ? region.end : selected - 1)}>← <span>PREV</span></button><button onClick={() => loadPokemon(selected === region.end ? region.start : selected + 1)}><span>NEXT</span> →</button></div>
          </>}
        </aside>
      </section>

      {/* Data-source attribution and the keyboard-navigation reminder. */}
      <footer id="about"><p>Field data sourced from <a href="https://pokemondb.net/pokedex/game/red-blue-yellow" target="_blank" rel="noreferrer">Pokémon Database</a> and <a href="https://pokeapi.co" target="_blank" rel="noreferrer">PokéAPI</a>.</p><p>Use ← → to move between entries</p></footer>
    </main>
  );
}
