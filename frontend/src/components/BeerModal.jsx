import React from "react";
import { Modal, Button, Row, Col, Badge } from "react-bootstrap";
import "../styles/Discover.css"; // We'll keep styles in Discover.css for consistency

const BeerModal = ({ show, handleClose, beer }) => {
  // Helper function to assign a visual emoji based on the category
  const getEmoji = (cat) => {
    if (!cat) return "🥂";
    const category = cat.toLowerCase();
    if (category.includes("whiskey") || category.includes("whisky")) return "🥃";
    if (category.includes("vin") || category.includes("wine")) return "🍷";
    if (category.includes("cocktail")) return "🍸";
    if (category.includes("gin")) return "🧊";
    if (category.includes("ber") || category.includes("beer")) return "🍺";
    return "🥂";
  };

  if (!beer) return null;

  return (
    <Modal 
        show={show} 
        onHide={handleClose} 
        centered 
        size="lg" // Larger modal for a premium feel
        contentClassName="premium-modal-content" // Custom class for Dark Theme
    >
      {/* Modal Header with close button (white variant for dark mode) */}
      <Modal.Header closeButton className="premium-modal-header" closeVariant="white">
        <Modal.Title className="modal-title-custom">
          {beer.name}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="premium-modal-body">
        <Row>
          {/* LEFT COLUMN: Visual Placeholder */}
          <Col md={5} className="mb-4 mb-md-0 text-center">
            <div className="modal-image-placeholder">
                {getEmoji(beer.cat_name)}
            </div>
          </Col>

          {/* RIGHT COLUMN: Technical Details */}
          <Col md={7}>
            <div className="details-section">
                {/* Category & Style Information */}
                <div className="detail-item">
                    <span className="detail-label">Category & Style</span>
                    <div className="detail-value">
                        <Badge bg="warning" text="dark" className="me-2">
                            {beer.cat_name}
                        </Badge>
                        <span className="text-white-50">{beer.style_name}</span>
                    </div>
                </div>

                {/* Alcohol Content (ABV) */}
                <div className="detail-item">
                    <span className="detail-label">Alcohol Content (ABV)</span>
                    <div className="detail-value">
                        {beer.abv && beer.abv > 0 ? (
                           <span className="abv-badge">Premium {beer.abv}% Strength</span>
                        ) : (
                            <span className="text-muted italic">Volume info not provided</span>
                        )}
                    </div>
                </div>

                {/* Description Text */}
                <div className="detail-item" style={{ borderBottom: 'none' }}>
                    <span className="detail-label">Tasting Notes</span>
                    <p className="text-muted mt-2" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                        Experience the unique character of this selection. Detailed tasting notes 
                        and professional reviews for this item will be available in the next update.
                    </p>
                </div>
            </div>
          </Col>
        </Row>
      </Modal.Body>

      {/* Footer with high-contrast action buttons */}
      <Modal.Footer className="premium-modal-footer">
        <Button className="btn-premium-dark" onClick={handleClose}>
          Close
        </Button>
        <Button className="btn-premium-gold">
          Add to Favorites
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BeerModal;