import os
import json

from flask import Flask, request, jsonify
from dotenv import load_dotenv
from pymongo import MongoClient
from bson.objectid import ObjectId
from schemas import user_schema, review_schema
from pymongo import ASCENDING, DESCENDING

load_dotenv()

app = Flask(__name__)
mongodb_host = os.getenv("MONGODB_HOST")

client = MongoClient(mongodb_host)
db_name = mongodb_host.rsplit("/", 1)[-1].split("?", 1)[0]
db = client[db_name]

users_collection = db["users"]
drinks_collection = db["drinks"]
producers_collection = db["producers"]
reviews_collection = db["reviews"]
producer_reviews_collection = db["producer_reviews"]

# -----------------------------
# PRODUCER REVIEWS
# -----------------------------
@app.route("/reviews/producer/<string:producer_id>", methods=["GET"])
def get_producer_reviews(producer_id):
    producer_id = str(producer_id)

    if not producers_collection.find_one({"id": producer_id}):
        return jsonify({"message": "Producer not found"}), 404

    reviews = producer_reviews_collection.find({"producer_id": producer_id})

    out = []
    for r in reviews:
        u = users_collection.find_one({"_id": r["user_id"]}, {"_id": 0})
        out.append(
            {
                "_id": str(r["_id"]),
                "user_id": str(r["user_id"]),
                "user": u["username"] if u else None,
                "producer_id": r.get("producer_id"),
                "rating": r.get("rating"),
                "review": r.get("review"),
                "tastes": r.get("tastes", []),
            }
        )

    return jsonify(out), 200


@app.route("/producer-reviews", methods=["POST"])
def add_producer_review():
    data = request.json or {}

    username = data.get("username")
    producer_id = str(data.get("producer_id"))
    rating = data.get("rating")
    review = data.get("review")
    tastes = data.get("tastes", [])

    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"message": "User not found"}), 404

    if not producers_collection.find_one({"id": producer_id}):
        return jsonify({"message": "Producer not found"}), 404

    existing = producer_reviews_collection.find_one({"user_id": user["_id"], "producer_id": producer_id})
    if existing:
        return jsonify({"message": "You have already reviewed this producer"}), 400

    doc = {
        "producer_id": producer_id,
        "rating": rating,
        "review": review,
        "tastes": tastes,
        "user_id": user["_id"],
    }

    review_id = producer_reviews_collection.insert_one(doc).inserted_id
    users_collection.update_one({"username": username}, {"$push": {"producer_reviews": review_id}})

    return jsonify({"message": "Producer review added successfully"}), 201


@app.route("/producer-reviews", methods=["GET"])
def get_my_producer_reviews():
    data = request.json or {}
    username = data.get("username")

    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"message": "User not found"}), 404

    ids = user.get("producer_reviews", [])
    reviews = producer_reviews_collection.find({"_id": {"$in": ids}})

    out = []
    for r in reviews:
        producer = producers_collection.find_one({"id": r.get("producer_id")}, {"_id": 0})
        out.append(
            {
                "_id": str(r["_id"]),
                "user_id": str(r["user_id"]),
                "user": username,
                "rating": r.get("rating"),
                "review": r.get("review"),
                "tastes": r.get("tastes", []),
                "producer": producer,
                "producer_id": r.get("producer_id"),
            }
        )

    return jsonify(out), 200


@app.route("/producer-reviews/<string:review_id>", methods=["DELETE"])
def delete_producer_review(review_id):
    data = request.json or {}
    username = data.get("username")

    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"message": "User not found"}), 404

    review = producer_reviews_collection.find_one({"_id": ObjectId(review_id)})
    if not review:
        return jsonify({"message": "Review not found"}), 404

    if review["user_id"] != user["_id"]:
        return jsonify({"message": "You are not authorized to delete this review"}), 403

    producer_reviews_collection.delete_one({"_id": ObjectId(review_id)})
    users_collection.update_one({"username": username}, {"$pull": {"producer_reviews": ObjectId(review_id)}})

    return jsonify({"message": "Review deleted successfully"}), 200


def add_drinks():
    with open("/app/drinks.json", "r", encoding="utf-8") as drinks_file:
        drinks = json.load(drinks_file)
        drinks_collection.insert_many(drinks)


def add_producers():
    with open("/app/producers.json", "r", encoding="utf-8") as producers_file:
        producers = json.load(producers_file)
        producers_collection.insert_many(producers)


