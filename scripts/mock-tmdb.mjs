// A tiny stand-in for the TMDB API, for local development and tests without an API key.
// Usage: node scripts/mock-tmdb.mjs  (listens on :4010)
// Then set TMDB_API_BASE="http://127.0.0.1:4010/3" and TMDB_API_KEY="mock".
// All films below are invented.

import { createServer } from "node:http";

const FILMS = [
  ["The Lighthouse Keeper's Daughter", "2019-03-14", ["Drama", "Mystery"], "Ines Calvert", 118],
  ["Neon Monsoon", "2022-08-05", ["Thriller", "Crime"], "Ravi Okonkwo", 104],
  ["Salt and Saffron", "2016-11-20", ["Romance", "Comedy"], "Mara Lindqvist", 96],
  ["Orbit of Small Things", "2024-02-09", ["Science Fiction", "Drama"], "Tomasz Weller", 131],
  ["The Last Tram to Kessington", "1987-06-01", ["Drama"], "Edith Marlowe", 112],
  ["Paper Wolves", "2021-10-29", ["Horror"], "Dae-jun Park", 92],
  ["A Quiet Inventory", "2008-04-17", ["Drama", "Comedy"], "Ines Calvert", 101],
  ["Copper Coast", "1974-09-12", ["Western"], "Hal Brennan", 124],
  ["Midnight at the Aquarium", "2023-12-01", ["Animation", "Family"], "Yuki Arai", 88],
  ["Glass Cathedral", "2012-05-22", ["Mystery", "Thriller"], "Ravi Okonkwo", 127],
  ["The Understudy", "1999-01-30", ["Comedy"], "Mara Lindqvist", 99],
  ["Rivers Remember", "2025-07-18", ["Documentary"], "Amara Diallo", 84],
].map(([title, date, genres, director, runtime], i) => ({
  id: 9000 + i,
  title,
  original_title: title,
  release_date: date,
  poster_path: null,
  backdrop_path: null,
  overview: `${title} is an invented film used for local development.`,
  tagline: "",
  runtime,
  vote_average: 7,
  genres: genres.map((name, j) => ({ id: j, name })),
  credits: {
    cast: [
      { name: "Alex Moreau", character: "Lead", order: 0 },
      { name: "Priya Sandhu", character: "Friend", order: 1 },
    ],
    crew: [{ name: director, job: "Director" }],
  },
}));

const summary = ({ genres, credits, runtime, tagline, ...m }) => m;
const page = (results) => ({ page: 1, total_pages: 1, total_results: results.length, results: results.map(summary) });

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const send = (status, body) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };
  const path = url.pathname.replace(/^\/3/, "");
  if (path === "/search/movie") {
    const q = (url.searchParams.get("query") || "").toLowerCase();
    const year = url.searchParams.get("primary_release_year");
    return send(200, page(FILMS.filter((f) => f.title.toLowerCase().includes(q) && (!year || f.release_date.startsWith(year)))));
  }
  if (["/trending/movie/week", "/movie/popular", "/movie/top_rated", "/movie/now_playing"].includes(path)) {
    return send(200, page(FILMS));
  }
  const m = path.match(/^\/movie\/(\d+)$/);
  if (m) {
    const film = FILMS.find((f) => f.id === Number(m[1]));
    return film ? send(200, film) : send(404, { status_message: "Not found" });
  }
  send(404, { status_message: "Not found" });
});

const port = Number(process.env.PORT || 4010);
server.listen(port, "127.0.0.1", () => console.log(`Mock TMDB on http://127.0.0.1:${port}/3`));
