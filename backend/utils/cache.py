from flask_caching import Cache

cache = Cache()
cached = cache.cached

def init_cache(app):
    cache.init_app(app)
