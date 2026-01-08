import { useEffect, useState } from "react";
import CustomNavbar from "./Navbar";
import { Button, Card, Col, Container, Row, Spinner, Nav, Badge } from "react-bootstrap";
import "../styles/Discover.css"; 
import BeerModal from "./BeerModal";

const Discover = () => {
  const [beers, setBeers] = useState([]);
  const [filteredBeers, setFilteredBeers] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // --- AICI ESTE LOGICA NOUA PENTRU BUTONUL ANIMAT ---
  const [likedBeersLocal, setLikedBeersLocal] = useState({}); 

  const handleTempClick = (beerId) => {
    setLikedBeersLocal(prev => ({
        ...prev,
        [beerId]: !prev[beerId]
    }));
  };
  // ---------------------------------------------------

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; 
  
  const apiUrl = window.__ENV__["VITE_API_URL"];

  // --- 1. FETCH DATA ---
  useEffect(() => {
    fetch(`${apiUrl}/beers`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    .then((response) => response.json()) 
    .then((data) => {
      setBeers(data);
      setFilteredBeers(data);
      setLoading(false);
    })
    .catch((error) => {
      console.error("Error:", error);
      setLoading(false);
    });
  }, []);

  // --- 2. CATEGORY FILTERING ---
  const handleCategorySelect = (category) => {
    setActiveCategory(category);
    setCurrentPage(1); 

    if (category === "All") {
      setFilteredBeers(beers);
    } else {
      const filtered = beers.filter(item => item.cat_name === category);
      setFilteredBeers(filtered);
    }
  };

  // --- 3. EMOJI HELPER ---
  const getEmoji = (cat) => {
    if (cat.includes("Whiskey") || cat.includes("Whisky")) return "🥃";
    if (cat.includes("Vin") || cat.includes("Wine")) return "🍷";
    if (cat.includes("Cocktail")) return "🍸";
    if (cat.includes("Gin")) return "🧊";
    if (cat.includes("Ber") || cat.includes("Beer")) return "🍺";
    return "🥂";
  };

  // --- 4. PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBeers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBeers.length / itemsPerPage);

  // --- 5. EXTRACT CATEGORIES ---
  const categories = ["All", ...new Set(beers.map(b => b.cat_name))];

  const handleShow = (beer) => {
    setSelectedItem(beer);
    setShow(true);
  };
  const handleClose = () => setShow(false);

  return (
    <div className="discover-container">
      <CustomNavbar />
      
      <Container className="pt-5">
        
        {/* HERO SECTION */}
        <div className="text-center mb-5">
          <h1 className="hero-title">Exclusive <span style={{ color: "#ffc107" }}>Collection</span></h1>
          <p className="hero-subtitle">Discover our finest selection of premium beverages</p>
        </div>

        {/* CATEGORY TABS */}
        <Nav className="category-nav" activeKey={activeCategory}>
          {categories.map((cat) => (
            <Nav.Item key={cat}>
              <Nav.Link 
                eventKey={cat} 
                onClick={() => handleCategorySelect(cat)}
                className={activeCategory === cat ? "active" : ""}
              >
                {cat}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>

        {/* MAIN CONTENT */}
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: "40vh" }}>
            <Spinner animation="border" variant="warning" />
          </div>
        ) : (
          <>
            {/* GRID LAYOUT */}
            <Row>
              {currentItems.map((beer) => (
                <Col key={beer.id} md={6} lg={4} className="mb-4">
                  <div className="drink-card">
                    {/* Image Placeholder */}
                    <div className="card-img-placeholder">
                      {getEmoji(beer.cat_name)}
                    </div>
                    
                    {/* Card Body */}
                    <div className="card-body-custom">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Badge className="custom-badge">{beer.cat_name}</Badge>
                        <small className="text-muted">{beer.abv > 0 ? `${beer.abv}% ABV` : ""}</small>
                      </div>
                      
                      <h3 className="drink-name">{beer.name}</h3>
                      <p className="drink-style">{beer.style_name}</p>
                      
                      <div className="mt-auto">
                          <div className="d-flex justify-content-between align-items-center mt-3 pt-3" style={{borderTop: '1px solid rgba(255,255,255,0.05)'}}>
                             <Button 
                               className="btn-details" 
                               onClick={() => handleShow(beer)}
                             >
                               View Details
                             </Button>

                             {/* --- AICI ESTE BUTONUL NOU (MANA) --- */}
                             <div 
                                className={`beer-hand-btn ${likedBeersLocal[beer.id] ? 'active' : ''}`}
                                onClick={() => handleTempClick(beer.id)}
                                title="Like this drink!"
                             >
                                <div className="hand-shape-mask">
                                    <div className="beer-liquid-fill"></div>
                                </div>
                             </div>
                             {/* ------------------------------------ */}

                          </div>
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-5">
                <Button 
                  variant="outline-secondary" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="me-2"
                >
                  &laquo; Prev
                </Button>
                <span className="align-self-center text-muted mx-3">
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline-secondary" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="ms-2"
                >
                  Next &raquo;
                </Button>
              </div>
            )}

            {/* CALL TO ACTION (Footer Banner) */}
            <div className="cta-section">
              <h3 className="cta-title">Can't find your favorite drink? 🥃</h3>
              <p style={{color: '#8b949e'}}>Be the first to add it to our exclusive catalog.</p>
              <Button className="btn-add-drink">
                + Add New Drink
              </Button>
            </div>
          </>
        )}
      </Container>
      
      {selectedItem && (
        <BeerModal show={show} handleClose={handleClose} beer={selectedItem} />
      )}
    </div>
  );
};

export default Discover;