from flask import Flask

def setup():
    app = Flask(__name__)

    from .routes.core_routes import api as api_blueprint
    from .routes.core_routes import core as core_blueprint

    app.register_blueprint(api_blueprint)
    app.register_blueprint(core_blueprint)

    return app