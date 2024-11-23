from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify
import markdown
import firebase_admin
from firebase_admin import db
import uuid
import time
import google.generativeai as genai

bp = Blueprint ('assitant',__name__)

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


@bp.route('/assistant')
@login_required
def assistant_route():
    return render_template('asistente/assistant.html')


@bp.route('/check_question', methods=['POST'])
@login_required
def check_question():
    pregunta = request.form['pregunta']
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403
        
    faq_ref = db.reference(f'asistente/{user_id}/faq')
    faqs = faq_ref.get()
    
    if faqs:
        for faq_id, faq_data in faqs.items():
            if faq_data.get('questions').lower().strip() == pregunta.lower().strip():
                formatted_answer = markdown.markdown(faq_data.get('answer'))
                return jsonify({
                    'exists': True,
                    'existingAnswer': formatted_answer,
                    'faqId': faq_id
                })
    
    return jsonify({'exists': False})

@bp.route('/ask', methods=['POST'])
@login_required
def ask():
    pregunta = request.form['pregunta']
    error_message = request.form.get('error')
    force_new = request.form.get('force_new') == 'true'
    existing_faq_id = request.form.get('existing_faq_id')
    
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403
        
    assistant_ref = db.reference(f'asistente/{user_id}/assistant')
    faq_ref = db.reference(f'asistente/{user_id}/faq')
    pregunta_id = str(uuid.uuid4())
    timestamp = int(time.time() * 1000)
    
    if error_message:
        formatted_error = asistente.format_message(error_message)
        assistant_ref.child(pregunta_id).set({
            'questions': pregunta,
            'answer': formatted_error,
            'timestamp': timestamp
        })
        return jsonify({'success': True, 'respuesta': formatted_error})
    else:
        try:
            respuesta = asistente.obtener_respuesta(pregunta)
            assistant_ref.child(pregunta_id).set({
                'questions': pregunta,
                'answer': respuesta['respuesta'],
                'timestamp': timestamp
            })
            
            if respuesta['respuesta'] != 'Hubo un error al procesar tu solicitud. Inténtalo de nuevo.':
                if force_new and existing_faq_id:
                    faq_ref.child(existing_faq_id).update({
                        'answer': respuesta['respuesta'],
                        'timestamp': timestamp
                    })
                else:
                    faq_ref.child(pregunta_id).set({
                        'questions': pregunta,
                        'answer': respuesta['respuesta'],
                        'timestamp': timestamp
                    })
            return jsonify(respuesta)
            
        except Exception as e:
            error_message = 'Hubo un error al procesar tu solicitud. Inténtalo de nuevo.'
            formatted_error = asistente.format_message(error_message)
            assistant_ref.child(pregunta_id).set({
                'questions': pregunta,
                'answer': formatted_error,
                'timestamp': timestamp
            })
            return jsonify({'success': False, 'respuesta': formatted_error}), 500

@bp.route('/get_chat_history', methods=['GET'])
@login_required
def get_chat_history():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403
    
    assistant_ref = db.reference(f'asistente/{user_id}/assistant')
    chat_history = assistant_ref.get()
    history_list = []
    
    if chat_history:
        for chat_id, chat_data in chat_history.items():
            history_list.append({
                'id': chat_id,
                'question': chat_data.get('questions'),
                'answer': markdown.markdown(chat_data.get('answer')),
                'timestamp': chat_data.get('timestamp', 0)
            })
        
        history_list.sort(key=lambda x: x['timestamp'])
    
    return jsonify({'success': True, 'history': history_list})

@bp.route('/clear_chat', methods=['DELETE'])
@login_required
def clear_chat():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'error': 'Usuario no autenticado'}), 403
    
    try:
        assistant_ref = db.reference(f'asistente/{user_id}/assistant')
        
        assistant_ref.delete()
        
        return jsonify({'success': True, 'message': 'Chat history cleared successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500