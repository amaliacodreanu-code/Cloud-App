class user_schema:
    def __init__(
        self,
        username,
        password,
        fav_drinks=None,
        reviews=None,
        preferred_style=None,
        bio="",
        last_login=None,
    ):
        self.username = username
        self.password = password
        self.fav_drinks = fav_drinks or []
        self.reviews = reviews or []
        self.preferred_style = preferred_style
        self.bio = bio
        self.last_login = last_login

    def to_json(self):
        return {
            "username": self.username,
            "password": self.password,
            "fav_drinks": self.fav_drinks,
            "reviews": self.reviews,
            "preferred_style": self.preferred_style,
            "bio": self.bio,
            "last_login": self.last_login,
        }

    @staticmethod
    def from_json(json):
        return user_schema(
            json.get("username"),
            json.get("password"),
            json.get("fav_drinks", []),
            json.get("reviews", []),
            json.get("preferred_style"),
            json.get("bio", ""),
            json.get("last_login"),
        )


class review_schema:
    def __init__(self, drink_id, rating, review, tastes, user_id):
        self.drink_id = str(drink_id)
        self.rating = rating
        self.review = review
        self.tastes = tastes or []
        self.user_id = user_id

    def to_json(self):
        return {
            "drink_id": self.drink_id,
            "rating": self.rating,
            "review": self.review,
            "tastes": self.tastes,
            "user_id": self.user_id,
        }

    @staticmethod
    def from_json(json):
        return review_schema(
            json.get("drink_id"),
            json.get("rating"),
            json.get("review"),
            json.get("tastes", []),
            json.get("user_id"),
        )
