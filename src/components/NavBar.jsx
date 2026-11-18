
import { useNavigate } from "react-router-dom";

export default function NavBar({ search, setSearch }) {
  const navigate = useNavigate();

  return (
    <header>
      <div className="nav-leftside">
        <span className="logo-txt">MusicJot!</span>
      </div>

      <div className="nav-middle">
        <input type="text" placeholder="Search" className="nav-search" aria-label="Search posts by title" value={search ?? ""} onChange={(event) => {
            if (setSearch) {
              setSearch(event.target.value);
            }
          }}
        />
      </div>

      <div className="nav-rightside">
        <ul className="nav-list">
          <button
            className="nav-button"
            onClick={() => navigate("/")}
          >
            Home
          </button>

          <button className="nav-button" onClick={() => navigate("/CreatePost")}>
            Create Post
          </button>
        </ul>
      </div>
    </header>
  );
}
