
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import { supabase } from "../supabaseClient";

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imgUrl, setImgUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [postFound, setPostFound] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPost() {
      setLoading(true);
      setPostFound(false);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("Posts")
        .select("id, title, desc, imgUrl")
        .eq("id", id)
        .abortSignal(controller.signal)
        .maybeSingle();

      if (controller.signal.aborted) return;

      if (error) {
        setErrorMessage(error.message);
      } else if (!data) {
        setErrorMessage("Post not found.");
      } else {
        setTitle(data.title ?? "");
        setDescription(data.desc ?? "");
        setImgUrl(data.imgUrl ?? "");
        setPostFound(true);
      }

      setLoading(false);
    }

    loadPost();

    return () => controller.abort();
  }, [id]);

  async function handleEditPost(event) {
    event.preventDefault();

    if (!title.trim() || isSaving || !postFound) return;

    setIsSaving(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("Posts")
        .update({
          title: title.trim(),
          desc: description.trim() || null,
          imgUrl: imgUrl.trim() || null,
        })
        .eq("id", id)
        .select("id")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error("Post could not be updated.");
      }

      navigate(`/posts/${id}`);
    } catch (error) {
      setErrorMessage(
        error.message || "Could not update the post."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <NavBar />

      <div className="main-div">
        {loading ? (
          <span className="small-detail-txt">Loading post...</span>
        ) : (
          <form
            className="form-div"
            onSubmit={handleEditPost}
          >
            <span className="title-txt">Edit Post</span>

            {errorMessage && (
              <p role="alert">{errorMessage}</p>
            )}

            {postFound && (
              <>
                <input
                  type="text"
                  name="title"
                  placeholder="Title"
                  aria-label="Title"
                  className="normal-search-option"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  required
                />

                <textarea
                  className="large-search-option"
                  name="description"
                  placeholder="Enter a description (optional)"
                  aria-label="Description (optional)"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                />

                <input
                  type="url"
                  name="imgUrl"
                  placeholder="Image URL (optional)"
                  aria-label="Image URL (optional)"
                  className="normal-search-option"
                  value={imgUrl}
                  onChange={(event) =>
                    setImgUrl(event.target.value)
                  }
                />

                <button
                  type="submit"
                  className="createPost-button"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Edit Post"}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
