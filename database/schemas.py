class user_schema:
    def __init__(self, username, password, fav_beers=None, reviews=None, preferred_style=None, bio="", last_login=None):
        self.username = username
        self.password = password
        self.fav_beers = fav_beers or []
        self.reviews = reviews or []
        self.preferred_style = preferred_style
        self.bio = bio
        self.last_login = last_login

    def to_json(self):
        return {
            "username": self.username,
            "password": self.password,
            "fav_beers": self.fav_beers,
            "reviews": self.reviews,
            "preferred_style": self.preferred_style,
            "bio": self.bio,
            "last_login": self.last_login
        }

    @staticmethod
    def from_json(json):
        return user_schema(
            json['username'],
            json['password'],
            json['fav_beers'],
            json['reviews']
        )


class review_schema:
    def __init__(self, beer_id, rating, review, tastes, user_id):
        self.beer_id = beer_id
        self.rating = rating
        self.review = review
        self.tastes = tastes
        self.user_id = user_id

    def to_json(self):
        return {
            'beer_id': self.beer_id,
            'rating': self.rating,
            'review': self.review,
            'tastes': self.tastes,
            'user_id': self.user_id
        }

    @staticmethod
    def from_json(json):
        return review_schema(
            json['beer_id'],
            json['rating'],
            json['review'],
            json['tastes'],
            json['user_id']
        )