def initialize_db():
    if not users_collection.find_one({"username": "admin"}):
        users_collection.insert_one(
            {"username": "admin", "password": "admin", "fav_drinks": [], "reviews": []}
        )

    if not drinks_collection.find_one():
        add_drinks()

    if not producers_collection.find_one():
        add_producers()


initialize_db()


@app.route("/register_user", methods=["POST"])
def register_user():
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")
    preferred_style = data.get("preferred_style")

    if users_collection.find_one({"username": username}):
        return jsonify({"message": "Username already exists"}), 400

    users_collection.insert_one(
        user_schema(
            username,
            password,
            preferred_style=preferred_style,
            bio="",
            last_login=None,
        ).to_json()
    )
    return jsonify({"message": "User created successfully"}), 201


@app.route("/user_exists", methods=["POST"])
def user_exists():
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")

    user = users_collection.find_one({"username": username})
    if not user or password != user.get("password"):
        return jsonify({"message": "Invalid username or password"}), 401

    return jsonify({"message": "User exists"}), 200



@app.route("/top-rated", methods=["GET"])
def top_rated():
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    min_reviews = int(request.args.get("min_reviews", 1))
    sort = request.args.get("sort", "avg")  # "avg" | "count"
    skip = (page - 1) * per_page

    # sort key
    if sort == "count":
        sort_stage = {"$sort": {"review_count": -1, "avg_rating": -1}}
    else:
        sort_stage = {"$sort": {"avg_rating": -1, "review_count": -1}}

    pipeline = [
        # group reviews by drink_id
        {
            "$group": {
                "_id": "$drink_id",
                "avg_rating": {"$avg": "$rating"},
                "review_count": {"$sum": 1},
            }
        },
        # keep only drinks with enough reviews
        {"$match": {"review_count": {"$gte": min_reviews}}},
        sort_stage,
        {"$skip": skip},
        {"$limit": per_page},

        # join drinks
        {
            "$lookup": {
                "from": "drinks",
                "localField": "_id",
                "foreignField": "id",
                "as": "drink",
            }
        },
        {"$unwind": {"path": "$drink", "preserveNullAndEmptyArrays": True}},

        # join producers
        {
            "$lookup": {
                "from": "producers",
                "localField": "drink.producerId",
                "foreignField": "id",
                "as": "producer",
            }
        },
        {"$unwind": {"path": "$producer", "preserveNullAndEmptyArrays": True}},

        # project clean JSON (NO ObjectId)
        {
            "$project": {
                "_id": 0,
                "drink_id": "$_id",
                "avg_rating": 1,
                "review_count": 1,

                "drink": {
                    "id": "$drink.id",
                    "name": "$drink.name",
                    "category": "$drink.category",
                    "abv": "$drink.abv",
                    "description": "$drink.description",
                    "producerId": "$drink.producerId",
                },

                "producer": {
                    "id": "$producer.id",
                    "name": "$producer.name",
                    "type": "$producer.type",
                    "city": "$producer.city",
                    "country": "$producer.country",
                },
            }
        },
    ]

    try:
        data = list(reviews_collection.aggregate(pipeline))

        # round avg_rating safely
        for r in data:
            if isinstance(r.get("avg_rating"), (int, float)):
                r["avg_rating"] = round(float(r["avg_rating"]), 2)

        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500






