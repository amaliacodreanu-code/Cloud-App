import os
import requests

from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token
from hashlib import sha256
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

secret_key_file = '/app/secret_key.txt'

with open(secret_key_file, 'r') as file:
    secret_key = file.read().strip()

app.config["JWT_SECRET_KEY"] = secret_key
app.config["DB_API_URL"] = "http://data-layer-api:5000"

jwt = JWTManager(app)

def hash_password(password):
    return sha256(password.encode()).hexdigest()

@app.route('/register', methods=['POST'])
def register():
    data = request.json

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Missing username or password'}), 400
    
    username = data['username']
    password = hash_password(data['password'])
    res = requests.post(f"{app.config['DB_API_URL']}/register_user", json={'username': username, 'password': password})

    return res.json(), res.status_code


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Missing username or password'}), 400

    username = data['username']
    password = hash_password(data['password'])

    res = requests.post(f"{app.config['DB_API_URL']}/user_exists", json={'username': username, 'password': password})

    if res.status_code != 200:
        return jsonify({'message': 'Invalid credentials, please try again.'}), 401

    access_token = create_access_token(identity=username, expires_delta=False)
    return jsonify({'access_token': access_token}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5050)
