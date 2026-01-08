import os
import json

from flask import Flask, request, jsonify
from dotenv import load_dotenv
from pymongo import MongoClient
from bson.objectid import ObjectId
from schemas import user_schema, review_schema

load_dotenv()

app = Flask(__name__)
mongodb_host = os.getenv("MONGODB_HOST")

client = MongoClient(mongodb_host)
db = client[mongodb_host.split("/")[-1]]

users_collection = db["users"]
beers_collection = db["beers"]
breweries_collection = db["breweries"]
reviews_collection = db["reviews"]

def add_beers():
    with open('/app/drinks.json', 'r', encoding='utf-8') as beers_file:
        beers = json.load(beers_file)
        beers_collection.insert_many(beers)

def add_breweries():
    with open('/app/breweries.json', 'r', encoding='utf-8') as breweries_file:
        breweries = json.load(breweries_file)
        breweries_collection.insert_many(breweries)

def initialize_db():
    if not users_collection.find_one({'username': 'admin'}):
        users_collection.insert_one({'username': 'admin', 'password': 'admin', 'fav_beers': [], 'reviews': []})
    
    if not beers_collection.find_one():
        add_beers()
        
    if not breweries_collection.find_one():
        add_breweries()

initialize_db()

@app.route('/register_user', methods=['POST'])
@app.route('/register_user', methods=['POST'])
def register_user():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    preferred_style = data.get('preferred_style')  # nou

    if users_collection.find_one({'username': username}):
        return jsonify({'message': 'Username already exists'}), 400

    users_collection.insert_one(user_schema(username, password, preferred_style=preferred_style, bio="", last_login=None).to_json())
    return jsonify({'message': 'User created successfully'}), 201


@app.route('/user_exists', methods=['POST'])
def user_exists():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = users_collection.find_one({'username': username})

    if not user or password != user['password']:
        return jsonify({'message': 'Invalid username or password'}), 401

    return jsonify({'message': 'User exists'}), 200


@app.route('/beers', methods=['GET'])
def get_beers():
    data = request.json
    query = data.get('query', {})

    try:
        beers = beers_collection.find(query, {'_id': 0})
        beers_with_brewery = [{**beer, 'brewery': breweries_collection.find_one({'id': str(beer['brewery_id'])}, {'_id': 0})} for beer in beers]
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(beers_with_brewery), 200


@app.route('/beers/categories', methods=['GET'])
def get_beer_categories():
    try:
        categories = beers_collection.distinct('cat_name')
        categories = [{category: beers_collection.distinct('style_name', {'cat_name': category})} for category in categories]
    except Exception as e:
        return jsonify({"Error getting categories": str(e)}), 500

    return jsonify(categories), 200


@app.route('/add_to_favorites', methods=['POST'])
def add_to_favorites():
    data = request.json
    username = data.get('username')
    beer_id = data.get('beer_id')

    if not beers_collection.find_one({'id': str(beer_id)}):
        return jsonify({'message': 'Beer not found'}), 404

    user = users_collection.find_one({'username': username})

    if beer_id in user['fav_beers']:
        return jsonify({'message': 'Beer already in favorites'}), 400
    
    user['fav_beers'].append(beer_id)
    users_collection.update_one({'username': username}, {'$set': {'fav_beers': user['fav_beers']}})

    return jsonify({'message': 'Beer added to favorites'}), 200


@app.route('/get_favorites', methods=['GET'])
def get_favorites():
    data = request.json
    username = data.get('username')

    user = users_collection.find_one({'username': username})
    fav_beers = beers_collection.find({'id': {'$in': user['fav_beers']}}, {'_id': 0})
    
    fav_beers = [{**beer, 'brewery': breweries_collection.find_one({'id': str(beer['brewery_id'])}, {'_id': 0})} for beer in fav_beers]
    return jsonify(list(fav_beers))


@app.route('/remove_from_favorites', methods=['DELETE'])
def remove_from_favorites():
    data = request.json
    username = data.get('username')
    beer_id = data.get('beer_id')
    user = users_collection.find_one({'username': username})

    if beer_id not in user['fav_beers']:
        return jsonify({'message': 'Beer not in favourites'}), 400

    user['fav_beers'].remove(beer_id)
    users_collection.update_one({'username': username}, {'$set': {'fav_beers': user['fav_beers']}})

    return jsonify({'message': 'Beer removed from favourites'}), 200


@app.route('/breweries', methods=['GET'])
def get_breweries():
    data = request.json
    query = data.get('query', {})

    try:
        breweries = breweries_collection.find(query, {'_id': 0})
    except Exception as e:
        return jsonify({"Error getting breweries": str(e)}), 500

    return jsonify(list(breweries)), 200


@app.route('/breweries/<int:brewery_id>', methods=['GET'])
def get_brewery(brewery_id):
    brewery = breweries_collection.find_one({'id': str(brewery_id)}, {'_id': 0})

    if not brewery:
        return jsonify({'message': 'Brewery not found'}), 404

    return jsonify(brewery), 200