# -----------------------------
# DRINKS
# -----------------------------
@app.route("/drinks", methods=["GET"])
def get_drinks():
    data = request.json or {}
    query = data.get("query", {})

    try:
        drinks = drinks_collection.find(query, {"_id": 0})
        drinks_with_producer = []
        for drink in drinks:
            producer_id = drink.get("producerId")
            producer = None
            if producer_id is not None:
                producer = producers_collection.find_one({"id": str(producer_id)}, {"_id": 0})
            drinks_with_producer.append({**drink, "producer": producer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(drinks_with_producer), 200


@app.route("/drinks/categories", methods=["GET"])
def get_drink_categories():
    try:
        categories = drinks_collection.distinct("category")
    except Exception as e:
        return jsonify({"Error getting categories": str(e)}), 500

    return jsonify(categories), 200


# -----------------------------
# PRODUCERS
# -----------------------------
@app.route("/producers", methods=["GET"])
def get_producers():
    data = request.json or {}
    query = data.get("query", {})

    try:
        producers = producers_collection.find(query, {"_id": 0})
    except Exception as e:
        return jsonify({"Error getting producers": str(e)}), 500

    return jsonify(list(producers)), 200


@app.route("/producers/<string:producer_id>", methods=["GET"])
def get_producer(producer_id):
    producer = producers_collection.find_one({"id": str(producer_id)}, {"_id": 0})
    if not producer:
        return jsonify({"message": "Producer not found"}), 404
    return jsonify(producer), 200


# -----------------------------
# FAVORITES
# -----------------------------
@app.route("/add_to_favorites", methods=["POST"])
def add_to_favorites():
    data = request.json or {}
    username = data.get("username")
    drink_id = data.get("drink_id")

    if not drinks_collection.find_one({"id": str(drink_id)}):
        return jsonify({"message": "Drink not found"}), 404

    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"message": "User not found"}), 404

    if "fav_drinks" not in user:
        users_collection.update_one({"username": username}, {"$set": {"fav_drinks": []}})
        user = users_collection.find_one({"username": username})

    if str(drink_id) in user["fav_drinks"]:
        return jsonify({"message": "Drink already in favorites"}), 400

    user["fav_drinks"].append(str(drink_id))
    users_collection.update_one(
        {"username": username}, {"$set": {"fav_drinks": user["fav_drinks"]}}
    )

    return jsonify({"message": "Drink added to favorites"}), 200


@app.route("/get_favorites", methods=["GET"])
def get_favorites():
    data = request.json or {}
    username = data.get("username")

    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"message": "User not found"}), 404

    fav_drinks = [str(x) for x in user.get("fav_drinks", [])]
    fav = drinks_collection.find({"id": {"$in": fav_drinks}}, {"_id": 0})

    fav = [
        {
            **drink,
            "producer": producers_collection.find_one({"id": str(drink.get("producerId"))}, {"_id": 0})
            if drink.get("producerId") is not None
            else None,
        }
        for drink in fav
    ]

    return jsonify(list(fav)), 200


@app.route("/remove_from_favorites", methods=["DELETE"])
def remove_from_favorites():
    data = request.json or {}
    username = data.get("username")
    drink_id = str(data.get("drink_id"))

    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"message": "User not found"}), 404

    fav_drinks = user.get("fav_drinks", [])
    if drink_id not in fav_drinks:
        return jsonify({"message": "Drink not in favourites"}), 400

    fav_drinks.remove(drink_id)
    users_collection.update_one({"username": username}, {"$set": {"fav_drinks": fav_drinks}})

    return jsonify({"message": "Drink removed from favourites"}), 200


# -----------------------------
# RECOMMENDATIONS
# -----------------------------
@app.route("/recommendations", methods=["GET"])
def get_recommendations():
    data = request.json or {}
    username = data.get("username")

    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"message": "User not found"}), 404

    fav_drinks_ids = [str(x) for x in user.get("fav_drinks", [])]
    fav_drinks = drinks_collection.find({"id": {"$in": fav_drinks_ids}}, {"_id": 0})
    fav_categories = [d.get("category") for d in fav_drinks if d.get("category")]

    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    skip = (page - 1) * per_page

    recommendations = (
        drinks_collection.find({"category": {"$in": fav_categories}}, {"_id": 0})
        .skip(skip)
        .limit(per_page)
    )

    recommendations = [
        {
            **drink,
            "producer": producers_collection.find_one({"id": str(drink.get("producerId"))}, {"_id": 0})
            if drink.get("producerId") is not None
            else None,
        }
        for drink in recommendations
    ]

    return jsonify(list(recommendations)), 200


# -----------------------------
# REVIEWS
# -----------------------------
@app.route("/reviews/drink/<string:drink_id>", methods=["GET"])
def get_drink_reviews(drink_id):
    drink_id = str(drink_id)

    if not drinks_collection.find_one({"id": drink_id}):
        return jsonify({"message": "Drink not found"}), 404

    reviews = reviews_collection.find({"drink_id": drink_id})

    out = []
    for r in reviews:
        username = users_collection.find_one({"_id": r["user_id"]}, {"_id": 0})
        out.append(
            {
                "_id": str(r["_id"]),
                "user_id": str(r["user_id"]),
                "user": username["username"] if username else None,
                "drink_id": r.get("drink_id"),
                "rating": r.get("rating"),
                "review": r.get("review"),
                "tastes": r.get("tastes", []),
            }
        )

    return jsonify(out), 200


