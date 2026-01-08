import os
import requests

from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from dotenv import load_dotenv
from openai import OpenAI
from flask_caching import Cache

load_dotenv()
app = Flask(__name__)

# secret_key_file = os.getenv('JWT_SECRET_KEY_FILE')
# openai_api_key_file = os.getenv('OPENAI_API_KEY_FILE')

# with open(secret_key_file, 'r') as file:
#     secret_key = file.read().strip()

# with open(openai_api_key_file, 'r') as file:
#     openai_api_key = file.read().strip()


secret_key_file = '/app/secret_key.txt'

with open(secret_key_file, 'r') as file:
    secret_key = file.read().strip()

openai_api_key = "cheie_falsa_temporara"

app.config['JWT_SECRET_KEY'] = secret_key
app.config['DB_API_URL'] = os.getenv('DB_API_URL')

cache = Cache(app, config={'CACHE_TYPE': 'SimpleCache'})

jwt = JWTManager(app)

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify({'message': f'Welcome, {current_user}'})


@app.route('/beers', methods=['GET'])
@cache.cached(timeout=0)
def get_beers():
    query = {}

    for key, value in request.args.items():
        query[key] = value
        
    res = requests.get(f'{app.config["DB_API_URL"]}/beers', json=query)
    return res.json(), res.status_code


@app.route('/beers/categories', methods=['GET'])
def get_categories():
    res = requests.get(f'{app.config["DB_API_URL"]}/beers/categories')
    return res.json(), res.status_code


@app.route('/favorites', methods=['POST'])
@jwt_required()
def add_favourite():
    current_user = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('beer_id'):
        return jsonify({'message': 'Missing beer_id'}), 400

    beer_id = data['beer_id']
    beer_id = str(beer_id)
    res = requests.post(f'{app.config["DB_API_URL"]}/add_to_favorites', json={'beer_id': beer_id, 'username': current_user})

    return res.json(), res.status_code


@app.route('/favorites', methods=['GET'])
@jwt_required()
def get_favorites():
    current_user = get_jwt_identity()
    res = requests.get(f'{app.config["DB_API_URL"]}/get_favorites', json={'username': current_user})
    return res.json(), res.status_code


@app.route('/favorites', methods=['DELETE'])
@jwt_required()
def delete_favourite():
    current_user = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('beer_id'):
        return jsonify({'message': 'Missing beer_id'}), 400

    beer_id = str(data['beer_id'])
    res = requests.delete(f'{app.config["DB_API_URL"]}/remove_from_favorites', json={'beer_id': beer_id, 'username': current_user})
    return res.json(), res.status_code


@app.route('/breweries', methods=['GET'])
@cache.cached(timeout=0)
def get_breweries():
    query = {}

    for key, value in request.args.items():
        query[key] = value

    res = requests.get(f'{app.config["DB_API_URL"]}/breweries', json=query)
    return res.json(), res.status_code


@app.route('/breweries/<int:brewery_id>', methods=['GET'])
def get_brewery(brewery_id):
    res = requests.get(f'{app.config["DB_API_URL"]}/breweries/{brewery_id}')
    return res.json(), res.status_code


@app.route('/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations():
    current_user = get_jwt_identity()
    res = requests.get(f'{app.config["DB_API_URL"]}/recommendations', json={'username': current_user})
    return res.json(), res.status_code


@app.route('/chatbot', methods=['GET'])
@jwt_required()
def get_chatbot():
    current_user = get_jwt_identity()
    res = requests.get(f'{app.config["DB_API_URL"]}/get_favorites', json={'username': current_user})
    beers = res.json()
    fav_beers = [beer['style_name'] for beer in beers]
    fav_beers = ', '.join(fav_beers)

    client = OpenAI(api_key=openai_api_key)
    
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that is very knowledgeable in specialty beers."},
            {"role": "user", "content": f"I like {fav_beers} beers. What would you recommend me?"},
        ]
    )

    response = {'response': completion.choices[0].message.content}
    return jsonify(response)


@app.route('/reviews/beer/<int:beer_id>', methods=['GET'])
def get_beer_reviews(beer_id):
    res = requests.get(f'{app.config["DB_API_URL"]}/reviews/beer/{beer_id}')
    return res.json(), res.status_code


@app.route('/reviews', methods=['POST'])
@jwt_required()
def add_review():
    current_user = get_jwt_identity()
    data = request.json

    if not data or not data.get('beer_id') or not data.get('rating') or not data.get('tastes'):
        return jsonify({'message': 'Missing required fields'}), 400

    beer_id = data['beer_id']
    rating = data['rating']
    review = data['review']
    tastes = data['tastes']

    res = requests.post(f'{app.config["DB_API_URL"]}/reviews', json={'beer_id': beer_id, 'username': current_user, 'rating': rating, 'review': review, 'tastes': tastes})
    return res.json(), res.status_code


@app.route('/reviews', methods=['GET'])
@jwt_required()
def get_reviews():
    current_user = get_jwt_identity()
    res = requests.get(f'{app.config["DB_API_URL"]}/reviews', json={'username': current_user})
    return res.json(), res.status_code
    

@app.route('/reviews/<string:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    current_user = get_jwt_identity()
    res = requests.delete(f'{app.config["DB_API_URL"]}/reviews/{review_id}', json={'username': current_user})
    return res.json(), res.status_code

@app.route('/profile', methods=['GET'])
@jwt_required()
def profile_get():
    current_user = get_jwt_identity()
    res = requests.get(f'{app.config["DB_API_URL"]}/profile', json={'username': current_user})
    return res.json(), res.status_code

@app.route('/profile', methods=['PUT'])
@jwt_required()
def profile_put():
    current_user = get_jwt_identity()
    data = request.get_json() or {}
    payload = {
        "username": current_user,
        "bio": data.get("bio"),
        "preferred_style": data.get("preferred_style")
    }
    res = requests.put(f'{app.config["DB_API_URL"]}/profile', json=payload)
    return res.json(), res.status_code



if __name__ == '__main__':
    app.run(debug=True, port=5000)
