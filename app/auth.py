from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from firebase_admin import db
import bcrypt

bp = Blueprint ('auth',__name__)

@bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        users_ref = db.reference('asistente').get()
        
        if users_ref:
            for user_id, user_data in users_ref.items():
                if 'user' in user_data:
                    stored_username = user_data['user'].get('username')
                    stored_password = user_data['user'].get('password')
                    user_status = user_data['user'].get('estado')
                    user_type = user_data['user'].get('tipo')
                    
                    if stored_username == username:
                        if user_status != "activo":
                            flash("Tu cuenta está desactivada. Contacta con el administrador.")
                            return redirect(url_for('auth.login'))
                        
                        if bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8')):
                            session['logged_in'] = True
                            session['username'] = username
                            session['user_id'] = user_id
                            session['user_type'] = user_type
                            return redirect(url_for('home'))
        
        flash('Nombre de usuario o contraseña incorrectos.')
        return redirect(url_for('auth.login'))

    return render_template('auth/login.html')

@bp.route('/logout')
def logout():
    session.clear()
    flash("Sesión cerrada correctamente.")
    return redirect(url_for('auth.login'))