from flask import Flask, render_template, redirect, url_for, session
from app import auth, assistant, faq, resources, settings
from config import init_services, config
import os

def create_app():
    app = Flask(__name__)
    
    app.config.from_mapping(config)
    
    init_services()
    
    app.register_blueprint(auth.bp)
    app.register_blueprint(assistant.bp)
    app.register_blueprint(faq.bp)
    app.register_blueprint(resources.bp)
    app.register_blueprint(settings.bp)
    
    def login_required(func):
        def wrapper(*args, **kwargs):
            if 'logged_in' not in session:
                return redirect(url_for('auth.login'))
            return func(*args, **kwargs)
        wrapper.__name__ = func.__name__
        return wrapper
    
    @app.route('/')
    @login_required
    def home():
        return render_template('index.html')
    
    return app

app = create_app()