import { useState, useEffect } from "react";
import { Spinner, Button } from "react-bootstrap";
import { Card } from "react-bootstrap";
import "../styles/ChatGPTRecommended.css";

const ChatGPTRecommended = () => {
  const [response, setResponse] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = window.__ENV__["VITE_API_URL"];

  useEffect(() => {
    const savedResponse = localStorage.getItem("recommendedBeers");
    if (savedResponse) {
      setResponse(JSON.parse(savedResponse));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchRecommended = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/chatbot`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      localStorage.setItem("recommendedBeers", JSON.stringify(data.response));
      setResponse(data.response);
    } catch (error) {
      console.error("Error fetching recommended beers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1>AI recommendations</h1>
      <p>
        Try out our AI-powered recommendation engine to find your next favorite
        beer
      </p>

      <div className="recommended_container">
        {loading ? (
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        ) : response.length > 0 ? (
          <>
            <h4>This is what I recommend:</h4>
            <Card className="response">
              <p>{response}</p>
            </Card>
          </>
        ) : (
          <Button onClick={fetchRecommended} variant="info">
            Get AI recommendations
          </Button>
        )}
      </div>
    </>
  );
};

export default ChatGPTRecommended;
