from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify, current_app
import re
import uuid
from firebase_admin import db
from googleapiclient.discovery import build

bp = Blueprint('resources', __name__)

YOUTUBE_API_SERVICE_NAME = 'youtube'
YOUTUBE_API_VERSION = 'v3'

def iso8601_a_segundos(duracion):
    match = re.match(r'PT((\d+)H)?((\d+)M)?((\d+)S)?', duracion)
    horas = int(match.group(2) or 0)
    minutos = int(match.group(4) or 0)
    segundos = int(match.group(6) or 0)
    return horas * 3600 + minutos * 60 + segundos

def obtener_duracion(video_id, youtube):
    request = youtube.videos().list(
        part='contentDetails',
        id=video_id
    )
    response = request.execute()
    items = response.get('items', [])
    if items:
        duracion_iso = items[0]['contentDetails']['duration']
        return iso8601_a_segundos(duracion_iso)
    return "Desconocida"

def buscar_videos(query, max_results=10):
    youtube = build(
        YOUTUBE_API_SERVICE_NAME, 
        YOUTUBE_API_VERSION, 
        developerKey=current_app.config['YOUTUBE_API_KEY']
    )
    search_request = youtube.search().list(
        q=query,
        part='snippet',
        type='video',
        maxResults=max_results
    )
    search_response = search_request.execute()
    videos = []
    for item in search_response.get('items', []):
        titulo = item['snippet']['title']
        video_id = item['id']['videoId']
        url = f"https://www.youtube.com/watch?v={video_id}"
        duracion = obtener_duracion(video_id, youtube)
        videos.append({
            'titulo': titulo,
            'url': url,
            'duracion': duracion
        })
    return videos

def login_required(func):
    def wrapper(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('auth.login'))
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

@bp.route('/resources')
@login_required
def resources_route():
    return render_template('asistente/resources.html')

@bp.route('/buscar_videos', methods=['POST'])
@login_required
def buscar_videos_route():
    tema = request.json.get('tema', '')
    videos = buscar_videos(tema)
    return jsonify(videos)


@bp.route('/add_to_resources/<faq_id>', methods=['POST'])
@login_required
def add_to_resources(faq_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403

    try:
        faq_ref = db.reference(f'asistente/{user_id}/faq/{faq_id}')
        faq_data = faq_ref.get()
        
        if not faq_data:
            return jsonify({'success': False, 'error': 'Pregunta no encontrada'}), 404

        guide_ref = db.reference(f'asistente/{user_id}/resources/guide')
        
        existing_guides = guide_ref.get()
        if existing_guides:
            for guide in existing_guides.values():
                if guide.get('questions') == faq_data['questions']:
                    return jsonify({
                        'success': False,
                        'error': 'Esta pregunta ya existe en recursos'
                    }), 409

        new_guide = guide_ref.push({
            'questions': faq_data['questions'],
            'answer': faq_data['answer']
        })

        return jsonify({
            'success': True,
            'message': 'Agregado a recursos exitosamente',
            'guide_id': new_guide.key
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al agregar a recursos: {str(e)}'
        }), 500

@bp.route('/save_video_history', methods=['POST'])
@login_required
def save_video_history():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403

    try:
        video_data = request.json
        
        video_ref = db.reference(f'asistente/{user_id}/resources/video_history')
        
        existing_videos = video_ref.get()
        if existing_videos:
            for video in existing_videos.values():
                if video.get('url') == video_data['url']:
                    return jsonify({
                        'success': False,
                        'error': 'Este video ya existe en recursos'
                    }), 409

        video_id = f"-{uuid.uuid4().hex[:12]}"
        
        video_ref.child(video_id).set({
            'title': video_data['title'],
            'url': video_data['url'],
            'duration': video_data['duration']
        })

        return jsonify({
            'success': True,
            'message': 'Video guardado exitosamente',
            'video_id': video_id
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al guardar el video: {str(e)}'
        }), 500

@bp.route('/save_video_list', methods=['POST'])
@login_required
def save_video_list():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403

    try:
        video_data = request.json
        
        video_ref = db.reference(f'asistente/{user_id}/resources/video_list')
        
        existing_videos = video_ref.get()
        if existing_videos:
            for video in existing_videos.values():
                if video.get('url') == video_data['url']:
                    return jsonify({
                        'success': False,
                        'error': 'Este video ya existe en recursos'
                    }), 409

        video_id = f"-{uuid.uuid4().hex[:12]}"
        
        video_ref.child(video_id).set({
            'title': video_data['title'],
            'url': video_data['url'],
            'duration': video_data['duration']
        })

        return jsonify({
            'success': True,
            'message': 'Video guardado exitosamente',
            'video_id': video_id
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al guardar el video: {str(e)}'
        }), 500

@bp.route('/get_video_history', methods=['GET'])
@login_required
def get_videos_history():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403
    try:
        video_ref = db.reference(f'asistente/{user_id}/resources/video_history')
        videos = video_ref.get()

        video_list = []
        if videos:
            for video_id, video_data in videos.items():
                video_data['video_id'] = video_id
                video_list.append(video_data)
        return jsonify({'success': True, 'videos': video_list})
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener los videos: {str(e)}'
        }), 500

