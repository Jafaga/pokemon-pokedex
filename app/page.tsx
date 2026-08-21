"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Pokemon = {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  sprites: { front_default: string; other?: { "official-artwork"?: { front_default: string } } };
  cries?: { latest?: string; legacy?: string };
};

type Species = {
  flavor_text_entries: { flavor_text: string; language: { name: string }; version: { name: string } }[];
  genera: { genus: string; language: { name: string } }[];
  habitat?: { name: string };
  growth_rate: { name: string };
  capture_rate: number;
};

const names = [
  "bulbasaur","ivysaur","venusaur","charmander","charmeleon","charizard","squirtle","wartortle","blastoise","caterpie","metapod","butterfree","weedle","kakuna","beedrill","pidgey","pidgeotto","pidgeot","rattata","raticate","spearow","fearow","ekans","arbok","pikachu","raichu","sandshrew","sandslash","nidoran-f","nidorina","nidoqueen","nidoran-m","nidorino","nidoking","clefairy","clefable","vulpix","ninetales","jigglypuff","wigglytuff","zubat","golbat","oddish","gloom","vileplume","paras","parasect","venonat","venomoth","diglett","dugtrio","meowth","persian","psyduck","golduck","mankey","primeape","growlithe","arcanine","poliwag","poliwhirl","poliwrath","abra","kadabra","alakazam","machop","machoke","machamp","bellsprout","weepinbell","victreebel","tentacool","tentacruel","geodude","graveler","golem","ponyta","rapidash","slowpoke","slowbro","magnemite","magneton","farfetchd","doduo","dodrio","seel","dewgong","grimer","muk","shellder","cloyster","gastly","haunter","gengar","onix","drowzee","hypno","krabby","kingler","voltorb","electrode","exeggcute","exeggutor","cubone","marowak","hitmonlee","hitmonchan","lickitung","koffing","weezing","rhyhorn","rhydon","chansey","tangela","kangaskhan","horsea","seadra","goldeen","seaking","staryu","starmie","mr-mime","scyther","jynx","electabuzz","magmar","pinsir","tauros","magikarp","gyarados","lapras","ditto","eevee","vaporeon","jolteon","flareon","porygon","omanyte","omastar","kabuto","kabutops","aerodactyl","snorlax","articuno","zapdos","moltres","dratini","dragonair","dragonite","mewtwo","mew"
];

const typeColors: Record<string, string> = {
  normal: "#8a8b78", fire: "#e45b35", water: "#3a7cc8", electric: "#e3ad28",
  grass: "#5b9b55", ice: "#57aeb0", fighting: "#b54a3d", poison: "#8d5b9d",
  ground: "#b68c4d", flying: "#7788b7", psychic: "#c55076", bug: "#879548",
  rock: "#94824c", ghost: "#6c5f89", dragon: "#6750a7", dark: "#554c46",
  steel: "#8d96a3", fairy: "#bd7f9e"
};

const typeHints: Record<number, string[]> = {
  1:["grass","poison"],2:["grass","poison"],3:["grass","poison"],4:["fire"],5:["fire"],6:["fire","flying"],
  7:["water"],8:["water"],9:["water"],25:["electric"],94:["ghost","poison"],130:["water","flying"],
  131:["water","ice"],133:["normal"],144:["ice","flying"],145:["electric","flying"],146:["fire","flying"],150:["psychic"],151:["psychic"]
};

const format = (value: string) => value.replaceAll("-", " ").replace(/\b\w/g, c => c.toUpperCase());
const pad = (id: number) => String(id).padStart(3, "0");
const sprite = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

function TypeBadge({ type }: { type: string }) {
  return <span className="type" style={{ "--type": typeColors[type] || "#777" } as React.CSSProperties}>{type}</span>;
}

