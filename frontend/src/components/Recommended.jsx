import React, { useEffect, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { Card } from "react-bootstrap";
import { Container } from "react-bootstrap";
import BeerModal from "./BeerModal";

const Recommended = () => {
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const [show, setShow] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const apiUrl = window.__ENV__["VITE_API_URL"];

  useEffect(() => {
    const fetchRecommended = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${apiUrl}/recommendations?page=${currentPage}&per_page=${itemsPerPage}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();
        setRecommended(data);
      } catch (error) {
        console.error("Error fetching recommended beers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommended();
  }, [currentPage]);

  const handleNextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handleClose = () => setShow(false);
  const handleShow = (beer) => {
    setSelectedItem(beer);
    setShow(true);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const renderPaginationButtons = () => (
    <div className="pagination">
      <Button
        onClick={handlePreviousPage}
        disabled={currentPage === 1}
        variant="danger"
      >
        Previous
      </Button>
      <Button onClick={handleNextPage}>Next</Button>
    </div>
  );

  return (
    <div className="recommended">
      <h1>Other beers you might like</h1>
      <p>Here are some beers you might like based on your taste profile</p>
      <div className="recommended_container">
        {loading ? (
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        ) : (
          <div className="search-results">
            {recommended.map((beer, index) => (
              <Card key={beer.id} style={{ width: "18rem" }}>
                <Card.Body key={beer.id} className="card-body">
                  <Card.Title>
                    {index + 1}. {beer.name}
                  </Card.Title>
                  <Card.Text>{beer.cat_name}</Card.Text>
                  <Card.Text>{beer.style_name}</Card.Text>
                  <Card.Text>
                    {beer.abv ? parseFloat(beer.abv).toFixed(1) : "N/A"}%
                    alcohol
                  </Card.Text>
                  <Container className="d-flex justify-content-between">
                    <Button
                      variant="primary"
                      onClick={() => {
                        handleShow(beer);
                      }}
                    >
                      Details
                    </Button>
                  </Container>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
        {renderPaginationButtons()}
      </div>
      {selectedItem && (
        <BeerModal show={show} handleClose={handleClose} beer={selectedItem} />
      )}
    </div>
  );
};

export default Recommended;