@bp.route('/get_video_list', methods=['GET'])
@login_required
def get_videos_list():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403
    try:
        video_ref = db.reference(f'asistente/{user_id}/resources/video_list')
        videos = video_ref.get()

        video_list = []
        if videos:
            for video_id, video_data in videos.items():
                video_data['video_id'] = video_id
                video_list.append(video_data)
        return jsonify({'success': True, 'videos': video_list})
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener los videos: {str(e)}'
        }), 500

@bp.route('/delete_video/<video_id>', methods=['DELETE'])
@login_required
def delete_video(video_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403
    
    try:
        video_ref = db.reference(f'asistente/{user_id}/resources/video_list/{video_id}')
        
        video_ref.delete()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': f'Error al eliminar el video: {str(e)}'}), 500

@bp.route('/clear_video_history', methods=['DELETE'])
@login_required
def clear_video_history():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403

    try:
        video_ref = db.reference(f'asistente/{user_id}/resources/video_history')
        
        video_ref.delete()

        return jsonify({'success': True, 'message': 'Historial de videos borrado correctamente.'})
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al borrar el historial de videos: {str(e)}'
        }), 500


@bp.route('/clear_video_list', methods=['DELETE'])
@login_required
def clear_video_list():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403

    try:
        video_ref = db.reference(f'asistente/{user_id}/resources/video_list')
        
        video_ref.delete()

        return jsonify({'success': True, 'message': 'Historial de videos borrado correctamente.'})
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al borrar el historial de videos: {str(e)}'
        }), 500

@bp.route('/get_guides', methods=['GET'])
@login_required
def get_guides():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403

    try:
        guide_ref = db.reference(f'asistente/{user_id}/resources/guide')
        guide = guide_ref.get()

        return jsonify({'success': True, 'guide': guide})

    except Exception as e:
        return jsonify({'success': False, 'error': f'Error al obtener la guía: {str(e)}'}), 500

@bp.route('/delete_guide/<guide_id>', methods=['DELETE'])
@login_required
def delete_guide(guide_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403

    try:
        guide_ref = db.reference(f'asistente/{user_id}/resources/guide/{guide_id}')
        
        guide_ref.delete()

        return jsonify({'success': True, 'message': 'Guía eliminada correctamente.'})
    except Exception as e:
        return jsonify({'success': False, 'error': f'Error al eliminar la guía: {str(e)}'}), 500

@bp.route('/clear_guide', methods=['DELETE'])
@login_required
def clear_guide():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403

    try:
        guide_ref = db.reference(f'asistente/{user_id}/resources/guide')
        guide_ref.delete()

        return jsonify({'success': True, 'message': 'Historial de las guías borrado correctamente.'})
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al borrar el historial de las guías: {str(e)}'
        }), 500