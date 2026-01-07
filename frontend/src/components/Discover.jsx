import { useEffect, useState } from "react";
import CustomNavbar from "./Navbar";
import { Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import "../styles/Discover.css";
import BeerModal from "./BeerModal";

const Discover = () => {
  const [breweries, setBreweries] = useState([]);
  const [beers, setBeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentBreweryPage, setCurrentBreweryPage] = useState(1);
  const [currentBeerPage, setCurrentBeerPage] = useState(1);
  const itemsPerPage = 10;
  const pageButtonLimit = 5; // Number of page buttons to show at once
  const apiUrl = window.__ENV__["VITE_API_URL"];

  const handleClose = () => setShow(false);
  const handleShow = (brewery) => {
    setSelectedItem(brewery);
    setShow(true);
  };

  useEffect(() => {
    const fetchBreweries = fetch(`${apiUrl}/breweries`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((response) => response.json());

    const fetchBeers = fetch(`${apiUrl}/beers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((response) => response.json());

    Promise.all([fetchBreweries, fetchBeers])
      .then(([breweriesData, beersData]) => {
        setBreweries(breweriesData);
        setBeers(beersData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setLoading(false); // Stop loading even if there's an error
      });
  }, []);

  const handleBreweryPageChange = (newPage) => {
    setCurrentBreweryPage(newPage);
  };

  const handleBeerPageChange = (newPage) => {
    setCurrentBeerPage(newPage);
  };

  const displayedBreweries = breweries.slice(
    (currentBreweryPage - 1) * itemsPerPage,
    currentBreweryPage * itemsPerPage
  );

  const displayedBeers = beers.slice(
    (currentBeerPage - 1) * itemsPerPage,
    currentBeerPage * itemsPerPage
  );

  const renderPaginationButtons = (
    currentPage,
    totalItems,
    handlePageChange
  ) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startPage = Math.max(
      1,
      currentPage - Math.floor(pageButtonLimit / 2)
    );
    const endPage = Math.min(totalPages, startPage + pageButtonLimit - 1);

    const pageButtons = [];
    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <Button
          key={i}
          variant="dark"
          size="sm"
          onClick={() => handlePageChange(i)}
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
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        {pageButtons}
        <Button
          variant="dark"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  return (
    <>
      <CustomNavbar />
      <Container
        style={{ width: "70vw", backgroundColor: "white", padding: "2rem" }}
      >
        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "100vh" }}
          >
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <Row>
            <Col className="list">
              <h1>Breweries</h1>
              <p>Top Breweries</p>
              <div className="item-container">
                {displayedBreweries.map((brewery, index) => {
                  return (
                    <Card style={{ width: "18rem" }} key={brewery.id}>
                      <Card.Body>
                        <Card.Title>
                          {index + 1}. {brewery.name}
                        </Card.Title>
                        <Card.Text>{brewery.city}</Card.Text>
                        <Card.Text>{brewery.state}</Card.Text>
                        <Card.Text>{brewery.country}</Card.Text>
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>
              {renderPaginationButtons(
                currentBreweryPage,
                breweries.length,
                handleBreweryPageChange
              )}
            </Col>
            <Col className="list">
              <h1>Beers</h1>
              <p>Top Beers</p>
              <div className="item-container">
                {displayedBeers.map((beer, index) => {
                  return (
                    <Card style={{ width: "18rem" }} key={beer.id}>
                      <Card.Body>
                        <Card.Title>
                          {index + 1}. {beer.name}
                        </Card.Title>
                        <Card.Text>{beer.cat_name}</Card.Text>
                        <Card.Text>{beer.style_name}</Card.Text>
                        <Card.Text>
                          {beer.abv ? parseFloat(beer.abv).toFixed(1) : "N/A"}%
                          alcohol
                        </Card.Text>
                        <Button
                          variant="primary"
                          onClick={() => {
                            handleShow(beer);
                          }}
                        >
                          Details
                        </Button>
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>
              {renderPaginationButtons(
                currentBeerPage,
                beers.length,
                handleBeerPageChange
              )}
            </Col>
          </Row>
        )}
      </Container>
      {selectedItem && (
        <BeerModal show={show} handleClose={handleClose} beer={selectedItem} />
      )}
    </>
  );
};

export default Discover;
