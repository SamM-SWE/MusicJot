import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import PreviewCard from "../components/PreviewCard";


const relativeTime = new Intl.RelativeTimeFormat("en");

const timeUnits = [
  ["year", 365 * 24 * 60],
  ["day", 24 * 60],
  ["hour", 60],
  ["minute", 1],
];

function formatPostedAt(createdAt) {
  const minutesAgo = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / 60_000
  );

  for (const [unit, minutesPerUnit] of timeUnits) {
    if (minutesAgo >= minutesPerUnit) {
      const amount = Math.floor(minutesAgo / minutesPerUnit);
      return `Posted ${relativeTime.format(-amount, unit)}`;
    }
  }

  return "Posted just now";
}

async function loadPosts(signal) {
  const posts = [];
  const pageSize = 500;
  let lastId = null;

  while (true) {
    let query = supabase
      .from("Posts")
      .select("id, created_at, title, upVotes")
      .order("id", { ascending: true })
      .limit(pageSize)
      .abortSignal(signal);

    if (lastId !== null) {
      query = query.gt("id", lastId);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (data.length === 0) return posts;

    posts.push(...data);
    lastId = data[data.length - 1].id;
  }
}

const newestFirst = (a, b) =>
  new Date(b.created_at) - new Date(a.created_at);

const sortOptions = {
  oldest: {
    label: "Oldest",
    compare: (a, b) => newestFirst(b, a),
  },
  newest: {
    label: "Newest",
    compare: newestFirst,
  },
  mostPopular: {
    label: "Most Popular",
    compare: (a, b) => b.upVotes - a.upVotes || newestFirst(a, b),
  },
  leastPopular: {
    label: "Least Popular",
    compare: (a, b) => a.upVotes - b.upVotes || newestFirst(a, b),
  },
};

export default function Home() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchPosts() {
      try {
        const rows = await loadPosts(controller.signal);

        if (!controller.signal.aborted) {
          setPosts(rows);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setErrorMessage(error.message || "Could not load posts.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchPosts();

    return () => controller.abort();
  }, []);

  const searchTerm = search.trim().toLowerCase();

  const visiblePosts = posts
    .filter((post) => post.title.toLowerCase().includes(searchTerm))
    .sort(sortOptions[sortBy].compare);

  return (
    <div>
      <NavBar search={search} setSearch={setSearch} />

      <div className="main-div-home">
        <div className="sort-div">
          <span className="sort-txt">Sort by:</span>

          {Object.entries(sortOptions).map(([value, option]) => (
            <button
              key={value}
              type="button"
              className="sort-button"
              aria-pressed={sortBy === value}
              onClick={() => setSortBy(value)}
            >
              {option.label}
            </button>
          ))}
        </div>

       

        <div className="cards-div">
          {loading && <span className="small-detail-txt">Loading posts…</span>}

          {errorMessage && <p role="alert">{errorMessage}</p>}

          {!loading && !errorMessage && visiblePosts.length === 0 && (
            <span className="small-detail-txt">
              {searchTerm
                ? "No posts match your search."
                : "No posts to display."}
            </span>
          )}

          {visiblePosts.map((post) => (
  <div
    key={post.id}
    role="link"
    tabIndex={0}
    onClick={() => navigate(`/posts/${post.id}`)}
    onKeyDown={(event) => {
      if (event.key === "Enter") {
        navigate(`/posts/${post.id}`);
      }
    }}
  >
    <PreviewCard
      title={post.title}
      upVotes={post.upVotes}
      postedAt={formatPostedAt(post.created_at)}
    />
  </div>
))}
        </div>
      </div>
    </div>
  );
}