export default function Home() {
  const [selected, setSelected] = useState(25);
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [species, setSpecies] = useState<Species | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPokemon = useCallback(async (id: number) => {
    setSelected(id); setLoading(true); setError("");
    try {
      const [p, s] = await Promise.all([
        fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).then(r => { if (!r.ok) throw new Error(); return r.json(); })
      ]);
      setPokemon(p); setSpecies(s);
    } catch {
      setError("The Pokédex signal is weak. Check your connection and try again.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPokemon(25); }, [loadPokemon]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowLeft") loadPokemon(selected === 1 ? 151 : selected - 1);
      if (e.key === "ArrowRight") loadPokemon(selected === 151 ? 1 : selected + 1);
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [selected, loadPokemon]);

  const visible = useMemo(() => names.map((name, i) => ({ name, id: i + 1 })).filter(p => {
    const searchMatch = p.name.includes(query.toLowerCase().trim()) || String(p.id) === query.trim().replace(/^#/, "");
    const typeMatch = filter === "all" || (typeHints[p.id] || []).includes(filter) || (p.id === selected && pokemon?.types.some(t => t.type.name === filter));
    return searchMatch && typeMatch;
  }), [query, filter, selected, pokemon]);

  const description = species?.flavor_text_entries.find(x => x.language.name === "en" && ["red", "blue", "yellow"].includes(x.version.name))
    || species?.flavor_text_entries.find(x => x.language.name === "en");
  const genus = species?.genera.find(g => g.language.name === "en")?.genus;
  const total = pokemon?.stats.reduce((sum, s) => sum + s.base_stat, 0) || 0;

  const playCry = () => {
    const url = pokemon?.cries?.legacy || pokemon?.cries?.latest;
    if (url) new Audio(url).play().catch(() => undefined);
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Kanto Pokédex home">
          <span className="brand-ball"><i /></span><span>KANTO</span><b>POKÉDEX</b>
        </a>
        <label className="search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or number..." aria-label="Search Pokémon"/><kbd>/</kbd></label>
        <div className="edition"><i /> RED · BLUE · YELLOW <span>GEN I</span></div>
      </header>

      <section className="workspace" id="top">
        <aside className="rail">
          <div><span className="eyebrow">REGION</span><strong>KANTO</strong><small>001—151</small></div>
          <nav aria-label="Pokédex sections"><a className="active" href="#index">⌗ <span>Pokédex</span></a><a href="#details">◫ <span>Details</span></a><a href="#about">? <span>About</span></a></nav>
          <div className="rail-foot"><div className="mini-ball"/><span>OAK<br/>RESEARCH<br/>LAB</span></div>
        </aside>

        <section className="index" id="index">
          <div className="section-head"><div><span className="eyebrow">NATIONAL INDEX</span><h1>All Pokémon</h1></div><span className="count">{visible.length} / 151</span></div>
          <div className="filters" role="group" aria-label="Filter by type">
            {["all","grass","fire","water","electric","psychic","ghost"].map(t => <button key={t} className={filter === t ? "chosen" : ""} onClick={() => setFilter(t)}>{t}</button>)}
          </div>
          <div className="grid">
            {visible.map(p => <button key={p.id} className={`poke-card ${selected === p.id ? "selected" : ""}`} onClick={() => loadPokemon(p.id)} aria-label={`View ${format(p.name)}, number ${p.id}`}>
              <span className="number">#{pad(p.id)}</span>
              <img src={sprite(p.id)} alt="" loading="lazy"/>
              <strong>{format(p.name)}</strong>
              <span className="dot" />
            </button>)}
            {!visible.length && <div className="no-results">No Pokémon found in this field guide.</div>}
          </div>
        </section>

        <aside className="detail" id="details" aria-live="polite">
          <div className="detail-top"><span className="eyebrow">SPECIMEN FILE</span><span className="detail-id">#{pad(selected)}</span></div>
          {loading && !pokemon ? <div className="loading">Scanning specimen…</div> : error ? <div className="error">{error}<button onClick={() => loadPokemon(selected)}>Retry scan</button></div> : pokemon && <>
            <div className="hero-image">
              <span className="scanline" />
              <img src={pokemon.sprites.other?.["official-artwork"]?.front_default || pokemon.sprites.front_default} alt={format(pokemon.name)}/>
              <button className="cry" onClick={playCry} title="Play cry" aria-label={`Play ${format(pokemon.name)} cry`}>◖))</button>
            </div>
            <div className="name-row"><div><h2>{format(pokemon.name)}</h2><p>{genus || "Pokémon"}</p></div><div className="badges">{pokemon.types.map(t => <TypeBadge key={t.type.name} type={t.type.name}/>)}</div></div>
            <p className="description">{description?.flavor_text.replace(/[\n\f]/g, " ")}</p>
            <div className="measurements"><div><span>HEIGHT</span><strong>{(pokemon.height / 10).toFixed(1)} m</strong></div><div><span>WEIGHT</span><strong>{(pokemon.weight / 10).toFixed(1)} kg</strong></div><div><span>HABITAT</span><strong>{format(species?.habitat?.name || "unknown")}</strong></div></div>
            <section className="stats"><div className="subhead"><h3>BASE STATS</h3><span>TOTAL <b>{total}</b></span></div>{pokemon.stats.map(s => <div className="stat" key={s.stat.name}><span>{s.stat.name.replace("special-attack","sp. atk").replace("special-defense","sp. def")}</span><b>{s.base_stat}</b><i><em style={{ width: `${Math.min(100, s.base_stat / 1.6)}%` }}/></i></div>)}</section>
            <section className="facts"><div><span>ABILITIES</span><strong>{pokemon.abilities.map(a => format(a.ability.name)).join(" · ")}</strong></div><div><span>GROWTH</span><strong>{format(species?.growth_rate.name || "—")}</strong></div><div><span>CAPTURE RATE</span><strong>{species?.capture_rate ?? "—"}</strong></div></section>
            <div className="pager"><button onClick={() => loadPokemon(selected === 1 ? 151 : selected - 1)}>← <span>PREV</span></button><button onClick={() => loadPokemon(selected === 151 ? 1 : selected + 1)}><span>NEXT</span> →</button></div>
          </>}
        </aside>
      </section>

      <footer id="about"><p>Field data sourced from <a href="https://pokemondb.net/pokedex/game/red-blue-yellow" target="_blank" rel="noreferrer">Pokémon Database</a> and <a href="https://pokeapi.co" target="_blank" rel="noreferrer">PokéAPI</a>.</p><p>Use ← → to move between entries</p></footer>
    </main>
  );
}
