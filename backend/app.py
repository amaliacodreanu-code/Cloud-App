import os
import requests

from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from dotenv import load_dotenv
from flask_caching import Cache

load_dotenv()
app = Flask(__name__)

secret_key_file = "/app/secret_key.txt"
with open(secret_key_file, "r") as file:
    secret_key = file.read().strip()

app.config["JWT_SECRET_KEY"] = secret_key
app.config["DB_API_URL"] = os.getenv("DB_API_URL")

cache = Cache(app, config={"CACHE_TYPE": "SimpleCache"})
jwt = JWTManager(app)


@app.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify({"message": f"Welcome, {current_user}"})


def _query_from_args():
    query = {}
    for key, value in request.args.items():
        query[key] = value
    return query


# -----------------------------
# DRINKS
# -----------------------------
@app.route("/drinks", methods=["GET"])
@cache.cached(timeout=0)
def get_drinks():
    query = _query_from_args()
    res = requests.get(f'{app.config["DB_API_URL"]}/drinks', json=query)
    return res.json(), res.status_code


@app.route("/drinks/categories", methods=["GET"])
def get_drink_categories():
    res = requests.get(f'{app.config["DB_API_URL"]}/drinks/categories')
    return res.json(), res.status_code


# -----------------------------
# PRODUCERS
# -----------------------------
@app.route("/producers", methods=["GET"])
@cache.cached(timeout=0)
def get_producers():
    query = _query_from_args()
    res = requests.get(f'{app.config["DB_API_URL"]}/producers', json=query)
    return res.json(), res.status_code


@app.route("/producers/<string:producer_id>", methods=["GET"])
def get_producer(producer_id):
    res = requests.get(f'{app.config["DB_API_URL"]}/producers/{producer_id}')
    return res.json(), res.status_code


# -----------------------------
# FAVORITES
# -----------------------------
@app.route("/favorites", methods=["POST"])
@jwt_required()
def add_favourite():
    current_user = get_jwt_identity()
    data = request.get_json() or {}

    drink_id = data.get("drink_id")
    if not drink_id:
        return jsonify({"message": "Missing drink_id"}), 400

    res = requests.post(
        f'{app.config["DB_API_URL"]}/add_to_favorites',
        json={"drink_id": str(drink_id), "username": current_user},
    )
    return res.json(), res.status_code


@app.route("/favorites", methods=["GET"])
@jwt_required()
def get_favorites():
    current_user = get_jwt_identity()
    res = requests.get(
        f'{app.config["DB_API_URL"]}/get_favorites',
        json={"username": current_user},
    )
    return res.json(), res.status_code


@app.route("/favorites", methods=["DELETE"])
@jwt_required()
def delete_favourite():
    current_user = get_jwt_identity()
    data = request.get_json() or {}

    drink_id = data.get("drink_id")
    if not drink_id:
        return jsonify({"message": "Missing drink_id"}), 400

    res = requests.delete(
        f'{app.config["DB_API_URL"]}/remove_from_favorites',
        json={"drink_id": str(drink_id), "username": current_user},
    )
    return res.json(), res.status_code


# -----------------------------
# RECOMMENDATIONS
# -----------------------------
@app.route("/recommendations", methods=["GET"])
@jwt_required()
def get_recommendations():
    current_user = get_jwt_identity()
    res = requests.get(
        f'{app.config["DB_API_URL"]}/recommendations',
        json={"username": current_user},
    )
    return res.json(), res.status_code


# -----------------------------
# REVIEWS
# -----------------------------
@app.route("/reviews/drink/<string:drink_id>", methods=["GET"])
def get_drink_reviews(drink_id):
    res = requests.get(f'{app.config["DB_API_URL"]}/reviews/drink/{drink_id}')
    return res.json(), res.status_code


@app.route("/reviews", methods=["POST"])
@jwt_required()
def add_review():
    current_user = get_jwt_identity()
    data = request.get_json() or {}

    drink_id = data.get("drink_id")
    rating = data.get("rating")
    tastes = data.get("tastes", [])

    if not drink_id or rating is None:
        return jsonify({"message": "Missing required fields"}), 400

    payload = {
        "drink_id": str(drink_id),
        "username": current_user,
        "rating": rating,
        "review": data.get("review", ""),
        "tastes": tastes,
    }

    res = requests.post(f'{app.config["DB_API_URL"]}/reviews', json=payload)
    return res.json(), res.status_code


@app.route("/reviews", methods=["GET"])
@jwt_required()
def get_reviews():
    current_user = get_jwt_identity()
    res = requests.get(
        f'{app.config["DB_API_URL"]}/reviews',
        json={"username": current_user},
    )
    return res.json(), res.status_code


@app.route("/reviews/<string:review_id>", methods=["DELETE"])
@jwt_required()
def delete_review(review_id):
    current_user = get_jwt_identity()
    res = requests.delete(
        f'{app.config["DB_API_URL"]}/reviews/{review_id}',
        json={"username": current_user},
    )
    return res.json(), res.status_code

# -----------------------------
# PRODUCER REVIEWS
# -----------------------------
@app.route("/reviews/producer/<string:producer_id>", methods=["GET"])
def get_producer_reviews(producer_id):
    res = requests.get(f'{app.config["DB_API_URL"]}/reviews/producer/{producer_id}')
    return res.json(), res.status_code


@app.route("/producer-reviews", methods=["POST"])
@jwt_required()
def add_producer_review():
    current_user = get_jwt_identity()
    data = request.get_json() or {}

    producer_id = data.get("producer_id")
    rating = data.get("rating")
    tastes = data.get("tastes", [])

    if not producer_id or rating is None:
        return jsonify({"message": "Missing required fields"}), 400

    payload = {
        "producer_id": str(producer_id),
        "username": current_user,
        "rating": rating,
        "review": data.get("review", ""),
        "tastes": tastes,
    }

    res = requests.post(f'{app.config["DB_API_URL"]}/producer-reviews', json=payload)
    return res.json(), res.status_code


@app.route("/producer-reviews", methods=["GET"])
@jwt_required()
def get_my_producer_reviews():
    current_user = get_jwt_identity()
    res = requests.get(
        f'{app.config["DB_API_URL"]}/producer-reviews',
        json={"username": current_user},
    )
    return res.json(), res.status_code


@app.route("/producer-reviews/<string:review_id>", methods=["DELETE"])
@jwt_required()
def delete_my_producer_review(review_id):
    current_user = get_jwt_identity()
    res = requests.delete(
        f'{app.config["DB_API_URL"]}/producer-reviews/{review_id}',
        json={"username": current_user},
    )
    return res.json(), res.status_code



# -----------------------------
# PROFILE
# -----------------------------
@app.route("/profile", methods=["GET"])
@jwt_required()
def profile_get():
    current_user = get_jwt_identity()
    res = requests.get(
        f'{app.config["DB_API_URL"]}/profile',
        json={"username": current_user},
    )
    return res.json(), res.status_code


@app.route("/profile", methods=["PUT"])
@jwt_required()
def profile_put():
    current_user = get_jwt_identity()
    data = request.get_json() or {}
    payload = {
        "username": current_user,
        "bio": data.get("bio"),
        "preferred_style": data.get("preferred_style"),
    }
    res = requests.put(f'{app.config["DB_API_URL"]}/profile', json=payload)
    return res.json(), res.status_code


if __name__ == "__main__":
    app.run(debug=True, port=5000)