@app.route('/recommendations', methods=['GET'])
def get_recommendations():
    data = request.json
    username = data.get('username')
    user = users_collection.find_one({'username': username})
    fav_beers = beers_collection.find({'id': {'$in': user['fav_beers']}}, {'_id': 0})
    fav_beers = [beer['style_name'] for beer in fav_beers]

    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    skip = (page - 1) * per_page

    recommendations = beers_collection.find({'style_name': {'$in': fav_beers}}, {'_id': 0}).skip(skip).limit(per_page)
    recommendations = [{**beer, 'brewery': breweries_collection.find_one({'id': str(beer['brewery_id'])}, {'_id': 0})} for beer in recommendations]

    return jsonify(list(recommendations)), 200


@app.route('/reviews/beer/<int:beer_id>', methods=['GET'])
def get_beer_reviews(beer_id):
    beer_id = str(beer_id)

    if not beers_collection.find_one({'id': beer_id}):
        return jsonify({'message': 'Beer not found'}), 404
    
    reviews = reviews_collection.find({'beer_id': beer_id})
    reviews = [{**review, 'user': users_collection.find_one({'_id': review['user_id']}, {'_id': 0})['username']} for review in reviews]
    reviews = [{**review, '_id': str(review['_id']), 'user_id': str(review['user_id'])} for review in reviews]

    return jsonify(list(reviews))


@app.route('/reviews', methods=['POST'])
def add_review():
    data = request.json

    username = data.get('username')
    beer_id = data.get('beer_id')
    rating = data.get('rating')
    review = data.get('review')
    tastes = data.get('tastes', [])

    user_id = users_collection.find_one({'username': username})['_id']

    if not beers_collection.find_one({'id': str(beer_id)}):
        return jsonify({'message': 'Beer not found'}), 404

    user = users_collection.find_one({'username': username})
    if any(review_id for review_id in user['reviews'] if reviews_collection.find_one({'_id': review_id, 'beer_id': beer_id})):
        return jsonify({'message': 'You have already reviewed this beer'}), 400
    
    review_id = reviews_collection.insert_one(review_schema(beer_id, rating, review, tastes, user_id).to_json()).inserted_id
    user['reviews'].append(review_id)
    
    users_collection.update_one({'username': username}, {'$set': {'reviews': user['reviews']}})
                                
    return jsonify({'message': 'Review added successfully'}), 201


@app.route('/reviews', methods=['GET'])
def get_reviews():
    data = request.json

    username = data.get('username')
    user = users_collection.find_one({'username': username})
    reviews = reviews_collection.find({'_id': {'$in': user['reviews']}})
    reviews = [{**review, 'user': users_collection.find_one({'_id': review['user_id']}, {'_id': 0})['username']} for review in reviews]
    reviews = [{**review, '_id': str(review['_id']), 'user_id': str(review['user_id'])} for review in reviews]
    reviews = [{**review, 'beer': beers_collection.find_one({'id': review['beer_id']}, {'_id': 0})} for review in reviews]

    return jsonify(list(reviews)), 200


@app.route('/reviews/<string:review_id>', methods=['DELETE'])
def delete_review(review_id):
    data = request.json

    username = data.get('username')
    user = users_collection.find_one({'username': username})
    review = reviews_collection.find_one({'_id': ObjectId(review_id)})
    
    if not review:
        return jsonify({'message': 'Review not found'}), 404
    
    if review['user_id'] != user['_id']:
        return jsonify({'message': 'You are not authorized to delete this review'}), 403
    
    reviews_collection.delete_one({'_id': ObjectId(review_id)})
    user['reviews'].remove(ObjectId(review_id))
    users_collection.update_one({'username': username}, {'$set': {'reviews': user['reviews']}})
    
    return jsonify({'message': 'Review deleted successfully'}), 200

from datetime import datetime, timezone

def compute_rank(review_count: int) -> str:
    if review_count <= 5:
        return "Novice"
    return "Expert"

@app.route('/profile', methods=['GET'])
def get_profile():
    data = request.json or {}
    username = data.get('username')

    user = users_collection.find_one({'username': username})
    if not user:
        return jsonify({'message': 'User not found'}), 404

    review_count = len(user.get('reviews', []))
    rank = compute_rank(review_count)

    return jsonify({
        "username": user.get("username"),
        "bio": user.get("bio", ""),
        "preferred_style": user.get("preferred_style"),
        "last_login": user.get("last_login"),
        "review_count": review_count,
        "rank": rank
    }), 200

@app.route('/profile', methods=['PUT'])
def update_profile():
    data = request.json or {}
    username = data.get('username')
    bio = data.get('bio')
    preferred_style = data.get('preferred_style')

    user = users_collection.find_one({'username': username})
    if not user:
        return jsonify({'message': 'User not found'}), 404

    update = {}
    if bio is not None:
        update["bio"] = bio
    if preferred_style is not None:
        update["preferred_style"] = preferred_style

    if not update:
        return jsonify({'message': 'Nothing to update'}), 400

    users_collection.update_one({'username': username}, {'$set': update})
    return jsonify({'message': 'Profile updated'}), 200

@app.route('/last_login', methods=['POST'])
def set_last_login():
    data = request.json or {}
    username = data.get('username')

    user = users_collection.find_one({'username': username})
    if not user:
        return jsonify({'message': 'User not found'}), 404

    now = datetime.now(timezone.utc).isoformat()
    users_collection.update_one({'username': username}, {'$set': {'last_login': now}})
    return jsonify({'message': 'Last login updated', 'last_login': now}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5051)