@app.route("/reviews", methods=["POST"])
def add_review():
    data = request.json or {}

    username = data.get("username")
    drink_id = str(data.get("drink_id"))
    rating = data.get("rating")
    review = data.get("review")
    tastes = data.get("tastes", [])

    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"message": "User not found"}), 404

    if not drinks_collection.find_one({"id": drink_id}):
        return jsonify({"message": "Drink not found"}), 404

    # prevent duplicate review for same drink
    existing = reviews_collection.find_one({"user_id": user["_id"], "drink_id": drink_id})
    if existing:
        return jsonify({"message": "You have already reviewed this drink"}), 400

    # IMPORTANT: review_schema must store drink_id (not beer_id)
    review_doc = review_schema(drink_id, rating, review, tastes, user["_id"]).to_json()
    review_id = reviews_collection.insert_one(review_doc).inserted_id

    users_collection.update_one({"username": username}, {"$push": {"reviews": review_id}})

    return jsonify({"message": "Review added successfully"}), 201


@app.route("/reviews", methods=["GET"])
def get_reviews():
    data = request.json or {}
    username = data.get("username")

    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"message": "User not found"}), 404

    reviews = reviews_collection.find({"_id": {"$in": user.get("reviews", [])}})

    out = []
    for r in reviews:
        drink = drinks_collection.find_one({"id": r.get("drink_id")}, {"_id": 0})
        producer = None
        if drink and drink.get("producerId") is not None:
            producer = producers_collection.find_one({"id": str(drink["producerId"])}, {"_id": 0})

        out.append(
            {
                "_id": str(r["_id"]),
                "user_id": str(r["user_id"]),
                "user": username,
                "rating": r.get("rating"),
                "review": r.get("review"),
                "tastes": r.get("tastes", []),
                "drink": drink,
                "producer": producer,
            }
        )

    return jsonify(out), 200


@app.route("/reviews/<string:review_id>", methods=["DELETE"])
def delete_review(review_id):
    data = request.json or {}
    username = data.get("username")

    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"message": "User not found"}), 404

    review = reviews_collection.find_one({"_id": ObjectId(review_id)})
    if not review:
        return jsonify({"message": "Review not found"}), 404

    if review["user_id"] != user["_id"]:
        return jsonify({"message": "You are not authorized to delete this review"}), 403

    reviews_collection.delete_one({"_id": ObjectId(review_id)})
    users_collection.update_one(
        {"username": username}, {"$pull": {"reviews": ObjectId(review_id)}}
    )

    return jsonify({"message": "Review deleted successfully"}), 200


# -----------------------------
# PROFILE
# -----------------------------
from datetime import datetime, timezone

def compute_rank(review_count: int) -> str:
    if review_count <= 5:
        return "Novice"
    return "Expert"


@app.route("/profile", methods=["GET"])
def get_profile():
    data = request.json or {}
    username = data.get("username")

    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"message": "User not found"}), 404

    review_count = len(user.get("reviews", []))
    rank = compute_rank(review_count)

    return jsonify(
        {
            "username": user.get("username"),
            "bio": user.get("bio", ""),
            "preferred_style": user.get("preferred_style"),
            "last_login": user.get("last_login"),
            "review_count": review_count,
            "rank": rank,
        }
    ), 200


@app.route("/profile", methods=["PUT"])
def update_profile():
    data = request.json or {}
    username = data.get("username")
    bio = data.get("bio")
    preferred_style = data.get("preferred_style")

    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"message": "User not found"}), 404

    update = {}
    if bio is not None:
        update["bio"] = bio
    if preferred_style is not None:
        update["preferred_style"] = preferred_style

    if not update:
        return jsonify({"message": "Nothing to update"}), 400

    users_collection.update_one({"username": username}, {"$set": update})
    return jsonify({"message": "Profile updated"}), 200


@app.route("/last_login", methods=["POST"])
def set_last_login():
    data = request.json or {}
    username = data.get("username")

    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"message": "User not found"}), 404

    now = datetime.now(timezone.utc).isoformat()
    users_collection.update_one({"username": username}, {"$set": {"last_login": now}})
    return jsonify({"message": "Last login updated", "last_login": now}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5051)
