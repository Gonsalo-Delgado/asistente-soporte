from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify
import markdown
from firebase_admin import db
import google.generativeai as genai

bp = Blueprint ('faq',__name__)

model = genai.GenerativeModel(model_name="gemini-1.5-flash")

class AsistenteSoporte:
    def __init__(self):
        pass

    def preprocesar_texto(self, texto):
        return texto.lower()

    def obtener_respuesta(self, pregunta):
        pregunta_procesada = self.preprocesar_texto(pregunta)
        response = model.generate_content(pregunta_procesada)
        return {
            'respuesta': response.text
        }

    def format_message(self, mensaje):
        return f"Error: {mensaje}"

asistente = AsistenteSoporte()

def login_required(func):
    def wrapper(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('auth.login'))
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

@bp.route('/faq')
@login_required
def faq_route():
    user_id = session.get('user_id')
    
    if not user_id:
        return "Usuario no autenticado", 403

    faq_ref = db.reference(f'asistente/{user_id}/faq')
    faq_data = faq_ref.get()

    if not faq_data:
        faq_data = {}

    faq_list = []
    for faq_id, faq in faq_data.items():
        faq_list.append({
            'id': faq_id,
            'questions': faq.get('questions'),
            'answer': markdown.markdown(faq.get('answer'))
        })
    
    return render_template('asistente/faq.html', faq_list=faq_list)

@bp.route('/check_resource_exists/<faq_id>', methods=['GET'])
@login_required
def check_resource_exists(faq_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403

    try:
        faq_ref = db.reference(f'asistente/{user_id}/faq/{faq_id}')
        faq_data = faq_ref.get()
        
        if not faq_data:
            return jsonify({'exists': False}), 404

        guide_ref = db.reference(f'asistente/{user_id}/resources/guide')
        guides = guide_ref.get()
        
        if guides:
            for guide in guides.values():
                if guide.get('questions') == faq_data['questions']:
                    return jsonify({'exists': True})

        return jsonify({'exists': False})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/add_question', methods=['POST'])
@login_required
def add_question():
    question_data = request.get_json()
    question = question_data.get('question')
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403

    faq_ref = db.reference(f'asistente/{user_id}/faq')

    existing_faqs = faq_ref.get()
    if existing_faqs:
        for faq_id, faq in existing_faqs.items():
            if faq.get('questions', '').strip().lower() == question.strip().lower():
                return jsonify({
                    'success': False,
                    'error': 'Esta pregunta ya existe en las preguntas frecuentes.'
                }), 409

    new_faq_ref = faq_ref.push({
        'questions': question,
        'answer': 'Respuesta pendiente de definir.'
    })

    return jsonify({
        'success': True,
        'faq_id': new_faq_ref.key,
        'answer': 'Respuesta pendiente de definir.'
    })

@bp.route('/delete_faq/<faq_id>', methods=['DELETE'])
@login_required
def delete_faq(faq_id):

    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403

    faq_ref = db.reference(f'asistente/{user_id}/faq/{faq_id}')
    
    faq_ref.delete()

    return jsonify({'success': True}), 200

@bp.route('/generate_answer_for_faq/<faq_id>', methods=['POST'])
@login_required
def generate_answer_for_faq(faq_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403

    faq_ref = db.reference(f'asistente/{user_id}/faq/{faq_id}')
    faq_data = faq_ref.get()

    if not faq_data:
        return jsonify({'success': False, 'error': 'Pregunta no encontrada en FAQ'}), 404

    pregunta = faq_data.get('questions', '')
    
    if not pregunta:
        return jsonify({'success': False, 'error': 'La pregunta está vacía'}), 400

    try:
        respuesta = asistente.obtener_respuesta(pregunta)

        faq_ref.update({
            'answer': respuesta['respuesta']
        })

        return jsonify({'success': True, 'respuesta': respuesta['respuesta']})
    
    except Exception as e:
        error_message = 'Hubo un error al generar la respuesta. Inténtalo de nuevo.'
        formatted_error = asistente.format_message(error_message)
        return jsonify({'success': False, 'respuesta': formatted_error}), 500


@bp.route('/update_faq_question/<faq_id>', methods=['POST'])
@login_required
def update_faq_question(faq_id):
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403

    new_question = request.json.get('question')

    if not new_question:
        return jsonify({'success': False, 'error': 'Pregunta no proporcionada'}), 400

    try:
        faq_ref = db.reference(f'asistente/{user_id}/faq/{faq_id}')
        faq_ref.update({'questions': new_question})

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/clear_faq', methods=['DELETE'])
@login_required
def clear_faq():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403

    try:
        faq_ref = db.reference(f'asistente/{user_id}/faq')
        faq_ref.delete()

        return jsonify({'success': True, 'message': 'Historial de las guías borrado correctamente.'})
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al borrar el historial de las guías: {str(e)}'
        }), 500