from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify
from firebase_admin import db
import bcrypt

bp = Blueprint ('settings',__name__)

def login_required(func):
    def wrapper(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('auth.login'))
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

@bp.route('/settings')
@login_required
def settings_route():
    return render_template('asistente/settings.html')

@bp.route('/get_usuarios', methods=['GET'])
@login_required
def get_usuarios():
    current_user_id = session.get('user_id')
    
    if not current_user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403
    
    try:
        asistente_ref = db.reference('asistente')
        all_users_data = asistente_ref.get()
        
        if not all_users_data:
            return jsonify({'success': True, 'users': []}), 200
        
        users_list = []
        
        for user_id, user_data in all_users_data.items():
            if user_data and 'user' in user_data:
                user_info = user_data['user']
                user_object = {
                    'user_id': user_id,
                    'estado': user_info.get('estado'),
                    'password': user_info.get('password'),
                    'tipo': user_info.get('tipo'),
                    'username': user_info.get('username')
                }
                users_list.append(user_object)
        
        return jsonify({
            'success': True, 
            'users': users_list
        }), 200
        
    except Exception as e:
        print(f"Error detallado: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error al obtener los usuarios: {str(e)}'
        }), 500


@bp.route('/agregar_usuario', methods=['POST'])
@login_required
def agregar_usuario():
    current_user_id = session.get('user_id')
    
    if not current_user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403

    data = request.get_json()
    username = data.get('username')
    tipo = data.get('tipo')
    password = data.get('password')
    estado = data.get('estado')

    if not all([username, tipo, password, estado]):
        return jsonify({'success': False, 'error': 'Todos los campos son obligatorios'}), 400

    try:
        asistente_ref = db.reference('asistente')

        usuarios = asistente_ref.get()
        for key, usuario in usuarios.items():
            if usuario.get('user', {}).get('username') == username:
                return jsonify({'success': False, 'error': 'El usuario ya existe'}), 400

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        nuevo_usuario_ref = asistente_ref.push()

        nuevo_usuario_ref.set({
            'user': {
                'username': username,
                'tipo': tipo,
                'estado': estado,
                'password': hashed_password.decode('utf-8')
            }
        })

        return jsonify({'success': True, 'message': 'Usuario agregado correctamente'}), 200

    except Exception as e:
        print(f"Error al agregar usuario: {str(e)}")
        return jsonify({'success': False, 'error': f'Error al agregar el usuario: {str(e)}'}), 500


@bp.route('/editar_usuario', methods=['PUT']) 
@login_required
def editar_usuario():
    current_user_id = session.get('user_id')
    
    if not current_user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403

    data = request.get_json()
    user_id = data.get('userId')
    username = data.get('username')
    tipo = data.get('tipo')
    estado = data.get('estado')
    password = data.get('password')

    if not all([user_id, username, tipo, estado]):
        return jsonify({'success': False, 'error': 'Faltan campos requeridos'}), 400

    try:
        user_ref = db.reference(f'asistente/{user_id}/user')
        current_user = user_ref.get()
        
        if not current_user:
            return jsonify({'success': False, 'error': 'Usuario no encontrado'}), 404

        asistente_ref = db.reference('asistente')
        usuarios = asistente_ref.get()
        for key, usuario in usuarios.items():
            if key != user_id and usuario.get('user', {}).get('username') == username:
                return jsonify({'success': False, 'error': 'El nombre de usuario ya está en uso'}), 400

        update_data = {
            'username': username,
            'tipo': tipo,
            'estado': estado
        }

        if password:
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            update_data['password'] = hashed_password.decode('utf-8')
        
        user_ref.update(update_data)
        
        return jsonify({'success': True, 'message': 'Usuario actualizado correctamente'}), 200

    except Exception as e:
        print(f"Error al actualizar usuario: {str(e)}")
        return jsonify({'success': False, 'error': f'Error al actualizar el usuario: {str(e)}'}), 500


@bp.route('/eliminar_usuario', methods=['DELETE'])
@login_required
def eliminar_usuario():
    current_user_id = session.get('user_id')
    
    if not current_user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403

    data = request.get_json()
    user_id = data.get('userId')

    if not user_id:
        return jsonify({'success': False, 'error': 'ID de usuario no proporcionado'}), 400

    if user_id == current_user_id:
        return jsonify({'success': False, 'error': 'No puedes eliminar tu propia cuenta'}), 403

    try:
        user_ref = db.reference(f'asistente/{user_id}')
        user_data = user_ref.get()
        
        if not user_data:
            return jsonify({'success': False, 'error': 'Usuario no encontrado'}), 404

        user_ref.delete()
        
        return jsonify({
            'success': True, 
            'message': 'Usuario eliminado correctamente'
        }), 200

    except Exception as e:
        print(f"Error al eliminar usuario: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error al eliminar el usuario: {str(e)}'
        }), 500

@bp.route('/actualizar_temas_soporte', methods=['POST'])
@login_required
def actualizar_temas_soporte():
    data = request.get_json()
    temas = data.get('temas')
    user_id = session.get('user_id')

    if not temas:
        return jsonify({'success': False, 'message': 'No se recibieron temas válidos'}), 400

    try:
        user_ref = db.reference(f'asistente/{user_id}/settings')

        user_ref.update({'temas_soporte': temas})

        return jsonify({'success': True, 'message': 'Los temas de soporte han sido actualizados'}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error al actualizar temas de soporte: {str(e)}'}), 500

@bp.route('/obtener_temas_soporte', methods=['GET'])
@login_required
def obtener_temas_soporte():
    user_id = session.get('user_id')

    try:
        user_ref = db.reference(f'asistente/{user_id}/settings')

        temas_soporte = user_ref.child('temas_soporte').get()

        if not temas_soporte:
            temas_soporte = [
                {'id': 'hardware', 'text': 'Soporte de Hardware', 'checked': True},
                {'id': 'software', 'text': 'Soporte de Software', 'checked': True},
                {'id': 'redes', 'text': 'Soporte de Redes', 'checked': True},
                {'id': 'otros', 'text': 'Otros', 'checked': True}
            ]

        return jsonify({'temas': temas_soporte}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error al obtener temas de soporte: {str(e)}'}), 500