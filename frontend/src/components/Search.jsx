import React, { useEffect, useMemo, useState } from "react";
import CustomNavbar from "./Navbar";
import { Button, Card, Container, Form } from "react-bootstrap";
import Spinner from "react-bootstrap/Spinner";
import DrinkModal from "./DrinkModal";
import "../styles/Search.css";

const Search = () => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");

  const [allDrinks, setAllDrinks] = useState([]);

  const [show, setShow] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const pageButtonLimit = 5;

  const [favorites, setFavorites] = useState([]); // array of drink ids (strings)

  const token = localStorage.getItem("token");

  const apiUrl =
    window.__ENV__?.VITE_API_URL ??
    import.meta.env.VITE_API_URL ??
    `${window.location.protocol}//${window.location.hostname}:8080/api`;

  const safeJson = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Expected JSON, got: ${text.slice(0, 120)}...`);
    }
  };

  const fetchJson = async (url, opts = {}) => {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return safeJson(res);
  };

  const handleClose = () => setShow(false);
  const handleShow = (drink) => {
    setSelectedItem(drink);
    setShow(true);
  };

  const fetchCategories = async () => {
    // preferred endpoint
    try {
      return await fetchJson(`${apiUrl}/drinks/categories`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // fallback old alias if you kept it
      const legacy = await fetchJson(`${apiUrl}/beers/categories`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      // legacy format was [{cat: [styles]}], new is often ["Cocktail", ...]
      if (Array.isArray(legacy) && legacy.length && typeof legacy[0] === "object") {
        return legacy.map((o) => Object.keys(o)[0]).filter(Boolean);
      }
      return legacy;
    }
  };

  const fetchAllDrinks = async () => {
    // preferred endpoint
    try {
      return await fetchJson(`${apiUrl}/drinks`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // fallback old alias
      return await fetchJson(`${apiUrl}/beers`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
    }
  };

  const fetchAllFavorites = async () => {
    if (!token) return [];
    const fav = await fetchJson(`${apiUrl}/favorites`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return Array.isArray(fav) ? fav : [];
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([fetchAllDrinks(), fetchCategories(), fetchAllFavorites()])
      .then(([d, cats, fav]) => {
        if (!mounted) return;

        const drinksArr = Array.isArray(d) ? d : [];
        const catsArr = Array.isArray(cats) ? cats : [];

        setAllDrinks(drinksArr);
        setCategories(catsArr);

        const favIds = fav.map((x) => String(x?.id ?? x?.drink_id ?? x?._id ?? "")).filter(Boolean);
        setFavorites(favIds);

        setResults(drinksArr);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setAllDrinks([]);
        setCategories([]);
        setFavorites([]);
        setResults([]);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  // Search filtering (client-side)
  useEffect(() => {
    setCurrentPage(1);

    if (!search) {
      setResults(allDrinks);
      return;
    }

    const q = search.toLowerCase().trim();
    const filtered = allDrinks.filter((d) => (d?.name || "").toLowerCase().includes(q));
    setResults(filtered);
  }, [search, allDrinks]);

  // Category filtering (client-side for drinks; server-side optional)
  useEffect(() => {
    setCurrentPage(1);

    if (!category) return;

    const filtered = allDrinks.filter((d) => {
      const c = d?.category ?? d?.cat_name ?? "";
      return String(c).toLowerCase() === String(category).toLowerCase();
    });

    setResults(filtered);
  }, [category, allDrinks]);

  const handleInputChange = (event) => {
    setSearch(event.target.value);
    setCategory("");
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
    setSearch("");
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(results.length / itemsPerPage)),
    [results.length]
  );

  const displayedResults = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return results.slice(start, start + itemsPerPage);
  }, [results, currentPage]);

  const renderPaginationButtons = () => {
    const startPage = Math.max(1, currentPage - Math.floor(pageButtonLimit / 2));
    const endPage = Math.min(totalPages, startPage + pageButtonLimit - 1);

    const pageButtons = [];
    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <Button
          key={i}
          variant="dark"
          size="sm"
          onClick={() => setCurrentPage(i)}
          className="page-button"
        >
          {i}
        </Button>
      );
    }

    return (
      <div className="pagination">
        <Button
          variant="dark"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>

        {pageButtons}

        <Button
          variant="dark"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  const toggleFavorite = async (drinkId) => {
    if (!token) {
      alert("Trebuie să fii logat ca să folosești favorite.");
      return;
    }

    const id = String(drinkId);

    const already = favorites.includes(id);
    // optimistic update
    setFavorites((prev) => (already ? prev.filter((x) => x !== id) : [...prev, id]));

    try {
      const res = await fetch(`${apiUrl}/favorites`, {
        method: already ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ drink_id: id }),
      });

      if (!res.ok) {
        // rollback on fail
        setFavorites((prev) => (already ? [...prev, id] : prev.filter((x) => x !== id)));
        const t = await res.text().catch(() => "");
        alert(`Nu pot actualiza favorite. (${res.status}) ${t.slice(0, 140)}`);
      }
    } catch (e) {
      console.error(e);
      setFavorites((prev) => (already ? [...prev, id] : prev.filter((x) => x !== id)));
      alert("Eroare la favorite.");
    }
  };

  return (
    <>
      <CustomNavbar />

      <Container
        className="search-container"
        style={{ width: "70vw", backgroundColor: "white", padding: "2rem" }}
      >
        <h1>Search</h1>
        <p>
          Page{" "}
          <strong>
            {currentPage} of {totalPages}
          </strong>
        </p>

        <Form>
          <Form.Group className="mb-3 search-bar" controlId="searchInput">
            <Form.Control
              type="text"
              placeholder="Search drinks"
              value={search}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group className="mb-3 search-bar" controlId="categorySelect">
            <Form.Control as="select" value={category} onChange={handleCategoryChange}>
              <option value="">Select a category</option>
              {categories.map((c, idx) => (
                <option key={`${c}-${idx}`} value={c}>
                  {c}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Form>

        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ padding: "22px" }}>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <>
            <div className="search-results">
              {displayedResults.map((drink, index) => {
                const id = String(drink?.id ?? "");
                const categoryText = drink?.category ?? drink?.cat_name ?? "—";
                const styleText = drink?.style_name ?? "—";

                return (
                  <Card key={`${id}-${index}`} style={{ width: "18rem" }}>
                    <Card.Body className="card-body">
                      <Card.Title>
                        {index + 1}. {drink?.name || "Unnamed"}
                      </Card.Title>

                      <Card.Text>{categoryText}</Card.Text>
                      <Card.Text>{styleText}</Card.Text>

                      <Card.Text>
                        {drink?.abv != null && drink?.abv !== ""
                          ? `${Number(drink.abv).toFixed(1)}% alcohol`
                          : "ABV: N/A"}
                      </Card.Text>

                      <Container className="d-flex justify-content-between">
                        <Button
                          variant="primary"
                          onClick={() => handleShow(drink)}
                          disabled={!drink?.id}
                        >
                          Details
                        </Button>

                        <i
                          className={`fa ${favorites.includes(id) ? "fa-star" : "fa-star-o"}`}
                          onClick={() => toggleFavorite(id)}
                          style={{
                            marginTop: "0.5rem",
                            fontSize: "1.5rem",
                            cursor: "pointer",
                            color: favorites.includes(id) ? "gold" : "black",
                          }}
                          aria-label="favorite"
                          role="button"
                        />
                      </Container>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>

            {renderPaginationButtons()}
          </>
        )}
      </Container>

      {selectedItem ? (
        <DrinkModal show={show} handleClose={handleClose} drink={selectedItem} />
      ) : null}
    </>
  );
};

export default Search;
