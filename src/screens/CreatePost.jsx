import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { supabase } from "../supabaseClient";

export default function CreatePost() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCreatePost(event) {
    event.preventDefault();

    if (isSaving) return;

    const formData = new FormData(event.currentTarget);
    const title = formData.get("title").trim();
    const description = formData.get("description").trim();
    const imgUrl = formData.get("imgUrl").trim();

    if (!title) {
      setErrorMessage("Enter a title for your post.");
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    try {
      const { error } = await supabase.from("Posts").insert({
        title,
        desc: description || null,
        imgUrl: imgUrl || null,
      });

      if (error) throw error;

      navigate("/");
    } catch (error) {
      setErrorMessage(error.message || "Could not create the post.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <NavBar />

      <div className="main-div">
        <form className="form-div" onSubmit={handleCreatePost}>
          <span className="title-txt">Create New Post</span>

          <input
            type="text"
            name="title"
            placeholder="Title"
            aria-label="Title"
            className="normal-search-option"
            required
          />

          <textarea
            className="large-search-option"
            name="description"
            placeholder="Enter a description (optional)"
            aria-label="Description (optional)"
          />

          <input
            type="url"
            name="imgUrl"
            placeholder="Image URL (optional)"
            aria-label="Image URL (optional)"
            className="normal-search-option"
          />

          {errorMessage && <span className="small-detail-txt" role="alert">{errorMessage}</span>}

          <button
            type="submit"
            className="createPost-button"
            disabled={isSaving}
          >
            {isSaving ? "Posting…" : "Create Post"}
          </button>
        </form>
      </div>
    </div>
  );
}